# Plan 06 — Admin: Hồ Sơ Bệnh Lý (Medical Records)

> **Đọc cùng với**: `plans/02-database-schema.md`, `plans/05-admin-customers-pets.md`
> **Áp dụng**: Phase 2

---

## Tổng quan

Medical Record là lõi y tế của hệ thống. Mỗi lần khám = 1 record. Bác sĩ điền sau khi khám xong. Record có thể share với khách hàng hoặc giữ nội bộ.

**Display number**: `MED-YYYYMMDD-NNN` — hiển thị ở mọi nơi, không bao giờ show UUID.

---

## API Endpoints

```
POST   /v1/admin/medical-records              # tạo mới (thường từ booking completed)
GET    /v1/admin/medical-records/:id
PUT    /v1/admin/medical-records/:id
PATCH  /v1/admin/medical-records/:id

# File attachments
POST   /v1/admin/medical-records/:id/attachments
DELETE /v1/admin/medical-records/:id/attachments/:attachmentId

# Sharing
PATCH  /v1/admin/medical-records/:id/sharing

# List
GET    /v1/admin/medical-records?petId={uuid}
GET    /v1/admin/medical-records?requiresAttention=true
```

---

## Response Shape

```typescript
{
  "id": "uuid",                      // ✅ dùng cho PUT, PATCH, DELETE, POST attachments
  "displayNumber": "MED-20241215-001",
  "pet": {
    "name": "Mimi",
    "species": "cat",
    "breed": "Anh lông ngắn",
    "ownerName": "Nguyễn Thị An",
    "ownerPhone": "0901234567",
    "knownAllergies": ["penicillin"]   // luôn show để bác sĩ nhớ
  },
  "linkedBooking": {
    "displayNumber": "BKG-20241215-001",
    "serviceType": "general_checkup"
  },
  "visitDate": "2024-12-15",
  "weightAtVisit": 4.2,
  "temperatureCelsius": 38.5,
  "chiefComplaint": "Ho khan 3 ngày, bỏ ăn",
  "physicalExamination": "Phổi trong, không ran. Họng đỏ nhẹ.",
  "diagnosis": "Viêm họng cấp",
  "diagnosisNotes": "Nguyên nhân có thể do thay đổi thời tiết",
  "treatmentPlan": [
    {
      "id": "tp-1",
      "drug": "Amoxicillin",
      "dosage": "50mg",
      "frequency": "2 lần/ngày",
      "duration": "7 ngày",
      "route": "uống",
      "notes": "Cho uống sau bữa ăn"
    }
  ],
  "doctorNotes": "Theo dõi sau 5 ngày. Nếu không thuyên giảm cần xét nghiệm máu.",
  "followupDate": "2024-12-22",
  "followupNotes": "Tái khám kiểm tra",
  "attachments": [
    {
      "id": "att-uuid-1",       // UUID dùng cho API delete, nhưng không hiển thị trên UI
      "filename": "x-quang-nguc.jpg",
      "type": "xray",
      "typeLabel": "X-quang",
      "url": "https://files.../...",
      "uploadedAt": "2024-12-15T10:30:00+07:00"
    }
  ],
  "isSharedWithCustomer": false,
  "requiresAttention": false,
  "attentionReason": null,
  "createdBy": "Bác sĩ Lục",    // tên admin, không phải UUID
  "createdAt": "2024-12-15T10:45:00+07:00",
  "updatedAt": "2024-12-15T11:00:00+07:00"
}
```

---

## Medical Record Form (Admin UI)

### Khi mở từ Booking completed:
- Pre-fill: pet info, visit date, linked booking
- Auto-generate display number

### Sections trong form

#### 1. Thông tin cơ bản
```
Ngày khám:     [DatePicker — default today]
Cân nặng (kg): [Number input]
Nhiệt độ (°C): [Number input — normal 38–39.5°C cho chó/mèo]
```

#### 2. Triệu chứng & Khám lâm sàng
```
Triệu chứng chính*: [Textarea — khách mô tả + bác sĩ bổ sung]
Kết quả khám lâm sàng: [Textarea — rich text]
```

#### 3. Chẩn đoán
```
Chẩn đoán*:    [Textarea]
Ghi chú chẩn đoán: [Textarea — giải thích thêm]
```

#### 4. Phác đồ điều trị
```
[Danh sách thuốc — dynamic form]
+ Thêm thuốc:
  Tên thuốc:    [Input]
  Liều lượng:   [Input]  (50mg, 1 viên)
  Tần suất:     [Select] (1 lần/ngày | 2 lần/ngày | 3 lần/ngày | Khi cần)
  Thời gian:    [Input]  (7 ngày)
  Đường dùng:   [Select] (uống | tiêm | bôi | nhỏ mắt | nhỏ tai)
  Ghi chú:      [Input]
```

#### 5. Theo dõi & Tái khám
```
Ghi chú bác sĩ:   [Textarea tự do]
Ngày tái khám:    [DatePicker — nullable]
Ghi chú tái khám: [Input]
Cần chú ý đặc biệt: [Toggle] → nếu bật, nhập lý do
```

#### 6. Đính kèm
```
[File upload area — drag & drop]
Accept: JPG, PNG, WEBP, PDF
Max: 10MB/file
Preview inline cho ảnh
```

#### 7. Chia sẻ với khách hàng
```
[Toggle: Cho phép khách hàng xem record này]
Default: OFF (bác sĩ quyết định share gì)
```

---

## File Upload Flow

```typescript
// POST /v1/admin/medical-records/:id/attachments
// Content-Type: multipart/form-data

// Backend flow:
// 1. Validate file type + size
// 2. Generate filename: {medicalRecordUUID}/{uuid}.{ext}
//    (UUID trong tên file — internal, không hiển thị)
// 3. Upload lên Cloudflare R2
// 4. Lưu metadata vào medical_records.attachments JSONB
// 5. Return attachment object với url

// Xoá:
// DELETE /v1/admin/medical-records/:id/attachments/:attachmentId
// attachmentId là UUID trong JSONB — dùng để identify attachment
// Trên UI: nút xoá bên cạnh filename — user không thấy UUID này
```

---

## Sharing Logic

```typescript
// Khi isSharedWithCustomer = true:
// → Customer có thể thấy record này trong Customer Portal
// → Nhưng chỉ thấy các fields an toàn:
//   - visitDate, chiefComplaint, diagnosis, diagnosisNotes
//   - treatmentPlan (tên thuốc, liều, tần suất)
//   - followupDate
//   - attachments (nếu có)
// → KHÔNG thấy: physicalExamination (technical), doctorNotes (internal)

// Customer KHÔNG thể sửa gì cả — read-only
```

---

## Requires Attention Flag

```typescript
// Dùng cho báo cáo 6h sáng của AI
// Admin toggle khi thú cưng cần theo dõi đặc biệt

// AI sẽ prioritize các pet có requires_attention = true
// trong morning report, kèm attentionReason

// Examples:
// "Hậu phẫu ngày 2 — theo dõi vết mổ"
// "Dị ứng thuốc — đang xử lý"
// "Ca nặng — cần tái khám sớm"
```

---

## Audit & History

```typescript
// Mọi thay đổi vào medical_records cần log:
// - updated_at tự động update
// - created_by lưu admin ID

// Nếu cần audit trail chi tiết (phase sau):
// Tạo table medical_record_audit_logs
// Log: field_changed, old_value, new_value, changed_by, changed_at
```

---

*→ Tiếp theo: `plans/07-admin-finance.md`*
