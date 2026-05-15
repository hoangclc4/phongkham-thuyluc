# Plan 08 — Customer Portal

> **Đọc cùng với**: `plans/03-auth.md`, `plans/02-database-schema.md`
> **Áp dụng**: Phase 3

---

## Nguyên tắc UX

Giao diện customer cần **cực kỳ đơn giản**. Đây không phải power user — họ chỉ muốn biết "con mèo của tôi có khoẻ không" và "khi nào cần tái khám". 

- Font lớn (minimum 16px body)
- Contrast cao
- Số bước tối thiểu để đạt mục tiêu
- Mobile-first (phần lớn dùng điện thoại)
- Tiếng Việt hoàn toàn

---

## API Endpoints (Customer)

```
# Auth (đã ở plans/03-auth.md)

# Profile
GET    /v1/customer/profile
PUT    /v1/customer/profile             # chỉ cho sửa: email, address
PUT    /v1/customer/change-password

# Pets
GET    /v1/customer/pets                # danh sách thú cưng của mình
GET    /v1/customer/pets/:id

# Medical Records (chỉ những record được share)
GET    /v1/customer/pets/:id/medical-records
GET    /v1/customer/pets/:id/medical-records/:id

# Vaccines
GET    /v1/customer/pets/:id/vaccines

# Bookings
GET    /v1/customer/bookings            # tất cả bookings
GET    /v1/customer/bookings/:id
POST   /v1/customer/bookings            # tạo booking mới
DELETE /v1/customer/bookings/:id        # huỷ (nếu còn > 24h)

# Available slots cho booking
GET    /v1/customer/booking-slots?date=2024-12-20

# AI Chat (xem plans/09-ai-assistant.md)
```

---

## Customer response shape (fields khác admin)

Các entity **vẫn trả về `id` (UUID)** — frontend customer cần để gọi API (GET pet detail, POST booking, v.v.).
Khác biệt so với admin là một số fields nhạy cảm bị ẩn, không phải bỏ `id`.

```typescript
// ✅ id LUÔN có trong response — dùng cho API calls
// GET /v1/customer/pets → [{ id, name, species, ... }]
// GET /v1/customer/bookings/:id
// POST /v1/customer/bookings  (body chứa petId)
// DELETE /v1/customer/bookings/:id

// Customer KHÔNG thấy (ẩn khỏi response):
// - internalNotes của admin (customers table)
// - Medical records có isSharedWithCustomer = false
// - physicalExamination, doctorNotes trong medical records
// - Thông tin tài chính chi tiết (line items, discount — chỉ thấy totalAmount nếu paid)

// Customer THẤY (có trong response):
// - id (UUID) của mọi entity — dùng cho API calls
// - displayNumber của booking, medical record — hiển thị trên UI
// - Tên, SĐT, email của chính mình
// - Thông tin thú cưng: id, name, species, breed, status, avatarUrl, knownAllergies
// - Medical records được share: id, displayNumber, diagnosis, diagnosisNotes,
//   treatmentPlan, followupDate, attachments
```

---

## Notification System (Customer)

### Email notifications
| Event | Email gửi khi |
|-------|--------------|
| Booking created | Customer tạo booking thành công |
| Booking confirmed | Admin confirm lịch |
| Booking cancelled | Admin hoặc customer huỷ |
| Reminder | 1 ngày trước lịch hẹn (cron 18:00) |
| Vaccine due | 2 tuần trước ngày nhắc (cron hàng tuần) |
| Account invite | Admin gửi invite set password |

---

*→ Tiếp theo: `plans/09-ai-assistant.md`*
