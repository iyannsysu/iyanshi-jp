'use strict';
// Auto-generated dari message.js — command: bokep
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
	name: 'bokep',
	aliases: [],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const raw = (query || '').trim();
						const sender = m.sender || m.from;
						const { searchBokep, getBokepVideo, downloadBokep } = await import('../helper/bokep.js');

						// .bokep <nomor> -> download dari hasil terakhir
						if (/^\d+$/.test(raw)) {
							const cache = bokepSearchCache.get(sender);
							if (!cache || !cache.length) {
								await m.reply('Cari dulu: `.bokep <keyword>`');
								return;
							}
							const idx = parseInt(raw) - 1;
							if (idx < 0 || idx >= cache.length) {
								await m.reply(`Nomor 1-${cache.length} aja.`);
								return;
							}
							const item = cache[idx];
							await m.reply(`🎬 Mengambil *${item.title}*...`);
							try {
								const { videoUrl } = await getBokepVideo(item.url);
								await m.reply('⬇️ Mengunduh video...');
								const data = await downloadBokep(videoUrl, 100);
								const caption = `🔞 *${item.title}*`;
								if (data.length > 64 * 1024 * 1024) {
									await hisoka.sendMessage(m.from, { document: data, fileName: 'bokep.mp4', caption }, { quoted: m });
								} else {
									await hisoka.sendMessage(m.from, { video: data, caption }, { quoted: m });
								}
							} catch (err) {
								await m.reply('❌ ' + (err?.message || 'Gagal mengunduh.'));
							}
							return;
						}

						if (!raw) {
							await m.reply('Kasih keyword. Contoh:\n.bokep asian\n.bokep japanese');
							return;
						}
						await m.reply(`🔎 Mencari *${raw}*...`);
						try {
							const results = await searchBokep(raw);
							bokepSearchCache.set(sender, results);
							const list = results.map((r, i) => `${i + 1}. *${r.title}*`).join('\n');
							await m.reply(`🔞 Hasil untuk *${raw}*:\n${list}\n\n_Download: .bokep <nomor>_`);
						} catch (err) {
							await m.reply('❌ ' + (err?.message || 'Gagal mencari.'));
						}
					}
					return;
	},
};
