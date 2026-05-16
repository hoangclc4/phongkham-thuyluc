import type { Metadata } from 'next';
import { Fraunces, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Phòng Khám Thú Y Bác Sĩ Lục | 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM',
  description:
    'Phòng khám thú y uy tín tại Tân Mỹ, Quận 7, TP.HCM. Bác sĩ Lục với hơn 15 năm kinh nghiệm. Dịch vụ: khám tổng quát, tiêm phòng, phẫu thuật, grooming. Đặt lịch: 028 3873 0496',
  keywords: [
    'phòng khám thú y',
    'thú y Tân Mỹ',
    'thú y Quận 7',
    'bác sĩ thú y TPHCM',
    'khám chó mèo Quận 7',
  ],
  openGraph: {
    title: 'Phòng Khám Thú Y Bác Sĩ Lục | 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM',
    description:
      'Phòng khám thú y uy tín tại Tân Mỹ, Quận 7, TP.HCM. Bác sĩ Lục với hơn 15 năm kinh nghiệm.',
    locale: 'vi_VN',
    type: 'website',
    url: 'https://phongkhamthuyluc.com',
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'VeterinaryCare',
  name: 'Phòng Khám Thú Y Bác Sĩ Lục',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '990 Huỳnh Tấn Phát',
    addressLocality: 'Tân Mỹ',
    addressRegion: 'TP. Hồ Chí Minh',
    addressCountry: 'VN',
  },
  telephone: '+84-28-3873-0496',
  openingHours: ['Mo-Fr 08:00-19:00', 'Sa-Su 08:00-17:00'],
  url: 'https://phongkhamthuyluc.com',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${beVietnamPro.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
