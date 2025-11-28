#!/usr/bin/env bash
set -euo pipefail

PLIST_DEST="$HOME/Library/LaunchAgents/com.orderhelper.backup.plist"
ICLOUD="/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
LOG="/Users/alvin/Desktop/Kitchen/backup.log"

echo "⏹ Dừng launchd job..."
launchctl unload "$PLIST_DEST" >/dev/null 2>&1 || true

echo "🧹 Xoá plist..."
rm -f "$PLIST_DEST"

read -r -p "Xoá toàn bộ file backup trong iCloud/Kitchen? [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  find "$ICLOUD" -maxdepth 1 -type f -name 'order_history_*.json' -print -delete || true
  echo "✅ Đã xoá backup."
fi

read -r -p "Xoá log file ($LOG)? [y/N] " ans2
if [[ "$ans2" =~ ^[Yy]$ ]]; then
  rm -f "$LOG"
  echo "✅ Đã xoá log."
fi

echo "✅ Đã gỡ cài đặt hoàn tất."
