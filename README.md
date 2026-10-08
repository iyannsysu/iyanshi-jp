<div align="center">

# 🤖 rimuru-plugin

### WhatsApp Self-Bot dengan Arsitektur Plugin

*76 plugin · 164 command · 1 bot yang rapi*

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
├── fitur.js        → command .fitur (status semua fitur)
├── menu.js         → command .menu
├── play.js         → command .play
├── tiktok.js       → command .tt
└── ... (76 plugin)
```

> Mau tambah command baru? Cukup bikin 1 file. Bot otomatis memuatnya saat startup. Ketik `.fitur` di WhatsApp untuk lihat status semua fitur (✓ aktif / ✗ rusak).

---

## 🚀 Cara Pasang

**Syarat:**
- Node.js 20 atau lebih baru
- ffmpeg (untuk stiker & kompres video) — `sudo apt install ffmpeg`
- 1 nomor WhatsApp untuk bot

```bash
# 1. Clone repo ini
git clone https://github.com/iyannsysu/iyanshi-jp.git
cd iyanshi-jp

# 2. Install dependencies
npm install

# 3. Siapkan konfigurasi
cp .env.example .env
# → buka .env, isi BOT_NUMBER_OWNER dengan nomormu (format: 6281234567890)

# 4. Jalankan
npm start
# atau pakai supervisor (auto-restart + anti-double-run):
bash run.sh
```

**Login:** scan **QR** yang muncul di terminal. Atau isi `BOT_NUMBER_PAIR` di `.env` dengan nomormu untuk login pakai **kode pairing** (8 digit, diketik di WhatsApp > Perangkat Tertaut).

**Konfigurasi penting di `.env`:**

| Variabel | Fungsi |
|---|---|
| `BOT_NUMBER_OWNER` | Nomormu (format 628xxx) — wajib |
| `BOT_OWNER_NAME` | Nama owner |
| `BOT_PREFIX` | Prefix command (default `.`) |
| `BOT_NUMBER_PAIR` | Isi nomormu kalau mau login pakai kode pairing |
| `TELEGRAM_TOKEN` / `TELEGRAM_CHAT_ID` | Bot Telegram untuk ringkasan status harian |
| `UPDATE_REPO` | `pemilik/repo` GitHub untuk auto-update (mis. `iyannsysu/iyanshi-jp`) |
| `BOT_FORWARD_STATUS_WA` | `true` kalau status mau diteruskan ke chat pribadi (default mati) |

---

## 🎯 Fitur Utama

| Kategori | Deskripsi |
|---|---|
| 📥 **Downloader** | TikTok HD, YouTube/Spotify audio (`.play`, `.play2` tanpa login), Pinterest, Pixiv |
| 🖼️ **Stiker** | Buat stiker webp 512×512 dari gambar/video, sticker pack |
| 📊 **Status** | Auto-read, auto-react, status saver, ringkasan harian ke Telegram |
| 📕 **Komik** | `.komik` & `.manhwa` — baca chapter langsung jadi **1 file PDF** (nggak spam) |
| 🎮 **Game** | Tebak gambar, math, family100 |
| 🕌 **Islami** | Jadwal sholat, doa harian, primbon, zodiak |
| 🛠️ **Utilitas** | TTS, translate, screenshot web, cuaca, `.fitur` (cek status fitur), `.versi` |
| 🤖 **Otomatis** | Anti-delete, anti view-once, auto-reply, pantau kontak |
| 🔄 **Auto-update** | `.update` — update script dari GitHub tanpa git, aman (backup + rollback otomatis) |

---

## 📋 Daftar Command (76 plugin)

<details>
<summary><b>📥 downloader (1)</b></summary>

- `.play2` — Download lagu dari Spotify  ⚡ *

</details>

<details>
<summary><b>🖼️ STIKER (3)</b></summary>

- `.s`
- `.spack`
- `.tpack`

</details>

<details>
<summary><b>📊 STATUS (5)</b></summary>

- `.sw`
- `.swemoji`
- `.swreacttext`
- `.swread`
- `.uptimebio`

</details>

<details>
<summary><b>🎮 GAME (3)</b></summary>

- `.math`
- `.nyerah`
- `.tebakgambar`

</details>

<details>
<summary><b>🎭 FUN (5)</b></summary>

- `.afk`
- `.alay`
- `.hacker`
- `.khodam`
- `.menfess`

</details>

<details>
<summary><b>🛠️ TOOLS (5)</b></summary>

- `.cuaca`
- `.fitur` — Lihat status semua fitur: ✓ aktif, ✗ rusak.
- `.ssweb`
- `.translate`
- `.tts`

</details>

<details>
<summary><b>🕌 ISLAMI & PRIMBON (5)</b></summary>

- `.artinama`
- `.doaharian`
- `.jadwalsholat`
- `.ramalanjodoh`
- `.zodiak`

</details>

<details>
<summary><b>🔞 18+ ZONE (13)</b></summary>

- `.bokep`
- `.cewe`
- `.cewekat`
- `.cewevid`
- `.chara`
- `.cosplay18`
- `.hanime`
- `.komik` — Baca komik dewasa teks Indonesia. .komik <judul>, lalu ketik nomor.
- `.manhwa`
- `.nekopoi`
- `.ppic` — Cari foto dewasa HD. Contoh: .ppic asian
- `.r34` — Cari gambar anime 18+ dari booru (maks 20/album). Contoh: .r34 breasts
- `.s18` — Search video 18+ di web. .s18 <keyword> lalu .s18 <nomor>

</details>

<details>
<summary><b>👑 owner (2)</b></summary>

- `.debug`
- `.jadibot` — Clone bot ke nomor lain

</details>

<details>
<summary><b>⚙️ OWNER & SISTEM (1)</b></summary>

- `.update` — Cek & pasang update dari GitHub. .update

</details>

<details>
<summary><b>📦 other (33)</b></summary>

- `.$`
- `.>`
- `.balasmenfess`
- `.busyreply`
- `.contacts`
- `.cosplay`
- `.groups`
- `.hentai`
- `.hidetag`
- `.menu` — Menampilkan daftar menu. Contoh: .menu
- `.p`
- `.pin`
- `.pixiv`
- `.play`
- `.ppcouple`
- `.q`
- `.react`
- `.setgc`
- `.sfile`
- `.storyadd`
- `.storycap`
- `.storyclear`
- `.storydel`
- `.storylist`
- `.storynow`
- `.storyon`
- `.storytime`
- `.swreplytext`
- `.tiktokv2`
- `.tolakmenfess`
- `.tt`
- `.versi` — Lihat versi & status bot. Contoh: .versi
- `.ytsearch`

</details>


> Ketik `.menu` di WhatsApp untuk daftar interaktif, atau `.fitur` untuk lihat status kesehatan semua fitur (✓ aktif / ✗ rusak).

---

## 🔄 Auto Update

Bot bisa memperbarui dirinya sendiri dari GitHub, tanpa git dan tanpa menyentuh data lokal
(`.env`, `sessions/`, `*.json` data, `node_modules/`).

```env
UPDATE_REPO=iyannsysu/iyanshi-jp
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

MIT License — Copyright (c) 2026 rimuru. Lihat [LICENSE](LICENSE) untuk detail.

---

<div align="center">

*Dibuat dengan 💙 oleh **rimuru***

</div>
