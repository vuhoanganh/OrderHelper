#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PLIST_DEST="$HOME/Library/LaunchAgents/com.orderhelper.backup.plist"
HTML="/Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
ICLOUD="/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
LOG="/Users/alvin/Desktop/Kitchen/backup.log"
BACKUP_SCPT="$BASE_DIR/Scripts/backup.scpt"

echo "🔍 Kiểm tra đường dẫn..."
[ -f "$HTML" ] || { echo "❌ Không tìm thấy file HTML: $HTML"; exit 1; }
[ -f "$BACKUP_SCPT" ] || { echo "❌ Không tìm thấy backup.scpt: $BACKUP_SCPT"; exit 1; }
mkdir -p "$ICLOUD"
touch "$LOG"
chmod +x "$BASE_DIR"/install.sh "$BASE_DIR"/uninstall.sh "$BASE_DIR"/Scripts/*.sh

echo "📝 Tạo launchd plist..."
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST_DEST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.orderhelper.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/osascript</string>
    <string>$BACKUP_SCPT</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>16</integer><key>Minute</key><integer>0</integer></dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>/Users/alvin/Desktop/Kitchen/backup_error.log</string>
</dict>
</plist>
EOF

echo "⏳ Nạp launchd job..."
launchctl unload "$PLIST_DEST" >/dev/null 2>&1 || true
launchctl load "$PLIST_DEST"

echo "🔔 Yêu cầu quyền thông báo..."
/usr/bin/osascript -e 'display notification "Đã bật backup tự động 16:00 hàng ngày" with title "Order Helper Backup"'

echo "🧪 Chạy thử backup một lần..."
/usr/bin/osascript "$BACKUP_SCPT" || { echo "❌ Backup thử thất bại, xem log $LOG"; exit 1; }

echo "✅ Cài đặt xong! Kiểm tra file backup trong iCloud: $ICLOUD"
echo "ℹ️ Xem log tại: $LOG"
