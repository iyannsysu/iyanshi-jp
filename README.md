<div align="center">

# 🤖 rimuru-plugin

### WhatsApp Self-Bot dengan Arsitektur Plugin

*74 plugin · 155 command · 1 bot yang rapi*

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-v7-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-rimuru-ff69b4?style=flat-square)](https://github.com/iyannsysu)

</div>

---

## ✨ Tentang

**rimuru-plugin** adalah WhatsApp self-bot yang dibangun dengan arsitektur **plugin**. Setiap command hidup di file-nya sendiri di `src/plugins/` — rapi, mudah dicari, dan gampang ditambah tanpa mengutak-atik file raksasa.

```
src/plugins/
├── _shared.js      → semua helper & state bersama
├── _loader.js      → auto-scan & validasi plugin
├── menu.js         → command .menu
├── play.js         → command .play
├── tiktok.js       → command .tt
└── ... (74 plugin)
```

> Mau tambah command baru? Cukup bikin 1 file. Bot otomatis memuatnya saat startup.

---

## 🚀 Instalasi

**Syarat:** Node.js 20+ dan ffmpeg (untuk stiker)

```bash
# 1. Install dependencies
npm install

# 2. Siapkan konfigurasi
cp .env.example .env
# → isi BOT_NUMBER_OWNER dengan nomormu (format: 6281234567890)

# 3. Jalankan
npm start
```

Login via **QR** di terminal, atau isi `BOT_NUMBER_PAIR` di `.env` untuk login pakai **kode pairing**.

---

## 🎯 Fitur Utama

| Kategori | Deskripsi |
|---|---|
| 📥 **Downloader** | TikTok HD, YouTube audio (`.play`), Pinterest, Pixiv |
| 🖼️ **Stiker** | Buat stiker webp 512×512 dari gambar/video |
| 📊 **Status** | Auto-read, auto-react, status saver, ringkasan harian ke Telegram |
| 🎮 **Game** | Tebak-tebakan, math, family100, dan lainnya |
| 🕌 **Islami** | Jadwal sholat, doa harian, primbon |
| 🛠️ **Utilitas** | TTS, translate, screenshot web, cuaca |
| 🤖 **Otomatis** | Anti-delete, anti view-once, auto-reply, pantau kontak |

---

## 📋 Daftar Command

<details>
<summary><b>📥 Downloader</b></summary>

| Command | Fungsi |
|---|---|
| `.tt` / `.tiktok` / `.dl` `<link>` | Download video TikTok HD |
| `.play` `<judul>` | Download audio YouTube |
| `.pin` `<keyword>` | Cari & download Pinterest |
| `.pixiv` `<keyword>` | Cari artwork Pixiv |

</details>

<details>
<summary><b>🖼️ Stiker</b></summary>

| Command | Fungsi |
|---|---|
| `.s` / `.sticker` | Buat stiker dari pesan yang di-reply |
| `.tpack` `<link>` | Download sticker pack Telegram |

</details>

<details>
<summary><b>📊 Status</b></summary>

| Command | Fungsi |
|---|---|
| `.sw` | Panel status |
| `.swreact` `<emoji>` | Set emoji auto-react |
| `.swread` `on/off` | Toggle auto-read status |

</details>

<details>
<summary><b>🎮 Game</b></summary>

| Command | Fungsi |
|---|---|
| `.tebakgambar` | Tebak gambar |
| `.math` | Kuis matematika |
| `.family100` | Family 100 |

</details>

<details>
<summary><b>🛠️ Utilitas</b></summary>

| Command | Fungsi |
|---|---|
| `.tts` `<teks>` | Text to speech |
| `.tr` `<lang>` `<teks>` | Translate |
| `.ss` `<url>` | Screenshot website |
| `.cuaca` `<kota>` | Info cuaca |
| `.menu` | Tampilkan menu lengkap |
| `.p` / `.ping` | Cek latency & uptime |

</details>

> Ketik `.menu` di WhatsApp untuk daftar lengkap (dibuat otomatis dari plugin yang termuat). Detail per kategori: `.menu 1` atau `.menu downloader`.

---

## 🔄 Auto Update

Bot bisa memperbarui dirinya sendiri dari GitHub, tanpa git dan tanpa menyentuh data lokal
(`.env`, `sessions/`, `*.json` data, `node_modules/`).

```env
UPDATE_REPO=pemilik/repo      # wajib
UPDATE_BRANCH=main
GITHUB_TOKEN=                 # opsional (repo private / limit lebih longgar)
AUTO_UPDATE=true
AUTO_UPDATE_INTERVAL_MIN=60
```

| Command (owner) | Fungsi |
|---|---|
| `.update` | cek versi baru |
| `.update now` | unduh, validasi, pasang, restart otomatis |
| `.update force` | pasang ulang versi terbaru walau sama |
| `.update status` | versi terpasang & konfigurasi |
| `.update auto on/off` | hidupkan / matikan cek berkala |
| `.update rollback` | batalkan update terakhir |

Pengaman: semua file `.js` di repo diperiksa (`node --check`) **sebelum** menimpa apa pun, file yang
ditimpa di-backup ke `.update-backup/`, kegagalan (termasuk `npm install`) memicu rollback otomatis,
dan restart menunggu command yang sedang berjalan. Pertama kali dijalankan, auto update hanya menetapkan
versi acuan = commit repo saat ini (tidak menimpa file). Restart otomatis butuh bot dijalankan lewat `run.sh`.
Untuk memakai versi script ini, push dulu ke repo `UPDATE_REPO` supaya repo jadi sumber kebenaran.

## ⚙️ Konfigurasi

| File | Fungsi |
|---|---|
| `.env` | Nomor owner, token Telegram, dsb. |
| `autoreply.json` | Keyword auto-reply |
| `react.json` | Custom emoji per kontak |
| `watch.json` | Daftar nomor yang dipantau |
| `swconfig.json` | Pengaturan status |

---

## 🧩 Bikin Plugin Sendiri

```js
// src/plugins/halo.js
import * as shared from './_shared.js';

export default {
    name: 'halo',
    aliases: ['hi', 'hello'],
    category: 'fun',
    desc: 'Sapa balik',
    async run(ctx) {
        const { m } = ctx;
        await m.reply('Halo juga! 👋');
    },
};
```

Simpan, restart bot — command `.halo` langsung aktif. Tanpa edit file lain.

---

## 📄 Lisensi

MIT License — Copyright (c) 2026 rimuru. Lihat [LICENSE](LICENSE) untuk detail (tersedia dalam bahasa Jepang & Inggris).

---

<div align="center">

*Dibuat dengan 💙 oleh **rimuru***

</div>
