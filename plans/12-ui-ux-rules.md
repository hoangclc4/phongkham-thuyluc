# Plan 12 — UI/UX Rules & Component Guidelines

> **Áp dụng**: Xuyên suốt — đọc trước khi build bất kỳ UI component nào

---

## Design Tokens

```typescript
// Dùng Tailwind CSS v4 với custom tokens
// apps/web/src/styles/global.css

:root {
  /* Brand colors */
  --color-primary: #2d6e6e;       /* teal — màu chính */
  --color-primary-light: #4a9d9d;
  --color-accent: #e8a24a;        /* warm gold */

  /* Semantic */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #2563eb;

  /* Booking status */
  --color-status-pending: #f59e0b;
  --color-status-confirmed: #3b82f6;
  --color-status-checked-in: #8b5cf6;
  --color-status-in-progress: #10b981;
  --color-status-completed: #6b7280;
  --color-status-cancelled: #ef4444;
  --color-status-no-show: #9ca3af;
}
```

---

## "Không hiển thị UUID lên UI" — Implementation

UUID có trong API response và frontend state — chỉ là không render ra màn hình cho người dùng thấy.

```
API response   → có cả id (UUID) lẫn displayNumber
Frontend state → lưu cả hai
URL params     → dùng UUID (performant — lookup thẳng PK)
API calls      → dùng UUID
Render ra UI   → chỉ dùng displayNumber, KHÔNG render UUID
```

---

## Status Labels (Tiếng Việt)

```typescript
export const BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã đến',
  in_progress: 'Đang khám',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

export const PET_SPECIES_LABELS = {
  dog: 'Chó',
  cat: 'Mèo',
  bird: 'Chim',
  rabbit: 'Thỏ',
  hamster: 'Hamster',
  reptile: 'Bò sát',
  other: 'Khác',
};

export const SERVICE_TYPE_LABELS = {
  general_checkup: 'Khám tổng quát',
  followup: 'Tái khám',
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  grooming: 'Grooming',
  laboratory: 'Xét nghiệm',
  dental: 'Nha khoa',
  emergency: 'Cấp cứu',
  other: 'Khác',
};
```

---

## Admin vs Customer UI Differences

| | Admin | Customer |
|--|-------|---------|
| Layout | Sidebar + main content | Bottom tab nav |
| Data density | Cao (table views, nhiều columns) | Thấp (card views, ít info) |
| Actions | Đầy đủ CRUD | Chỉ view + book + cancel |
| Technical terms | OK (bác sĩ hiểu) | Tránh (ngôn ngữ đơn giản) |
| Font size | 14px body | 16px body |
| UUID exposure | Không (dùng displayNumber) | Không (dùng displayNumber) |

---

## Responsive Breakpoints

```
Mobile:  < 768px  → bottom nav, single column
Tablet:  768-1024px → collapsed sidebar, 2 columns  
Desktop: > 1024px → full sidebar, multi columns
```

---

*Hết tài liệu kế hoạch. Xem `CLAUDE.md` để bắt đầu session implement.*
