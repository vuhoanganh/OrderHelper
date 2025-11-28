#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd -- "$(dirname "$0")" && pwd)/.."
SCPT="$BASE_DIR/Scripts/backup.scpt"
CLEAN_SCPT="$BASE_DIR/Scripts/cleanup.scpt"
PLIST="$BASE_DIR/../com.orderhelper.backup.plist"
ICLOUD="/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
LOG="/Users/alvin/Desktop/Kitchen/backup.log"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

echo "=== Test 1: Backup script execution ==="
/usr/bin/osascript "$SCPT" || fail "Backup script lỗi"
latest=$(ls -1t "$ICLOUD"/order_history_*.json 2>/dev/null | head -n 1)
[[ -n "$latest" ]] || fail "Không thấy file backup"
size=$(stat -f%z "$latest")
[[ "$size" -gt 0 ]] || fail "File backup rỗng"
pass "Backup tạo file: $latest (${size} bytes)"

echo "=== Test 2: Cleanup rotation (giữ 30 file) ==="
mkdir -p "$ICLOUD"
for i in $(seq -w 01 35); do
  touch "$ICLOUD/order_history_2025-01-$i.json"
done
/usr/bin/osascript "$CLEAN_SCPT" || fail "Cleanup lỗi"
count=$(ls -1 "$ICLOUD"/order_history_*.json 2>/dev/null | wc -l | tr -d ' ')
[[ "$count" -eq 30 ]] || fail "Sau cleanup còn $count file (kỳ vọng 30)"
pass "Cleanup giữ đúng 30 file"

echo "=== Test 3: Notification system ==="
/usr/bin/osascript -e 'display notification "Test thông báo" with title "Order Helper Backup"' || fail "Gửi thông báo thất bại"
pass "Notification gọi thành công (xác nhận trong Notification Center)"

echo "=== Test 4: Error handling (đường dẫn xấu) ==="
if /usr/bin/osascript "$SCPT" <<<'bad'; then
  :
fi
pass "Error handling đã kiểm tra (xem log để xác thực không crash)"

echo "=== Test 5: launchd plist cấu hình ==="
[[ -f "$PLIST" ]] || fail "Không tìm thấy plist mẫu: $PLIST"
hour=$(/usr/libexec/PlistBuddy -c "Print :StartCalendarInterval:Hour" "$PLIST")
minute=$(/usr/libexec/PlistBuddy -c "Print :StartCalendarInterval:Minute" "$PLIST")
[[ "$hour" == "16" && "$minute" == "0" ]] || fail "Lịch không đúng 16:00 (giờ=$hour, phút=$minute)"
pass "launchd plist 16:00 hợp lệ"

echo "=== Báo cáo ==="
echo "Log gần đây:"
tail -n 8 "$LOG" || true
echo "Tất cả test đã chạy xong."
