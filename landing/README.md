# landing

Landing page tĩnh cho **Phòng Khám Thú Y Bác Sĩ Lục**.

## Tech Stack

- **Next.js 15** (Static Export / SSG)
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- Deploy: **Cloudflare Pages**

## Setup

```bash
# Cài dependencies
npm install

# Copy env
cp .env.example .env

# Dev server
npm run dev

# Build static export
npm run build
```

## Deploy

Build output nằm ở thư mục `out/`. Cloudflare Pages deploy tự động từ nhánh `main` qua GitHub Actions.
