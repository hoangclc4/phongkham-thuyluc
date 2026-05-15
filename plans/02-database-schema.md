# Plan 02 — Database Schema

> **Đọc cùng với**: `CLAUDE.md`, `plans/01-architecture.md`
> **Áp dụng**: Phase 1 — Setup schema trước khi viết bất kỳ module nào

---

## Nguyên tắc chung

- Tất cả PK: `UUID` (internal only, KHÔNG hiển thị trên UI)
- Tất cả entity người dùng tương tác: có thêm `display_number` (human-readable)
- Timestamps: `TIMESTAMPTZ` (UTC), hiển thị theo `Asia/Ho_Chi_Minh`
- Tiền VND: `BIGINT` (đơn vị đồng)
- Soft delete: dùng `deleted_at TIMESTAMPTZ` thay vì xoá thật

---

## Numbering System

### Format
```
BKG-YYYYMMDD-NNN   → BKG-20241215-001  (Booking)
MED-YYYYMMDD-NNN   → MED-20241215-003  (Medical Record)
INV-YYYYMMDD-NNN   → INV-20241215-001  (Invoice)
```

- `NNN` = 3 chữ số, bắt đầu từ `001`, tăng dần trong ngày
- Reset về `001` mỗi ngày mới
- Nếu > 999 lần/ngày → tăng lên 4 chữ số tự động (`0001`)

### PostgreSQL Sequence Helper

```sql
-- Bảng lưu sequence counter theo ngày và loại
CREATE TABLE daily_sequences (
  entity_type VARCHAR(10) NOT NULL,   -- 'BKG', 'MED', 'INV'
  seq_date    DATE NOT NULL,
  last_val    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (entity_type, seq_date)
);

-- Function generate display_number
CREATE OR REPLACE FUNCTION generate_display_number(p_type VARCHAR, p_date DATE)
RETURNS VARCHAR AS $$
DECLARE
  v_next INTEGER;
  v_padded VARCHAR;
BEGIN
  INSERT INTO daily_sequences (entity_type, seq_date, last_val)
  VALUES (p_type, p_date, 1)
  ON CONFLICT (entity_type, seq_date)
  DO UPDATE SET last_val = daily_sequences.last_val + 1
  RETURNING last_val INTO v_next;

  -- Pad: 001, 002 ... 999, 1000 (tự mở rộng)
  v_padded := LPAD(v_next::TEXT, GREATEST(3, LENGTH(v_next::TEXT)), '0');

  RETURN p_type || '-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' || v_padded;
END;
$$ LANGUAGE plpgsql;

-- Ví dụ dùng trong trigger:
-- NEW.display_number := generate_display_number('BKG', CURRENT_DATE);
```

> **Lưu ý Drizzle**: Drizzle không hỗ trợ trigger trực tiếp. Gọi function này trong NestJS service trước khi insert, hoặc dùng raw SQL trong transaction.

---

## Schema Chi Tiết

### Table: `admin_users`
```sql
-- Chỉ có 1 record (Bác sĩ Lục). Không có signup.
CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `customers`
```sql
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(15) NOT NULL UNIQUE,  -- login username
  email           VARCHAR(255),
  address         TEXT,
  password_hash   VARCHAR(255),                 -- nullable (admin tạo trước, gửi invite sau)
  password_reset_token       VARCHAR(255),
  password_reset_token_expires TIMESTAMPTZ,
  internal_notes  TEXT,                         -- chỉ admin đọc
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
```

### Table: `pets`
```sql
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other');
CREATE TYPE pet_gender  AS ENUM ('male', 'female', 'unknown');
CREATE TYPE pet_status  AS ENUM ('healthy', 'in_treatment', 'monitoring', 'deceased', 'transferred');

CREATE TABLE pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  name            VARCHAR(50) NOT NULL,
  species         pet_species NOT NULL,
  breed           VARCHAR(100),
  gender          pet_gender NOT NULL DEFAULT 'unknown',
  date_of_birth   DATE,                         -- có thể ước tính
  color           VARCHAR(100),
  weight_kg       DECIMAL(5,2),                 -- cân nặng lần khám gần nhất
  avatar_url      TEXT,                         -- Cloudflare R2 URL
  status          pet_status NOT NULL DEFAULT 'healthy',
  known_allergies TEXT[],                       -- ['penicillin', 'aspirin']
  microchip_id    VARCHAR(50),
  notes           TEXT,                         -- ghi chú chung về thú cưng
  is_neutered     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_pets_customer_id ON pets(customer_id);
