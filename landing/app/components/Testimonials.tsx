'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

type Review = {
  avatar: string;
  name: string;
  pet: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    avatar: '/images/avatar-a.png',
    name: 'Chị Lan Anh',
    pet: 'Chủ của bé Golden — Milo',
    text: 'Bác sĩ Lục rất tận tình và kiên nhẫn. Chó nhà tôi sợ đi khám nhưng ở đây bé lại rất thoải mái. Sẽ quay lại lần sau!',
  },
  {
    avatar: '/images/avatar-b.png',
    name: 'Anh Minh Tuấn',
    pet: 'Chủ của bé British — Cam',
    text: 'Giá cả hợp lý, bác sĩ giải thích rõ ràng từng bước. Con mèo nhà tôi được chăm sóc rất chu đáo sau ca phẫu thuật nhỏ.',
  },
  {
    avatar: '/images/avatar-c.png',
    name: 'Chị Thu Hà',
    pet: 'Chủ của bé Poodle — Bông',
    text: 'Gọi cấp cứu lúc 10 giờ tối, bác sĩ vẫn hỗ trợ ngay. Thật sự rất cảm ơn Phòng Khám Bác Sĩ Lục đã cứu bé nhà tôi.',
  },
] as const;

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="danh-gia" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d97757' }}>
            Khách hàng nói gì
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-[1.15] mt-2"
            style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
          >
            Những gia đình{' '}
            <em style={{ color: '#d97757', fontStyle: 'italic' }}>đã tin tưởng</em>
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ backgroundColor: '#fff8f0' }}
            >
              {/* Quote mark */}
              <span
                className="text-5xl font-bold leading-none -mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#d97757' }}
              >
                &ldquo;
              </span>

              <p className="text-sm leading-relaxed italic flex-1" style={{ color: '#3d342d' }}>
                {review.text}
              </p>

              {/* Stars */}
              <div className="flex gap-0.5" aria-label="5 sao">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-sm" style={{ color: '#d97757' }}>★</span>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid #eddcc8' }}>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative"
                  style={{ border: '2px solid #d97757' }}
                >
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none mb-0.5" style={{ color: '#2a2520' }}>
                    {review.name}
                  </p>
                  <p className="text-xs" style={{ color: '#8a7a6e' }}>
                    {review.pet}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
