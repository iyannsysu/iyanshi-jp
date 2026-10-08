'use strict';
// Auto-generated dari message.js — command: manhwa (aliases: mh, manhua)
// Kategori: 18+ ZONE

import * as shared from './_shared.js';

	const {
		isJidGroup, jidNormalizedUser, jidDecode, generateWAMessageFromContent,
		exec, execFile, fileURLToPath, util, fs, path, os,
		glitch, msToTime,
		downloadTikTok, cleanupTikTok,
		downloadYouTubeAudio, cleanupYouTubeAudio,
		searchPinterest, downloadPinterestPin, cleanupPinterest,
		searchPixiv, downloadPixivArtwork, cleanupPixiv,
		searchHentaidad, downloadHentaidadGallery, cleanupHentaidad,
		searchHanime, getHanimeStreams, pickHanimeStream, downloadHanimeStream, shortNum,
		getStickerPack, downloadStickerPack, cleanupStickerPack,
		getTelegramPack, downloadTelegramPack, cleanupTelegramPack,
		readSwConfig, writeSwConfig, extractEmojis,
		loadStoryCfg, saveStoryCfg, downloadTikTokHD, postToStatus,
		handleBusyReply, loadBusyCfg, saveBusyCfg,
		telegram, execFileAsync,
		PROJECT_ROOT, MENU_BANNER, GC_JSON,
		hanimeSearchCache, bokepSearchCache, cosplay18SearchCache,
		manhwaSearchCache, manhwaChapterCache,
		readGcLink, handleTikTokDownload, sendAlbum, handleSticker,
	} = shared;

