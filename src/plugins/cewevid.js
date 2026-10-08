'use strict';
// Auto-generated dari message.js — command: cewevid (aliases: cv)
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
	name: 'cewevid',
	aliases: ['cv'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const raw = (query || '').trim();
						const count = /^\d{1,2}$/.test(raw) ? Math.max(1, Math.min(3, parseInt(raw))) : 2;

						const fs = await import('fs');
						const path = await import('path');
						const vidDir = path.join(process.cwd(), 'cewe_vid_lib');
						const sentPath = path.join(process.cwd(), 'cewe_sent.json');
						if (!fs.existsSync(vidDir)) {
							await m.reply('❌ Galeri video kosong, coba lagi nanti.');
							return;
						}
						let files = fs.readdirSync(vidDir).filter(f => f.endsWith('.mp4'));
						if (!files.length) {
							await m.reply('❌ Galeri video kosong, coba lagi nanti.');
							return;
						}
						let sent = [];
						try {
							sent = JSON.parse(fs.readFileSync(sentPath, 'utf-8') || '[]');
							if (!Array.isArray(sent)) sent = [];
						} catch {}
						const sentSet = new Set(sent);
						let pool = files.filter(f => !sentSet.has(f));
						if (pool.length < Math.min(count, files.length)) {
							pool = files;
							sent = sent.filter(s => !files.includes(s));
						}
						const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
						try {
							fs.writeFileSync(sentPath, JSON.stringify([...sent, ...picked].slice(-500)));
						} catch {}

						await m.reply(`🎬 Mengirim ${picked.length} video...`);
						for (const f of picked) {
							try {
								await hisoka.sendMessage(m.from, {
									video: fs.readFileSync(path.join(vidDir, f)),
									caption: '🔞',
								});
							} catch (err) {
								console.error('\x1b[33mcewevid gagal kirim:\x1b[39m', err?.message || err);
							}
						}
					}
					return;
	},
};
