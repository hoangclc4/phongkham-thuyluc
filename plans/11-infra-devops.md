# Plan 11 — Hạ Tầng & DevOps

> **Áp dụng**: Xuyên suốt project

---

## Services & Chi Phí Ước Tính

| Service | Dùng cho | Plan | Chi phí/tháng |
|---------|---------|------|--------------|
| Railway | NestJS API | Starter | ~$5 |
| Neon | PostgreSQL | Free / Launch | $0-19 |
| Cloudflare Pages | Landing + SPA | Free | $0 |
| Cloudflare R2 | File storage | Free 10GB | $0 |
| Resend | Email | Free 3k/tháng | $0 |
| Claude API | AI | Pay per use | ~$5-10 |
| **Tổng** | | | **~$10-25/tháng** |

---

## Environment Stages

```
development  → local machine
staging      → Railway (staging env) + Neon (dev branch)
production   → Railway (prod env) + Neon (main branch)
```

---

## Health Check Endpoint

```typescript
// GET /health
{
  "status": "ok",
  "timestamp": "2024-12-15T06:00:00Z",
  "services": {
    "database": "ok"
  },
  "version": "1.0.0"
}
```

---

## Monitoring

- **Uptime Robot** (free): Ping /health mỗi 5 phút, alert email nếu down
- **Railway Metrics**: CPU, RAM, Response time tích hợp sẵn
- **Neon Dashboard**: DB connections, query performance

---

## Logging

```typescript
// NestJS: dùng Pino logger (fast JSON logging)
// Log levels: error, warn, info (production), debug (development)

// KHÔNG log:
// - Passwords, tokens
// - Thông tin cá nhân khách hàng (PII)
// - Content AI conversations

// LOG:
// - Request method/path/statusCode/duration
// - Errors với stack trace
// - Auth events (login success/fail, token refresh)
// - Cron job execution (start/end/result)
```

---

## Secrets Management

- Railway: Environment Variables (encrypted at rest)
- KHÔNG bao giờ commit `.env` files
- `.env.example` chứa tất cả keys với placeholder values
- Rotate JWT secrets nếu nghi ngờ bị leak

---

*→ Tiếp theo: `plans/12-ui-ux-rules.md`*
