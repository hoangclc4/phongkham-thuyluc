# Design: Khách hàng tự thêm / sửa / xoá thú cưng

**Ngày:** 2026-05-16  
**Scope:** Customer portal — CRUD thú cưng do khách tự quản lý

---

## Tóm tắt

Hiện tại trang `/customer/pets` chỉ đọc (read-only), khách hàng phải liên hệ phòng khám để thêm thú cưng. Tính năng này cho phép khách tự thêm, sửa, xoá thú cưng của họ ngay trong portal. Thú cưng mới active ngay, không cần admin duyệt.

---

## Quyết định thiết kế

| Câu hỏi | Quyết định |
|---------|-----------|
| Có cần admin duyệt? | Không — active ngay sau khi tạo |
| Scope form | Đầy đủ (không có microchip ID) |
| Khách có thể sửa/xoá? | Có |
| Upload avatar? | Có |
| UX pattern | Modal/Dialog (không navigate away) |
| Status mặc định | `healthy`, khách không được tự đổi |

---

## Backend

### Endpoints mới (thêm vào `CustomerController`)

```
POST   /customer/pets                    → tạo thú cưng
PUT    /customer/pets/:petId             → sửa thú cưng
DELETE /customer/pets/:petId             → xoá mềm
PUT    /customer/pets/:petId/avatar      → upload ảnh đại diện (multipart)
```

Tất cả đều yêu cầu `CustomerGuard`. Ownership được verify bằng `customerId` từ JWT — không cho sửa/xoá pet của người khác.

### DTOs

**`CreateCustomerPetDto`**

| Field | Type | Required |
|-------|------|----------|
| `name` | `string` (max 50) | ✅ |
| `species` | `PetSpecies` enum | ✅ |
| `gender` | `PetGender` enum | ✅ |
| `breed` | `string` (max 100) | ❌ |
| `dateOfBirth` | `string` (YYYY-MM-DD) | ❌ |
| `color` | `string` (max 100) | ❌ |
| `weightKg` | `number` (positive) | ❌ |
| `isNeutered` | `boolean` | ❌ |
| `knownAllergies` | `string[]` | ❌ |
| `notes` | `string` | ❌ |

`status` không có trong DTO — luôn set `healthy` khi tạo.

**`UpdateCustomerPetDto`:** partial của `CreateCustomerPetDto` (tất cả optional).

### Avatar upload

- Pattern giống `PUT /admin/pets/:id/avatar`
- Dùng Fastify `req.file()` + `StorageService.uploadFile('pets', petId, ...)`
- Chỉ accept: `image/jpeg`, `image/png`, `image/webp` — max 10MB
- Cần verify ownership trước khi upload

### `CustomerService` — methods mới

- `createPet(customerId, dto)` — insert với `status='healthy'`, `customerId` từ JWT
- `updatePet(customerId, petId, dto)` — verify ownership → update
- `deletePet(customerId, petId)` — verify ownership → set `deletedAt = now()`
- `updatePetAvatar(customerId, petId, avatarUrl)` — verify ownership → update `avatarUrl`

---

## Frontend

### Components mới

**`PetFormModal`**
- Dùng chung cho create và edit
- Nhận prop `pet?: CustomerPetResponse` — nếu có thì pre-fill (edit mode), không có thì empty (create mode)
- Dialog với `ScrollArea` bên trong để form dài vẫn scroll được trên mobile
- Form chia 3 section:
  1. **Thông tin cơ bản:** `name`, `species`, `gender`
  2. **Thông tin bổ sung:** `breed`, `dateOfBirth`, `color`, `weightKg`, `isNeutered`
  3. **Thông tin y tế:** `knownAllergies`, `notes`
- Avatar upload: click vào circle → file picker → preview trong modal → upload khi submit (dùng `useUploadPetAvatar` sau khi create/update thành công)

**`DeletePetConfirmDialog`**
- Alert Dialog với confirm trước khi xoá
- Hiện tên thú cưng trong message confirm

### Hooks mới (trong `use-customer-portal.ts` hoặc file riêng)

- `useCreatePet()` — `POST /customer/pets`
- `useUpdatePet()` — `PUT /customer/pets/:petId`
- `useDeletePet()` — `DELETE /customer/pets/:petId`
- `useUploadPetAvatar()` — `PUT /customer/pets/:petId/avatar` (multipart)

Tất cả đều invalidate query key `['my-pets']` sau khi thành công.

### Thay đổi trang hiện có

**`/customer/pets` (index)**
- Thêm nút "+ Thêm thú cưng" ở header (bên phải tiêu đề)
- Empty state: bỏ text "Liên hệ phòng khám..." → thay bằng nút "+ Thêm thú cưng đầu tiên"
- Click nút → mở `PetFormModal` (create mode)

**`/customer/pets/$id` (detail)**
- Thêm nút "Sửa" → mở `PetFormModal` pre-filled (edit mode)
- Thêm nút "Xoá" → mở `DeletePetConfirmDialog`
- Sau xoá thành công → navigate về `/customer/pets`

---

## Luồng xử lý avatar

1. User chọn file trong `PetFormModal`
2. File preview ngay trong UI (không upload vội)
3. User submit form → `useCreatePet` hoặc `useUpdatePet` chạy trước
4. Nếu có file mới → `useUploadPetAvatar` chạy tiếp với `petId` vừa có
5. Invalidate `['my-pets']` và `['my-pet', petId]`

---

## Edge cases

- Avatar upload lỗi sau khi create/update pet thành công → pet vẫn được lưu, không rollback. User có thể upload lại qua edit.
- `knownAllergies` trong UI: textarea mỗi dòng một dị ứng → split `\n` thành `string[]` khi submit.

---

## Out of scope

- Khách không thể tự đổi `status` của thú cưng
- Không có soft-undelete từ phía khách
- Không có approval workflow
