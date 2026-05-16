'use client';

import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Tại sao chọn', href: '#tai-sao' },
  { label: 'Đánh giá', href: '#danh-gia' },
  { label: 'Liên hệ', href: '#lien-he' },
] as const;

const BOOKING_HREF = '#lien-he';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'shadow-none'
      }`}
      style={{ backgroundColor: '#fff8f0', borderBottom: '1px solid #eddcc8' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#trang-chu" className="flex items-center gap-2.5" onClick={closeMobile}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0"
              style={{ backgroundColor: '#d97757' }}
            >
              🐾
            </div>
            <div className="leading-tight">
              <p
                className="text-base font-bold leading-none"
                style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
              >
                Bác Sĩ Lục
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: '#8a7a6e' }}>
                Phòng Khám Thú Y
              </p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: '#3d342d' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={BOOKING_HREF}
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#d97757' }}
          >
            Đặt lịch khám →
          </a>

          <button
            type="button"
            className="md:hidden p-2 rounded-md"
            style={{ color: '#2a2520' }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden px-4 py-4 flex flex-col gap-4"
          style={{ backgroundColor: '#fff8f0', borderTop: '1px solid #eddcc8' }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="text-sm font-medium py-1"
              style={{ color: '#3d342d' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href={BOOKING_HREF}
            onClick={closeMobile}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: '#d97757' }}
          >
            Đặt lịch khám →
          </a>
        </div>
      )}
    </header>
  );
}
