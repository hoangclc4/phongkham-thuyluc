# Frontend Theme Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ màu sắc và font chữ của frontend admin app với landing page (terra/cream/brown palette + Fraunces + Be Vietnam Pro).

**Architecture:** Thay đổi hoàn toàn ở tầng CSS variables — không sửa component nào. Tất cả component đang dùng `var(--color-*)` và shadcn/ui tokens sẽ tự cập nhật theo.

**Tech Stack:** Tailwind CSS v4 (`@theme` block), shadcn/ui CSS variables (`:root`), Google Fonts

---

## File map

| File | Thay đổi |
|---|---|
| `frontend/index.html` | Thêm `<link>` preconnect + Google Fonts (Be Vietnam Pro, Fraunces) |
| `frontend/.tanstack/src/index.css` | Rewrite toàn bộ: `@theme` variables mới, `:root` shadcn tokens, font vars, body |

---

### Task 1: Thêm Google Fonts vào index.html

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Thêm font links vào `<head>`**

Mở `frontend/index.html`, thêm 2 dòng sau vào trong `<head>`, trước thẻ `</head>`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Phòng Khám Thú Y Bác Sĩ Lục</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/.tanstack/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Kiểm tra font load trong browser**

Mở `http://localhost:3202`, mở DevTools → Network → filter "font". Phải thấy request đến `fonts.googleapis.com` và `fonts.gstatic.com` trả về 200.

---

### Task 2: Rewrite CSS variables trong index.css

**Files:**
- Modify: `frontend/.tanstack/src/index.css`

- [ ] **Step 1: Thay toàn bộ nội dung file**

```css
@import "tailwindcss";

/* ── Tailwind theme tokens ─────────────────────────────────── */
@theme {
  --color-primary:      #d97757;
  --color-primary-light: #e8967a;
  --color-primary-dark:  #8b5a3c;
  --color-surface:      #fff8f0;
  --color-surface-mid:  #f5e6d3;
  --color-border:       #eddcc8;
  --color-sidebar:      #8b5a3c;
  --color-dark:         #2a2520;
  --color-dark-mid:     #3d342d;
  --color-muted:        #8a7a6e;

  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Be Vietnam Pro', system-ui, sans-serif;
}

/* ── shadcn/ui tokens ──────────────────────────────────────── */
:root {
  --background:           255 248 240;   /* #fff8f0 — dùng RGB cho shadcn */
  --foreground:           42 37 32;      /* #2a2520 */
  --card:                 255 255 255;
  --card-foreground:      42 37 32;
  --primary:              217 119 87;    /* #d97757 */
  --primary-foreground:   255 255 255;
  --secondary:            245 230 211;   /* #f5e6d3 */
  --secondary-foreground: 61 52 45;      /* #3d342d */
  --muted:                245 230 211;
  --muted-foreground:     138 122 110;   /* #8a7a6e */
  --accent:               245 230 211;
  --accent-foreground:    42 37 32;
  --border:               237 220 200;   /* #eddcc8 */
  --input:                237 220 200;
  --ring:                 217 119 87;
  --radius:               0.5rem;
}

/* ── Base ──────────────────────────────────────────────────── */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100dvh;
  font-family: var(--font-body);
  background-color: #fff8f0;
  color: #2a2520;
}

h1, h2, h3 {
  font-family: var(--font-display);
}
```

- [ ] **Step 2: Kiểm tra visual trong browser**

Mở `http://localhost:3202/login`. Phải thấy:
- Nền trang màu kem (`#fff8f0`) thay vì xám
- Nút "Đăng nhập" màu terra (`#d97757`) thay vì teal
- Font body là Be Vietnam Pro (kiểm tra DevTools → Elements → Computed → font-family)
- Tiêu đề "Phòng Khám Thú Y Bác Sĩ Lục" dùng Fraunces

- [ ] **Step 3: Kiểm tra trang admin**

Đăng nhập vào `http://localhost:3202/admin`. Phải thấy:
- Sidebar màu brown (`#8b5a3c`)
- Card/table nền trắng với border kem (`#eddcc8`)
- Heading trang (vd: "Dashboard") dùng font Fraunces

---

## Lưu ý khi implement

**shadcn/ui token format:** shadcn/ui với Tailwind v4 expect CSS variables dạng RGB space-separated (không có `rgb()`), ví dụ `--primary: 217 119 87` để dùng với `hsl()` hoặc `rgb()` wrapper. Nếu sau khi apply màu shadcn components (Button, Card) vẫn không đổi, kiểm tra lại format — có thể project dùng HSL format thay vì RGB.

**Fallback nếu shadcn tokens không nhận:** Tìm file `components/ui/*.tsx` xem họ dùng `bg-primary` hay `bg-[var(--color-primary)]`. Nếu dùng `bg-primary` thì cần shadcn tokens. Nếu dùng `var(--color-primary)` thì chỉ cần `@theme` block là đủ.
