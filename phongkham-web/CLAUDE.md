# CLAUDE.md — Phòng Khám Thú Y Bác Sĩ Lục

> **Đọc file này đầu tiên trong mỗi session mới.**
> Đây là file context chính. Từ đây, tham chiếu đến các plan file cụ thể khi cần implement.

---

## 🏥 Project Identity

| | |
|---|---|
| **Tên dự án** | Phòng Khám Thú Y Bác Sĩ Lục — Management System |
| **Địa chỉ** | 990 Huỳnh Tấn Phát, Tân Mỹ, TP. Hồ Chí Minh |
| **SĐT** | 028 3873 0496 |
| **Domain dự kiến** | `phongkhamthuyluc.com` (landing) / `app.phongkhamthuyluc.com` (webapp) |
| **Timezone** | `Asia/Ho_Chi_Minh` (UTC+7) — dùng ở mọi nơi |
| **Tiền tệ** | VND — lưu `BIGINT` (đơn vị đồng), hiển thị format `1.500.000 ₫` |
| **Ngôn ngữ UI** | Tiếng Việt (primary), có thể thêm EN sau |

---

## 🗂️ Plan Files (đọc khi implement phần tương ứng)

| File | Nội dung | Phase |
|------|----------|-------|
| `plans/01-architecture.md` | Kiến trúc tổng thể, domain, routing | Setup |
| `plans/02-database-schema.md` | Toàn bộ schema + numbering system | Phase 1 |
| `plans/03-auth.md` | Authentication, JWT, forgot password | Phase 1 |
| `plans/04-admin-booking.md` | Module booking lịch khám cho admin | Phase 2 |
| `plans/05-admin-customers-pets.md` | CRUD khách hàng & thú cưng | Phase 2 |
| `plans/06-admin-medical-records.md` | Hồ sơ bệnh lý, điều trị | Phase 2 |
| `plans/07-admin-finance.md` | Hoá đơn, tính chi phí, báo cáo | Phase 2-5 |
| `plans/08-customer-portal.md` | Giao diện khách hàng, booking online | Phase 3 |
| `plans/09-ai-assistant.md` | Claude AI integration, guardrails, cache | Phase 4 |
| `plans/10-landing-page.md` | Static landing page, SEO | Phase 5 |
| `plans/11-infra-devops.md` | Deploy, CI/CD, monitoring | Xuyên suốt |
| `plans/12-ui-ux-rules.md` | Design rules, component guidelines | Xuyên suốt |

---

## ⚙️ Tech Stack (tổng hợp nhanh)

### Frontend — Landing Page (`landing`)
- **Next.js 15** (Static Export / SSG)
- **Tailwind CSS v4**, Framer Motion
- Deploy: **Cloudflare Pages**

### Frontend — Web App (`frontend`)
- **React 19** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui**
- **TanStack Query v5** (server state)
- **TanStack Router** (routing)
- **Zustand** (client state)
- **FullCalendar** (booking calendar)
- **Recharts** (biểu đồ báo cáo)

### Backend (`backend`)
- **NestJS** + **Fastify** adapter
- **Drizzle ORM** + **Drizzle Kit** (migrations)
- **Passport** + **JWT** (auth)
- **node-cron** (scheduled jobs)
- **Nodemailer** / **Resend** (email)
- **Multer** + **Cloudflare R2** (file upload)

### Database & Cache
- **PostgreSQL 16** — Neon (serverless) hoặc Supabase

### AI
- **Anthropic Claude API**
  - `claude-sonnet-4-5` → tư vấn y tế, báo cáo phức tạp
  - `claude-haiku-4` → intent detection, câu trả lời đơn giản

### Infra
- **Railway** hoặc **Render** (NestJS backend)
- **Cloudflare Pages** (Frontend)
- **Cloudflare R2** (file storage)
- **GitHub Actions** (CI/CD — mỗi repo có workflow riêng)

---

## 📁 Project Structure (3 repos riêng biệt)

```
GitHub: phongkham-thuyluc/
│
├── backend/              # NestJS backend
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
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   └── database/
│   │       ├── schema/
│   │       └── migrations/
│   ├── plans/          ← copy plans/ vào đây
│   ├── CLAUDE.md       ← copy file này vào đây
│   └── .env.example
│
├── frontend/              # React SPA (admin + customer portal)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   ├── customer/
│   │   │   └── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/         # Zustand stores
│   │   └── lib/
│   │       ├── api.ts      # API client (axios/ky)
│   │       ├── formatVND.ts
│   │       └── formatDate.ts
│   ├── plans/          ← copy plans/ vào đây
│   ├── CLAUDE.md       ← copy file này vào đây
│   └── .env.example
│
└── landing/          # Next.js static landing page
    ├── app/
    ├── public/
    ├── CLAUDE.md       ← copy file này vào đây
    └── next.config.ts
```

> **Quan trọng**: Mỗi repo tự quản lý types và utils riêng — không share code cross-repo.
> Copy `CLAUDE.md` + `plans/` vào root của repo đang làm việc để dùng với Claude Code.

---

## 🔑 Global Rules — LUÔN ÁP DỤNG

### 1. Numbering System (QUAN TRỌNG)
Mọi entity hiển thị với người dùng đều có **human-readable number**, KHÔNG bao giờ render UUID ra UI.

