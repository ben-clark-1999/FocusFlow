import React from 'react';

type P = { size?: number; className?: string; stroke?: number };
const S = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24' });

/* Inline SVG set (kept for any place you still use them) */
export const IconRain = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 14a5 5 0 0 1 0-10 6 6 0 0 1 11.6 2A4 4 0 1 1 20 14H5z" />
    <path d="M7 18l-1.2 2M11 18l-1.2 2M15 18l-1.2 2" />
  </svg>
);
export const IconFire = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3c2.6 2.8 4.1 5 4.1 7.6A4.6 4.6 0 1 1 7.3 11c0-2 1.3-4.5 4.7-8z" />
    <path d="M12 10.6c1.5 1.7 2.2 3 2.2 4.2a2.2 2.2 0 1 1-4.4 0c0-1 .6-2.2 2.2-4.2z" />
  </svg>
);
export const IconWind = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10a3 3 0 1 0 0-6" />
    <path d="M3 16h14a3 3 0 1 1 0 6" />
    <path d="M3 12h8a2 2 0 1 0 0-4" />
  </svg>
);
export const IconCafe = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10h12v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-5z" />
    <path d="M15 10h2a3 3 0 0 1 0 6h-2" />
    <path d="M7 3s0 2 2 2-2 2 0 2-2 2 0 2" />
  </svg>
);
export const IconBird = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 13c3-1.6 6.6-4.6 9.1-7.1 1.9-1.9 4.7-1.5 5.8.6" />
    <path d="M6 14c2.4 0 4.6.6 6.7 2" />
    <path d="M15 12c1.9.2 3.7.9 5.1 2" />
  </svg>
);

export const TrackIcon: Record<string, React.FC<P>> = {
  rain: IconRain, fire: IconFire, wind: IconWind, cafe: IconCafe, bird: IconBird,
};

/* Use your PNG files (Vite+Electron friendly) */
const asset = (file: string) =>
  new URL(`../../../assets/icons/${file}`, import.meta.url).href;

export const TrackImage: Record<string, string> = {
  rain: asset('rain.png'),
  cafe: asset('cafe.png'),
  fire: asset('fire.png'),
  bird: asset('bird.png'),
  wind: asset('wind.png'),
};
