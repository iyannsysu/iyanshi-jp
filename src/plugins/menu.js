'use strict';
// Menu utama (command: menu, aliases: help, ?, btnmenu)
//
// Daftar command DIBANGUN OTOMATIS dari plugin yang benar-benar termuat
// (lihat getPluginRegistry di _loader.js), jadi menu tidak pernah lagi
// menampilkan command yang tidak ada, dan command baru langsung muncul
// tanpa edit file ini.
//
//   .menu            -> menu lengkap (kartu thumbnail besar)
//   .menu 3          -> detail kategori nomor 3 (lengkap dengan deskripsi)
//   .menu downloader -> detail kategori lewat nama
//
// Gaya tampilan lewat .env:  BOT_MENU_STYLE=card (default) | image | text
//   card  -> satu pesan teks dengan kartu thumbnail besar
//   image -> gambar banner + daftar menu
//   text  -> teks saja (paling ringan / paling aman)

import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import { execFile } from 'child_process';

import * as shared from './_shared.js';
import { getPluginRegistry } from './_loader.js';

const { readGcLink, MENU_BANNER } = shared;
const execFileAsync = util.promisify(execFile);

const BANNER_URL = 'https://raw.githubusercontent.com/iyannsysu/iyan-x-m/main/assets/menu-adawong.jpg';
const TZ = 'Asia/Jakarta';

// Urutan & ikon kategori. Kategori yang tidak ada di sini tetap tampil (di bawah).
const CATEGORY_META = [
	{ key: 'DOWNLOADER', icon: '📥' },
	{ key: '18+ ZONE', icon: '🔞' },
	{ key: 'STIKER', icon: '🎨' },
	{ key: 'STATUS', icon: '👁️' },
	{ key: 'FUN', icon: '😂' },
	{ key: 'GAME', icon: '🎮' },
	{ key: 'TOOLS', icon: '🔧' },
	{ key: 'GRUP & KONTAK', icon: '👥' },
	{ key: 'ISLAMI & PRIMBON', icon: '🕌' },
	{ key: 'OWNER & SISTEM', icon: '🔐' },
];
const FALLBACK_CATEGORY = 'LAINNYA';

// Plugin yang field category-nya masih 'other'/'owner'/'downloader' dipetakan di sini.
const CATEGORY_OF = {
	play: 'DOWNLOADER', play2: 'DOWNLOADER', ytsearch: 'DOWNLOADER', sfile: 'DOWNLOADER',
	tt: 'DOWNLOADER', tiktokv2: 'DOWNLOADER', pin: 'DOWNLOADER', ppcouple: 'DOWNLOADER',
	cosplay: 'DOWNLOADER', pixiv: 'DOWNLOADER', hentai: 'DOWNLOADER',
	react: 'STATUS', swreplytext: 'STATUS',
	storyadd: 'STATUS', storycap: 'STATUS', storyclear: 'STATUS', storydel: 'STATUS',
	storylist: 'STATUS', storynow: 'STATUS', storyon: 'STATUS', storytime: 'STATUS',
	balasmenfess: 'FUN', tolakmenfess: 'FUN',
	p: 'TOOLS', q: 'TOOLS',
	hidetag: 'GRUP & KONTAK', groups: 'GRUP & KONTAK', contacts: 'GRUP & KONTAK', setgc: 'GRUP & KONTAK',
	jadibot: 'OWNER & SISTEM', busyreply: 'OWNER & SISTEM', update: 'OWNER & SISTEM',
	debug: 'OWNER & SISTEM', '>': 'OWNER & SISTEM', $: 'OWNER & SISTEM',
	menu: 'MENU',
};

// Plugin yang alias-nya adalah command terpisah (mis. tiap game punya nama sendiri):
// di menu utama semua alias ikut ditampilkan sebagai command sendiri.
const EXPAND_ALIASES = new Set(['tebakgambar', 'swread']);

const QUOTES = [
	'Jangan menunggu sempurna, buat momenmu sempurna.',
	'Berani mencoba adalah awal kesuksesan.',
	'Hari ini lelah, besok bangga.',
	'Fokus proses, hasil mengikuti.',
	'Mimpi tanpa aksi hanyalah angan.',
	'Maju sedikit tiap hari itu cukup.',
	'Gagal itu guru, asal mau belajar.',
	'Jadilah versi terbaik dirimu.',
	'Waktu terbaik mulai adalah sekarang.',
	'Kerja keras kalahkan bakat malas.',
	'Pelan tak apa, asal jangan diam.',
	'Hal besar mulai dari langkah kecil.',
];

