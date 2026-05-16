'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MapPin, Phone, Clock } from 'lucide-react';

const PHONE_HREF = 'tel:02838730496';
const MAPS_HREF =
  'https://www.google.com/maps/search/990+Hu%E1%BB%B3nh+T%E1%BA%A5n+Ph%C3%A1t,+T%C3%A2n+M%E1%BB%B9,+TP.+H%E1%BB%93+Ch%C3%AD+Minh';

type ContactItem = {
  icon: LucideIcon;
  label: string;
  lines: readonly string[];
};

const CONTACT_ITEMS: ContactItem[] = [
  {
    icon: MapPin,
    label: 'Địa chỉ',
    lines: ['990 Huỳnh Tấn Phát, Phường Tân Mỹ', 'Quận 7, TP. Hồ Chí Minh'],
  },
  {
    icon: Phone,
    label: 'Điện thoại',
    lines: ['028 3873 0496 (giờ hành chính)', 'Cấp cứu: hotline 24/7'],
  },
  {
    icon: Clock,
    label: 'Giờ làm việc',
    lines: ['Thứ 2–6: 08:00 – 19:00', 'Thứ 7–CN: 08:00 – 17:00'],
  },
] as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="lien-he" className="py-20" style={{ backgroundColor: '#2a2520' }}>
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 items-start"
      >
        {/* Left — info */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col gap-5"
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d97757' }}>
            Liên hệ & đặt lịch
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Sẵn sàng chăm sóc{' '}
            <em style={{ color: '#d97757', fontStyle: 'italic' }}>bé cưng của bạn</em>
          </h2>

          <div className="flex flex-col gap-4 mt-2">
            {CONTACT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(217,119,87,0.15)' }}
                  >
                    <Icon size={18} style={{ color: '#d97757' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#d97757' }}>
                      {item.label}
                    </p>
                    {item.lines.map((line) => (
                      <p key={line} className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right — map + CTA card */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Map embed */}
          <div className="w-full rounded-xl overflow-hidden" style={{ height: '220px' }}>
            <iframe
              title="Bản đồ Phòng Khám Thú Y Bác Sĩ Lục"
              src="https://maps.google.com/maps?q=990+Huynh+Tan+Phat,+Tan+My,+Ho+Chi+Minh&output=embed&z=16"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a
            href={PHONE_HREF}
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#d97757' }}
          >
            Đặt lịch khám ngay →
          </a>

          <a
            href={MAPS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Xem bản đồ đầy đủ
          </a>
        </motion.div>
      </div>
    </section>
  );
}
