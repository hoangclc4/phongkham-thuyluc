'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const VALUE_CARDS = [
  { icon: '🏆', title: '15+ năm uy tín', desc: 'Hàng nghìn gia đình Tân Mỹ đã tin tưởng gửi gắm' },
  { icon: '🔬', title: 'Thiết bị hiện đại', desc: 'Chẩn đoán chính xác với công nghệ tiên tiến' },
  { icon: '🚨', title: 'Cấp cứu 24/7', desc: 'Luôn sẵn sàng khi bé cần khẩn cấp nhất' },
  { icon: '💰', title: 'Minh bạch chi phí', desc: 'Báo giá rõ ràng, không phát sinh phí ẩn' },
] as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function WhyUs() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="tai-sao" className="py-20" style={{ backgroundColor: '#2a2520' }}>
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center"
      >
        {/* Left — text */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col gap-5"
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d97757' }}>
            Tại sao chọn chúng tôi
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Khi bé yêu không khoẻ,{' '}
            <em style={{ color: '#d97757', fontStyle: 'italic' }}>chúng tôi ở đây.</em>
          </h2>
          <p className="leading-relaxed text-[0.95rem]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Phòng khám Bác Sĩ Lục không chỉ là nơi chữa bệnh — đây là nơi mỗi thú cưng được đối
            xử như thành viên trong gia đình.
          </p>
          <a
            href="#lien-he"
            className="inline-flex items-center px-5 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 w-fit mt-2"
            style={{ backgroundColor: '#d97757' }}
          >
            Đặt lịch khám →
          </a>
        </motion.div>

        {/* Right — 2×2 value cards */}
        <div className="grid grid-cols-2 gap-4">
          {VALUE_CARDS.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span className="text-2xl">{card.icon}</span>
              <p className="text-sm font-bold text-white">{card.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