// ───────────────────────── util ─────────────────────────

const isWord = s => /^[a-z0-9]/i.test(String(s));

// Nama tampilan khusus untuk command yang namanya terlalu pendek / ambigu.
const DISPLAY_AS = { p: 'ping', q: 'quoted' };

/** Nama yang enak dibaca: command seperti '>' atau '$' ditampilkan lewat alias hurufnya. */
function displayName(p) {
	if (DISPLAY_AS[p.name] && (p.name === DISPLAY_AS[p.name] || p.aliases.includes(DISPLAY_AS[p.name]))) return DISPLAY_AS[p.name];
	if (isWord(p.name)) return p.name;
	return p.aliases.find(isWord) || p.name;
}

/** Ambil prefix pertama yang tampil di menu (BOT_PREFIX bisa berupa regex seperti [./!]). */
function displayPrefix() {
	const raw = String(process.env.BOT_PREFIX || '.').trim();
	const cls = raw.match(/^\[(.+)\]$/);
	if (cls) return cls[1].replace(/\\(.)/g, '$1')[0] || '.';
	return raw.replace(/\\(.)/g, '$1')[0] || '.';
}

function categoryOf(p) {
	const mapped = CATEGORY_OF[p.name] ?? CATEGORY_OF[displayName(p)];
	if (mapped) return mapped;
	const c = String(p.category || '').trim();
	if (!c || ['other', 'owner', 'downloader'].includes(c.toLowerCase())) {
		return c.toLowerCase() === 'downloader' ? 'DOWNLOADER' : FALLBACK_CATEGORY;
	}
	return c.toUpperCase() === '18+ ZONE' ? '18+ ZONE' : c;
}

/** Kelompokkan plugin ke kategori terurut: [{ key, icon, plugins: [...] }] */
function buildCategories() {
	const { list } = getPluginRegistry();
	const groups = new Map();
	for (const p of list) {
		const key = categoryOf(p);
		if (key === 'MENU') continue; // menu itu sendiri tidak perlu masuk daftar
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(p);
	}
	const order = CATEGORY_META.map(c => c.key);
	const keys = [...groups.keys()].sort((a, b) => {
		const ia = order.indexOf(a), ib = order.indexOf(b);
		if (ia === -1 && ib === -1) return a.localeCompare(b);
		if (ia === -1) return 1;
		if (ib === -1) return -1;
		return ia - ib;
	});
	return keys.map(key => ({
		key,
		icon: CATEGORY_META.find(c => c.key === key)?.icon || '📦',
		plugins: groups.get(key).sort((a, b) => displayName(a).localeCompare(displayName(b))),
	}));
}

/** Nama command yang ditampilkan di menu utama untuk satu plugin. */
function listedNames(p) {
	if (EXPAND_ALIASES.has(p.name)) return [p.name, ...p.aliases].filter(isWord);
	return [displayName(p)];
}

function sapaan() {
	const jam =
		Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: TZ }).format(new Date())) % 24;
	if (jam >= 4 && jam < 11) return { teks: 'Selamat pagi', emoji: '🌅' };
	if (jam >= 11 && jam < 15) return { teks: 'Selamat siang', emoji: '☀️' };
	if (jam >= 15 && jam < 18) return { teks: 'Selamat sore', emoji: '🌇' };
	return { teks: 'Selamat malam', emoji: '🌙' };
}

function uptimeText() {
	const up = Math.floor(process.uptime());
	const d = Math.floor(up / 86400);
	const h = Math.floor((up % 86400) / 3600);
	const mnt = Math.floor((up % 3600) / 60);
	return d > 0 ? `${d}h ${h}j ${mnt}m` : h > 0 ? `${h}j ${mnt}m` : `${mnt}m`;
}

// ───────────────────────── teks menu ─────────────────────────

