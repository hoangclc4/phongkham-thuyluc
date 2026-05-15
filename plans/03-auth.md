# Plan 03 — Authentication & Authorization

> **Đọc cùng với**: `plans/02-database-schema.md`
> **Áp dụng**: Phase 1

---

## Hai loại user

| Type | Login bằng | JWT Expiry | Refresh |
|------|-----------|------------|---------|
| Admin | Email + Password | 15 phút | 7 ngày |
| Customer | Phone + Password | 1 giờ | 30 ngày |

---

## Endpoints

```
POST /v1/auth/admin/login
POST /v1/auth/customer/login
POST /v1/auth/refresh
POST /v1/auth/logout
POST /v1/auth/forgot-password       # customer only
POST /v1/auth/reset-password        # customer only
POST /v1/auth/customer/invite       # admin gửi invite cho customer mới
POST /v1/auth/customer/set-password # customer set password từ invite link
```

---

## JWT Structure

### Access Token Payload
```typescript
// Admin
{
  sub: string,        // admin user UUID (internal, không expose)
  role: 'admin',
  email: string,
  iat: number,
  exp: number
}

// Customer
{
  sub: string,        // customer UUID (internal)
  role: 'customer',
  phone: string,
  name: string,
  iat: number,
  exp: number
}
```

### Refresh Token
- Lưu trong **httpOnly cookie** (không accessible từ JavaScript)
- Cookie name: `refresh_token`
- Khi refresh: rotate token cũ (blacklist lưu trong PostgreSQL)

---

## Token Blacklist (PostgreSQL)

Không dùng Redis — blacklist lưu trong bảng `token_blacklist` ở PostgreSQL.

```sql
CREATE TABLE token_blacklist (
  jti        VARCHAR(36) PRIMARY KEY,  -- JWT ID
  expires_at TIMESTAMPTZ NOT NULL      -- dùng để cleanup
);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

```typescript
// Khi logout hoặc rotate refresh token:
// INSERT INTO token_blacklist (jti, expires_at) VALUES ($1, $2)

// Khi verify token:
// SELECT 1 FROM token_blacklist WHERE jti = $1
// Nếu có kết quả → token đã bị revoke → reject

// Cleanup job (cron hàng đêm 2:00 AM):
// DELETE FROM token_blacklist WHERE expires_at < NOW()
```

> **Performance**: Bảng này nhỏ (chỉ lưu token còn hiệu lực, cleanup hàng đêm).
> Với phòng khám nhỏ, số lượng token blacklisted cùng lúc < 100 — query hoàn toàn đủ nhanh.

---

## NestJS Implementation

### Guards
```typescript
// JwtAuthGuard: verify JWT, inject user vào request
// AdminGuard: extends JwtAuthGuard, check role === 'admin'
// CustomerGuard: extends JwtAuthGuard, check role === 'customer'
// ResourceOwnerGuard: check customer chỉ access resource của chính mình
```

### Decorators
```typescript
@GetUser()          // lấy user từ request
@Roles('admin')     // role guard decorator
@Public()           // bypass auth (dùng cho login endpoint)
```

### Module structure
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── admin.guard.ts
│   └── customer.guard.ts
└── dto/
    ├── admin-login.dto.ts
    ├── customer-login.dto.ts
    ├── forgot-password.dto.ts
    └── reset-password.dto.ts
```

---

## Forgot Password Flow (Customer)

```
1. POST /v1/auth/forgot-password { phone hoặc email }
   → Tìm customer theo phone/email
   → Nếu không tìm thấy: trả về 200 OK (không leak thông tin)
   → Generate reset token (crypto.randomBytes(32).toString('hex'))
   → Hash token, lưu vào customers.password_reset_token
   → Lưu expiry 1 giờ vào customers.password_reset_token_expires
   → Gửi email link: https://app.*/reset-password?token=<raw_token>

2. GET /reset-password?token=xxx (Frontend route)
   → Hiển thị form nhập mật khẩu mới

3. POST /v1/auth/reset-password { token, newPassword }
   → Hash token, tìm customer có token khớp và chưa hết hạn
   → Validate newPassword (min 8 chars)
   → Update password_hash mới
   → Clear reset token fields
   → Blacklist tất cả refresh token của customer (optional: logout all devices)
   → Gửi email xác nhận đã đổi mật khẩu thành công
```

---

## Customer Invite Flow (Admin tạo tài khoản cho khách)

```
1. Admin tạo customer record (chưa có password)
2. POST /v1/auth/customer/invite { customerId }
   → Generate invite token (expire 72 giờ)
   → Gửi email: "Phòng khám đã tạo tài khoản cho bạn..."
   → Link: https://app.*/set-password?token=<invite_token>

3. POST /v1/auth/customer/set-password { token, password }
   → Validate token
   → Set password, activate account
   → Auto-login (trả về JWT)
```

---

## Rate Limiting

```typescript
// Login endpoints
throttle: 5 requests / 1 phút / IP

// Forgot password
throttle: 3 requests / 15 phút / IP

// Nếu vượt quá → 429 Too Many Requests
// Message: "Quá nhiều yêu cầu, vui lòng thử lại sau X phút"
```

---

## Security Checklist

- [x] Passwords: bcrypt, salt rounds = 12
- [x] Reset tokens: crypto.randomBytes, hashed trước khi lưu DB
- [x] Refresh tokens: httpOnly cookie, Secure, SameSite=Strict
- [x] Access tokens: Authorization header (Bearer)
- [x] Rate limiting trên auth endpoints
- [x] Không trả về thông tin "email không tồn tại" (prevent user enumeration)
- [x] JWT có `jti` field để hỗ trợ blacklist
- [x] Rotate refresh token mỗi lần dùng

---

## Customer Self-Registration (Optional, Phase sau)

Nếu muốn cho phép khách tự đăng ký:
```
POST /v1/auth/customer/register { phone, fullName, password }
→ Tạo account với is_active = FALSE
→ Admin nhận notification
→ Admin verify và activate
```
> Không implement trong MVP — admin tạo hộ là đủ cho phòng khám nhỏ.

---

*→ Tiếp theo: `plans/04-admin-booking.md`*
