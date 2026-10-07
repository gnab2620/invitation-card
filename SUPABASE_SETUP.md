# Supabase setup cho form xác nhận tham dự

## 1. Tạo table

Vào Supabase Dashboard -> SQL Editor, chạy nội dung trong file `supabase_schema.sql`:

```sql
create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  attendance boolean not null,
  guest_count integer not null check (guest_count between 0 and 20),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists wedding_rsvps_created_at_idx
  on public.wedding_rsvps (created_at desc);
```

## 2. Điền cấu hình backend

Mở `appsettings.json` và thay:

```json
{
  "server": {
    "port": 4173
  },
  "supabase": {
    "url": "https://YOUR_PROJECT_REF.supabase.co",
    "serviceRoleKey": "YOUR_SUPABASE_SERVICE_ROLE_KEY",
    "table": "wedding_rsvps"
  }
}
```

Lấy `url` và `serviceRoleKey` trong Supabase Dashboard -> Project Settings -> API.

Quan trọng: `serviceRoleKey` là secret key, chỉ để trong backend. Không đưa key này vào file HTML, JS frontend, GitHub public, hoặc static hosting.

## 3. Chạy website với backend

Trong thư mục `D:\AI\invitation-card`, chạy:

```bash
npm start
```

Sau đó mở:

```text
http://127.0.0.1:4173
```

Nếu mở trực tiếp `index.html` bằng file browser thì popup vẫn hiện, nhưng nút gửi xác nhận sẽ không lưu được vì không có API `/api/rsvp`.
