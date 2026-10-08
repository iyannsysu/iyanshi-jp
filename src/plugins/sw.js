'use strict';
// Auto-generated dari message.js — command: sw
// Kategori: STATUS

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
	name: 'sw',
	aliases: [],
	category: 'STATUS',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const sw = readSwConfig();
						const on = v => (v ? 'ON ✅' : 'OFF ❌');
						await m.reply(
							`👁️ *STATUS MONITOR*\n\n` +
								`• Auto-read: ${on(sw.autoread)}\n` +
								`• Auto-react: ${on(sw.autoreact)}\n` +
								`• Auto-reply: ${on(sw.autoreply)} ("${sw.reply_text}")\n` +
								`• React teks: ${sw.react_text ? `"${sw.react_text}"` : '-'}\n` +
								`• Bio uptime: ${on(sw.uptimebio)}\n` +
								`• Mode acak: ${on(sw.random_emoji)}\n` +
								`• Emoji pool (${sw.emoji_pool.length}): ${sw.emoji_pool.join(' ') || '-'}\n\n` +
								`_Atur: .swread on/off | .swreact on/off | .swreply on/off | .swreplytext <teks> | .swreacttext <tulisan> | .uptimebio on/off | .swrandom on/off | .swemoji 😍🔥_`
						);
					}
					return;
	},
};
