'use strict';
// Auto-generated dari message.js — command: chara (aliases: character, karakter)
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
	name: 'chara',
	aliases: ['character', 'karakter'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const raw = (query || '').trim();
						if (!raw) {
							await m.reply('Kasih nama karakternya. Contoh: .chara ada wong');
							return;
						}
						let count = 5;
						let name = raw;
						const numMatch = raw.match(/\s+(\d{1,2})$/);
						if (numMatch) {
							count = Math.max(1, Math.min(10, parseInt(numMatch[1])));
							name = raw.slice(0, numMatch.index).trim();
						}
						if (!name) {
							await m.reply('Kasih nama karakternya. Contoh: .chara ada wong');
							return;
						}
						await m.reply(`🎭 Mencari karakter *${name}* (18+ AI)...`);
						let tmpDir = '';
						try {
							const { searchCharacter, downloadCivitai, cleanupCivitai } = await import('../helper/civitai.js');
							const items = await searchCharacter(name, count);
							const dl = await downloadCivitai(items);
							tmpDir = dl.tmpDir;
							await m.reply(`🎭 *${name}* — mengirim ${dl.files.length} gambar...`);
							await sendAlbum(hisoka, m.from, dl.files);
							cleanupCivitai(tmpDir);
						} catch (err) {
							if (tmpDir) {
								try {
									const { cleanupCivitai } = await import('../helper/civitai.js');
									cleanupCivitai(tmpDir);
								} catch {}
							}
							await m.reply('❌ ' + (err?.message || 'Karakter tidak ditemukan.'));
						}
					}
					return;
	},
};
