# Landing Page Design Spec — Phòng Khám Thú Y Bác Sĩ Lục

**Date:** 2026-05-15
**Phase:** 5
**Tech:** Next.js 15 (Static Export) → Cloudflare Pages
**Repo:** `phongkham-landing/`

---

## Design System

### Màu sắc
| Token | Hex | Dùng ở |
|---|---|---|
| `--terra` | `#d97757` | Primary CTA, icon, emphasis, hero badge |
| `--terra-light` | `#e8967a` | Hover states |
| `--terra-pale` | `rgba(217,119,87,.1)` | Icon bg, badge bg, card border subtle |
| `--cream` | `#fff8f0` | Page background, testimonial cards |
| `--cream-mid` | `#f5e6d3` | Section alternation, placeholder bg |
| `--cream-dark` | `#eddcc8` | Borders, dividers |
| `--brown` | `#8b5a3c` | Secondary text, subheadings |
| `--dark` | `#2a2520` | Primary text, dark sections bg |
| `--muted` | `#8a7a6e` | Body text, descriptions |

### Typography
- **Display / heading:** `Fraunces` (serif, Google Fonts) — `font-weight: 700`, italic `em` cho emphasis
- **Body / UI:** `Be Vietnam Pro` (sans-serif, Google Fonts) — `font-weight: 400/500/600`

### Illustration / Assets
- Pet illustrations (chó, mèo) và service icons: **có sẵn SVG/PNG** do user cung cấp
- Đặt vào `public/images/` và `public/icons/`
- Naming convention: `hero-dog.svg`, `hero-cat.svg`, `icon-kham.svg`, `icon-tiem.svg`, etc.

---

## Cấu trúc Page (Single Page Scroll)

### ① Nav — sticky
- `position: sticky; top: 0; z-index: 100`
- Background: `--cream`, border-bottom `--cream-dark`
- Left: Logo (icon tròn terracotta + tên serif)
- Center: Links → Giới thiệu · Dịch vụ · Gallery · Đánh giá · Liên hệ (smooth scroll)
- Right: CTA button "Đặt lịch khám →" — terracotta fill
- Mobile: hamburger menu, links collapse vào drawer

### ② Hero — split layout
- Grid: `1fr 1fr`, min-height `580px`
- **Left:** badge "Uy tín từ 2009 · Tân Mỹ, Quận 7" + H1 Fraunces italic + sub text + 2 CTA buttons + stats bar (15+ năm / 5,000+ bé / 24/7)
- **Right:** gradient warm brown bg + paw pattern overlay 6% opacity + float card ("24 bé hôm nay") + pet illustration (dog SVG, bottom-aligned)
- Heading copy: *"Yêu thương, **chữa lành** mỗi ngày."* — `em` italic terracotta
- CTA primary: "Đặt lịch khám →" | CTA ghost: "028 3873 0496"

### ③ Giới thiệu — 2-col
- Background: white
- Left: ảnh Bác sĩ Lục (portrait, aspect 4:5, border-radius 24px) + badge card tuyệt đối "15+ năm kinh nghiệm" terracotta
- Right: eyebrow "VỀ CHÚNG TÔI" + H2 + body text + 3 feature rows (icon 36px + title + desc)
  - 🏥 Trang thiết bị hiện đại
  - 💊 Thuốc chính hãng, đảm bảo
  - 🤝 Tư vấn tận tình, minh bạch

### ④ Dịch vụ — 8 cards, 4-col grid
- Background: `--cream`
- Header: eyebrow + H2 *"Tất cả những gì **bé cần**, dưới một mái nhà."* + link "Xem tất cả →"
- Grid: `repeat(4, 1fr)`, gap 1.2rem, 2 rows
- Card: white bg, border-radius 16px, hover lift + shadow + border terracotta subtle
- Card structure: icon-wrap (52×52, terra-pale bg) + svc-name (700) + svc-desc (muted)
- Card đặc biệt "Cấp cứu 24/7": dark background, white text, orange icon

| # | Tên | SVG icon |
|---|---|---|
| 1 | Khám tổng quát | clipboard + checkmark |
| 2 | Tiêm chủng | syringe |
| 3 | Phẫu thuật | scissors / plus |
| 4 | Spa & làm đẹp | bath / scissors |
| 5 | Dinh dưỡng | bowl |
| 6 | AI Tư vấn | robot / chip |
| 7 | Chat online | chat bubble |
| 8 | Cấp cứu 24/7 | alert circle — dark card |

