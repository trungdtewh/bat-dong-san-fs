# Hướng dẫn Deploy Staging

> Môi trường: Neon (PostgreSQL) + Vercel  
> Phiên bản ứng dụng: Next.js 16 / Prisma 7 / NextAuth v4

---

## Tổng quan kiến trúc

```
Vercel (Next.js)  ──►  Neon (PostgreSQL serverless)
     │
     └── NextAuth (JWT session, CredentialsProvider)
```

**Biến môi trường bắt buộc (3 biến):**

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `DATABASE_URL` | ✅ | Chuỗi kết nối Neon PostgreSQL |
| `NEXTAUTH_SECRET` | ✅ | Tối thiểu 32 ký tự |
| `NEXTAUTH_URL` | ✅ | URL đầy đủ của ứng dụng trên Vercel |

---

## Bước 1 — Tạo Neon Database

### 1.1 Đăng ký / Đăng nhập

Truy cập [https://neon.tech](https://neon.tech) và đăng nhập bằng GitHub hoặc email.

### 1.2 Tạo project mới

1. Nhấn **New Project**
2. Điền thông tin:
   - **Project name:** `bat-dong-san-fs-staging`
   - **Database name:** `real_estate_cashflow`
   - **Region:** `AWS Singapore (ap-southeast-1)` *(gần Việt Nam nhất)*
   - **Postgres version:** `16` (mặc định)
3. Nhấn **Create project**

### 1.3 Lấy DATABASE_URL

Sau khi tạo xong, Neon hiển thị connection string ngay trên màn hình.

1. Chọn tab **Connection string**
2. Chọn **Pooled connection** (khuyến nghị cho serverless)
3. Copy chuỗi có dạng:

```
postgresql://user:password@ep-xxx-yyy.ap-southeast-1.aws.neon.tech/real_estate_cashflow?sslmode=require
```

> **Lưu ý:** Giữ chuỗi này bí mật. Không commit vào git.

---

## Bước 2 — Tạo Project Vercel

### 2.1 Import repository

1. Truy cập [https://vercel.com/new](https://vercel.com/new)
2. Kết nối GitHub và chọn repo `bat-dong-san-fs`
3. Vercel tự nhận dạng **Next.js** — không cần chỉnh framework

### 2.2 Cấu hình build

Vercel sử dụng lệnh build mặc định từ `package.json`:

```json
"build": "prisma generate && next build"
```

Không cần chỉnh **Build Command** hay **Output Directory**.

### 2.3 Thiết lập biến môi trường

Trước khi nhấn **Deploy**, mở rộng mục **Environment Variables** và thêm 3 biến sau:

#### `DATABASE_URL`

```
postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/real_estate_cashflow?sslmode=require
```

*(dán chuỗi lấy từ Bước 1.3)*

#### `NEXTAUTH_SECRET`

Tạo giá trị ngẫu nhiên bằng lệnh sau trong terminal:

```bash
openssl rand -base64 32
```

Dán kết quả (ví dụ: `K7fP2mXqR9vL4nW8cZ1bY6uE3sA5jH0d`) vào ô giá trị.

#### `NEXTAUTH_URL`

Điền URL staging của ứng dụng:

```
https://bat-dong-san-fs.vercel.app
```

> Sau khi deploy lần đầu, Vercel cấp URL chính xác. Nếu chưa biết URL, điền tạm — sau đó quay lại **Settings → Environment Variables** cập nhật rồi redeploy.

### 2.4 Deploy lần đầu

Nhấn **Deploy**. Vercel sẽ:
1. Chạy `npm install` (kéo theo `postinstall: prisma generate`)
2. Chạy `prisma generate && next build`
3. Deploy lên CDN

> **Build có thể thất bại** nếu chưa chạy migration (bảng chưa tồn tại). Xem Bước 3 để chạy migration trước.

---

## Bước 3 — Chạy Migration Production

Migration phải chạy **trước lần deploy đầu tiên** hoặc khi có migration mới.

### Cách 1: Chạy từ máy local (khuyến nghị cho staging)

**Yêu cầu:** Node.js đã cài, đang ở thư mục dự án.

```bash
# 1. Tạo file .env.staging tạm thời (KHÔNG commit file này)
echo 'DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/real_estate_cashflow?sslmode=require"' > .env.staging

# 2. Chạy migrate deploy với env override
DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/real_estate_cashflow?sslmode=require" \
  npx prisma migrate deploy

# 3. Xóa file tạm
rm .env.staging
```

**Hoặc** nếu dùng `.env` local (chú ý không commit):

```bash
# Tạm thời đổi DATABASE_URL trong .env sang Neon URL, rồi:
npx prisma migrate deploy
# Sau đó khôi phục .env local
```

### Cách 2: Dùng Vercel CLI

```bash
# Cài Vercel CLI
npm i -g vercel

# Link project
vercel link

# Kéo env vars từ Vercel về local
vercel env pull .env.vercel

# Chạy migrate với env của Vercel
source .env.vercel && npx prisma migrate deploy
```

### Kết quả kỳ vọng

```
Prisma Migrate: 11 migrations found in prisma/migrations

The following migrations have been applied:
  - 20260604110635_init
  - 20260604121430_add_project_fields
  - 20260605144133_add_scenario_timeline_fields
  - 20260605150859_redesign_assumption_fields
  - 20260605154647_add_land_cost_category
  - 20260605161959_add_construction_phase7
  - 20260606000000_add_product_group_batch
  - 20260606093614_add_user_email_verified
  - 20260606100000_add_von_vay_module
  - 20260606101553_p5_project_ownership
  - 20260606150000_cleanup_loan_defaults
  - 20260606200000_add_dong_tien_module

All migrations have been successfully applied.
```

---

## Bước 4 — Tạo Tài khoản Admin

Sau khi migration thành công, chạy seed để tạo tài khoản admin mặc định:

```bash
# Với DATABASE_URL trỏ vào Neon staging
DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/real_estate_cashflow?sslmode=require" \
  npm run db:seed
```

### Kết quả kỳ vọng

```
✅ Tài khoản admin: admin@example.com / Admin@2024
```

### Thông tin đăng nhập mặc định

| Thông tin | Giá trị |
|-----------|---------|
| Email | `admin@example.com` |
| Mật khẩu | `Admin@2024` |
| Vai trò | `ADMIN` |

> **Bắt buộc:** Đổi mật khẩu ngay sau lần đăng nhập đầu tiên.  
> Truy cập **Cài đặt tài khoản → Đổi mật khẩu** trong ứng dụng.

---

## Bước 5 — Kiểm tra sau Deploy

### 5.1 Kiểm tra ứng dụng

Truy cập URL Vercel và kiểm tra:

- [ ] Trang đăng nhập `/dang-nhap` hiển thị đúng
- [ ] Đăng nhập bằng `admin@example.com` / `Admin@2024` thành công
- [ ] Dashboard tổng quan load được
- [ ] Tạo thử 1 dự án mới

### 5.2 Kiểm tra database trên Neon

Trong Neon Console → **Tables**, kiểm tra các bảng sau đã tồn tại:

```
users, projects, project_members, project_documents,
scenarios, assumptions, land_costs, construction_phases,
contract_packages, construction_costs, product_groups,
product_batches, loans, equity_contributions,
payment_schedules, payment_milestones,
cash_flow_entries, kpi_snapshots
```

---

## Tóm tắt lệnh

```bash
# Migrate database staging
DATABASE_URL="<neon-url>" npx prisma migrate deploy

# Seed admin account
DATABASE_URL="<neon-url>" npm run db:seed

# Kiểm tra trạng thái migration
DATABASE_URL="<neon-url>" npx prisma migrate status
```

---

## Xử lý lỗi thường gặp

### Lỗi: `P1001 - Can't reach database server`
- Kiểm tra lại `DATABASE_URL` — đúng host, user, password chưa?
- Neon có `sslmode=require` trong URL chưa?

### Lỗi: `Environment variable not found: DATABASE_URL`
- Prisma 7 dùng driver adapter — `DATABASE_URL` phải có trong environment trước khi chạy lệnh
- Không để trống biến này trong Vercel Settings

### Lỗi: `NEXTAUTH_URL` không khớp
- `NEXTAUTH_URL` phải khớp chính xác với URL ứng dụng (không có `/` ở cuối)
- Sau khi đổi URL, phải redeploy để NextAuth nhận giá trị mới

### Build Vercel thất bại: `Table does not exist`
- Chạy `prisma migrate deploy` trước khi deploy (Bước 3)
- Hoặc dùng Vercel Build Command tùy chỉnh: `prisma migrate deploy && prisma generate && next build`

---

## Thứ tự thực hiện

```
1. Tạo Neon project  →  lấy DATABASE_URL
2. Tạo Vercel project  →  thêm 3 biến môi trường
3. Chạy: prisma migrate deploy  (từ local với Neon URL)
4. Chạy: npm run db:seed  (từ local với Neon URL)
5. Deploy trên Vercel  →  nhấn Deploy hoặc push code
6. Kiểm tra đăng nhập  →  đổi mật khẩu admin
```
