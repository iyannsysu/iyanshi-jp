'use strict';
// Auto-generated dari message.js — command: cewe (aliases: cw)
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
	name: 'cewe',
	aliases: ['cw'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const CATS = ['sexy','nude','sensual','hot','lingerie','bedroom','curvy','blonde','petite','mature','redhead','brunette','bikini','beach','realistis','shower','asian','latina','ebony','cosplay','goth','milf','campuran','anime','fantasi','cyberpunk','render3d'];
						const raw = (query || '').trim();
						let count = 5;
						let keyword = '';
						const numMatch = raw.match(/\s+(\d{1,2})$/);
						if (numMatch) {
							count = Math.max(1, Math.min(10, parseInt(numMatch[1])));
							keyword = raw.slice(0, numMatch.index).trim().toLowerCase();
						} else if (/^\d{1,2}$/.test(raw)) {
							count = Math.max(1, Math.min(10, parseInt(raw)));
						} else {
							keyword = raw.toLowerCase();
						}

						const fs = await import('fs');
						const path = await import('path');
						const libDir = path.join(process.cwd(), 'cewe_lib');
						const sentPath = path.join(process.cwd(), 'cewe_sent.json');
						const libFiles = fs.existsSync(libDir)
							? fs.readdirSync(libDir).filter(f => f.endsWith('.jpg'))
							: [];

						// Ambil acak dari galeri TANPA mengulang yang sudah dikirim
						const pickLib = (category) => {
							let files = libFiles;
							if (category) files = files.filter(f => f.startsWith(`cewe_${category}_`));
							if (!files.length) return [];
							let sent = [];
							try {
								sent = JSON.parse(fs.readFileSync(sentPath, 'utf-8') || '[]');
								if (!Array.isArray(sent)) sent = [];
							} catch {}
							const sentSet = new Set(sent);
							let pool = files.filter(f => !sentSet.has(f));
							if (pool.length < Math.min(count, files.length)) {
								// semua sudah pernah dikirim -> mulai rotasi baru
								pool = files;
								sent = sent.filter(s => !files.includes(s));
							}
							const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
							try {
								fs.writeFileSync(sentPath, JSON.stringify([...sent, ...picked].slice(-500)));
							} catch {}
							return picked.map(f => path.join(libDir, f));
						};

						// Tanpa keyword -> acak dari galeri
						if (!keyword) {
							const picked = pickLib('');
							if (!picked.length) {
								await m.reply('❌ Galeri kosong, coba lagi nanti.');
								return;
							}
							await m.reply(`💃 Mengirim ${picked.length} gambar...`);
							await sendAlbum(hisoka, m.from, picked);
							return;
						}

						// Keyword = nama kategori -> ambil dari kategori itu
						if (CATS.includes(keyword)) {
							const picked = pickLib(keyword);
							if (!picked.length) {
								await m.reply(`❌ Kategori *${keyword}* kosong.`);
								return;
							}
							await m.reply(`📂 *${keyword}* — mengirim ${picked.length} gambar...`);
							await sendAlbum(hisoka, m.from, picked);
							return;
						}

						// Selain itu -> cari live, fallback ke galeri lokal
						await m.reply(`🔎 Mencari *${keyword}*...`);
						let tmpDir = '';
						try {
							const { searchCivitai, downloadCivitai, cleanupCivitai } = await import('../helper/civitai.js');
							const items = await searchCivitai(keyword, count);
							const dl = await downloadCivitai(items);
							tmpDir = dl.tmpDir;
							await m.reply(`💃 Mengirim ${dl.files.length} gambar...`);
							await sendAlbum(hisoka, m.from, dl.files);
							cleanupCivitai(tmpDir);
						} catch (err) {
							if (tmpDir) {
								try {
									const { cleanupCivitai } = await import('../helper/civitai.js');
									cleanupCivitai(tmpDir);
								} catch {}
							}
							const picked = pickLib('');
							if (picked.length) {
								await m.reply(`⚠️ API sibuk, ambil dari galeri simpanan~ 💃`);
								await sendAlbum(hisoka, m.from, picked);
							} else {
								await m.reply('❌ ' + (err?.message || 'Gagal mengambil gambar.'));
							}
						}
					}
					return;
	},
};
