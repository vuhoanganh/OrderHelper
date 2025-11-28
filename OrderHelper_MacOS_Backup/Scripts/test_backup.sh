#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd -- "$(dirname "$0")" && pwd)/.."
SCPT="$BASE_DIR/Scripts/backup.scpt"
TARGET_DIR="/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
LOG="/Users/alvin/Desktop/Kitchen/backup.log"

echo "▶️ Chạy backup.scpt..."
/usr/bin/osascript "$SCPT"

echo "🔎 Kiểm tra file mới..."
latest=$(ls -1t "$TARGET_DIR"/order_history_*.json 2>/dev/null | head -n 1)
if [[ -z "$latest" ]]; then
  echo "❌ Không tìm thấy file backup."
  exit 1
fi

size=$(stat -f%z "$latest")
if [[ "$size" -le 0 ]]; then
  echo "❌ File rỗng: $latest"
  exit 1
fi

echo "✅ PASS: $latest (${size} bytes)"
echo "📜 Log gần nhất:"
tail -n 10 "$LOG" || true
