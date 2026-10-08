'use strict';
// Command: play — download audio YouTube langsung

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
	name: 'play',
	aliases: [],
	category: 'other',
	desc: '',
	async run(ctx) {
	const { hisoka, m, query, text, quoted, message, messagesType } = ctx;
					{
						const q = (query || '').trim();
						if (!q) {
							await m.reply('Kasih judul lagunya. Contoh: .play iqroo');
							return;
						}

						const { startLoading: slPlay } = await import('../helper/loading.js');
						const playLoad = await slPlay(hisoka, m, 'Mencari lagu');

						let res = null;
						try {
							res = await downloadYouTubeAudio(q);
							const data = fs.readFileSync(res.file);
							const safeTitle = res.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'audio';

							await playLoad.stop();

							const content =
								data.length > 100 * 1024 * 1024
									? { document: data, fileName: `${safeTitle}.mp3` }
									: { audio: data, mimetype: 'audio/mpeg', fileName: `${safeTitle}.mp3` };
							await hisoka.sendMessage(m.from, content, { quoted: m });
						} catch (err) {
							const emsg = err?.message || 'Gagal mengunduh audio.';
							const friendly = /Semua client gagal|not a bot|Sign in/i.test(emsg)
								? '❌ YouTube lagi nge-block server bot 😅\nCoba lagi 5-10 menit lagi ya.'
								: '❌ ' + emsg;
							await playLoad.fail(friendly);
						} finally {
							if (res && !res.cached) cleanupYouTubeAudio(res.file);
						}
					}
					return;
	},
};
