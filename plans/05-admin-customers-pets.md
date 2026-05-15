# Plan 05 — Admin: Quản Lý Khách Hàng & Thú Cưng

> **Đọc cùng với**: `plans/02-database-schema.md`
> **Áp dụng**: Phase 2

---

## Customers — API Endpoints

```
GET    /v1/admin/customers              # list với pagination + search
POST   /v1/admin/customers              # tạo mới
GET    /v1/admin/customers/:id          # :id = UUID
PUT    /v1/admin/customers/:id
DELETE /v1/admin/customers/:id          # soft delete

GET    /v1/admin/customers/:id/pets          # danh sách thú cưng
GET    /v1/admin/customers/:id/bookings      # lịch sử booking
GET    /v1/admin/customers/:id/stats         # thống kê

POST   /v1/admin/customers/:id/invite        # gửi invite email để set password
```

> Dùng `id` (UUID) làm params — nhất quán với toàn bộ API. `phone` vẫn là search param: `GET /customers?phone=0901234567`

---

## Customer Response Shape

```typescript
// GET /v1/admin/customers/:id
{
  "id": "uuid",                    // ✅ dùng cho GET /customers/:id/pets, PUT, DELETE
  "phone": "0901234567",           // hiển thị + dùng làm search
  "fullName": "Nguyễn Thị An",
  "email": "an@example.com",
  "address": "123 Đường ABC, Q.7",
  "isActive": true,
  "hasAccount": true,
  "internalNotes": "...",          // chỉ admin thấy
  "stats": {
    "totalVisits": 8,
    "totalSpent": 2400000,
    "lastVisitDate": "2024-12-01",
    "petsCount": 2
  },
  "createdAt": "2024-01-15T...",
  "lastLoginAt": "2024-12-10T..."
}
```

---

## Customer List View (Admin)

### Columns trong table
| Cột | Hiển thị |
|-----|---------|
| Họ tên | + avatar initials |
| SĐT | click-to-call |
| Số thú cưng | badge count |
| Lần khám cuối | relative date (3 ngày trước) |
| Tổng chi tiêu | formatted VND |
| Trạng thái | Active / Inactive badge |
| Hành động | Xem / Sửa / ... |

### Search & Filter
```
?search=nguyen          # tìm theo tên hoặc SĐT
?hasActiveBooking=true  # có lịch sắp tới
?isActive=true
?page=1&limit=20
```

---

## Customer Detail Page (Admin)

Layout: Tabs hoặc Sections

### Tab 1: Thông tin cá nhân
- Form xem/sửa thông tin
- Internal Notes (textarea, chỉ admin)
- Nút: Gửi invite / Đặt lại mật khẩu

### Tab 2: Thú cưng
- Grid/List các thú cưng của khách này
- Nút "Thêm thú cưng"
- Click vào thú cưng → navigate đến Pet Detail

### Tab 3: Lịch sử khám
- Timeline các booking: ngày, dịch vụ, thú cưng, trạng thái, số tiền
- Chỉ show `displayNumber`, tên thú cưng, ngày giờ — KHÔNG show UUID

### Tab 4: Tài chính
- Tổng tiêu, số lần khám, trung bình/lần
- Danh sách hoá đơn (số INV, ngày, số tiền, trạng thái thanh toán)

---

## Pets — API Endpoints

```
GET    /v1/admin/pets                   # list tất cả (admin cần search global)
POST   /v1/admin/pets                   # tạo thú cưng mới
GET    /v1/admin/pets/:id               # :id = UUID
PUT    /v1/admin/pets/:id
DELETE /v1/admin/pets/:id               # soft delete

GET    /v1/admin/pets/:id/medical-records   # lịch sử bệnh
GET    /v1/admin/pets/:id/vaccines          # lịch sử vaccine
POST   /v1/admin/pets/:id/vaccines          # thêm vaccine record
PUT    /v1/admin/pets/:id/avatar            # upload ảnh
```

---

## Pet Response Shape

```typescript
// GET /v1/admin/pets/:id
{
  "id": "uuid",                    // ✅ dùng cho PUT, DELETE, GET /pets/:id/medical-records
  "customerId": "uuid",            // ✅ dùng để navigate về customer detail
  "ownerPhone": "0901234567",
  "ownerName": "Nguyễn Thị An",
  "name": "Mimi",
  "species": "cat",
  "speciesLabel": "Mèo",
  "breed": "Anh lông ngắn",
  "gender": "female",
  "genderLabel": "Cái",
  "dateOfBirth": "2021-03-15",
  "ageDisplay": "3 tuổi 9 tháng",
  "weightKg": 4.2,
  "color": "Xám trắng",
  "avatarUrl": "https://...",
  "status": "in_treatment",
  "statusLabel": "Đang điều trị",
  "knownAllergies": ["penicillin"],
  "isNeutered": true,
  "microchipId": null,
  "notes": "Rất thân thiện, không cắn",
  "lastVisitDate": "2024-12-10",
  "upcomingAppointment": {
    "id": "uuid",                  // ✅ dùng để navigate booking detail
    "displayNumber": "BKG-20241220-002",
    "scheduledAt": "2024-12-20T10:00:00+07:00"
  }
}
```

---

## Pet Detail Page (Admin)

### Header
- Ảnh + Tên + Species badge + Status badge
- Tuổi + Cân nặng + Giống
- Allergen alerts (nếu có known_allergies — hiển thị nổi bật ⚠️)
- Link về trang khách hàng

### Sections

#### Thông tin cơ bản (có thể edit inline)
- Tất cả fields cơ bản

#### Lịch sử bệnh lý
- Timeline các Medical Records
- Mỗi record: ngày khám, chẩn đoán, bác sĩ, nút "Xem chi tiết"
- Show `displayNumber` (MED-YYYYMMDD-NNN)

#### Lịch vaccine
- Table: Tên vaccine | Ngày tiêm | Nhắc lại | Batch number
- Highlight các vaccine sắp hết hạn (< 30 ngày) màu vàng
- Vaccine đã quá hạn: màu đỏ

#### Lịch hẹn
- Upcoming + Recent bookings của thú cưng này

---

## Allergy Warning System

```typescript
// Khi mở booking hoặc medical record có pet với known_allergies:
// Hiện banner cảnh báo rõ ràng ở đầu trang

// Component: AllergyAlert
{
  type: 'warning',
  message: `⚠️ ${pet.name} có dị ứng với: ${pet.knownAllergies.join(', ')}`,
  persistent: true   // không tự đóng
}
```

---

## Pet Status Transitions

```
healthy ──────→ in_treatment   (khi có medical record mới)
in_treatment ─→ monitoring     (bác sĩ set)
in_treatment ─→ healthy        (bác sĩ set khi khỏi)
monitoring ──→ healthy
* ───────────→ deceased        (admin set)
* ───────────→ transferred     (chuyển cơ sở khác)
```

Khi status = `deceased` hoặc `transferred`: Giữ nguyên toàn bộ lịch sử, chỉ thêm badge.

---

*→ Tiếp theo: `plans/06-admin-medical-records.md`*
