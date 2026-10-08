'use strict';
// Command: r34 — cari gambar anime 18+ dari booru (sumber: Yandere, tanpa login).
// Catatan: API resmi rule34.xxx sekarang WAJIB login/auth, jadi fitur ini pakai
// Yandere (konten sejenis: anime explicit, rating:explicit selalu dipaksa).
// Kategori: 18+ ZONE

import * as shared from './_shared.js';

const { sendAlbum } = shared;

/** Tag yang DITOLAK: indikasi minor / usia ambigu. */
const BLOCKED_TAGS = new Set([
	'loli', 'lolicon', 'shota', 'shotacon', 'toddlercon',
	'child', 'children', 'kid', 'kids', 'toddler', 'baby', 'infant',
	'preteen', 'young', 'younger', 'schoolgirl', 'school_girl',
	'middle_school', 'elementary_school', 'kindergarten',
]);

const IMG_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const VID_EXT = new Set(['mp4', 'webm']);

async function searchYandere(tags, limit = 100) {
	const page = 1 + Math.floor(Math.random() * 20);
	const url =
		'https://yande.re/post.json?limit=' + limit +
		'&page=' + page +
		'&tags=' + encodeURIComponent(tags);
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' },
		signal: AbortSignal.timeout(25000),
	});
	if (!res.ok) throw new Error('Yandere HTTP ' + res.status);
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

/** Verifikasi client-side: post WAJIB memuat semua tag yang diminta user. */
function tagsMatch(post, needTags) {
	if (!needTags.length) return true;
	const pt = new Set((post.tags || '').toLowerCase().split(/\s+/).filter(Boolean));
	return needTags.every(t => pt.has(t));
}

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export default {
	name: 'r34',
	aliases: ['yandere', 'ydr'],
	category: '18+ ZONE',
	desc: 'Cari gambar anime 18+ dari booru (maks 20/album). Contoh: .r34 breasts | .r34 breasts 10',
	async run(ctx) {
		const { hisoka, m, query } = ctx;
		const raw = (query || '').trim();

		// Parse: angka di akhir = jumlah (1-20, default 3)
		let count = 3;
		let tagStr = raw;
		const numMatch = raw.match(/\s+(\d{1,2})$/);
		if (numMatch) {
			count = Math.max(1, Math.min(20, parseInt(numMatch[1], 10)));
			tagStr = raw.slice(0, numMatch.index).trim();
		} else if (/^\d{1,2}$/.test(raw)) {
			count = Math.max(1, Math.min(20, parseInt(raw, 10)));
			tagStr = '';
		}

		// Normalisasi tag: spasi -> underscore (format booru)
		const tags = tagStr
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean)
			.map(t => t.replace(/\s+/g, '_'));

		// Safety: tolak tag minor / usia ambigu
		const hit = tags.find(t => BLOCKED_TAGS.has(t));
		if (hit) {
			await m.reply('❌ Tag *' + hit + '* ditolak. Cari yang dewasa-dewasa aja ya.');
			return;
		}

		const searchTags = [...tags, 'rating:explicit'].join(' ');
		await m.reply(`🔎 Mencari *${tagStr || 'random'}* (18+)...`);

		let posts = [];
		try {
			// Coba hingga 3 halaman acak agar dapat post yang tag-nya benar-benar cocok
			for (let attempt = 0; attempt < 3 && posts.length < count; attempt++) {
				const batch = await searchYandere(searchTags);
				for (const p of batch) {
					if (tagsMatch(p, tags) && !posts.some(q => q.id === p.id)) posts.push(p);
					if (posts.length >= Math.max(count, 10)) break;
				}
			}
		} catch (err) {
			await m.reply('❌ Gagal mengambil data: ' + (err?.message || 'error'));
			return;
		}

		const usable = posts.filter(p =>
			(IMG_EXT.has((p.file_ext || '').toLowerCase()) && p.sample_url) ||
			(VID_EXT.has((p.file_ext || '').toLowerCase()) && p.file_url)
		);
		if (!usable.length) {
			await m.reply(`❌ Nggak ketemu hasil buat *${tagStr}*.\nCoba tag lain, mis: breasts, big_breasts, cleavage, ass, panties, swimsuit, nude, sex, blowjob, uncensored`);
			return;
		}

		const picks = shuffle(usable).slice(0, count);

		// SEMUA dikirim sekaligus sebagai SATU album (gambar), video dikirim setelahnya.
		// Tidak ada lagi kirim 1-1 via URL agar selalu tampil sebagai album.
		const imgs = picks.filter(p => IMG_EXT.has((p.file_ext || '').toLowerCase()));
		const vids = picks.filter(p => VID_EXT.has((p.file_ext || '').toLowerCase()));
		if (!imgs.length && !vids.length) {
			await m.reply('❌ Tidak ada hasil yang bisa dikirim.');
			return;
		}
		const fs = await import('fs');
		const path = await import('path');
		const os = await import('os');
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r34-'));
		try {
			const files = [];
			if (imgs.length > 1) await m.reply(`📥 Mengunduh ${imgs.length} gambar...`);
			for (const p of imgs) {
				try {
					const r = await fetch(p.sample_url || p.file_url, {
						headers: { 'User-Agent': 'Mozilla/5.0' },
						signal: AbortSignal.timeout(30000),
					});
					if (!r.ok) continue;
					const buf = Buffer.from(await r.arrayBuffer());
					const fp = path.join(tmpDir, `r34_${p.id}.jpg`);
					fs.writeFileSync(fp, buf);
					files.push(fp);
				} catch {}
			}
			if (files.length) {
				// Satu panggilan album untuk semua gambar sekaligus
				await sendAlbum(hisoka, m.from, files);
				await m.reply(`🔞 *${tagStr || 'r34'}* — ${files.length} gambar`);
			}
			for (const p of vids) {
				try {
					await hisoka.sendMessage(m.from, { video: { url: p.file_url }, caption: `🔞 *${tagStr || 'r34'}*` });
				} catch {}
			}
			if (!files.length && !vids.length) await m.reply('❌ Semua unduhan gagal. Coba lagi.');
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	},
};
