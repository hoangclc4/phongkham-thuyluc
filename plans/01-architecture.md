# Plan 01 — Kiến Trúc Tổng Thể

> **Đọc cùng với**: `CLAUDE.md`
> **Áp dụng**: Phase 1 (setup) — quyết định kiến trúc ảnh hưởng toàn bộ project

---

## Tổng quan 3 Surface

Hệ thống được tách thành **3 surface độc lập**, mỗi surface triển khai riêng:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. LANDING PAGE           phongkhamthuyluc.com               │
│    Next.js Static Export  Cloudflare Pages                    │
│    Mục tiêu: SEO, marketing, giới thiệu phòng khám           │
├──────────────────────────────────────────────────────────────┤
│ 2. WEB APP (SPA)          app.phongkhamthuyluc.com           │
│    React + Vite           Cloudflare Pages                    │
│    /admin/*  → Admin Dashboard                                │
│    /customer/* → Customer Portal                              │
│    /login, /forgot-password → Public auth pages              │
├──────────────────────────────────────────────────────────────┤
│ 3. API BACKEND            api.phongkhamthuyluc.com           │
│    NestJS + Fastify       Railway / Render                    │
│    REST API + WebSocket                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Domain & Routing

| URL Pattern | Surface | Auth Required | Render |
|-------------|---------|--------------|--------|
| `phongkhamthuyluc.com/*` | Landing Page | Không | Static HTML |
| `app.*/login` | Web App | Không | SPA |
| `app.*/forgot-password` | Web App | Không | SPA |
| `app.*/admin/*` | Web App | Admin JWT | SPA |
| `app.*/customer/*` | Web App | Customer JWT | SPA |
| `api.*/v1/*` | Backend | JWT (varies) | REST/WS |

### Route Guards (React Router)
```typescript
// AdminGuard: redirect to /login nếu không có admin token
// CustomerGuard: redirect to /login nếu không có customer token
// Sau login: redirect về intended URL (lưu trong sessionStorage)
```

---

## Data Flow Architecture

```
[Browser]
    │
    ├── Static assets → Cloudflare CDN (edge cache)
    │
    └── API calls → api.phongkhamthuyluc.com
                        │
                        ├── Auth Module (JWT validation)
                        │
                        ├── Business Modules
                        │   ├── Bookings
                        │   ├── Customers
                        │   ├── Pets
                        │   ├── Medical Records
                        │   ├── Invoices
                        │   └── Reports
                        │
                        ├── AI Service
                        │   ├── Context Builder (query DB)
                        │   ├── Cache Layer (PostgreSQL)
                        │   └── Claude API Client
                        │
                        ├── Scheduler (node-cron)
                        │   └── 06:00 AM → Morning Report
                        │
                        └── Data Layer
                            ├── PostgreSQL (primary data)
                            └── Redis (session, cache, rate limit)
```

---

## Repo Structure (3 repos riêng biệt)

3 repos độc lập, deploy riêng, CI/CD riêng. Không shared packages cross-repo — mỗi repo tự quản lý types và utils.

```
GitHub: phongkham-thuyluc/
│
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── customers/
│   │   │   ├── pets/
│   │   │   ├── medical-records/
│   │   │   ├── invoices/
│   │   │   ├── reports/
│   │   │   └── ai/
│   │   ├── common/
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   └── database/
│   │       ├── schema/
│   │       └── migrations/
│   ├── plans/       ← copy plans/ vào đây
│   ├── CLAUDE.md    ← copy file này vào đây
│   ├── drizzle.config.ts
│   └── .env.example
│
├── frontend/               # React SPA (admin + customer portal)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   ├── customer/
│   │   │   └── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── lib/
│   │       ├── api.ts
│   │       ├── formatVND.ts
│   │       └── formatDate.ts
│   ├── plans/       ← copy plans/ vào đây
│   ├── CLAUDE.md    ← copy file này vào đây
│   ├── vite.config.ts
│   └── .env.example
│
└── landing/           # Next.js static landing page
    ├── app/
    ├── public/
    ├── CLAUDE.md    ← copy file này vào đây
    └── next.config.ts           # output: 'export'
```

---

## Environment Variables

### API (`backend/.env`)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/phongkham
# Auth
JWT_SECRET=<min 64 chars random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different min 64 chars>
JWT_REFRESH_EXPIRES_IN=30d

# Admin (single admin account)
ADMIN_EMAIL=bacsiluc@phongkhamthuyluc.com
ADMIN_INITIAL_PASSWORD=<set on first deploy>

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@phongkhamthuyluc.com

# Storage
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
R2_BUCKET_NAME=phongkham-files
R2_PUBLIC_URL=https://files.phongkhamthuyluc.com

# App
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.phongkhamthuyluc.com
APP_URL=https://api.phongkhamthuyluc.com
FRONTEND_URL=https://app.phongkhamthuyluc.com
```

### Web App (`frontend/.env`)
```bash
VITE_API_URL=https://api.phongkhamthuyluc.com
VITE_APP_ENV=production
```

---

## API Design Conventions

### Base URL
```
https://api.phongkhamthuyluc.com/v1
```

### Response Format
```typescript
// Success
{
  data: T,
  meta?: {           // cho paginated responses
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}

// Error
{
  statusCode: number,
  message: string,
  error: string,     // error code constant
  timestamp: string
}
```

### Pagination
```
GET /v1/bookings?page=1&limit=20&sortBy=scheduledAt&sortOrder=desc
```

### Filter pattern
```
GET /v1/bookings?status=confirmed&date=2024-12-15
GET /v1/customers?search=nguyen&page=1
```

### ID trong URL params: luôn dùng UUID
```
GET    /v1/bookings/:uuid
PUT    /v1/bookings/:uuid
DELETE /v1/bookings/:uuid
GET    /v1/customers/:uuid
GET    /v1/pets/:uuid
GET    /v1/medical-records/:uuid
GET    /v1/invoices/:uuid
```
Backend lookup thẳng bằng PK — không cần query thêm bước nào.
`displayNumber` chỉ dùng để hiển thị trên UI, không dùng trong URL.

---

## WebSocket (cho AI Chat)

```typescript
// Gateway: /v1/ai/chat
// Events:
//   client → server: 'message' { content: string, sessionId: string }
//   server → client: 'stream'  { delta: string, done: boolean }
//   server → client: 'error'   { message: string }

// Auth: JWT trong handshake query param
// ws://api.../v1/ai/chat?token=<jwt>
```

---

## CORS Configuration

```typescript
// NestJS main.ts
app.enableCors({
  origin: [
    'https://app.phongkhamthuyluc.com',
    'https://phongkhamthuyluc.com',
    // staging
    'https://staging-app.phongkhamthuyluc.com',
  ],
  credentials: true,   // cần cho httpOnly cookie (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

*→ Tiếp theo: `plans/02-database-schema.md`*
