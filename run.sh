#!/usr/bin/env bash
# Supervisor readsw self-bot: hidup terus, restart otomatis kalau proses mati/crash.
# Single instance via flock. Stop: kill $(cat bot-sup.pid)
set -u
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK="$BASE_DIR/bot.lock"
LOG="$BASE_DIR/bot.log"

# TLS lewat egress proxy MITM sandbox
[ -f /usr/local/share/ca-certificates/hatch-egress-ca.crt ] && export NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/hatch-egress-ca.crt
# Sanitasi no_proxy (entri IPv6 tanpa kurung siku merusak parsing di bbrp lib)
export NO_PROXY=localhost,127.0.0.1
export no_proxy=localhost,127.0.0.1

# Beri tahu bot bahwa ada supervisor: auto update boleh restart (exit 75) dan run.sh menghidupkan lagi.
export READSW_SUPERVISED=1

exec 9>"$LOCK"
if ! flock -n 9; then echo "readsw supervisor sudah jalan"; exit 0; fi

# Tulis pidfile HANYA setelah lock didapat: instance yang gagal flock
# sebelumnya menimpa bot-sup.pid dengan PID-nya sendiri lalu exit,
# sehingga pidfile basi (menunjuk ke PID yang sudah mati).
echo $$ > "$BASE_DIR/bot-sup.pid"

CHILD=""
# WAJIB: kode bot pakai process.cwd() untuk .env, sessions/, react.json, dll.
# Tanpa cd ke sini, dotenv tidak menemukan .env dan semua env jadi undefined.
cd "$BASE_DIR"

while true; do
  echo "[$(date -u +%FT%TZ)] supervisor: menjalankan bot..." >>"$LOG"
  # stdbuf: matikan buffering stdout agar log real-time (bukan 4KB buffer)
  # Tutup fd lock (9) di child: kalau tidak, bot mewarisi fd lock dan
  # flock tidak pernah lepas saat supervisor mati -> supervisor baru
  # mengira supervisor lama masih jalan ("ghost lock").
  # stdbuf dipakai kalau ada (tidak ada di sebagian sistem, mis. macOS)
  if command -v stdbuf >/dev/null 2>&1; then
    stdbuf -o0 -e0 node "$BASE_DIR/src/index.js" 9>&- >>"$LOG" 2>&1 &
  else
    node "$BASE_DIR/src/index.js" 9>&- >>"$LOG" 2>&1 &
  fi
  CHILD=$!
  wait "$CHILD"
  code=$?
  CHILD=""
  if [ "$code" = "75" ]; then
    # keluar karena update: langsung hidupkan lagi dengan kode baru
    echo "[$(date -u +%FT%TZ)] supervisor: restart karena update, mulai lagi 2 dtk..." >>"$LOG"
    sleep 2
  else
    echo "[$(date -u +%FT%TZ)] supervisor: bot keluar (code $code), restart 10 dtk..." >>"$LOG"
    sleep 10
  fi
done
