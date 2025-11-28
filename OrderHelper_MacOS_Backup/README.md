# Hệ thống backup tự động cho Order Helper (macOS)

## Yêu cầu hệ thống
- macOS 15.6 (Sequoia)
- Safari (ưu tiên), Chrome dự phòng
- iCloud Drive đã bật, thư mục: `/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/`
- File HTML: `/Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html`
- Python 3, osascript, launchd (mặc định có sẵn trên macOS)

## Cài đặt nhanh
```bash
cd /Users/alvin/Desktop/Kitchen/OrderHelper_MacOS_Backup
chmod +x install.sh Scripts/*.sh uninstall.sh
./install.sh
```
- install.sh sẽ kiểm tra đường dẫn, tạo plist, nạp launchd lúc 16:00 hàng ngày, bật thông báo, và chạy thử một lần.

## Cách hoạt động
1) launchd gọi `backup.scpt` mỗi ngày 16:00.  
2) `backup.scpt` mở Safari với tham số `?autobackup=true`, gọi hàm `exportForAutomation()` trong HTML để lấy JSON lịch sử.  
3) Ghi file vào iCloud Drive: `order_history_YYYY-MM-DD.json`.  
4) Gọi `cleanup.scpt` để giữ tối đa 30 file (xoá cũ nhất nếu vượt quá).  
5) Ghi log vào `backup.log` và gửi thông báo Notification Center (thành công/thất bại).

### Luồng chữ (đơn giản)
```
launchd 16:00 → backup.scpt (Safari + JS export) → iCloud JSON → cleanup 30 file → thông báo
```

## File & script chính
- `Scripts/backup.scpt`: Backup chính, log, thông báo, gọi cleanup.
- `Scripts/cleanup.scpt`: Giữ tối đa 30 file `order_history_*.json`.
- `Scripts/test_backup.sh`: Test thủ công: chạy backup, check file & log.
- `Scripts/automation_test.sh`: Bộ test tự động (backup, cleanup, notif, plist).
- `com.orderhelper.backup.plist`: launchd cấu hình 16:00.
- `install.sh`: Cài, nạp launchd, chạy thử.
- `uninstall.sh`: Gỡ launchd, tuỳ chọn xoá backup/log.

## Kiểm thử
- Test nhanh: `./Scripts/test_backup.sh`
- Test đầy đủ: `./Scripts/automation_test.sh`

## Troubleshooting
- Không thấy file backup: xem `backup.log`, kiểm tra iCloud Drive đã sync.
- Safari không mở: thử `osascript Scripts/backup.scpt` và đọc thông báo lỗi.
- Thông báo không hiện: mở Notification Settings → cho phép Script Editor/osascript/Terminal.
- Lịch không chạy: xem `launchctl list | grep orderhelper` và chắc chắn plist trong `~/Library/LaunchAgents`.

## Gỡ cài đặt
```bash
./uninstall.sh
```
- Chọn xoá/nếu muốn giữ backup hoặc log.

## FAQ
- **Có cần xoá kết quả cũ trong app trước khi backup?** Không. Backup lấy toàn bộ `orderHistory` từ localStorage hiện tại.  
- **Có giới hạn dung lượng?** Giữ 30 file gần nhất, mỗi file là JSON lịch sử.  
- **Safari hay Chrome?** Safari mặc định; có thể chỉnh `backup.scpt` nếu muốn.  