function buildMenu({ who, ownerName, gcLink, cats }) {
	const px = displayPrefix();
	const now = new Date();
	const tanggal = now.toLocaleDateString('id-ID', {
		weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
	});
	const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).replace(':', '.');
	const { map } = getPluginRegistry();
	const total = cats.reduce((n, c) => n + c.plugins.length, 0);
	const { teks, emoji } = sapaan();
	const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

	const head =
		`✦━━━━━━ *ADAWONG BOT* ━━━━━━✦\n\n` +
		`Halo, *${who}*! ${teks} ${emoji}\n` +
		`_"${quote}"_\n\n` +
		`╭─❏ *INFORMASI*\n` +
		`│ 👑 Owner   : ${ownerName}\n` +
		`│ ⏱️ Online  : ${uptimeText()}\n` +
		`│ 🗓️ Tanggal : ${tanggal}\n` +
		`│ 🕒 Jam     : ${jam} WIB\n` +
		`│ 📚 Fitur   : ${total} fitur • ${map.size} command\n` +
		`│ 🔣 Prefix  : ${px}\n` +
		`╰──────────────\n`;

	const body = cats
		.map((c, i) => {
			const names = c.plugins.flatMap(listedNames);
			return (
				`\n╭─❏ ${i + 1}. ${c.icon} *${c.key}* (${names.length})\n` +
				names.map(n => `│ ✧ ${px}${n}`).join('\n') +
				`\n╰──────────────`
			);
		})
		.join('\n');

	const foot =
		`\n\n💡 _Ketik ${px}menu <nomor/nama> untuk detail kategori, contoh: ${px}menu 1_\n` +
		(gcLink ? `👥 *Grup WA*\n🔗 ${gcLink}\n\n` : '\n') +
		`✦ ⚙️ readsw • by *${ownerName}* ✦`;

	return { text: head + body + foot, total };
}

function buildCategoryDetail(cat, index) {
	const px = displayPrefix();
	const lines = cat.plugins.map(p => {
		const aliases = p.aliases.filter(a => isWord(a) && a !== displayName(p));
		const alias = aliases.length ? ` _(${aliases.map(a => px + a).join(', ')})_` : '';
		const desc = p.desc ? `\n│    ↳ ${p.desc.split('\n')[0].slice(0, 120)}` : '';
		return `│ ✧ *${px}${displayName(p)}*${alias}${desc}`;
	});
	return (
		`╭─❏ ${index}. ${cat.icon} *${cat.key}*\n` +
		lines.join('\n') +
		`\n╰──────────────\n\n💡 _Kembali ke menu utama: ${px}menu_`
	);
}

/** Cari kategori dari argumen: nomor ("3") atau nama ("downloader", "18"). */
function findCategory(cats, arg) {
	const a = String(arg || '').trim().toLowerCase();
	if (!a) return null;
	if (/^\d+$/.test(a)) {
		const i = parseInt(a, 10) - 1;
		if (cats[i]) return { cat: cats[i], index: i + 1 };
		// di luar rentang nomor -> coba cocokkan nama (mis. "18" -> "18+ ZONE")
	}
	const i = cats.findIndex(c => c.key.toLowerCase() === a || c.key.toLowerCase().startsWith(a) || c.key.toLowerCase().includes(a));
	return i >= 0 ? { cat: cats[i], index: i + 1 } : null;
}

// ───────────────────────── thumbnail ─────────────────────────

let thumbCache = { buf: null, at: 0 };
const THUMB_RETRY_MS = 10 * 60 * 1000;