### ⑤ Tại sao chọn chúng tôi — dark section
- Background: `--dark` (`#2a2520`)
- Grid: `1fr 1fr`, align-items center
- Left: eyebrow + H2 white *"Khi bé yêu không khoẻ, **chúng tôi ở đây.**"* + body + CTA
- Right: 2×2 value cards — glass effect (`rgba(255,255,255,.05)`, border `rgba(255,255,255,.08)`)
  - 🏆 15+ năm uy tín
  - 🔬 Thiết bị hiện đại
  - 🚨 Cấp cứu 24/7
  - 💰 Minh bạch chi phí

### ⑥ Gallery — masonry-style grid
- Background: `--cream`
- Grid: `2fr 1fr 1fr` × 2 rows, gap 1rem
- Item 1: span 2 rows (ảnh phòng khám chính, lớn)
- Item 2–5: ảnh bác sĩ khám, tiêm, grooming, etc.
- Mỗi item: `position: relative` container + `<Image fill objectFit="cover">` + overlay label bottom-left
- Placeholder names: `clinic-main.jpg`, `dog-exam.jpg`, `cat-exam.jpg`, `vaccine.jpg`, `grooming.jpg`

### ⑦ Testimonials — 3 cards
- Background: white
- Header centered: eyebrow + H2 *"Những gia đình **đã tin tưởng**"*
- Grid: `repeat(3, 1fr)`, gap 1.5rem
- Card: `--cream` bg, border-radius 20px
  - Quote mark Fraunces `"` terracotta size-4xl
  - Italic review text
  - ★★★★★ terracotta
  - Avatar (circular, 42px, border terracotta) + name + pet description

### ⑧ Liên hệ — dark section
- Background: `--dark`
- Grid: `1fr 1fr`
- Left: eyebrow + H2 + 3 contact info rows (📍 địa chỉ / 📞 SĐT / 🕐 giờ)
  - 990 Huỳnh Tấn Phát, Tân Mỹ, Quận 7, TP.HCM
  - 028 3873 0496
  - T2–T6: 08:00–19:00 · T7–CN: 08:00–17:00
- Right: card glass (border rgba white) chứa Google Maps iframe + CTA button full-width + note SĐT

### Footer
- Background: `#1e1a16`
- Left: copyright text
- Right: links (Chính sách bảo mật · Điều khoản · Sitemap)

---

## SEO

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Phòng Khám Thú Y Bác Sĩ Lục | 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM',
  description: 'Phòng khám thú y uy tín tại Tân Mỹ, Quận 7, TP.HCM...',
  keywords: ['phòng khám thú y', 'thú y Tân Mỹ', 'thú y Quận 7', 'bác sĩ Lục'],
}
```

JSON-LD Schema.org `VeterinaryCare` — inject qua `<script type="application/ld+json">` trong layout.

---

## File Structure

```
phongkham-landing/
├── app/
│   ├── layout.tsx          # metadata, fonts (next/font/google), global CSS
│   ├── page.tsx            # compose tất cả sections
│   └── globals.css         # CSS custom properties (design tokens)
├── components/
│   ├── Nav.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Services.tsx
│   ├── WhyUs.tsx
│   ├── Gallery.tsx
│   ├── Testimonials.tsx
│   └── Contact.tsx
└── public/
    ├── images/             # JPG/PNG (hero, gallery, bác sĩ)
    └── icons/              # SVG service icons
```

---

## Responsive

| Breakpoint | Thay đổi |
|---|---|
| `< 768px` (mobile) | Hero: single col, illustration ẩn. Services: 2-col. About/WhyUs/Contact: single col. Nav: hamburger |
| `768–1024px` (tablet) | Hero: 2-col nhưng nhỏ hơn. Services: 2-col. Gallery: 2-col |
| `> 1024px` (desktop) | Full layout như mockup |

---

## Performance

- Font: `next/font/google` với `display: swap`
- Images: `next/image` với `priority` cho hero
- Tất cả section dưới fold: lazy-load
- Target: PageSpeed > 90, LCP < 2.5s
