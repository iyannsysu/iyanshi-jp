'use strict';
// Command: komik — baca komik dewasa (Web Komik Dewasa, teks Indonesia).
// Alur gampang:
//   .komik <judul>   -> daftar komik (nomor)
//   lalu ketik angka saja (mis. "1") -> daftar chapter
//   lalu ketik angka saja (mis. "2") -> baca chapter sebagai album
// Bentuk ber-prefix tetap didukung: .komik 1 | .komik baca 2
// Kategori: 18+ ZONE

import * as shared from './_shared.js';

const {
	fs, path, os,
	sendAlbum,
} = shared;

/** Cache per pengirim (dengan timestamp, kedaluwarsa 10 menit).
 *  Disimpan juga ke disk agar tidak hilang saat bot restart. */
import { ROOT as PROJECT_DIR } from '../helper/paths.js';
const CACHE_FILE = path.join(PROJECT_DIR, '.komik-cache.json');
const komikSearchCache = new Map();   // sender -> { list, ts }
const komikChapterCache = new Map();  // sender -> { title, chapters, ts }
const SESSION_TTL = 10 * 60 * 1000;

function saveCaches() {
	try {
		fs.writeFileSync(CACHE_FILE, JSON.stringify({
			search: [...komikSearchCache.entries()],
			chapter: [...komikChapterCache.entries()],
		}));
	} catch {}
}
function loadCaches() {
	try {
		if (!fs.existsSync(CACHE_FILE)) return;
		const d = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
		for (const [k, v] of d.search || []) komikSearchCache.set(k, v);
		for (const [k, v] of d.chapter || []) komikChapterCache.set(k, v);
	} catch {}
}
loadCaches();

const PER_ALBUM = 20;

function fresh(entry) {
	return entry && (Date.now() - entry.ts) < SESSION_TTL;
}

async function showChapters(ctx, idx) {
	const { hisoka, m } = ctx;
	const sender = m.sender;
	const entry = komikSearchCache.get(sender);
	if (!fresh(entry) || !entry.list[idx]) {
		await m.reply('❌ Cari dulu: `.komik <judul>`');
		return;
	}
	const komik = entry.list[idx];
	const { getKomikChapters } = await import('../helper/komikdewasa.js');
	await m.reply(`📚 Mengambil daftar chapter *${komik.title}*...`);
	try {
		const { title, chapters } = await getKomikChapters(komik.url);
		if (!chapters.length) {
			await m.reply('❌ Tidak ada chapter ditemukan.');
			return;
		}
		komikChapterCache.set(sender, { title: title || komik.title, chapters, ts: Date.now() });
		saveCaches();
		const shown = chapters.slice(0, 25);
		const listTxt = shown.map((c, i) => `${i + 1}. ${c.label}`).join('\n');
		const more = chapters.length > 25 ? `\n_...dan ${chapters.length - 25} chapter lainnya_` : '';
		await m.reply(
			`📚 *${title || komik.title}*\n${chapters.length} chapter:\n${listTxt}${more}\n\n` +
			`_Ketik nomor chapter yang mau dibaca_`
		);
	} catch (err) {
		await m.reply('❌ Gagal mengambil chapter: ' + (err?.message || 'error'));
	}
}

async function readChapter(ctx, idx) {
	const { hisoka, m } = ctx;
	const sender = m.sender;
	const cached = komikChapterCache.get(sender);
	if (!fresh(cached) || !cached.chapters[idx]) {
		await m.reply('❌ Pilih dulu chapternya dari daftar.');
		return;
	}
	const ch = cached.chapters[idx];
	const { getChapterImages, downloadKomikImage } = await import('../helper/komikdewasa.js');
	await m.reply(`📖 Mengambil *${cached.title}* — ${ch.label}...`);
	let images;
	try {
		images = await getChapterImages(ch.url);
	} catch (err) {
		await m.reply('❌ Gagal membuka chapter: ' + (err?.message || 'error'));
		return;
	}
	if (!images.length) {
		await m.reply('❌ Tidak ada gambar di chapter ini.');
		return;
	}
	await m.reply(`📄 ${images.length} halaman, mengunduh...`);
	{
		const bufs = [];
		for (let i = 0; i < images.length; i++) {
			try {
				const buf = await downloadKomikImage(images[i]);
				bufs.push(buf);
			} catch {}
			if ((i + 1) % 10 === 0) await m.reply(`⏳ ${i + 1}/${images.length}...`);
		}
		if (!bufs.length) {
			await m.reply('❌ Semua halaman gagal diunduh.');
			return;
		}
		// Jadikan SATU PDF biar nggak spam banyak pesan gambar.
		await m.reply('📕 Menyusun PDF...');
		const { imagesToPdf, safePdfName } = await import('../helper/comicpdf.js');
		const pdf = await imagesToPdf(bufs, { title: `${cached.title} — ${ch.label}` });
		await hisoka.sendMessage(m.from, {
			document: pdf,
			mimetype: 'application/pdf',
			fileName: safePdfName(`${cached.title} ${ch.label}`),
			caption: `📕 *${cached.title}* — ${ch.label} (${bufs.length} hlm)`,
		}, { quoted: m });
		await m.reply(`✅ Selesai: *${cached.title}* — ${ch.label} (${bufs.length} hlm)`);
	}
}

