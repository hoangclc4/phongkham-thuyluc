'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  spanRows?: boolean;
};

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: '/images/clinic-building.png',
    alt: 'Không gian phòng khám chính',
    caption: 'Không gian phòng khám chính',
    spanRows: true,
  },
  { src: '/images/dog.png', alt: 'Ca khám chó', caption: 'Ca khám chó' },
  { src: '/images/cat.png', alt: 'Ca khám mèo', caption: 'Ca khám mèo' },
  { src: '/images/icon-vaccine.png', alt: 'Tiêm phòng', caption: 'Tiêm phòng' },
  { src: '/images/icon-grooming.png', alt: 'Spa & grooming', caption: 'Spa & grooming' },
] as const;

export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="gallery" className="py-20" style={{ backgroundColor: '#fff8f0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d97757' }}>
            Hình ảnh
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-[1.15] mt-1 max-w-lg"
            style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
          >
            Một thoáng{' '}
            <em style={{ color: '#d97757', fontStyle: 'italic' }}>bên trong</em>
            <br />
            phòng khám của chúng tôi
          </h2>
        </motion.div>

        <div
          ref={ref}
          className="grid gap-3"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '240px 200px',
          }}
        >
          {GALLERY_ITEMS.map((item, index) => (
            <motion.div
              key={item.src}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="relative rounded-2xl overflow-hidden group"
              style={item.spanRows ? { gridRow: 'span 2' } : undefined}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div
                className="absolute bottom-2.5 left-3 text-white text-xs font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: 'rgba(42,37,32,0.7)', backdropFilter: 'blur(4px)' }}
              >
                {item.caption}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
