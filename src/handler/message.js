'use strict';

import { isJidGroup, jidNormalizedUser, jidDecode, generateWAMessageFromContent } from 'baileys';
import { exec, execFile } from 'child_process';
import { fileURLToPath } from 'url';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { glitch } from '../helper/text.js';

import { msToTime } from '../helper/utils.js';
import { downloadTikTok, cleanupTikTok } from '../helper/tiktok.js';
import { downloadYouTubeAudio, cleanupYouTubeAudio } from '../helper/youtube.js';
import { searchPinterest, downloadPinterestPin, cleanupPinterest } from '../helper/pinterest.js';
import { searchPixiv, downloadPixivArtwork, cleanupPixiv } from '../helper/pixiv.js';
import { searchHentaidad, downloadHentaidadGallery, cleanupHentaidad } from '../helper/hentaidad.js';
import { searchHanime, getHanimeStreams, pickHanimeStream, downloadHanimeStream, shortNum } from '../helper/hanime.js';
import { getStickerPack, downloadStickerPack, cleanupStickerPack } from '../helper/stickerpack.js';
import { getTelegramPack, downloadTelegramPack, cleanupTelegramPack } from '../helper/tgsticker.js';
import { readSwConfig, writeSwConfig, extractEmojis } from '../helper/swconfig.js';
import { loadStoryCfg, saveStoryCfg, downloadTikTokHD, postToStatus } from '../helper/schedstory.js';
import { handleBusyReply, loadBusyCfg, saveBusyCfg } from '../helper/busyreply.js';
import { telegram } from '../helper/index.js';
import { loadPlugins } from '../plugins/_loader.js';
import { beginTask, endTask } from '../helper/updater.js';

// Load semua plugin sekali saat startup
const __pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'plugins');
const { map: pluginMap, list: pluginList } = await loadPlugins(__pluginsDir);
console.info(`\x1b[32m[plugin] loaded ${pluginList.length} plugins (${pluginMap.size} commands)\x1b[39m`);

const execFileAsync = util.promisify(execFile);

/** Cache hasil pencarian .hanime per pengirim: sender -> Array hasil searchHanime */
const hanimeSearchCache = new Map();
const bokepSearchCache = new Map();
const cosplay18SearchCache = new Map();
const manhwaSearchCache = new Map(); // sender -> hasil search
const manhwaChapterCache = new Map(); // sender -> { manga, chapters }

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MENU_BANNER = path.join(PROJECT_ROOT, 'assets/menu-adawong.jpg');
const GC_JSON = path.join(PROJECT_ROOT, 'gc.json');

/** Baca link invite grup WA untuk menu (diset via .setgc). */
function readGcLink() {
	try {
		const j = JSON.parse(fs.readFileSync(GC_JSON, 'utf8'));
		if (j && typeof j.invite === 'string' && /chat\.whatsapp\.com\//i.test(j.invite)) return j.invite.trim();
	} catch { /* belum diset */ }
	return '';
}

/**
 * Unduh video TikTok dari URL lalu kirim ke chat.
 * @param {import('../../index').WASocketExtra} hisoka
 * @param {import('../../index').WAMessageExtra} m
 * @param {string} text teks yang mengandung URL TikTok
 */
async function handleTikTokDownload(hisoka, m, text) {
	const match = (text || '').match(/https?:\/\/[^\s]*tiktok\.com[^\s]*/i);
	if (!match) {
		await m.reply('Kirim link TikTok yang valid. Contoh: .tt <link>');
		return;
	}

	const { startLoading } = await import('../helper/loading.js');
	const ttLoad = await startLoading(hisoka, m, 'Mengambil TikTok');

	const { getTikTok, downloadUrl, downloadTikTok: ytFallback } = await import('../helper/tiktok.js');
	let info = null;
	try {
		info = await getTikTok(match[0]);
	} catch (err) {
		await ttLoad.fail('❌ ' + (err?.message || 'Gagal.') + '\n_Coba lagi sebentar..._');
		return;
	}

	const caption = `🎵 *${info.title || 'TikTok'}*\n👤 ${info.author}`;

	// FOTO SLIDESHOW -> kirim sebagai album
	if (info.type === 'images') {
		await ttLoad.stop();
		try {
			const bufs = await Promise.all(info.images.map(u => downloadUrl(u, 20)));
			const tmpFiles = bufs.map((b, i) => {
				const fp = `/tmp/tt_img_${Date.now()}_${i}.jpg`;
				fs.writeFileSync(fp, b);
				return fp;
			});
			// caption di foto pertama via sendAlbum modif: kirim manual
			await sendAlbum(hisoka, m.from, tmpFiles);
			await m.reply(caption);
			for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch {} }
		} catch (err) {
			await ttLoad.fail('❌ ' + (err?.message || 'Gagal mengunduh foto.'));
		}
		return;
	}

	// VIDEO HD
	await ttLoad.stop();
	try {
		const data = await downloadUrl(info.videoUrl, 100);
		if (data.length > 100 * 1024 * 1024) {
			await hisoka.sendMessage(m.from, { document: data, fileName: 'tiktok_hd.mp4', caption }, { quoted: m });
		} else {
			await hisoka.sendMessage(m.from, { video: data, caption }, { quoted: m });
		}
	} catch (err) {
		// fallback ke yt-dlp
		await m.reply('⚠️ Coba cara lain...');
		let file = '';
		try {
			const { downloadTikTok, cleanupTikTok } = await import('../helper/tiktok.js');
			file = await downloadTikTok(match[0]);
			const size = fs.statSync(file).size;
			const data = fs.readFileSync(file);
			if (size > 100 * 1024 * 1024) {
				await hisoka.sendMessage(m.from, { document: data, fileName: path.basename(file), caption }, { quoted: m });
			} else {
				await hisoka.sendMessage(m.from, { video: data, caption }, { quoted: m });
			}
			cleanupTikTok(file);
		} catch (err2) {
			if (file) { try { fs.unlinkSync(file); } catch {} }
			await ttLoad.fail('❌ ' + (err2?.message || 'Gagal mengunduh video.'));
		}
	}
}

