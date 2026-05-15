# Plan 04 — Admin: Module Booking Lịch Khám

> **Đọc cùng với**: `plans/02-database-schema.md`
> **Áp dụng**: Phase 2

---

## Tổng quan

Module booking là trung tâm vận hành hàng ngày. Admin thấy toàn bộ lịch, có thể tạo/sửa/huỷ. Booking hiển thị bằng `display_number` (BKG-YYYYMMDD-NNN), KHÔNG bao giờ show UUID.

---

## API Endpoints

```
GET    /v1/admin/bookings              # list, filter theo date/status
POST   /v1/admin/bookings              # tạo booking mới
GET    /v1/admin/bookings/:id
PUT    /v1/admin/bookings/:id
PATCH  /v1/admin/bookings/:id/status
DELETE /v1/admin/bookings/:id          # soft: set status=cancelled

GET    /v1/admin/bookings/slots        # lấy slots available cho một ngày
GET    /v1/admin/bookings/today        # bookings hôm nay, sắp xếp theo giờ
GET    /v1/admin/bookings/upcoming-followups  # list thú cưng cần tái khám
```

### Filter params cho GET /v1/admin/bookings
```
?date=2024-12-15          # lọc theo ngày cụ thể
?dateFrom=...&dateTo=...  # lọc theo khoảng
?status=confirmed
?serviceType=general_checkup
?customerId=...           # dùng UUID trong API (không phải display number)
?petId=...
?search=nguyen            # tìm theo tên khách hoặc tên thú cưng
?page=1&limit=20
?sortBy=scheduledAt&sortOrder=asc
```

---

## Booking Status Machine

```
pending ──── Admin confirm ────→ confirmed
pending ──── Admin reject ─────→ cancelled
confirmed ── Khách đến ─────────→ checked_in
checked_in ─ Bắt đầu khám ─────→ in_progress
in_progress ─ Hoàn thành ───────→ completed
confirmed ── Admin/Khách huỷ ──→ cancelled
confirmed ── Không đến ─────────→ no_show    (admin set thủ công)

Chỉ trạng thái [pending, confirmed] mới có thể cancelled
completed và no_show là trạng thái cuối (không thay đổi)
```

---

## Business Rules

1. **Conflict detection theo slot + customer**:
   - Mỗi khung giờ (slot 30 phút) cho phép tối đa **2 booking đồng thời**
   - Tuy nhiên **cùng 1 khách hàng không được có 2 booking trùng giờ** (duplicate check theo `customer_id`)
   - Khi slot đã có đủ 2 booking → mark là `busy`, không nhận thêm
   - Admin có thể override nếu cần (với warning rõ ràng)
2. **Huỷ trước 24h**: Customer chỉ được huỷ nếu `scheduled_at > NOW() + 24 hours`. Admin có thể huỷ bất kỳ lúc nào.
3. **Display number**: Generate khi tạo booking, KHÔNG thay đổi sau khi tạo
4. **Khi completed**: Tự động tạo draft Invoice (status=pending) để admin điền chi phí
5. **Followup reminder**: Nếu booking là `followup`, link với `medical_record.followup_date` của booking trước

---

## Response Shape

```typescript
// GET /v1/admin/bookings/:id
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID — FE lưu để dùng khi cần
  "displayNumber": "BKG-20241215-001",            // Hiển thị trên UI
  "customer": {
    "id": "...",                    // UUID — FE lưu nội bộ
    "displayName": "Nguyễn Thị An",
    "phone": "0901234567"
  },
  "pet": {
    "id": "...",                    // UUID — FE lưu nội bộ
    "name": "Mimi",
    "species": "cat",
    "breed": "Anh lông ngắn",
    "avatarUrl": "https://..."
  },
  "serviceType": "general_checkup",
  "serviceLabel": "Khám tổng quát",
  "scheduledAt": "2024-12-15T09:00:00+07:00",
  "durationMinutes": 30,
  "status": "confirmed",
  "statusLabel": "Đã xác nhận",
  "source": "customer_portal",
  "notes": "Mimi bị ho 3 ngày",
  "createdAt": "2024-12-14T20:30:00+07:00"
}
```

