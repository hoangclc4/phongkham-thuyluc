'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const FEATURES = [
  {
    icon: '🏥',
    title: 'Trang thiết bị hiện đại',
    desc: 'Máy siêu âm, X-quang, xét nghiệm máu tại chỗ',
  },
  {
    icon: '💊',
    title: 'Thuốc chính hãng, đảm bảo',
    desc: 'Nhập khẩu trực tiếp, đúng lứa tuổi và cân nặng',
  },
  {
    icon: '🤝',
    title: 'Tư vấn tận tình, minh bạch',
    desc: 'Giải thích chi tiết từng bước, không phí ẩn',
  },
] as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="gioi-thieu" className="py-20 bg-white">
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        {/* Image column */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative"
        >
          <Image
            src="/images/doctor.png"
            alt="Bác sĩ Lục — Phòng Khám Thú Y"
            width={500}
            height={600}
            className="rounded-2xl w-full object-cover"
          />
          {/* Badge card */}
          <div
            className="absolute -bottom-4 -right-4 rounded-2xl px-5 py-4 text-center shadow-xl"
            style={{ backgroundColor: '#d97757' }}
          >
            <p
              className="text-3xl font-bold text-white leading-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              15+
            </p>
            <p className="text-xs font-medium text-white/85 mt-0.5">Năm kinh nghiệm</p>
          </div>
        </motion.div>

        {/* Text column */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-5"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#d97757' }}
          >
            Về chúng tôi
          </span>

          <h2
            className="text-3xl sm:text-4xl font-bold leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
          >
            Người bạn{' '}
            <em style={{ color: '#d97757', fontStyle: 'italic' }}>đáng tin</em>
            <br />
            của thú cưng bạn
          </h2>

          <p className="leading-relaxed text-[0.95rem]" style={{ color: '#8a7a6e' }}>
            Bác sĩ Lục tốt nghiệp chuyên ngành Thú Y tại Đại học Nông Lâm TP.HCM, với hơn 15 năm
            gắn bó cùng người dân Tân Mỹ. Phòng khám được trang bị đầy đủ thiết bị hiện đại, đảm
            bảo mỗi ca khám đều chính xác và an toàn.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: 'rgba(217,119,87,0.1)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#2a2520' }}>
                    {f.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#8a7a6e' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
