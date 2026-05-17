# Design: Đồng bộ Theme Frontend với Landing Page

**Ngày:** 2026-05-16  
**Scope:** `frontend/` — CSS variables, fonts, shadcn/ui tokens  
**Không thuộc scope:** landing page, backend, component logic

---

## Mục tiêu

Đồng bộ visual identity của frontend admin app với landing page: cùng màu sắc (terra/cream/brown), cùng font chữ (Fraunces + Be Vietnam Pro).

---

## Quyết định thiết kế

**Option A — Full landing palette**, đã được duyệt qua mockup.

---

## 1. Color Palette

Thay toàn bộ CSS variables trong `frontend/.tanstack/src/index.css`:

| Variable mới | Giá trị | Dùng cho |
|---|---|---|
| `--color-primary` | `#d97757` | Nút chính, active state, accent |
| `--color-primary-light` | `#e8967a` | Hover state |
| `--color-primary-dark` | `#8b5a3c` | Pressed state |
| `--color-surface` | `#fff8f0` | Background trang |
| `--color-surface-mid` | `#f5e6d3` | Card background, chip |
| `--color-border` | `#eddcc8` | Border, divider |
| `--color-sidebar` | `#8b5a3c` | Sidebar background |
| `--color-dark` | `#2a2520` | Text chính |
| `--color-dark-mid` | `#3d342d` | Text phụ |
| `--color-muted` | `#8a7a6e` | Placeholder, label mờ |

Xoá các variables cũ không còn dùng: `--color-accent`, `--color-accent-light`.

---

## 2. Typography

### Fonts import
Thêm vào `index.html` của frontend:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet">
```

### Font assignment trong CSS
```css
--font-display: 'Fraunces', Georgia, serif;   /* heading trang */
--font-body:    'Be Vietnam Pro', system-ui, sans-serif;  /* toàn bộ body */
```

- `body`: dùng `var(--font-body)`
- `h1, h2, h3` (page-level headings): dùng `var(--font-display)`
- shadcn/ui components (button, input, badge, v.v.): kế thừa `var(--font-body)`

---

## 3. shadcn/ui Token Mapping

shadcn/ui dùng CSS variables riêng (`--primary`, `--background`, v.v.). Cần map sang palette mới trong `index.css`:

| shadcn token | Giá trị mới |
|---|---|
| `--background` | `#fff8f0` |
| `--foreground` | `#2a2520` |
| `--primary` | `#d97757` |
| `--primary-foreground` | `#ffffff` |
| `--secondary` | `#f5e6d3` |
| `--secondary-foreground` | `#3d342d` |
| `--muted` | `#f5e6d3` |
| `--muted-foreground` | `#8a7a6e` |
| `--accent` | `#f5e6d3` |
| `--accent-foreground` | `#2a2520` |
| `--border` | `#eddcc8` |
| `--input` | `#eddcc8` |
| `--ring` | `#d97757` |
| `--card` | `#ffffff` |
| `--card-foreground` | `#2a2520` |

---

## 4. Body background

```css
body {
  background-color: #fff8f0;
  color: #2a2520;
  font-family: var(--font-body);
}
```

---

## Files cần thay đổi

| File | Thay đổi |
|---|---|
| `frontend/index.html` | Thêm Google Fonts `<link>` |
| `frontend/.tanstack/src/index.css` | Toàn bộ CSS variables + font vars + body |

Không cần thay đổi component nào — tất cả component đang dùng `var(--color-*)` và shadcn tokens, sẽ tự cập nhật.

---

## Không thuộc scope

- Sửa hardcoded color trong từng component
- Thay đổi layout, spacing, hoặc component structure
- Dark mode
