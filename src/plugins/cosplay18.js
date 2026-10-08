'use strict';
// Auto-generated dari message.js — command: cosplay18 (aliases: cp18)
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
	name: 'cosplay18',
	aliases: ['cp18'],
	category: '18+ ZONE',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const raw = (query || '').trim();
						const sender = m.sender || m.from;
						const { searchBokep, getBokepVideo, downloadBokep } = await import('../helper/bokep.js');

						// .cosplay18 <nomor> -> download dari hasil terakhir
						if (/^\d+$/.test(raw)) {
							const cache = cosplay18SearchCache.get(sender);
							if (!cache || !cache.length) {
								await m.reply('Cari dulu: `.cosplay18 <keyword>`\nContoh: `.cosplay18 mitsuri`');
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
								const caption = `🔞👘 *${item.title}*`;
								if (data.length > 64 * 1024 * 1024) {
									await hisoka.sendMessage(m.from, { document: data, fileName: 'cosplay18.mp4', caption }, { quoted: m });
								} else {
									await hisoka.sendMessage(m.from, { video: data, caption }, { quoted: m });
								}
							} catch (err) {
								await m.reply('❌ ' + (err?.message || 'Gagal mengunduh.'));
							}
							return;
						}

						if (!raw) {
							await m.reply(
								'╭─「 👘🔞 *COSPLAY 18+* 」\n' +
								'│\n' +
								'│ Video cosplay dewasa\n' +
								'│ (manusia asli, bukan AI).\n' +
								'│\n' +
								'│ *Format:*\n' +
								'│ • `.cosplay18 <keyword>`\n' +
								'│ • `.cosplay18 <nomor>`\n' +
								'│\n' +
								'│ *Contoh:*\n' +
								'│ 1. `.cosplay18 mitsuri`\n' +
								'│ 2. `.cosplay18 rem`\n' +
								'│ 3. `.cosplay18 1`\n' +
								'╰──────────────────────'
							);
							return;
						}
						const searchQuery = `cosplay ${raw}`;
						await m.reply(`🔎 Mencari cosplay 18+ *${raw}*...`);
						try {
							const results = await searchBokep(searchQuery);
							cosplay18SearchCache.set(sender, results);
							const list = results.map((r, i) => `${i + 1}. *${r.title}*`).join('\n');
							await m.reply(`👘🔞 Hasil untuk *${raw}*:\n${list}\n\n_Download: .cosplay18 <nomor>_`);
						} catch (err) {
							await m.reply('❌ ' + (err?.message || 'Gagal mencari.'));
						}
					}
					return;
	},
};
