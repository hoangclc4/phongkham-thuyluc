const NAV_LINKS = [
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Tại sao chọn chúng tôi', href: '#tai-sao' },
  { label: 'Đánh giá', href: '#danh-gia' },
  { label: 'Liên hệ', href: '#lien-he' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1e1a16' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <a href="#trang-chu" className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                style={{ backgroundColor: '#d97757' }}
              >
                🐾
              </div>
              <div className="leading-tight">
                <p
                  className="text-sm font-bold leading-none"
                  style={{ fontFamily: 'var(--font-display)', color: 'white' }}
                >
                  Bác Sĩ Lục
                </p>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Phòng Khám Thú Y
                </p>
              </div>
            </a>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Chăm sóc sức khỏe toàn diện cho thú cưng tại Tân Mỹ, Quận 7, TP. Hồ Chí Minh.
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Điều hướng
            </p>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs transition-colors hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Liên hệ
            </p>
            <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <p>990 Huỳnh Tấn Phát, Tân Mỹ, Quận 7</p>
              <p>TP. Hồ Chí Minh</p>
              <a
                href="tel:02838730496"
                className="transition-colors hover:opacity-80"
                style={{ color: '#d97757' }}
              >
                028 3873 0496
              </a>
              <p>Thứ 2–6: 08:00–19:00</p>
              <p>Thứ 7–CN: 08:00–17:00</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {CURRENT_YEAR} Phòng Khám Thú Y Bác Sĩ Lục. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Chính sách bảo mật', 'Điều khoản', 'Sitemap'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
