'use strict';
// Auto-generated dari message.js — command: hentai (aliases: hd)
// Kategori: other

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
	name: 'hentai',
	aliases: ['hd'],
	category: 'other',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const raw = (query || '').trim();
						if (!raw) {
							await m.reply('Kasih kata kuncinya. Contoh: .hentai zero two');
							return;
						}

						// Kalau berupa link galeri langsung -> unduh dari situ
						const galUrl = raw.match(/https?:\/\/hentaidad\.com\/[^\s]*/i);

						let tmpDir = '';
						try {
							// .hentai <kata kunci> [jumlah] -> cari galeri & kirim N gambar
							let count = 10;
							let keyword = raw;
							const numMatch = raw.match(/\s+(\d{1,2})$/);
							if (numMatch) {
								count = Math.max(1, Math.min(20, parseInt(numMatch[1])));
								keyword = raw.slice(0, numMatch.index).trim();
							}

							let res;
							if (galUrl) {
								await m.reply('🔞 Membuka galeri...');
								res = await downloadHentaidadGallery(galUrl[0], count);
							} else {
								if (!keyword) {
									await m.reply('Kasih kata kuncinya. Contoh: .hentai zero two');
									return;
								}
								await m.reply(`🔎 Mencari *${keyword}* di Hentaidad...`);
								res = await searchHentaidad(keyword, count);
							}
							tmpDir = res.tmpDir;
							await m.reply(`🔞 *${res.title}*\n🖼️ Total ${res.total} gambar, mengirim ${res.files.length}...`);
							await sendAlbum(hisoka, m.from, res.files);
						} catch (err) {
							await m.reply('❌ ' + (err?.message || 'Gagal mengambil dari Hentaidad.'));
						} finally {
							if (tmpDir) cleanupHentaidad(tmpDir);
						}
					}
					return;
	},
};
