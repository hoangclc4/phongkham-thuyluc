# Plan 07 — Admin: Tài Chính & Báo Cáo

> **Đọc cùng với**: `plans/02-database-schema.md`
> **Áp dụng**: Phase 2 (hoá đơn cơ bản) + Phase 5 (báo cáo đầy đủ)

---

## Tổng quan

Mọi chi phí đều tính bằng VND dưới dạng `BIGINT`. Hoá đơn có `displayNumber` dạng `INV-YYYYMMDD-NNN`. Admin điền chi phí sau mỗi lần khám, hệ thống tổng hợp báo cáo theo ngày/tuần/tháng.

---

## API Endpoints

```
# Invoices
POST   /v1/admin/invoices                    # tạo invoice
GET    /v1/admin/invoices/:id
PUT    /v1/admin/invoices/:id                # cập nhật (nếu chưa paid)
PATCH  /v1/admin/invoices/:id/payment

# Reports
GET    /v1/admin/reports/daily?date=2024-12-15
GET    /v1/admin/reports/weekly?weekStart=2024-12-09
GET    /v1/admin/reports/monthly?year=2024&month=12
GET    /v1/admin/reports/summary             # dashboard KPIs

# Export
GET    /v1/admin/reports/daily/export?date=2024-12-15&format=pdf
GET    /v1/admin/reports/monthly/export?year=2024&month=12&format=excel
```

---

## Invoice Response Shape

```typescript
{
  "id": "uuid",                  // ✅ dùng cho PUT, PATCH /payment
  "displayNumber": "INV-20241215-001",
  "linkedBooking": {
    "displayNumber": "BKG-20241215-001",
    "serviceLabel": "Khám tổng quát"
  },
  "linkedMedicalRecord": {
    "displayNumber": "MED-20241215-001"
  },
  "customer": {
    "fullName": "Nguyễn Thị An",
    "phone": "0901234567"
  },
  "pet": {
    "name": "Mimi",
    "species": "cat"
  },
  "lineItems": [
    {
      "description": "Phí khám tổng quát",
      "category": "examination",
      "categoryLabel": "Phí khám",
      "quantity": 1,
      "unitPrice": 150000,
      "total": 150000
    },
    {
      "description": "Amoxicillin 50mg x 14 viên",
      "category": "medication",
      "categoryLabel": "Thuốc",
      "quantity": 14,
      "unitPrice": 5000,
      "total": 70000
    },
    {
      "description": "Xét nghiệm máu tổng quát",
      "category": "lab",
      "categoryLabel": "Xét nghiệm",
      "quantity": 1,
      "unitPrice": 200000,
      "total": 200000
    }
  ],
  "subtotal": 420000,
  "discountAmount": 0,
  "discountReason": null,
  "totalAmount": 420000,
  "totalDisplay": "420.000 ₫",
  "paymentMethod": "cash",
  "paymentMethodLabel": "Tiền mặt",
  "paymentStatus": "paid",
  "paymentStatusLabel": "Đã thanh toán",
  "paidAmount": 420000,
  "paidAt": "2024-12-15T11:30:00+07:00",
  "notes": null,
  "createdAt": "2024-12-15T11:00:00+07:00"
}
```

---

## Invoice Form (Admin UI)

### Tạo từ Booking completed (flow tự động)
- Khi booking → status `completed`, hệ thống tạo draft invoice tự động
- Pre-fill: customer, pet, linked booking + medical record
- Admin chỉ cần điền line items + thanh toán

### Line Items (dynamic)
```
[Chọn từ service catalog] hoặc [Nhập tự do]

Mỗi item:
  Mô tả*:      [Input / Select từ catalog]
  Danh mục:    [Select: Phí khám | Thuốc | Xét nghiệm | Phẫu thuật | Grooming | Khác]
  Số lượng:    [Number, default 1]
  Đơn giá*:    [Number, VND]
  Thành tiền:  [Auto = qty × price, read-only]

[+ Thêm dịch vụ/thuốc]

──────────────────────────
Tạm tính: 420.000 ₫
Giảm giá: [Number] ₫  [Lý do: Input]
──────────────────────────
TỔNG CỘNG: 420.000 ₫
```

### Thanh toán
```
Phương thức: [Radio: Tiền mặt | Chuyển khoản | MoMo | ZaloPay | Khác]
Số tiền:     [Number — default = totalAmount, có thể nhập ít hơn (partially_paid)]
```

---

## Utility: Format VND

```typescript
// packages/utils/src/formatVND.ts
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
  // → "420.000 ₫"
}

// Trong DB: lưu 420000 (BIGINT)
// Trong API: trả về 420000 (number) + "420.000 ₫" (string display)
// Trong UI: dùng formatVND() từ utils package
// KHÔNG bao giờ truyền float qua API
```

---

## Báo Cáo Cuối Ngày

```typescript
// GET /v1/admin/reports/daily?date=2024-12-15
{
  "date": "2024-12-15",
  "summary": {
    "totalBookings": 8,
    "completedBookings": 7,
    "cancelledBookings": 0,
    "noShowBookings": 1,
    "newCustomers": 2,
    "totalRevenue": 3200000,
    "totalRevenueDisplay": "3.200.000 ₫",
    "paidRevenue": 2800000,
    "pendingRevenue": 400000
  },
  "revenueByMethod": {
    "cash": 1800000,
    "bank_transfer": 1000000,
    "momo": 0,
    "zalopay": 0
  },
  "revenueByCategory": {
    "examination": 1050000,
    "medication": 490000,
    "lab": 1200000,
    "surgery": 0,
    "grooming": 0,
    "other": 460000
  }
}
```

---

## Dashboard KPIs (Real-time)

```typescript
// GET /v1/admin/reports/summary
// Dùng cho Admin Dashboard home page, refresh mỗi 5 phút

{
  "today": {
    "bookings": 8,
    "completed": 5,
    "revenue": 2100000,
    "revenueDisplay": "2.100.000 ₫"
  },
  "pendingActions": {
    "bookingsToConfirm": 3,     // pending bookings
    "invoicesToProcess": 2,     // completed bookings chưa có invoice
    "unpaidInvoices": 1
  },
  "todaysSchedule": [           // next 3 upcoming
    {
      "time": "14:00",
      "displayNumber": "BKG-20241215-006",
      "petName": "Buddy",
      "ownerName": "Trần Văn B",
      "service": "Tiêm phòng"
    }
  ],
  "alerts": [
    {
      "type": "followup_due",
      "message": "3 thú cưng cần tái khám hôm nay"
    },
    {
      "type": "vaccine_due",
      "message": "Mimi (Nguyễn Thị An) cần tiêm nhắc vaccine Dại"
    }
  ]
}
```

---

*→ Tiếp theo: `plans/08-customer-portal.md`*