/**
 * Kirim beberapa gambar sebagai SATU album WhatsApp.
 * Caranya: kirim dulu pesan albumMessage (pengumuman: "N gambar akan datang"),
 * baru kirim semua gambar berbarengan. Client WA lalu menampilkannya
 * sebagai satu grup album, bukan pesan satu-satu.
 * @param {import('../../index').WASocketExtra} hisoka
 * @param {string} jid tujuan
 * @param {string[]} files path file gambar
 */
async function sendAlbum(hisoka, jid, files) {
	const n = files.length;
	if (!n) return;
	if (n === 1) {
		await hisoka.sendMessage(jid, { image: fs.readFileSync(files[0]) });
		return;
	}

	// 1. Pengumuman album
	try {
		const albumMsg = generateWAMessageFromContent(
			jid,
			{ albumMessage: { expectedImageCount: n, expectedVideoCount: 0 } },
			{}
		);
		await hisoka.relayMessage(jid, albumMsg.message, { messageId: albumMsg.key.id });
	} catch (err) {
		console.error('\x1b[33mPengumuman album gagal, lanjut kirim biasa:\x1b[39m', err?.message || err);
	}

	// 2. Semua gambar berbarengan
	const results = await Promise.allSettled(
		files.map(f => hisoka.sendMessage(jid, { image: fs.readFileSync(f) }))
	);
	const failed = results.filter(r => r.status === 'rejected').length;
	if (failed) {
		console.error(`\x1b[33msendAlbum: ${failed}/${n} gambar gagal terkirim\x1b[39m`);
	}
}

/**
 * Buat stiker webp 512x512 dari pesan quoted (gambar / video pendek).
 * @param {import('../../index').WASocketExtra} hisoka
 * @param {import('../../index').WAMessageExtra} m
 */
async function handleSticker(hisoka, m) {
	if (!m.isQuoted || !m.quoted?.isMedia) {
		await m.reply('Balas (reply) pesan berisi gambar atau video dulu.');
		return;
	}

	let media;
	try {
		media = await m.quoted.downloadMedia();
	} catch {
		await m.reply('Gagal mengunduh media.');
		return;
	}

	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
	const input = path.join(tmpDir, 'input');
	const output = path.join(tmpDir, 'sticker.webp');
	fs.writeFileSync(input, media);

	try {
		await execFileAsync(
			'/usr/bin/ffmpeg',
			[
				'-y',
				'-i',
				input,
				'-vf',
				'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
				'-vcodec',
				'libwebp',
				'-qscale',
				'75',
				'-preset',
				'default',
				'-loop',
				'0',
				'-an',
				'-vsync',
				'0',
				output,
			],
			{ timeout: 120000 }
		);

		await hisoka.sendMessage(m.from, { sticker: fs.readFileSync(output) }, { quoted: m });
	} catch {
		await m.reply('Gagal membuat stiker.');
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	}
}