CREATE INDEX idx_pets_status ON pets(status);
```

### Table: `vaccines`
```sql
-- Lịch sử tiêm vaccine của từng thú cưng
CREATE TABLE vaccines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_name    VARCHAR(100) NOT NULL,         -- 'Dại', '5in1', 'Lepto'
  administered_at DATE NOT NULL,
  next_due_at     DATE,                          -- ngày nhắc tiêm tiếp
  batch_number    VARCHAR(50),
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccines_pet_id ON vaccines(pet_id);
CREATE INDEX idx_vaccines_next_due ON vaccines(next_due_at) WHERE next_due_at IS NOT NULL;
```

### Table: `bookings`
```sql
CREATE TYPE booking_service AS ENUM (
  'general_checkup',
  'followup',
  'vaccination',
  'surgery',
  'grooming',
  'laboratory',
  'dental',
  'emergency',
  'other'
);

CREATE TYPE booking_status AS ENUM (
  'pending',           -- Chờ admin xác nhận
  'confirmed',         -- Admin đã xác nhận
  'checked_in',        -- Khách đã đến phòng khám
  'in_progress',       -- Đang khám
  'completed',         -- Hoàn thành
  'cancelled',         -- Đã huỷ
  'no_show'            -- Không đến
);

CREATE TYPE booking_source AS ENUM (
  'customer_portal',   -- Khách tự book
  'ai_chat',           -- Book qua AI assistant
  'admin',             -- Admin tạo thủ công
  'phone'              -- Điện thoại, admin nhập hộ
);

CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_number   VARCHAR(20) NOT NULL UNIQUE,  -- BKG-20241215-001
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  pet_id           UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  service_type     booking_service NOT NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status           booking_status NOT NULL DEFAULT 'pending',
  source           booking_source NOT NULL DEFAULT 'admin',
  notes            TEXT,                          -- ghi chú của khách
  admin_notes      TEXT,                          -- ghi chú nội bộ
  cancelled_at     TIMESTAMPTZ,
  cancelled_by     VARCHAR(10),                   -- 'customer' | 'admin'
  cancelled_reason TEXT,
  confirmed_at     TIMESTAMPTZ,
  checked_in_at    TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES admin_users(id),  -- null nếu khách tự tạo
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_pet_id ON bookings(pet_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_display_number ON bookings(display_number);
```

### Table: `medical_records`
```sql
CREATE TABLE medical_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_number          VARCHAR(20) NOT NULL UNIQUE,  -- MED-20241215-001
  booking_id              UUID REFERENCES bookings(id), -- nullable (walk-in)
  pet_id                  UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  visit_date              DATE NOT NULL,
  weight_at_visit         DECIMAL(5,2),                 -- kg lúc khám
  temperature_celsius     DECIMAL(4,1),                 -- nhiệt độ cơ thể
  chief_complaint         TEXT NOT NULL,                -- triệu chứng khách báo
  physical_examination    TEXT,                         -- kết quả khám lâm sàng
  diagnosis               TEXT,                         -- chẩn đoán bác sĩ
  diagnosis_notes         TEXT,                         -- giải thích thêm
  treatment_plan          JSONB,                        -- xem cấu trúc bên dưới
  doctor_notes            TEXT,                         -- ghi chú tự do
  followup_date           DATE,                         -- ngày tái khám
  followup_notes          TEXT,
  attachments             JSONB,                        -- xem cấu trúc bên dưới
  is_shared_with_customer BOOLEAN NOT NULL DEFAULT FALSE,
  requires_attention      BOOLEAN NOT NULL DEFAULT FALSE, -- cờ cho báo cáo 6h sáng
  attention_reason        TEXT,
  created_by              UUID NOT NULL REFERENCES admin_users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_medical_records_display_number ON medical_records(display_number);
CREATE INDEX idx_medical_records_attention ON medical_records(requires_attention) WHERE requires_attention = TRUE;
```

### Table: `invoices`
```sql
CREATE TYPE invoice_payment_method AS ENUM ('cash', 'bank_transfer', 'momo', 'zalopay', 'other');
CREATE TYPE invoice_payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'waived', 'refunded');

CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_number    VARCHAR(20) NOT NULL UNIQUE,  -- INV-20241215-001
  booking_id        UUID REFERENCES bookings(id),
  medical_record_id UUID REFERENCES medical_records(id),
  customer_id       UUID NOT NULL REFERENCES customers(id),
  pet_id            UUID NOT NULL REFERENCES pets(id),
  line_items        JSONB NOT NULL,               -- xem cấu trúc bên dưới
  subtotal          BIGINT NOT NULL,              -- VND, trước giảm giá
  discount_amount   BIGINT NOT NULL DEFAULT 0,    -- VND
  discount_reason   TEXT,
  total_amount      BIGINT NOT NULL,              -- VND, = subtotal - discount
  payment_method    invoice_payment_method,
  payment_status    invoice_payment_status NOT NULL DEFAULT 'pending',
  paid_amount       BIGINT NOT NULL DEFAULT 0,    -- VND đã thanh toán
  paid_at           TIMESTAMPTZ,
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES admin_users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_display_number ON invoices(display_number);
```

### Table: `daily_sequences`
```sql
-- Đã định nghĩa ở phần Numbering System bên trên
CREATE TABLE daily_sequences (
  entity_type VARCHAR(10) NOT NULL,
  seq_date    DATE NOT NULL,
  last_val    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (entity_type, seq_date)
);
```

### Table: `ai_conversations`
```sql
CREATE TABLE ai_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES customers(id),
  session_id       VARCHAR(50) NOT NULL UNIQUE,   -- UUID per session
  messages         JSONB NOT NULL DEFAULT '[]',   -- [{role, content, timestamp}]
  context_snapshot JSONB,                          -- snapshot context đã inject (audit)
  tokens_input     INTEGER NOT NULL DEFAULT 0,
  tokens_output    INTEGER NOT NULL DEFAULT 0,
  model_used       VARCHAR(50),
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_customer_id ON ai_conversations(customer_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);
```

### Table: `ai_context_cache`
```sql
CREATE TABLE ai_context_cache (
  cache_key    VARCHAR(200) PRIMARY KEY,    -- "ctx:{customer_id}:{YYYY-MM-DD}"
  context_data JSONB NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_expires ON ai_context_cache(expires_at);
-- Cleanup job xoá record hết hạn hàng ngày
```


### Table: `token_blacklist`
```sql
-- Thay thế Redis cho JWT blacklisting (không dùng Redis)
CREATE TABLE token_blacklist (
  jti        VARCHAR(36) PRIMARY KEY,   -- JWT ID (uuid v4, inject vào mọi JWT)
  expires_at TIMESTAMPTZ NOT NULL       -- thời điểm token gốc hết hạn
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
-- Cron 2:00 AM: DELETE FROM token_blacklist WHERE expires_at < NOW()
```

### Table: `morning_reports`
```sql
-- Lưu báo cáo 6h sáng để admin đọc lại
CREATE TABLE morning_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date  DATE NOT NULL UNIQUE,
  content      TEXT NOT NULL,          -- Full report text từ AI
  summary      JSONB,                  -- Structured summary
  tokens_used  INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `service_catalog`
```sql
-- Danh mục dịch vụ và giá chuẩn (admin quản lý)
CREATE TABLE service_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  category      booking_service NOT NULL,
  default_price BIGINT NOT NULL,         -- VND
  duration_min  INTEGER NOT NULL DEFAULT 30,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Drizzle Schema (TypeScript)

```typescript
// apps/api/src/database/schema/bookings.schema.ts
import { pgTable, uuid, varchar, timestamptz, integer, text, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { pets } from './pets.schema';
import { adminUsers } from './admin-users.schema';

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show'
]);

export const bookings = pgTable('bookings', {
  id:            uuid('id').primaryKey().defaultRandom(),
  displayNumber: varchar('display_number', { length: 20 }).notNull().unique(),
  customerId:    uuid('customer_id').notNull().references(() => customers.id),
  petId:         uuid('pet_id').notNull().references(() => pets.id),
  // ... các fields khác
  scheduledAt:   timestamptz('scheduled_at').notNull(),
  status:        bookingStatusEnum('status').notNull().default('pending'),
  createdAt:     timestamptz('created_at').notNull().defaultNow(),
  updatedAt:     timestamptz('updated_at').notNull().defaultNow(),
});
```

---

## Application-level Number Generation

```typescript
// apps/api/src/common/utils/display-number.util.ts
import { db } from '../database';
import { sql } from 'drizzle-orm';
import { format } from 'date-fns';

export type EntityType = 'BKG' | 'MED' | 'INV';

export async function generateDisplayNumber(
  type: EntityType,
  date: Date = new Date()
): Promise<string> {
  const dateStr = format(date, 'yyyyMMdd');

  // Dùng PostgreSQL function đã tạo (advisory lock đảm bảo không duplicate)
  const result = await db.execute(
    sql`SELECT generate_display_number(${type}, ${dateStr}::DATE) as display_number`
  );

  return result.rows[0].display_number as string;
}

// Usage trong BookingsService:
// const displayNumber = await generateDisplayNumber('BKG');
// await db.insert(bookings).values({ ...data, displayNumber });
```

---

## Migration Strategy

```bash
# Drizzle Kit commands
npx drizzle-kit generate   # tạo migration file từ schema
npx drizzle-kit migrate    # chạy migration
npx drizzle-kit studio     # Drizzle Studio (GUI)

# Seed data (chỉ chạy 1 lần trên fresh DB)
npx tsx src/database/seed.ts
```

### Seed file tạo:
1. Admin user (Bác sĩ Lục)
2. Service catalog (các dịch vụ + giá mặc định)
3. `daily_sequences` table (tự tạo khi cần, không cần seed)

---

*→ Tiếp theo: `plans/03-auth.md`*
