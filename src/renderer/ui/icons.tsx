import React from 'react';

type P = { size?: number; className?: string; stroke?: number };

const S = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export const IconRain = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 14a5 5 0 010-10 6 6 0 0111.6 2A4 4 0 1120 14H5z" />
    <path d="M7 18l-1.2 2M11 18l-1.2 2M15 18l-1.2 2" />
  </svg>
);

export const IconFire = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3s2 3 2 5a3 3 0 11-6 0c0-2 2-5 2-5" />
    <path d="M7 13a5 5 0 1010 0c0-3-2-5-5-8-3 3-5 5-5 8z" />
  </svg>
);

export const IconWind = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10a3 3 0 100-6" />
    <path d="M3 16h14a3 3 0 110 6" />
    <path d="M3 12h8a2 2 0 100-4" />
  </svg>
);

export const IconCafe = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10h12v5a5 5 0 01-5 5H8a5 5 0 01-5-5v-5z" />
    <path d="M15 10h2a3 3 0 010 6h-2" />
    <path d="M7 3s0 2 2 2-2 2 0 2-2 2 0 2" />
  </svg>
);

export const IconBird = ({ size = 24, className, stroke = 1.8 }: P) => (
  <svg {...S(size)} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12c5-2 8-7 12-7 3 0 4 2 4 3 0 3-3 6-8 6" />
    <path d="M11 14l-2 5 3-3 3 3-2-5" />
  </svg>
);

export const TrackIcon: Record<string, React.FC<P>> = {
  rain: IconRain,
  fire: IconFire,
  wind: IconWind,
  cafe: IconCafe,
  bird: IconBird
};