export default {
	name: 'manhwa',
	aliases: ['mh', 'manhua'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const isManhua = m.command === 'manhua';
						const raw = (query || '').trim();
						const sender = m.sender || m.from;
						const { searchManhwa, searchManhua, getIdChapters, getChapterPages, downloadPage } =
							await import('../helper/mangadex.js');
						const doSearch = isManhua ? searchManhua : searchManhwa;
						const cmdName = isManhua ? 'manhua' : 'manhwa';
						const flag = isManhua ? '🇨🇳' : '🇰🇷';

						// .manhwa baca <nomor> <chapter>
						const bacaMatch = raw.match(/^baca\s+(\d+)\s+([\d.]+)/i);
						if (bacaMatch) {
							const idx = parseInt(bacaMatch[1]) - 1;
							const chNum = bacaMatch[2];
							const { loadManhwaList } = await import('../helper/mangadex.js');
							let manga = manhwaSearchCache.get(sender)?.[idx];
							if (!manga) {
								// cache hilang (bot restart?) -> pakai daftar kurasi urut chapter terbanyak
								const curated = await loadManhwaList();
								const sorted = [...curated].sort((a, b) => b.chapters - a.chapters);
								manga = sorted[idx];
							}
							if (!manga) {
								await m.reply('❌ Cari dulu: `.manhwa top` atau `.manhwa <keyword>`');
								return;
							}
							await m.reply(`📖 Mengambil *${manga.title}* chapter ${chNum}...`);
							try {
								const chapters = await getIdChapters(manga.id);
								const ch = chapters.find(c => c.chapter === chNum);
								if (!ch) {
									await m.reply(`❌ Chapter ${chNum} tidak ada dalam bahasa Indonesia.`);
									return;
								}
								const pages = await getChapterPages(ch.id);
								await m.reply(`📄 ${pages.length} halaman, mengunduh...`);
								// unduh paralel 4 sekaligus
								const bufs = [];
								for (let i = 0; i < pages.length; i += 4) {
									const batch = await Promise.allSettled(
										pages.slice(i, i + 4).map(u => downloadPage(u))
									);
									for (const r of batch) if (r.status === 'fulfilled') bufs.push(r.value);
								}
								if (!bufs.length) {
									await m.reply('❌ Gagal mengunduh halaman.');
									return;
								}
								// kirim per 8 halaman sebagai album
								for (let i = 0; i < bufs.length; i += 8) {
									const chunk = bufs.slice(i, i + 8);
									const files = chunk.map((b, j) => {
										const fp = `/tmp/mh_${Date.now()}_${i + j}.jpg`;
										fs.writeFileSync(fp, b);
										return fp;
									});
									await sendAlbum(hisoka, m.from, files);
									for (const f of files) { try { fs.unlinkSync(f); } catch {} }
								}
								await m.reply(`✅ Selesai: *${manga.title}* ch.${chNum} (${bufs.length} hlm)`);
							} catch (err) {
								await m.reply('❌ ' + (err?.message || 'Gagal mengambil chapter.'));
							}
							return;
						}

						// .manhwa <nomor> -> daftar chapter
						if (/^\d+$/.test(raw)) {
							const idx = parseInt(raw) - 1;
							let manga = manhwaSearchCache.get(sender)?.[idx];
							if (!manga) {
								const { loadManhwaList } = await import('../helper/mangadex.js');
								const curated = await loadManhwaList();
								manga = [...curated].sort((a, b) => b.chapters - a.chapters)[idx];
							}
							if (!manga) {
								await m.reply('❌ Cari dulu: `.manhwa top`');
								return;
							}
							await m.reply(`📚 Mengambil daftar chapter *${manga.title}*...`);
							try {
								const chapters = await getIdChapters(manga.id);
								if (!chapters.length) {
									await m.reply('❌ Tidak ada chapter bahasa Indonesia.');
									return;
								}
								manhwaChapterCache.set(sender, { manga, chapters });
								const list = chapters.slice(0, 30).map(c => `• ${c.chapter}${c.title ? ' — ' + c.title.slice(0, 30) : ''}`).join('\n');
								const more = chapters.length > 30 ? `\n_...dan ${chapters.length - 30} lainnya_` : '';
								await m.reply(
									`📚 *${manga.title}*\n${chapters.length} chapter (ID):\n${list}${more}\n\n` +
									`_Baca: .manhwa baca ${idx + 1} <chapter>_`
								);
							} catch (err) {
								await m.reply('❌ ' + (err?.message || 'Gagal mengambil chapter.'));
							}
							return;
						}

						// .manhwa/.manhua <keyword> / top / random -> cari
						if (!raw) {
							if (isManhua) {
								await m.reply('📖 Manhua 18+ China 🇨🇉 couple/romance sub Indo:\n`.manhua <keyword>` — cari judul\n`.manhua <nomor>` — daftar chapter\n`.manhua baca <nomor> <chapter>` — baca');
							} else {
								await m.reply('📖 Manhwa 18+ Korea sub Indo:\n`.manhwa top` — paling populer\n`.manhwa random` — acak\n`.manhwa <keyword>` — cari judul\n`.manhwa <nomor>` — daftar chapter\n`.manhwa baca <nomor> <chapter>` — baca');
							}
							return;
						}
						const isTop = /^top$/i.test(raw);
						const isRandom = /^random$/i.test(raw);
						const { loadManhwaList } = await import('../helper/mangadex.js');
						const curated = await loadManhwaList();

						// .manhwa top / random -> dari daftar kurasi (sudah verified)
						if ((isTop || isRandom) && curated.length) {
							if (isRandom) {
								const pick = curated[Math.floor(Math.random() * curated.length)];
								manhwaSearchCache.set(sender, [pick]);
								try {
									const ch = await getIdChapters(pick.id);
									const list = ch.slice(0, 15).map(c => `• ${c.chapter}`).join(' ');
									await m.reply(
										`🎲 Rekomendasi acak:\n📖 *${pick.title}*\n${ch.length} chapter 🇮🇩\n${list}${ch.length > 15 ? ' ...' : ''}\n\n_Baca: .manhwa baca 1 <chapter>_`
									);
								} catch {
									await m.reply(`🎲 *${pick.title}*\n_Baca: .manhwa baca 1 <chapter>_`);
								}
								return;
							}
							const top = [...curated].sort((a, b) => b.chapters - a.chapters).slice(0, 8);
							manhwaSearchCache.set(sender, top);
							const list = top.map((r, i) => `${i + 1}. *${r.title}*\n   └ ${r.chapters} chapter 🇮🇩`).join('\n');
							await m.reply(`📖 Terpopuler:\n${list}\n\n_Lihat chapter: .manhwa <nomor>_`);
							return;
						}

						await m.reply(isTop ? '🔥 Mengambil manhwa terpopuler...' : isRandom ? '🎲 Mengacak manhwa...' : `🔎 Mencari manhwa *${raw}*...`);
						try {
							// cari dulu di daftar kurasi
							let results = [];
							if (!isTop && !isRandom && curated.length) {
								const kw = raw.toLowerCase();
								results = curated.filter(x => x.title.toLowerCase().includes(kw)).slice(0, 8)
									.map(x => ({ id: x.id, title: x.title, chCount: x.chapters }));
							}
							if (!results.length) {
								// fallback: live search + validasi chapter ID
								const live = await doSearch(raw, 10);
								if (!live.length) {
									await m.reply('❌ Tidak ketemu. Coba keyword lain.');
									return;
								}
								const valid = [];
								for (const r of live) {
									try {
										const ch = await getIdChapters(r.id);
										if (ch.length) { valid.push({ ...r, chCount: ch.length }); }
									} catch {}
									if (valid.length >= 5) break;
								}
								if (!valid.length) {
									await m.reply('❌ Tidak ada yang punya terjemahan Indonesia. Coba `.manhwa top`.');
									return;
								}
								results = valid;
							}
							manhwaSearchCache.set(sender, results);
							const list = results.map((r, i) => `${i + 1}. *${r.title}*\n   └ ${r.chCount} chapter 🇮🇩`).join('\n');
							await m.reply(`📖 ${flag} Hasil *${raw}*:\n${list}\n\n_Lihat chapter: .${cmdName} <nomor>_`);
						} catch (err) {
							await m.reply('❌ ' + (err?.message || 'Gagal mencari.'));
						}
					}
					return;
	},
};
