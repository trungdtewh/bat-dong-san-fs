# Hướng dẫn Deploy Production

## Yêu cầu

- Node.js ≥ 20
- PostgreSQL ≥ 14
- Tài khoản Vercel hoặc Railway

---

## Biến môi trường bắt buộc

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `NEXTAUTH_SECRET` | Chuỗi bí mật JWT, tối thiểu 32 ký tự |
| `NEXTAUTH_URL` | URL đầy đủ của ứng dụng (bao gồm `https://`) |

Tạo `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## Quy trình deploy chuẩn

```bash
# 1. Chạy migration (KHÔNG dùng migrate dev trên production)
npm run db:migrate

# 2. Build ứng dụng (bao gồm prisma generate)
npm run build

# 3. Tạo tài khoản admin lần đầu (upsert — an toàn khi chạy lại)
npm run db:seed

# 4. Khởi động
npm start
```

> **Quan trọng:** `prisma migrate deploy` chỉ chạy các migration đã có trong `prisma/migrations/`.
> Không tự động thay đổi schema như `prisma migrate dev`.

---

## Tài khoản admin mặc định

Sau khi chạy seed:

| Trường | Giá trị |
|---|---|
| Email | `admin@example.com` |
| Mật khẩu | `Admin@2024` |

**Đổi mật khẩu ngay sau lần đăng nhập đầu tiên** qua trang Thiết lập tài khoản.

---

## Vercel + Neon Postgres

### Bước 1: Tạo database Neon

1. Đăng nhập [neon.tech](https://neon.tech)
2. Tạo project mới → sao chép connection string (chọn **Pooled connection**)
3. Connection string có dạng:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Bước 2: Deploy lên Vercel

1. Kết nối repository GitHub với Vercel
2. Trong **Project Settings → Environment Variables**, thêm:
   ```
   DATABASE_URL     = <connection string từ Neon>
   NEXTAUTH_SECRET  = <output của openssl rand -base64 32>
   NEXTAUTH_URL     = https://<tên-project>.vercel.app
   ```
3. Vercel tự nhận `NODE_ENV=production`

### Bước 3: Chạy migration và seed

Vercel không tự chạy migration. Dùng một trong hai cách:

**Cách A — Vercel CLI (khuyến nghị):**

```bash
npx vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d= -f2-) \
  npx prisma migrate deploy
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d= -f2-) \
  npm run db:seed
```

**Cách B — Script `postbuild` (tự động mỗi deploy):**

Thêm vào `package.json` (chỉ dùng nếu chấp nhận seed chạy mỗi deploy — an toàn vì dùng upsert):

```json
"postbuild": "prisma migrate deploy"
```

### Lưu ý Neon

- Dùng **Pooled connection string** (port 5432 với `?sslmode=require`) thay vì Direct connection để tránh lỗi connection limit với Vercel Serverless
- Prisma `@prisma/adapter-pg` tương thích tốt với Neon

---

## Railway

### Bước 1: Tạo project Railway

1. Đăng nhập [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Chọn repository

### Bước 2: Thêm PostgreSQL

1. Trong project Railway → **New → Database → PostgreSQL**
2. Railway tự inject biến `DATABASE_URL` vào service — không cần copy thủ công

### Bước 3: Cấu hình biến môi trường

Trong tab **Variables** của service ứng dụng, thêm:

```
NEXTAUTH_SECRET  = <output của openssl rand -base64 32>
NEXTAUTH_URL     = https://<service>.up.railway.app
```

Railway tự set `NODE_ENV=production` và `PORT`.

### Bước 4: Cấu hình build và start

Railway tự phát hiện Next.js. Kiểm tra **Settings → Deploy**:

| Trường | Giá trị |
|---|---|
| Build Command | `npm run build` |
| Start Command | `npm start` |

### Bước 5: Chạy migration

Trong tab **Shell** của service (hoặc Railway CLI):

```bash
npm run db:migrate
npm run db:seed
```

Hoặc thêm migration vào build command:

```
npm run db:migrate && npm run build
```

---

## Kiểm tra sau deploy

Sau khi deploy thành công, kiểm tra các điểm sau:

- [ ] Trang đăng nhập `/dang-nhap` hiển thị
- [ ] Đăng nhập bằng `admin@example.com / Admin@2024`
- [ ] Tạo được dự án mới
- [ ] Navigation menu hiển thị đủ tiếng Việt
- [ ] Không có lỗi 500 trong Vercel/Railway logs

---

## Xử lý sự cố thường gặp

### Build lỗi: "Cannot find module '@prisma/client'"

Nguyên nhân: `prisma generate` chưa chạy.

Giải pháp: Script `build` đã bao gồm `prisma generate`. Kiểm tra biến `DATABASE_URL` có sẵn khi build.

### Lỗi: "Cấu hình môi trường không hợp lệ"

Nguyên nhân: Thiếu biến môi trường `DATABASE_URL` hoặc `NEXTAUTH_SECRET`.

Giải pháp: Kiểm tra lại Environment Variables trong Vercel/Railway.

### Lỗi connect database: "SSL required"

Nguyên nhân: Neon yêu cầu SSL.

Giải pháp: Thêm `?sslmode=require` vào cuối `DATABASE_URL`.

### Migration lỗi: "P3009 migrate found failed migrations"

Nguyên nhân: Migration trước đó bị interrupt.

Giải pháp:

```bash
prisma migrate resolve --rolled-back <migration-name>
prisma migrate deploy
```
