# Phòng Khám Thú Y Bác Sĩ Lục

Hệ thống quản lý phòng khám thú y — monorepo chứa backend API, web app và landing page.

**Địa chỉ:** 990 Huỳnh Tấn Phát, Tân Mỹ, TP. Hồ Chí Minh  
**SĐT:** 028 3873 0496

---

## Cấu trúc dự án

| Thư mục | Mô tả | Tech |
|---|---|---|
| [`phongkham-api/`](./phongkham-api/) | REST API backend | NestJS, Drizzle ORM, PostgreSQL |
| [`phongkham-web/`](./phongkham-web/) | Web app (admin + customer portal) | React 19, Vite, TanStack Router |
| [`phongkham-landing/`](./phongkham-landing/) | Landing page tĩnh | Next.js 15, Tailwind CSS v4 |

## Tính năng chính

- **Admin**: Quản lý lịch khám, hồ sơ bệnh lý, khách hàng & thú cưng, hoá đơn, báo cáo tài chính
- **Customer portal**: Booking online, xem hồ sơ thú cưng, AI chat tư vấn
- **AI Assistant**: Tích hợp Claude API — tư vấn thông tin bệnh lý, hỗ trợ đặt lịch

## Bắt đầu

### Yêu cầu

- Node.js 20+
- PostgreSQL 16

### Chạy local

```bash
# Backend
cd phongkham-api
cp .env.example .env   # điền các giá trị cần thiết
npm install
npm run db:migrate
npm run start:dev

# Web app
cd phongkham-web
cp .env.example .env
npm install
npm run dev

# Landing page
cd phongkham-landing
npm install
npm run dev
```

### Docker

```bash
docker compose up
```

## Lộ trình phát triển

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1 | Foundation: DB schema, Auth | Hoàn thành |
| 2 | Admin core: Booking, Customers, Pets, Medical Records, Invoice | Đang phát triển |
| 3 | Customer portal | Chưa bắt đầu |
| 4 | AI Assistant | Chưa bắt đầu |
| 5 | Landing page + báo cáo tài chính | Chưa bắt đầu |
