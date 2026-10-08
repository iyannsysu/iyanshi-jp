'use strict';
// Command: ppic — cari foto dewasa HD dari PornPics.
// Kategori: 18+ ZONE

import * as shared from './_shared.js';

const { m: _m, sendAlbum } = shared;

export default {
	name: 'ppic',
	aliases: ['pornpic', 'bokeppic'],
	category: '18+ ZONE',
	desc: 'Cari foto dewasa HD. Contoh: .ppic asian | .ppic asian 10',
	async run(ctx) {
		const { hisoka, m, query } = ctx;
		const parts = (query || '').trim().split(/\s+/).filter(Boolean);

		if (!parts.length) {
			await m.reply('Kasih kata kuncinya. Contoh: .ppic asian | .ppic asian 10');
			return;
		}

		// Angka di akhir = jumlah foto (maks 30, batas album WA).
		let count = 1;
		const last = parts[parts.length - 1];
		if (/^\d+$/.test(last) && parts.length > 1) {
			count = Math.min(Math.max(parseInt(last, 10), 1), 30);
			parts.pop();
		}
		const keyword = parts.join(' ');

		await m.reply(`🔎 Mencari *${keyword}*...`);

		let tmpDir = '';
		try {
			const { searchPornPics, downloadPornPics, cleanupPornPics, isBlockedQuery } = await import('../helper/pornpics.js');
			if (isBlockedQuery(keyword)) {
				await m.reply('❌ Kata kunci itu ditolak. Cari yang jelas dewasa ya.');
				return;
			}
			const results = await searchPornPics(keyword, Math.max(count, 10));

			if (!results.length) {
				await m.reply(`❌ Nggak ketemu hasil buat *${keyword}*. Coba kata kunci lain.`);
				return;
			}

			if (count === 1) {
				// 1 foto: langsung kirim via URL (cepat, tanpa download).
				const pick = results[Math.floor(Math.random() * results.length)];
				await hisoka.sendMessage(
					m.from,
					{ image: { url: pick }, caption: `🔞 *${keyword}*` },
					{ quoted: m }
				);
				return;
			}

			// Album: download dulu lalu kirim sekaligus.
			const urls = results.slice(0, count);
			await m.reply(`📥 Mengunduh ${urls.length} foto...`);
			const dl = await downloadPornPics(urls);
			tmpDir = dl.tmpDir;
			await m.reply(`📤 Mengirim ${dl.files.length} foto sebagai album...`);
			await sendAlbum(hisoka, m.from, dl.files);
			cleanupPornPics(tmpDir);
			tmpDir = '';
		} catch (err) {
			console.error('ppic error:', err?.message || err);
			await m.reply('❌ Gagal mengambil gambar. Coba lagi nanti.');
		} finally {
			if (tmpDir) {
				try {
					const { cleanupPornPics } = await import('../helper/pornpics.js');
					cleanupPornPics(tmpDir);
				} catch {}
			}
		}
	},
};
