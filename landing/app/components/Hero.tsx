import Image from 'next/image';

const PHONE_HREF = 'tel:02838730496';
const BOOKING_HREF = '#lien-he';

function SparkStar({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{
        position: 'absolute',
        width: 18,
        height: 18,
        color: '#d97757',
        animation: 'sparkle 2.4s ease-in-out infinite',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden
    >
      <path d="M12 0 l2 9 l9 2 l-9 2 l-2 9 l-2 -9 l-9 -2 l9 -2 z" />
    </svg>
  );
}

function FloatingBadge({
  icon,
  title,
  sub,
  style,
}: {
  icon: string;
  title: string;
  sub: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        padding: '11px 13px',
        borderRadius: 14,
        background: '#fff8f0',
        boxShadow: '0 12px 30px -10px rgba(42,37,32,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        zIndex: 10,
        ...style,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: '#f3c8b3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Image src={icon} alt="" width={20} height={20} />
      </div>
      <div>
        <div style={{ color: '#2a2520' }}>{title}</div>
        <div
          style={{
            fontSize: 10,
            color: '#5a4a3e',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

const PAW_POSITIONS = [
  { left: '12%', top: '70%', delay: '0s' },
  { left: '26%', top: '76%', delay: '1.0s' },
  { right: '18%', top: '72%', delay: '1.8s' },
  { right: '34%', top: '80%', delay: '0.5s' },
] as const;

export function Hero() {
  return (
    <section
      id="trang-chu"
      className="relative pt-16 flex flex-col lg:flex-row overflow-hidden min-h-screen"
      style={{ backgroundColor: '#fff8f0', color: '#2a2520' }}
    >
      {/* ── LEFT: Text content ── */}
      <div
        className="order-2 lg:order-1 flex flex-col justify-center px-6 sm:px-10 lg:pl-16 lg:pr-10 py-10 lg:py-24 lg:w-[54%]"
        style={{ backgroundColor: '#fff8f0', zIndex: 4 }}
      >
        {/* Live pill */}
        <span
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full w-fit mb-5 text-[13px] font-semibold"
          style={{ background: 'rgba(217,119,87,0.12)', color: '#b8593d' }}
        >
          <span className="hero-pill-dot" />
          Đang nhận lịch · Tuần này còn 12 slot
        </span>

        {/* Headline */}
        <h1
          className="font-medium leading-[0.98] tracking-tight mb-6 text-[2.8rem] sm:text-6xl lg:text-[5.2rem]"
          style={{ fontFamily: 'var(--font-display)', color: '#2a2520' }}
        >
          <span className="inline-block hero-word-1">Yêu thương,</span>
          <br />
          <em
            className="inline-block hero-word-2 not-italic"
            style={{ color: '#d97757', fontStyle: 'italic' }}
          >
            chữa lành,
          </em>
          <br />
          <span className="inline-block hero-word-3">gần bạn.</span>
        </h1>

        {/* Lede */}
        <p
          className="text-base lg:text-[17px] leading-relaxed mb-8 max-w-[500px]"
          style={{ color: '#5a4a3e' }}
        >
          Phòng khám thú y nhỏ ở Tân Mỹ. Bác sĩ Lục và đội ngũ chăm sóc từng bé như chính gia
          đình mình — nhẹ tay, lắng nghe, và minh bạch chi phí từ đầu.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href={BOOKING_HREF}
            className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm relative overflow-hidden"
            style={{ backgroundColor: '#2a2520', color: '#fff8f0' }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>Đặt lịch khám</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <span className="hero-btn-shine" />
          </a>

          <a
            href={PHONE_HREF}
            className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm"
            style={{
              background: 'transparent',
              color: '#2a2520',
              border: '1.5px solid rgba(42,37,32,0.18)',
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
            028 3873 0496
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-6" style={{ borderTop: '1px dashed rgba(42,37,32,0.18)' }}>
          {[
            { n: '15+', l: 'Năm kinh nghiệm' },
            { n: '8.4k', l: 'Bé đã chăm sóc' },
            { n: '4.9★', l: 'Đánh giá Google', gold: true },
          ].map(({ n, l, gold }) => (
            <div key={l}>
              <p
                className="text-3xl font-semibold leading-none mb-1.5"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: gold ? '#e8b059' : '#2a2520',
                }}
              >
                {n}
              </p>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: '#5a4a3e' }}
              >
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Animated scene ── */}
      <div
        className="order-1 lg:order-2 relative lg:w-[46%] min-h-[400px] lg:min-h-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Big morphing blob */}
        <div
          style={{
            position: 'absolute',
            inset: 40,
            background: 'linear-gradient(135deg, #f3c8b3, #faecd9)',
            borderRadius: '58% 42% 55% 45% / 48% 60% 40% 52%',
            animation: 'blobMorph 14s ease-in-out infinite',
          }}
        />
        {/* Inner accent blob */}
        <div
          style={{
            position: 'absolute',
            inset: 90,
            background: '#d97757',
            opacity: 0.14,
            borderRadius: '42% 58% 38% 62% / 60% 40% 55% 45%',
            animation: 'blobMorph 16s ease-in-out infinite reverse',
          }}
        />
        {/* Spinning dashed ring */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: '1.5px dashed rgba(217,119,87,0.42)',
            borderRadius: '50%',
            animation: 'blobSpin 40s linear infinite',
          }}
        />

        {/* Dog */}
        <div
          style={{
            position: 'absolute',
            left: '9%',
            top: '50%',
            marginTop: -88,
            animation: 'bounceA 2.2s ease-in-out infinite',
            transformOrigin: 'center bottom',
          }}
        >
          <Image
            src="/images/dog.png"
            alt="Chó"
            width={200}
            height={200}
            className="w-[155px] h-[155px] lg:w-[200px] lg:h-[200px] object-contain select-none"
            draggable={false}
            priority
          />
        </div>

        {/* Cat */}
        <div
          style={{
            position: 'absolute',
            right: '7%',
            top: '50%',
            marginTop: -78,
            animation: 'bounceB 2.2s ease-in-out infinite',
            transformOrigin: 'center bottom',
          }}
        >
          <Image
            src="/images/cat.png"
            alt="Mèo"
            width={175}
            height={175}
            className="w-[140px] h-[140px] lg:w-[175px] lg:h-[175px] object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Heart */}
        <div
          style={{
            position: 'absolute',
            right: '20%',
            top: '11%',
            animation: 'pulseHeart 1.4s ease-in-out infinite',
          }}
        >
          <Image
            src="/images/heart.png"
            alt=""
            width={52}
            height={52}
            className="w-[40px] h-[40px] lg:w-[52px] lg:h-[52px] object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Floating paw prints */}
        {PAW_POSITIONS.map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 28,
              height: 28,
              opacity: 0,
              animation: `floatUp 3.6s ease-in-out ${pos.delay} infinite`,
              ...pos,
            }}
          >
            <Image
              src="/images/paw.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              draggable={false}
            />
          </div>
        ))}

        {/* Badge A — Tiêm phòng */}
        <FloatingBadge
          icon="/images/icon-vaccine.png"
          title="Tiêm phòng"
          sub="Trọn gói · 250k"
          style={{ left: 14, top: '20%', animation: 'badgeFloat 3s ease-in-out infinite' }}
        />

        {/* Badge B — Cấp cứu 24/7 */}
        <FloatingBadge
          icon="/images/icon-emergency.png"
          title="Cấp cứu 24/7"
          sub="Hotline · 028 3873 0496"
          style={{
            right: 14,
            bottom: '20%',
            animation: 'badgeFloat 3s ease-in-out 1.5s infinite',
          }}
        />

        {/* Sparkles */}
        <SparkStar style={{ left: '46%', top: 60, animationDelay: '0.2s' }} />
        <SparkStar style={{ left: '26%', top: '50%', animationDelay: '1.1s' }} />
        <SparkStar style={{ right: '22%', bottom: 80, animationDelay: '1.7s' }} />
      </div>
    </section>
  );
}
