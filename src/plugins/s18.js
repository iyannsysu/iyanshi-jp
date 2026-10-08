'use strict';
// Command: s18 — search video 18+ di web (XNXX).
//   .s18 <keyword>  -> daftar video (nomor + durasi)
//   .s18 <nomor>     -> download & kirim video
// Kategori: 18+ ZONE

const s18SearchCache = new Map(); // sender -> { list, ts }
const SESSION_TTL = 10 * 60 * 1000;

export default {
	name: 's18',
	aliases: ['search18', 'xnxx'],
	category: '18+ ZONE',
	desc: 'Search video 18+ di web. .s18 <keyword> lalu .s18 <nomor>',
	async run(ctx) {
		const { hisoka, m, query } = ctx;
		const sender = m.sender;
		const raw = (query || '').trim();

		const { searchXNXX, getXNXXVideo, downloadXNXX } = await import('../helper/xnxx.js');

		if (!raw) {
			await m.reply(
				'🔞 *SEARCH 18+*\n\n' +
				'• `.s18 <keyword>` — cari video\n' +
				'• `.s18 <nomor>` — download & kirim\n\n' +
				'Contoh: `.s18 asian`'
			);
			return;
		}

		// .s18 <nomor> -> kirim video
		if (/^\d+$/.test(raw)) {
			const idx = parseInt(raw, 10) - 1;
			const cache = s18SearchCache.get(sender);
			if (!cache || (Date.now() - cache.ts) > SESSION_TTL || !cache.list[idx]) {
				await m.reply('❌ Cari dulu: `.s18 <keyword>`');
				return;
			}
			const item = cache.list[idx];
			await m.reply(`🎬 Mengambil *${item.title}*...`);
			try {
				const { videoUrl } = await getXNXXVideo(item.url);
				await m.reply('⬇️ Mengunduh video...');
				// Batas aman WA 45MB; kalau lebih, kompres otomatis via ffmpeg.
				const { buffer: buf, compressed } = await downloadXNXX(videoUrl, 45, { compress: true });
				if (compressed) await m.reply('🗜️ Video dikompres biar muat dikirim...');
				const caption = `🔞 *${item.title}*\n⏱️ ${item.duration}${item.quality ? ' • ' + item.quality : ''}${compressed ? ' (dikompres)' : ''}`;
				await hisoka.sendMessage(m.from, {
					video: buf,
					caption,
					mimetype: 'video/mp4',
				});
			} catch (err) {
				await m.reply('❌ ' + (err?.message || 'Gagal mengambil video.'));
			}
			return;
		}

		// .s18 <keyword> -> cari
		await m.reply(`🔎 Mencari video *${raw}*...`);
		try {
			const results = await searchXNXX(raw);
			if (!results.length) {
				await m.reply(`❌ Nggak ketemu video *${raw}*. Coba kata kunci lain.`);
				return;
			}
			s18SearchCache.set(sender, { list: results, ts: Date.now() });
			const listTxt = results.slice(0, 10).map((r, i) =>
				`${i + 1}. *${r.title}*\n    └ ⏱️ ${r.duration}${r.quality ? ' • ' + r.quality : ''}`
			).join('\n');
			await m.reply(
				`🔞 Hasil pencarian *${raw}*:\n${listTxt}\n\n` +
				`_Kirim: .s18 <nomor>_`
			);
		} catch (err) {
			await m.reply('❌ Gagal mencari: ' + (err?.message || 'error'));
		}
	},
};
