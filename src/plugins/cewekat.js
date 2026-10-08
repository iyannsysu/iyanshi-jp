'use strict';
// Auto-generated dari message.js — command: cewekat
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
	name: 'cewekat',
	aliases: [],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const fs2 = await import('fs');
						const path2 = await import('path');
						const libDir = path2.join(process.cwd(), 'cewe_lib');
						if (!fs2.existsSync(libDir)) {
							await m.reply('❌ Galeri kosong.');
							return;
						}
						const cats = {};
						fs2.readdirSync(libDir).filter(f => f.endsWith('.jpg')).forEach(f => {
							const mt = f.match(/^cewe_(.+?)_\d+\.jpg$/);
							if (mt) cats[mt[1]] = (cats[mt[1]] || 0) + 1;
						});
						const names = Object.keys(cats).sort();
						let text = `📂 *KATEGORI CEWE*\nTotal ${names.reduce((a, n) => a + cats[n], 0)} gambar\n\n`;
						names.forEach(n => { text += `• ${n} (${cats[n]})\n`; });
						text += `\n_Pakai: .cewe <kategori>_\n_Contoh: .cewe lingerie_`;
						await m.reply(text);
					}
					return;
	},
};
