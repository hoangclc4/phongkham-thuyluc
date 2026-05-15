# Plan 10 — Landing Page (Static Website)

> **Áp dụng**: Phase 5
> **Tech**: Next.js 15 (Static Export) → Cloudflare Pages

---

## Mục tiêu

- **SEO tối đa**: Googlebot index ngay lập tức (static HTML)
- **Tốc độ**: Core Web Vitals xanh lá
- **Marketing**: Giới thiệu phòng khám, tạo booking intent

---

## Cấu trúc Sections (Single Page)

```
1. Header/Nav
2. Hero
3. Giới thiệu
4. Dịch vụ
5. Tại sao chọn phòng khám
6. Gallery
7. Đánh giá khách hàng
8. Thông tin & Liên hệ
9. Footer
```

---

## SEO Configuration

### Metadata
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Phòng Khám Thú Y Bác Sĩ Lục | 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM',
  description: 'Phòng khám thú y uy tín tại Tân Mỹ, Quận 7, TP.HCM. Bác sĩ Lục với hơn [X] năm kinh nghiệm. Dịch vụ: khám tổng quát, tiêm phòng, phẫu thuật, grooming. Đặt lịch: 028 3873 0496',
  keywords: ['phòng khám thú y', 'thú y Tân Mỹ', 'thú y Quận 7', 'bác sĩ thú y TPHCM', 'khám chó mèo Quận 7'],
};
```

### Schema.org (JSON-LD)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VeterinaryCare",
  "name": "Phòng Khám Thú Y Bác Sĩ Lục",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "990 Huỳnh Tấn Phát",
    "addressLocality": "Tân Mỹ",
    "addressRegion": "TP. Hồ Chí Minh",
    "addressCountry": "VN"
  },
  "telephone": "+84-28-3873-0496",
  "openingHours": ["Mo-Fr 08:00-19:00", "Sa-Su 08:00-17:00"],
  "url": "https://phongkhamthuyluc.com"
}
</script>
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| PageSpeed score | > 90 |

---

## Deployment

```bash
# Build static
next build   # output: ./out/

# Cloudflare Pages settings:
# Build command: next build
# Build output: out
# Node version: 20
# Custom domain: phongkhamthuyluc.com
```

---

*→ Tiếp theo: `plans/11-infra-devops.md`*
