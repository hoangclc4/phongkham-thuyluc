'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const PHONE_HREF = 'tel:02838730496';
const BOOKING_HREF = '#lien-he';

const STATS = [
  { value: '15+', label: 'năm kinh nghiệm' },
  { value: '5,000+', label: 'thú cưng đã chăm sóc' },
  { value: '24/7', label: 'hỗ trợ cấp cứu' },
] as const;

const FADE_LEFT = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7 } },
};

const FADE_RIGHT = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7 } },
};

export function Hero() {
  return (
    <section
      id="trang-chu"
      className="pt-16 min-h-145 grid grid-cols-1 lg:grid-cols-2"
    >
      {/* Left — text */}
      <motion.div
        variants={FADE_LEFT}
        initial="hidden"
        animate="visible"
        className="flex flex-col justify-center px-6 sm:px-10 lg:pl-16 lg:pr-12 py-16 lg:py-20"
        style={{ backgroundColor: '#fff8f0' }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 w-fit"
          style={{
            backgroundColor: 'rgba(217,119,87,0.12)',
            border: '1px solid rgba(217,119,87,0.3)',
            color: '#8b5a3c',
          }}
        >
          ⭐ Uy tín từ 2009 · Tân Mỹ, Quận 7
        </span>

        <h1
          className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
        >
          Yêu thương,{' '}
          <em className="not-italic" style={{ color: '#d97757', fontStyle: 'italic' }}>
            chữa lành
          </em>
          <br />
          mỗi ngày.
        </h1>

        <p className="text-base leading-relaxed mb-7 max-w-md" style={{ color: '#8a7a6e' }}>
          Hơn 15 năm chăm sóc thú cưng tại Tân Mỹ. Chúng tôi đối xử với từng bé như chính người
          thân trong gia đình mình.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href={BOOKING_HREF}
            className="inline-flex items-center px-5 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#d97757' }}
          >
            Đặt lịch khám →
          </a>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{
              border: '1.5px solid #eddcc8',
              color: '#8b5a3c',
              backgroundColor: 'transparent',
            }}
          >
            028 3873 0496
          </a>
        </div>

        <div
          className="flex gap-6 pt-6"
          style={{ borderTop: '1px solid #eddcc8' }}
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p
                className="text-2xl font-bold leading-none mb-1"
                style={{ fontFamily: 'var(--font-display)', color: '#d97757' }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: '#8a7a6e' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right — illustration */}
      <motion.div
        variants={FADE_RIGHT}
        initial="hidden"
        animate="visible"
        className="relative flex items-end justify-center overflow-hidden min-h-90 lg:min-h-0"
        style={{
          background: 'linear-gradient(135deg, #f0dcc8 0%, #e8c9a8 50%, #dbb88a 100%)',
        }}
      >
        {/* Paw pattern bg */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='8' y='42' font-size='32' fill='%238b5a3c'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E")`,
          }}
        />

        {/* Float card */}
        <div
          className="absolute top-6 right-6 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-xl z-10"
          style={{ backgroundColor: 'white' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: 'rgba(217,119,87,0.12)' }}
          >
            ❤️
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold leading-none" style={{ color: '#2a2520', fontFamily: 'var(--font-display)' }}>
              24 bé
            </p>
            <p className="text-[11px]" style={{ color: '#8a7a6e' }}>Hôm nay đã chăm sóc</p>
          </div>
        </div>

        {/* Pet illustration */}
        <div className="relative z-10 w-64 sm:w-72 lg:w-80 aspect-4/5">
          <Image
            src="/images/hero-dog.png"
            alt="Thú cưng được chăm sóc tại Phòng Khám Thú Y Bác Sĩ Lục"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </motion.div>
    </section>
  );
}
