# backend

Backend API cho hệ thống quản lý **Phòng Khám Thú Y Bác Sĩ Lục**.

## Tech Stack

- **NestJS** + Fastify adapter
- **Drizzle ORM** + Drizzle Kit (migrations)
- **PostgreSQL 16** (Neon serverless)
- **Passport** + JWT (authentication)
- **Anthropic Claude API** (AI assistant)
- **Cloudflare R2** (file storage)

## Setup

```bash
# Cài dependencies
npm install

# Copy env và điền thông tin
cp .env.example .env

# Tạo migration từ schema
npm run db:generate

# Chạy migrations lên DB
npm run db:migrate

# Seed dữ liệu ban đầu (admin user + service catalog)
npm run db:seed

# Khởi động dev server
npm run start:dev
```

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm run start:dev` | Dev server với hot-reload |
| `npm run build` | Build production |
| `npm run db:generate` | Tạo Drizzle migration file từ schema |
| `npm run db:migrate` | Chạy pending migrations |
| `npm run db:studio` | Mở Drizzle Studio (DB GUI) |
| `npm run db:seed` | Seed admin user + service catalog |

## Cấu trúc thư mục

```
src/
├── modules/          # Feature modules (auth, bookings, customers, ...)
├── common/           # Guards, filters, interceptors, utils
│   └── utils/
│       └── display-number.util.ts  # Generate BKG/MED/INV numbers
├── database/
│   ├── schema/       # Drizzle schema (13 tables)
│   ├── migrations/   # SQL migrations
│   ├── database.ts   # DB connection
│   ├── database.module.ts
│   └── seed.ts
└── main.ts
```

## Biến môi trường

Xem `.env.example` để biết danh sách biến cần thiết.