/**
 * @param {import('baileys').BaileysEventMap['messages.upsert'] & { message: import('baileys').WAMessage }} message
 * @param {import('../../index').WASocketExtra} hisoka
 */
export default async function ({ message, type: messagesType }, hisoka) {
	try {
		const { injectMessage } = await import('../helper/inject.js');

		/**
		 * @type {import('../../index').WAMessageExtra}
		 */
		const m = await injectMessage(hisoka, message);

		// Check if the message is empty or malformed
		if (!m || !m.message) {
			console.warn('\x1b[33mReceived an empty message. Skipping...\x1b[39m\n', m);
			return;
		}

		/** Listen Event */
		const { default: listenEvent } = await import('./event.js');
		await listenEvent(m, hisoka);
		/** End Listen Event */

		const quoted = m.isMedia ? m : m.isQuoted ? m.quoted : m;

		const text = m.text;
		const query = m.query || quoted.query;

		if (!m.message) return;
		if (!m.key) return;
		if (m.isBot) return; // Skip if the message is from a bot

		/* Command Handling */
		if (messagesType === 'append') return; // Skip command handling for appended messages
		if (m.age > 60 * 10) return; // Skip messages older than 10 minutes


		// Auto-reply: hanya untuk non-owner di chat pribadi (bukan grup/status/bot)
		if (!m.isOwner && !m.key.fromMe && m.isPrivate && !m.status && !m.isBot && m.text) {
			try {
				const raw = fs.readFileSync(path.join(process.cwd(), 'autoreply.json'), 'utf-8');
				const rules = JSON.parse(raw || '{}');
				const lower = m.text.toLowerCase();
				for (const keyword of Object.keys(rules)) {
					if (keyword && lower.includes(keyword.toLowerCase())) {
						await m.reply(rules[keyword]);
						return;
					}
				}
			} catch {
				// autoreply.json tidak ada / rusak -> abaikan
			}
		}

		// Auto-reply sibuk berjenjang (1x pesan sibuk, 2-3x quotes, 4x+ diam)
		await handleBusyReply(m);

		// Anti view-once: teruskan foto/video sekali-lihat ke owner agar bisa dibuka ulang
		{
			const raw = message.message || {};
			const isViewOnce = !!(raw.viewOnceMessage || raw.viewOnceMessageV2 || raw.viewOnceMessageV2Extension);
			if (isViewOnce && !m.key.fromMe && !m.status && m.isMedia) {
				try {
					const ownerNumber = (process.env.BOT_NUMBER_OWNER || '')
						.split(',')
						.map(x => x.trim())
						.filter(Boolean)[0];
					if (ownerNumber) {
						const media = await m.downloadMedia();
						const waType = (m.type || '').replace('Message', '');
						const content = {};
						if (waType === 'image') content.image = media;
						else if (waType === 'video') content.video = media;
						else if (waType === 'audio') content.audio = media;
						else content.document = media;
						content.caption = `👁️ View-once dari ${m.pushName}`;
						await hisoka.sendMessage(`${ownerNumber}@s.whatsapp.net`, content);
					}
				} catch (err) {
					console.error('\x1b[31mAnti view-once gagal:\x1b[39m', err?.message || err);
				}
			}
		}

		// Pantau kontak penting: teruskan pesan ke Telegram (daftar di watch.json)
		if (
			!m.isOwner &&
			!m.key.fromMe &&
			!m.status &&
			!m.isBot &&
			process.env.TELEGRAM_CHAT_ID &&
			process.env.TELEGRAM_TOKEN
		) {
			try {
				const watchCfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'watch.json'), 'utf-8') || '{}');
				const numbers = (watchCfg.numbers || []).map(n => String(n).replace(/[^0-9]/g, '')).filter(Boolean);
				const senderNum = jidDecode(jidNormalizedUser(m.sender)).user.replace(/[^0-9]/g, '');
				if (numbers.includes(senderNum)) {
					const name = hisoka.getName(m.sender, true);
					const text =
						`<b>👀 Pantauan</b> dari <a href="https://wa.me/${senderNum}">${name}</a>\n<b>Tanggal:</b> ${new Date(
							Number(m.messageTimestamp) * 1000
						).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}${m.text ? `\n\n${m.text}` : ''}`.trim();
					let sent = false;
					if (m.isMedia && watchCfg.forward_media !== false) {
						try {
							const media = await m.downloadMedia();
							await telegram.send(process.env.TELEGRAM_CHAT_ID, media, {
								caption: text,
								type: m.type.replace('Message', ''),
								parse_mode: 'HTML',
							});
							sent = true;
						} catch (err) {
							console.error('\x1b[31mPantau: kirim media gagal:\x1b[39m', err?.message || err);
						}
					}
					if (!sent) {
						await telegram.send(process.env.TELEGRAM_CHAT_ID, text, {
							type: 'text',
							parse_mode: 'HTML',
						});
					}
				}
			} catch {
				// watch.json tidak ada / rusak -> abaikan
			}
		}

		// Command access: owner selalu boleh.
		// Non-owner: hanya jika public mode aktif DAN command ada di whitelist.
		if (!m.isOwner) {
			const { isPublicModeEnabled, isPublicCommand, checkRateLimit, getPublicWelcome } = await import('../helper/publicmode.js');
			if (!isPublicModeEnabled() || !isPublicCommand(m.command)) return;

			// Rate limit per user
			const rl = checkRateLimit(m.sender);
			if (!rl.allowed) {
				try { await m.reply(`⏳ *Rate limit!*\nKamu sudah pakai ${rl.resetIn ? '' : ''}batas maksimal command.\nCoba lagi dalam ${rl.resetIn} ya.`); } catch {}
				return;
			}

			// Sambutan sekali per user (tandai via sender)
			try {
				const welcome = getPublicWelcome();
				if (welcome && !global._publicWelcomed?.has(m.sender)) {
					if (!global._publicWelcomed) global._publicWelcomed = new Set();
					global._publicWelcomed.add(m.sender);
					await m.reply(welcome);
				}
			} catch {}
			// Lanjut ke dispatcher plugin (command publik)
		}

		// Auto-detect link TikTok dari owner (tanpa command)
		if (!m.command && /tiktok\.com/i.test(m.text || '')) {
			await handleTikTokDownload(hisoka, m, m.text);
			return;
		}

		// GAME: cek jawaban jika ada sesi aktif dan bukan command
		if (m.isOwner && !m.command && m.text) {
			try {
				const { checkAnswer, getSession } = await import('../helper/games.js');
				const result = checkAnswer(m.from, m.text);
				if (result?.correct) {
					await m.reply(`🎉 *Benar!*\nJawaban: *${result.jawaban}*`);
					return;
				}
			} catch {}
		}

		// KOMIK: angka polos dari owner = pilih dari daftar komik/chapter (tanpa prefix .komik)
		if (m.isOwner && !m.command && /^\d+$/.test((m.text || '').trim())) {
			try {
				const { handleKomikNumber } = await import('../plugins/komik.js');
				if (await handleKomikNumber({ hisoka, m })) return;
			} catch {}
		}

		// AFK: hapus status saat owner kirim pesan (kecuali command .afk itu sendiri)
		if (m.isOwner && m.command !== 'afk') {
			try {
				const { clearAfk } = await import('../helper/menfess.js');
				if (clearAfk(m.sender)) {
					await m.reply('✅ Kamu kembali dari AFK!');
				}
			} catch {}
		}


		// ===== PLUGIN DISPATCHER =====
		// Semua command dimuat dari src/plugins/*.js
		const plugin = pluginMap.get((m.command || '').toLowerCase());
		if (plugin) {
			try {
				const ctx = { hisoka, m, query, text, quoted, message, messagesType };
				beginTask();
				try {
					await plugin.run(ctx);
				} finally {
					endTask();
				}
				// Hapus pesan command milik owner dari chat ("ngeri pas chat")
				// agar hanya hasil command yang terlihat, bukan teks command-nya.
				if (m.key?.fromMe && m.from && m.key?.id) {
					try {
						await hisoka.sendMessage(m.from, { delete: m.key });
					} catch {
						// gagal hapus (mis. pesan sudah terlalu lama) -> abaikan
					}
				}
			} catch (err) {
				console.error(`\x1b[31m[plugin] error di "${plugin.name}":\x1b[39m`, err?.message || err);
				try { await m.reply('❌ Terjadi kesalahan saat menjalankan command.'); } catch {}
			}
		}
		// =============================
	} catch (error) {
		console.error(`\x1b[31mError in message handler:\x1b[39m\n`, error);
	}
}
