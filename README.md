# FS Dòng Tiền BĐS

Ứng dụng lập kế hoạch tài chính và phân tích dòng tiền cho dự án bất động sản.

## Demo

URL:

```txt
https://bat-dong-san-fs.vercel.app
```

Tài khoản demo:

```txt
Email: admin@example.com
Password: Admin@2024
```

## Tính năng chính

* Quản lý dự án bất động sản
* Quản lý kịch bản tài chính
* Nhập giả định tài chính
* Quản lý chi phí đất
* Quản lý chi phí xây dựng
* Quản lý doanh thu
* Quản lý vốn vay và góp vốn
* Tính toán dòng tiền
* Dashboard KPI: IRR, NPV, ROI, thời gian hoàn vốn
* Báo cáo tài chính dự án
* Xuất báo cáo Excel `.xlsx`
* Xác thực người dùng
* Phân quyền OWNER / EDITOR / VIEWER
* Quản lý thành viên dự án
* Admin Panel quản lý người dùng và dự án

## Công nghệ sử dụng

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* Prisma 7
* PostgreSQL / Neon
* NextAuth
* ExcelJS
* Playwright
* Vercel

## Cài đặt local

Clone repository:

```bash
git clone https://github.com/trungdtewh/bat-dong-san-fs.git
cd bat-dong-san-fs
```

Cài dependencies:

```bash
npm install
```

Tạo file môi trường:

```bash
cp .env.example .env
```

Cấu hình `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/real_estate_cashflow"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Tạo `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Generate Prisma Client:

```bash
npx prisma generate
```

Chạy migration:

```bash
npx prisma migrate dev
```

Seed dữ liệu demo:

```bash
npm run db:seed
```

Chạy dev server:

```bash
npm run dev
```

Mở:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run db:seed
npm run db:migrate
npm run db:migrate:dev
npm run test:e2e
```

## Deploy

Ứng dụng được deploy bằng Vercel và Neon PostgreSQL.

Biến môi trường cần cấu hình trên Vercel:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Sau khi deploy lần đầu, chạy migration và seed với `DATABASE_URL` production:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" npm run db:seed
```

## Xuất Excel

Trang Báo cáo hỗ trợ xuất file `.xlsx` gồm 8 sheet:

1. Tổng quan dự án
2. Giả định
3. Chi phí đất
4. Chi phí xây dựng
5. Doanh thu
6. Vốn vay
7. Dòng tiền
8. KPI

## Phân quyền

| Vai trò | Quyền                       |
| ------- | --------------------------- |
| OWNER   | Toàn quyền với dự án        |
| EDITOR  | Chỉnh sửa dữ liệu tài chính |
| VIEWER  | Chỉ xem dữ liệu             |

## Trạng thái phiên bản

* v1.0 MVP
* v1.1 Project Members
* v1.2 Admin Panel
* v1.3 E2E Tests
* v1.4 Staging Deployment
* v1.5 Excel Export

## Ghi chú bảo mật

Không commit file `.env`.

Các giá trị nhạy cảm như `DATABASE_URL`, `NEXTAUTH_SECRET` phải được cấu hình qua Environment Variables trên Vercel.

Nếu connection string database bị lộ, cần rotate password trên Neon và cập nhật lại `DATABASE_URL` trên Vercel.
