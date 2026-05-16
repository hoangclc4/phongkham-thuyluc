# frontend

Web app (SPA) cho hệ thống quản lý **Phòng Khám Thú Y Bác Sĩ Lục** — gồm cả giao diện Admin và Customer Portal.

## Tech Stack

- **React 19** + Vite
- **Tailwind CSS v4** + shadcn/ui
- **TanStack Query v5** (server state)
- **TanStack Router** (routing)
- **Zustand** (client state)
- **FullCalendar** (lịch booking)
- **Recharts** (biểu đồ báo cáo)

## Setup

```bash
# Cài dependencies
npm install

# Copy env và điền thông tin
cp .env.example .env

# Khởi động dev server
npm run dev
```

## Cấu trúc thư mục

```
src/
├── routes/
│   ├── admin/        # Giao diện quản lý (bác sĩ / nhân viên)
│   ├── customer/     # Customer portal (khách hàng)
│   └── auth/         # Đăng nhập / quên mật khẩu
├── components/       # Shared UI components
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── lib/
    ├── api.ts         # API client
    ├── formatVND.ts   # Format tiền VND
    └── formatDate.ts  # Format ngày giờ (Asia/Ho_Chi_Minh)
```

## Biến môi trường

Xem `.env.example` để biết danh sách biến cần thiết.
