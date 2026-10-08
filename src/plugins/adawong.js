'use strict';
// Command: adawong — ngobrol dengan Muse (adawong) lewat bot.
//   .adawong <pesan>   -> kirim pesan ke adawong, jawabannya dikirim balik
//   .adawong           -> status antrean
//
// Cara kerja: pesan dimasukkan ke .adawong-queue.json; hook "adawong-bridge"
// membangunkan worker adawong saat ada pesan baru; jawaban ditulis ke
// .adawong-replies.json dan dikirim oleh watcher di bawah (±1-2 menit).
// Khusus owner.

import * as shared from './_shared.js';

const { fs, path, os } = shared;

const QUEUE_FILE = path.join(os.homedir(), 'workspace', 'readsw', '.adawong-queue.json');
const REPLIES_FILE = path.join(os.homedir(), 'workspace', 'readsw', '.adawong-replies.json');

let sock = null; // ditangkap saat run() pertama
let watcherStarted = false;

function readJson(file) {
	try {
		if (!fs.existsSync(file)) return [];
		const d = JSON.parse(fs.readFileSync(file, 'utf8'));
		return Array.isArray(d) ? d : [];
	} catch {
		return [];
	}
}

function writeJsonAtomic(file, data) {
	const tmp = file + '.tmp';
	fs.writeFileSync(tmp, JSON.stringify(data));
	fs.renameSync(tmp, file);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pecah teks panjang jadi beberapa bubble chat ala orang ngetik. */
function splitBubbles(text) {
	if (text.length <= 400) return [text];
	const parts = text.split(/(?<=[.!?])\s+/);
	const bubbles = [];
	let cur = '';
	for (const p of parts) {
		if ((cur + ' ' + p).trim().length > 400 && cur) {
			bubbles.push(cur.trim());
			cur = p;
		} else {
			cur = (cur + ' ' + p).trim();
		}
	}
	if (cur.trim()) bubbles.push(cur.trim());
	return bubbles.length ? bubbles : [text];
}

/** Kirim satu bubble dengan indikator "mengetik..." dulu biar berasa hidup. */
async function sendLikeHuman(to, text) {
	const bubbles = splitBubbles(text);
	for (const b of bubbles) {
		try {
			await sock.sendPresenceUpdate('composing', to);
		} catch {}
		// simulasi kecepatan ngetik: ~40 karakter/detik, min 1.5s max 7s
		const typingMs = Math.min(7000, Math.max(1500, (b.length / 40) * 1000));
		await sleep(typingMs);
		try {
			await sock.sendMessage(to, { text: b });
		} catch {
			try { await sock.sendPresenceUpdate('paused', to); } catch {}
			throw new Error('gagal kirim');
		}
		try {
			await sock.sendPresenceUpdate('paused', to);
		} catch {}
		await sleep(800); // jeda antar bubble
	}
}

/** Kirim media (foto) — download dari Pollinations bila worker hanya memberi prompt. */
async function sendMediaLikeHuman(to, reply) {
	let filePath = reply.media && reply.media.path;
	const mediaPrompt = reply.media_prompt;

	// Worker hanya menulis prompt -> bot yang download gambarnya
	if (!filePath && mediaPrompt) {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adwimg-'));
		filePath = path.join(tmpDir, 'img.jpg');
		try {
			const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(mediaPrompt)}?width=768&height=768&nologo=true&model=flux`;
			const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const buf = Buffer.from(await res.arrayBuffer());
			if (buf.length < 10000) throw new Error('gambar tidak valid');
			fs.writeFileSync(filePath, buf);
		} catch (err) {
			fs.rmSync(tmpDir, { recursive: true, force: true });
			// fallback: kirim teks saja
			await sendLikeHuman(to, `🎨 Maaf sayang, gambarnya gagal dibuat (${err?.message || 'error'}).`);
			return;
		}
	}

	if (!filePath || !fs.existsSync(filePath)) return;
	const caption = (reply.media && reply.media.caption) || '';
	try {
		await sock.sendPresenceUpdate('composing', to);
	} catch {}
	await sleep(2500); // jeda "menyiapkan" media
	try {
		await sock.sendMessage(to, {
			image: fs.readFileSync(filePath),
			caption,
		});
	} finally {
		try { await sock.sendPresenceUpdate('paused', to); } catch {}
		try { fs.unlinkSync(filePath); } catch {}
	}
}

/** Kirim balasan yang sudah siap ke chat masing-masing. */
async function deliverReplies() {
	if (!sock) return;
	const replies = readJson(REPLIES_FILE);
	if (!replies.length) return;
	const remaining = [];
	for (const r of replies) {
		try {
			if (r.media_prompt || (r.media && r.media.path)) {
				await sendMediaLikeHuman(r.to, r);
			}
			if (r.text) {
				await sendLikeHuman(r.to, `💬 *adawong:*\n${r.text}`);
			}
		} catch {
			remaining.push(r); // gagal -> coba lagi nanti
		}
	}
	writeJsonAtomic(REPLIES_FILE, remaining);
}

function startWatcher() {
	if (watcherStarted) return;
	watcherStarted = true;
	const iv = setInterval(() => {
		deliverReplies().catch(() => {});
	}, 10000);
	if (iv.unref) iv.unref();
}

export default {
	name: 'adawong',
	aliases: ['tanyaadawong'],
	category: 'TOOLS',
	desc: 'Ngobrol dengan adawong. Contoh: .adawong halo',
	async run(ctx) {
		const { hisoka, m, query } = ctx;
		if (!m.isOwner) return;
		sock = hisoka;
		startWatcher();
		// sekalian cek balasan yang mungkin menunggu
		await deliverReplies().catch(() => {});

		const text = (query || '').trim();
		if (!text) {
			const q = readJson(QUEUE_FILE);
			const pending = q.filter((x) => x.status === 'pending').length;
			await m.reply(
				'💬 *ADAWONG*\n\n' +
				'• `.adawong <pesan>` — tanya sesuatu, kujawab ±1-2 menit\n' +
				`• Antrean saat ini: ${pending} pesan`
			);
			return;
		}
		if (text.length > 2000) {
			await m.reply('❌ Pesan maksimal 2000 karakter.');
			return;
		}

		const queue = readJson(QUEUE_FILE);
		// batasi antrean biar tidak menumpuk
		const pendingCount = queue.filter((x) => x.status === 'pending').length;
		if (pendingCount >= 5) {
			await m.reply('⏳ Antrean penuh (5). Tunggu jawaban sebelumnya dulu ya.');
			return;
		}
		queue.push({
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			to: m.from,
			sender: m.sender,
			text,
			ts: Date.now(),
			status: 'pending',
		});
		// simpan max 50 entri terakhir
		writeJsonAtomic(QUEUE_FILE, queue.slice(-50));
		// langsung tampilkan "mengetik..." saja, tanpa teks "tunggu dulu"
		try { await hisoka.sendPresenceUpdate('composing', m.from); } catch {}
	},
};