/**
 * Dipanggil dari handler untuk pesan angka polos (tanpa prefix).
 * Mengembalikan true jika angka ditangani sebagai pilihan komik.
 */
export async function handleKomikNumber(ctx) {
	const { m } = ctx;
	const sender = m.sender;
	const num = parseInt((m.text || '').trim(), 10);
	if (!Number.isFinite(num) || num < 1) return false;
	const idx = num - 1;

	const chEntry = komikChapterCache.get(sender);
	const sEntry = komikSearchCache.get(sender);
	const chFresh = fresh(chEntry);
	const sFresh = fresh(sEntry);
	if (!chFresh && !sFresh) {
		await m.reply('❌ Sesi pilihan habis / belum ada. Cari dulu: `.komik <judul>`');
		return true;
	}

	// Tahap terbaru yang menang: kalau daftar chapter lebih baru -> baca chapter,
	// kalau pencarian lebih baru -> pilih komik.
	if (chFresh && (!sFresh || chEntry.ts >= sEntry.ts)) {
		if (!chEntry.chapters[idx]) {
			await m.reply(`❌ Nomor 1–${chEntry.chapters.length} ya.`);
			return true;
		}
		await readChapter(ctx, idx);
		return true;
	}
	if (sFresh) {
		if (!sEntry.list[idx]) {
			await m.reply(`❌ Nomor 1–${sEntry.list.length} ya.`);
			return true;
		}
		await showChapters(ctx, idx);
		return true;
	}
	return false;
}

export default {
	name: 'komik',
	aliases: ['kd', 'kmk'],
	category: '18+ ZONE',
	desc: 'Baca komik dewasa teks Indonesia. .komik <judul>, lalu ketik nomor.',
	async run(ctx) {
		const { m, query } = ctx;
		const sender = m.sender;
		const raw = (query || '').trim();

		const { searchKomikdewasa } = await import('../helper/komikdewasa.js');

		if (!raw) {
			await m.reply(
				'📚 *KOMIK DEWASA*\n\n' +
				'• `.komik <judul>` — cari komik\n' +
				'• lalu ketik *nomor* — lihat daftar chapter\n' +
				'• lalu ketik *nomor* lagi — baca chapter\n\n' +
				'Contoh: `.komik milf` lalu ketik `1`'
			);
			return;
		}

		// .komik baca <nomor>
		const bacaMatch = raw.match(/^baca\s+(\d+)$/i);
		if (bacaMatch) {
			await readChapter(ctx, parseInt(bacaMatch[1], 10) - 1);
			return;
		}

		// .komik <nomor> -> daftar chapter
		if (/^\d+$/.test(raw)) {
			await showChapters(ctx, parseInt(raw, 10) - 1);
			return;
		}

		// .komik <judul> -> cari
		await m.reply(`🔎 Mencari komik *${raw}*...`);
		try {
			const results = await searchKomikdewasa(raw);
			if (!results.length) {
				await m.reply(`❌ Nggak ketemu komik *${raw}*. Coba kata kunci lain.`);
				return;
			}
			komikSearchCache.set(sender, { list: results, ts: Date.now() });
			saveCaches();
			const listTxt = results.slice(0, 10).map((r, i) =>
				`${i + 1}. *${r.title}*${r.latest ? `\n    └ ${r.latest}` : ''}`
			).join('\n');
			await m.reply(
				`📚 Hasil pencarian *${raw}*:\n${listTxt}\n\n` +
				`_Ketik nomor komik yang mau dibaca_`
			);
		} catch (err) {
			await m.reply('❌ Gagal mencari: ' + (err?.message || 'error'));
		}
	},
};
