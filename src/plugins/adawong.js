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

/** Kirim balasan yang sudah siap ke chat masing-masing. */
async function deliverReplies() {
	if (!sock) return;
	const replies = readJson(REPLIES_FILE);
	if (!replies.length) return;
	const remaining = [];
	for (const r of replies) {
		try {
			await sock.sendMessage(r.to, { text: `💬 *adawong:*\n${r.text}` }, { quoted: undefined });
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
	}, 15000);
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
		await m.reply('⏳ Oke, kumikir dulu ya sayang... (jawab ±1-2 menit)');
	},
};
