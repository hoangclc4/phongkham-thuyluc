'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

type Service = {
  icon: string;
  title: string;
  desc: string;
  emergency?: boolean;
};

const SERVICES: Service[] = [
  {
    icon: '/images/icon-checkup.png',
    title: 'Khám tổng quát',
    desc: 'Kiểm tra sức khoẻ định kỳ, phát hiện sớm các vấn đề.',
  },
  {
    icon: '/images/icon-vaccine.png',
    title: 'Tiêm chủng',
    desc: 'Đầy đủ các mũi vaccine theo lứa tuổi và giống loài.',
  },
  {
    icon: '/images/icon-surgery.png',
    title: 'Phẫu thuật',
    desc: 'Triệt sản, cấp cứu, can thiệp ngoại khoa an toàn.',
  },
  {
    icon: '/images/icon-grooming.png',
    title: 'Spa & làm đẹp',
    desc: 'Tắm, cắt tỉa lông, vệ sinh tai, cắt móng.',
  },
  {
    icon: '/images/icon-nutrition.png',
    title: 'Dinh dưỡng',
    desc: 'Tư vấn chế độ ăn phù hợp theo giống & lứa tuổi.',
  },
  {
    icon: '/images/icon-ai.png',
    title: 'AI Tư vấn',
    desc: 'Hỏi đáp nhanh qua AI 24/7, kết nối bác sĩ khi cần.',
  },
  {
    icon: '/images/icon-chat.png',
    title: 'Chat online',
    desc: 'Đặt lịch, hỏi bác sĩ trực tiếp qua chat.',
  },
  {
    icon: '/images/icon-emergency.png',
    title: 'Cấp cứu 24/7',
    desc: 'Đường dây nóng, hỗ trợ khẩn cấp bất kể giờ nào.',
    emergency: true,
  },
] as const;

export function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="dich-vu" className="py-20" style={{ backgroundColor: '#fff8f0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d97757' }}>
              Dịch vụ
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold leading-[1.15] mt-1"
              style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
            >
              Tất cả những gì{' '}
              <em style={{ color: '#d97757', fontStyle: 'italic' }}>bé cần</em>,<br />
              dưới một mái nhà.
            </h2>
          </div>
          <a
            href="#lien-he"
            className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: '#eddcc8', color: '#d97757' }}
          >
            Xem tất cả →
          </a>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
              style={{
                backgroundColor: service.emergency ? '#2a2520' : 'white',
                border: `1.5px solid ${service.emergency ? 'transparent' : 'rgba(217,119,87,0.08)'}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: service.emergency
                    ? 'rgba(217,119,87,0.2)'
                    : 'rgba(217,119,87,0.1)',
                }}
              >
                <Image
                  src={service.icon}
                  alt={service.title}
                  width={28}
                  height={28}
                />
              </div>
              <p
                className="text-sm font-bold leading-snug"
                style={{ color: service.emergency ? 'white' : '#2a2520' }}
              >
                {service.title}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: service.emergency ? 'rgba(255,255,255,0.5)' : '#8a7a6e' }}
              >
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
