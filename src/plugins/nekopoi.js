'use strict';
// Auto-generated dari message.js — command: nekopoi (aliases: neko)
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
	name: 'nekopoi',
	aliases: ['neko'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const keyword = (query || '').trim();
						if (!keyword) {
							await m.reply('Kasih kata kuncinya. Contoh: .nekopoi zero two');
							return;
						}
						await m.reply(`🔎 Mencari *${keyword}* di Nekopoi...`);
						try {
							const { searchNekopoi } = await import('../helper/nekopoi.js');
							const results = await searchNekopoi(keyword, 8);
							if (!results.length) {
								await m.reply('❌ Tidak ketemu. Coba kata kunci lain.');
								return;
							}
							let text = `🔞 *Hasil: ${keyword}*\n\n`;
							results.forEach((x, i) => {
								text += `${i + 1}. *${x.title}*\n   ▶️ Nonton: ${x.url}\n\n`;
							});
							await m.reply(text.trim());
						} catch (err) {
							await m.reply('❌ Gagal mencari: ' + (err?.message || 'error'));
						}
					}
					return;
	},
};