async function shrinkJpeg(buf) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-'));
	const input = path.join(dir, 'in');
	const output = path.join(dir, 'out.jpg');
	try {
		fs.writeFileSync(input, buf);
		const args = ['-y', '-i', input, '-vf', 'scale=480:-2', '-frames:v', '1', '-q:v', '6', output];
		for (const bin of [process.env.FFMPEG_PATH, 'ffmpeg', '/usr/bin/ffmpeg'].filter(Boolean)) {
			try {
				await execFileAsync(bin, args, { timeout: 20000 });
				return fs.readFileSync(output);
			} catch { /* coba binary berikutnya */ }
		}
		return null;
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

/**
 * Thumbnail banner (Buffer JPEG kecil) atau null. Tidak pernah melempar error.
 * Urutan: file lokal assets/ -> unduh BANNER_URL -> kecilkan via ffmpeg bila terlalu besar.
 * Hasil di-cache; kalau gagal, dicoba lagi 10 menit kemudian.
 */
async function getThumbnail() {
	if (thumbCache.buf) return thumbCache.buf;
	if (thumbCache.at && Date.now() - thumbCache.at < THUMB_RETRY_MS) return null;
	thumbCache.at = Date.now();

	let buf = null;
	try { buf = fs.readFileSync(MENU_BANNER); } catch { /* assets/ tidak ada */ }

	if (!buf) {
		try {
			const ctrl = new AbortController();
			const timer = setTimeout(() => ctrl.abort(), 8000);
			try {
				const res = await fetch(BANNER_URL, { signal: ctrl.signal });
				if (res.ok) buf = Buffer.from(await res.arrayBuffer());
			} finally {
				clearTimeout(timer);
			}
		} catch { /* offline / diblokir -> null */ }
	}

	if (buf && buf.length > 100 * 1024) buf = (await shrinkJpeg(buf)) || buf;
	if (buf && buf.length <= 300 * 1024) thumbCache = { buf, at: Date.now() };
	return thumbCache.buf;
}

// ───────────────────────── plugin ─────────────────────────

export default {
	name: 'menu',
	aliases: ['help', '?', 'btnmenu'],
	category: 'other',
	desc: 'Menampilkan daftar menu. Contoh: .menu | .menu 1 | .menu downloader',
	async run(ctx) {
		const { hisoka, m, query } = ctx;
		const ownerName = process.env.BOT_OWNER_NAME || 'Iyan';
		const who = m.pushName || ownerName;
		const gcLink = readGcLink();
		const cats = buildCategories();

		if (!cats.length) {
			await m.reply('⚠️ Belum ada plugin yang termuat.');
			return;
		}

		// ── Detail satu kategori ──
		const arg = (query || '').trim();
		if (arg) {
			const found = findCategory(cats, arg);
			if (!found) {
				const px = displayPrefix();
				await m.reply(
					`❌ Kategori *${arg}* tidak ditemukan.\n\n` +
						cats.map((c, i) => `${i + 1}. ${c.icon} ${c.key}`).join('\n') +
						`\n\nContoh: ${px}menu 1`
				);
				return;
			}
			await m.reply(buildCategoryDetail(found.cat, found.index));
			return;
		}

		// ── Menu lengkap ──
		const { text, total } = buildMenu({ who, ownerName, gcLink, cats });
		const style = (process.env.BOT_MENU_STYLE || 'card').toLowerCase();

		if (style === 'text') {
			await m.reply(text);
			return;
		}

		// Gaya kartu: satu pesan dengan thumbnail besar
		if (style !== 'image') {
			try {
				const thumbnail = await getThumbnail();
				const ownerNum = (process.env.BOT_NUMBER_OWNER || '').split(',')[0].trim();
				await hisoka.sendMessage(
					m.from,
					{
						text,
						contextInfo: {
							externalAdReply: {
								title: '✦ ADAWONG BOT ✦',
								body: `Online ${uptimeText()} • ${total} fitur`,
								mediaType: 1,
								renderLargerThumbnail: true,
								showAdAttribution: false,
								...(thumbnail ? { thumbnail } : { thumbnailUrl: BANNER_URL }),
								sourceUrl: gcLink || (ownerNum ? `https://wa.me/${ownerNum}` : BANNER_URL),
							},
						},
					},
					{ quoted: m }
				);
				return;
			} catch (e) {
				console.warn('[menu] gaya kartu gagal, pakai gambar:', e?.message || e);
			}
		}

		// Gaya gambar / cadangan: banner + teks; kalau gambar gagal, teks saja.
		try {
			const thumb = await getThumbnail();
			let banner = thumb;
			if (!banner) {
				try { banner = fs.readFileSync(MENU_BANNER); } catch { /* tidak ada */ }
			}
			const image = banner ? { image: banner } : { image: { url: BANNER_URL } };
			if (Buffer.byteLength(text, 'utf8') > 1000) {
				await hisoka.sendMessage(m.from, image, { quoted: m });
				await m.reply(text);
			} else {
				await hisoka.sendMessage(m.from, { ...image, caption: text }, { quoted: m });
			}
		} catch (e) {
			console.warn('[menu] gambar gagal, kirim teks:', e?.message || e);
			await m.reply(text);
		}
	},
};

// Diekspor untuk test / dipakai plugin lain bila perlu.
export { buildCategories, buildMenu, buildCategoryDetail, findCategory };