```
Booking:        BKG-YYYYMMDD-{NNN}   → BKG-20241215-001
Medical Record: MED-YYYYMMDD-{NNN}   → MED-20241215-003
Invoice:        INV-YYYYMMDD-{NNN}   → INV-20241215-001
```

- `{NNN}` reset về `001` mỗi ngày mới
- Lưu trong DB column `display_number` (VARCHAR)
- Generate bằng DB function hoặc application logic (xem `plans/02-database-schema.md`)

### 2. UUID — Dùng trong API params, KHÔNG render ra UI

**API params luôn dùng UUID** — backend lookup thẳng bằng PK, không cần query thêm:
```
GET    /v1/admin/bookings/:uuid
PUT    /v1/admin/bookings/:uuid
DELETE /v1/admin/bookings/:uuid
GET    /v1/admin/customers/:uuid
GET    /v1/admin/pets/:uuid
GET    /v1/admin/medical-records/:uuid
GET    /v1/admin/invoices/:uuid
```

**API response** trả về cả `id` (UUID) lẫn `displayNumber`:
```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID — FE dùng cho API calls
  "displayNumber": "BKG-20241215-001",            // Hiển thị trên UI
  // ...fields khác
}
```

**Frontend**:
- Lưu `id` trong React state / TanStack Query cache
- Dùng `id` khi gọi API (PUT, DELETE, navigate)
- Chỉ **render `displayNumber`** ra màn hình — không bao giờ render `id`

**UUID KHÔNG BAO GIỜ xuất hiện** trong:
- Table cell, card, badge, tooltip, breadcrumb
- Bất kỳ text nào người dùng đọc
- Copy-to-clipboard values

> Browser URL bar chứa UUID là chấp nhận được — user không cần đọc hay nhớ URL.

### 3. Tiền tệ VND
- DB: `BIGINT` (đơn vị đồng), KHÔNG dùng `DECIMAL` / `FLOAT`
- Tính toán: luôn ở server-side (integer arithmetic)
- Hiển thị: `formatVND(amount)` → `"1.500.000 ₫"`
- Không bao giờ gửi số tiền dạng float qua API

### 4. Timestamps
- DB: luôn `TIMESTAMPTZ` (timezone-aware), lưu UTC
- API response: ISO 8601 string với timezone
- Display: convert sang `Asia/Ho_Chi_Minh` ở frontend
- Dùng `date-fns-tz` hoặc `dayjs` với timezone plugin

### 5. AI Guardrails — KHÔNG BAO GIỜ VI PHẠM
AI Assistant **chỉ được**:
- Giải thích thông tin bệnh lý đã có trong DB (do bác sĩ ghi)
- Hỏi thăm tình trạng thú cưng
- Hỗ trợ booking lịch

AI **TUYỆT ĐỐI KHÔNG**:
- Đưa ra chẩn đoán bệnh mới
- Đề xuất phác đồ hoặc kê đơn thuốc
- Khẳng định bệnh tình chỉ dựa trên mô tả của khách

Câu chốt bắt buộc cuối mỗi tư vấn y tế:
> *"Đây là thông tin tham khảo. Để được chẩn đoán chính xác, xin mang bé đến trực tiếp Phòng Khám Thú Y Bác Sĩ Lục tại 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM. SĐT: 028 3873 0496"*

### 6. File Upload
- Chỉ accept: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max size: 10MB/file
- Lưu: Cloudflare R2, KHÔNG lưu vào DB hay local disk
- Tên file: `{entity_type}/{entity_uuid}/{random_uuid}.{ext}` (nội bộ, không expose ra UI)

### 7. Error Handling Convention
```typescript
// API errors luôn trả về format này:
{
  statusCode: number,
  message: string,        // human-readable, có thể show cho user
  error: string,          // error code (BOOKING_NOT_FOUND, etc.)
  timestamp: string
}
```

---

## 🚀 Lộ Trình (tổng hợp)

| Phase | Tuần | Nội dung |
|-------|------|----------|
| 1 | 1-2 | Foundation: 3 repos setup, DB schema, auth, deploy staging |
| 2 | 3-5 | **Admin core**: Booking, Customers, Pets, Medical Records, Invoice |
| 3 | 6-7 | **Customer portal**: Login, xem hồ sơ, booking online |
| 4 | 8-9 | **AI Assistant**: Claude API, guardrails, cache, cron 6h |
| 5 | 10-11 | **Landing page** + báo cáo tài chính đầy đủ |
| 6 | 12 | UAT, polish, go-live production |

> **MVP sớm nhất**: Sau Phase 2 (tuần 5), phòng khám có thể bắt đầu dùng Admin để quản lý.

---

## 💡 Khi bắt đầu session mới

1. Đọc file này (`CLAUDE.md`) — 2 phút
2. Đọc plan file của module đang implement
3. Làm rõ scope trước khi code: *"Tôi đang implement [tên module] theo `plans/XX-xxx.md`"*
4. Nếu có conflict giữa plan và thực tế, hỏi trước, đừng tự quyết định

---

*Tài liệu nội bộ — Phòng Khám Thú Y Bác Sĩ Lục*