> Quy tắc: `id` có trong response để frontend dùng cho các API call tiếp theo, nhưng **không bao giờ render `id` ra màn hình**. Mọi thứ hiển thị với người dùng đều dùng `displayNumber`, tên, SĐT — không phải UUID.

---

## Frontend — Calendar View

### Libraries
- **FullCalendar** (`@fullcalendar/react`, `@fullcalendar/timegrid`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`)

### Views
- **Day view** (mặc định): Timeline từ 8:00 – 20:00, 30 phút/slot
- **Week view**: Tổng quan tuần
- **Month view**: Dot view, click vào ngày để xem day view

### Color coding
```typescript
const statusColors = {
  pending:     '#f59e0b',  // amber
  confirmed:   '#3b82f6',  // blue
  checked_in:  '#8b5cf6',  // purple
  in_progress: '#10b981',  // green
  completed:   '#6b7280',  // gray
  cancelled:   '#ef4444',  // red
  no_show:     '#9ca3af',  // light gray
};
```

### Quick Actions trên calendar event
Click vào booking event → Popup với:
- Tên khách + Tên thú cưng + Dịch vụ
- Nút: **Xác nhận** | **Check-in** | **Bắt đầu khám** | **Hoàn thành** | **Huỷ**
- Nút: **Xem chi tiết** → mở detail drawer

---

## Frontend — Booking Form

### Fields khi Admin tạo thủ công
```
Khách hàng*     [Select/Search dropdown — tìm theo tên/SĐT]
Thú cưng*       [Select từ pets của khách đã chọn]
Dịch vụ*        [Select từ service_catalog]
Ngày & Giờ*     [DateTimePicker — slots available (bookingCount < 2) hiện bình thường,
               slots full (bookingCount = 2) hiện xám + tooltip "Đã đủ 2 lịch",
               admin vẫn có thể chọn slot full (có warning)]
Thời lượng      [auto-fill từ service, có thể chỉnh]
Ghi chú         [Textarea]
Nguồn           [auto: 'admin']
```

### Validation
- Khách hàng và thú cưng: bắt buộc
- Ngày giờ: phải trong tương lai
- Cảnh báo nếu slot conflict (không block, chỉ warn)

---

## Slot Availability Logic

Mỗi slot 30 phút cho phép tối đa **2 booking đồng thời**. Slot chỉ `busy` khi đã đủ 2.
Ngoài ra, check riêng xem customer hiện tại đã có booking trong slot đó chưa.

```typescript
// GET /v1/admin/bookings/slots?date=2024-12-15&customerId={uuid}
// customerId: optional — nếu có, trả thêm flag customerAlreadyBooked

// Working hours: 8:00 - 18:00, slot 30 phút
// Slots: 8:00, 8:30, 9:00, ... 17:30

interface TimeSlot {
  time: string;            // "09:00"
  bookingCount: number;    // số booking hiện tại trong slot (0, 1, hoặc 2)
  available: boolean;      // true nếu bookingCount < 2
  customerAlreadyBooked: boolean;  // true nếu customer này đã có booking slot này
  bookings: Array<{        // danh sách booking trong slot (admin thấy đủ, customer thấy rút gọn)
    displayNumber: string;
    customerName: string;
    petName: string;
  }>;
}
```

---

## Notifications

### Khi booking được tạo (pending)
- Admin: thông báo trên dashboard ("Có lịch hẹn mới cần xác nhận")

### Khi booking được xác nhận
- Customer: Email xác nhận với thông tin lịch hẹn
- Template: `"Lịch khám [BKG-xxx] cho [Tên thú cưng] vào [ngày giờ] đã được xác nhận"`

### Nhắc lịch trước 1 ngày
- Cron job chạy lúc 18:00 hàng ngày
- Gửi email nhắc cho tất cả customer có booking ngày mai (status=confirmed)

---

*→ Tiếp theo: `plans/05-admin-customers-pets.md`*
