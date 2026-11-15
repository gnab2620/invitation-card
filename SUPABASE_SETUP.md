# Supabase setup cho form xác nhận tham dự

Website hỗ trợ hai chế độ:

- Local: `server.cjs` dùng `serviceRoleKey` trong `appsettings.json`.
- GitHub Pages: trình duyệt gọi Supabase REST bằng publishable key; RLS cho phép khách thêm RSVP và có thể bật quyền đọc công khai có giới hạn cột cho trang `/table/`.
- Trang `/table/`: bảng RSVP công khai, đọc bằng publishable key và policy RLS giới hạn các cột được trả về.

Không đưa `serviceRoleKey` hoặc Supabase secret key vào HTML, JavaScript, GitHub Variables hay GitHub Pages.

## 1. Tạo table và chính sách bảo mật

Vào Supabase Dashboard -> SQL Editor và chạy toàn bộ nội dung file `supabase_schema.sql`.

Script sẽ:

- Tạo table `public.wedding_rsvps` nếu chưa tồn tại.
- Bật Row Level Security.
- Thu hồi toàn bộ quyền mặc định của `anon` và `authenticated`.
- Chỉ cấp quyền `INSERT` vào bốn cột cần thiết cho role `anon`.
- Không cấp quyền đọc, sửa hoặc xóa RSVP cho khách truy cập.

## 2. Lấy URL và publishable key

Trong Supabase Dashboard, mở Project Settings -> API Keys hoặc cửa sổ Connect và sao chép:

- Project URL, dạng `https://PROJECT_REF.supabase.co`.
- Publishable key, thường bắt đầu bằng `sb_publishable_`.

Project cũ có thể dùng legacy `anon` key. Không sử dụng `service_role` hoặc secret key trên GitHub Pages.

## 3. Cấu hình GitHub Pages

Trong GitHub repository, vào Settings -> Secrets and variables -> Actions. Workflow chấp nhận các giá trị được tạo trong Repository variables hoặc Repository secrets.

Tạo `SUPABASE_URL` trong tab Variables hoặc Secrets:

```text
SUPABASE_URL=https://PROJECT_REF.supabase.co
```

Nếu tên table khác mặc định, tạo thêm `SUPABASE_TABLE` trong Variables hoặc Secrets:

```text
SUPABASE_TABLE=wedding_rsvps
```

Tạo `SUPABASE_PUBLISHABLE_KEY` trong Secrets hoặc Variables:

```text
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Publishable key vốn được phép xuất hiện trong frontend; lưu trong GitHub Secret chỉ giúp tránh hiển thị nó trong cấu hình repository và log build.

Workflow `.github/workflows/static.yml` sẽ tạo `scripts/supabase-config.js` khi deploy. Sau khi thêm cấu hình, push lên branch `main` hoặc chạy workflow thủ công trong tab Actions.

## 4. Cấu hình backend local

Tạo `appsettings.json` từ `appsettings.example.json` và điền backend key:

```json
{
  "server": {
    "port": 4173
  },
  "supabase": {
    "url": "https://PROJECT_REF.supabase.co",
    "serviceRoleKey": "YOUR_SUPABASE_SERVICE_ROLE_KEY",
    "table": "wedding_rsvps"
  }
}
```

`appsettings.json` đã được `.gitignore`; không commit file này.

Chạy local:

```powershell
cd D:\AI\invitation-card
npm start
```

Sau đó mở `http://127.0.0.1:4173`.

## 5. Kiểm tra sau khi deploy

1. Mở URL GitHub Pages.
2. Gửi một RSVP thử nghiệm.
3. Kiểm tra row mới trong Supabase Dashboard -> Table Editor -> `wedding_rsvps`.
4. Nếu GitHub Actions báo thiếu cấu hình, kiểm tra chính xác tên variable và secret ở bước 3.

## 6. Bảng RSVP công khai tại `/table/`

Trang `/table/` không yêu cầu đăng nhập. Bảng tự cập nhật mỗi 15 giây, hiển thị tổng phản hồi, tổng khách tham dự (cộng `guest_count` của RSVP đồng ý), số RSVP từ chối và có nút tải CSV.

Để bật quyền đọc, chạy `supabase_public_read_policy.sql` trong Supabase SQL Editor rồi deploy lại GitHub Pages. Policy chỉ cấp quyền đọc các cột được hiển thị (`full_name`, `attendance`, `guest_count`, `created_at`); không cấp quyền đọc `user_agent` hoặc `id`.

**Lưu ý:** khi áp dụng policy này, bất kỳ ai có link website đều có thể xem/tải các tên và thông tin tham dự. Dữ liệu cũng có thể được đọc trực tiếp từ Supabase REST API bằng project URL và publishable key. `noindex` chỉ hạn chế lập chỉ mục trên công cụ tìm kiếm, không tạo bảo vệ truy cập.

Mở `https://gnab2620.github.io/invitation-card/table/` sau khi deploy. Không đưa service role key vào trang hoặc GitHub Pages.
