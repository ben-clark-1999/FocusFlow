import React, { useEffect, useMemo, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// Path from src/renderer/ui/Hero.tsx → project root /assets/icons/…
import meditatingBrain from '../../../assets/icons/Meditating Brain.json';

type Props = { onStart: () => void };

export default function Hero({ onStart }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Respect reduced motion so the logo doesn't animate if users prefer it off
  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    []
  );

  // Nudge animation speed based on theme to give each mode a subtle feel
  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    const speed =
      theme === 'neon-dark' ? 0.8 :
      theme === 'light-warm' ? 0.9 :
      1;
    try { lottieRef.current?.setSpeed(speed); } catch {}
  }, []);

  // If you cannot enable `resolveJsonModule`, use this fetch approach instead:
  // const [anim, setAnim] = React.useState<any>(null);
  // useEffect(() => {
  //   fetch(new URL('../../../assets/icons/Meditating Brain.json', import.meta.url))
  //     .then(r => r.json())
  //     .then(setAnim)
  //     .catch(()=>{});
  // }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        {/* Animated logo */}
        <div className="hero__logo" aria-hidden="true" style={{ width: 120, height: 120 }}>
          <Lottie
            lottieRef={lottieRef}
            animationData={meditatingBrain /* or anim if using fetch */}
            autoplay={!prefersReducedMotion}
            loop={!prefersReducedMotion}
            style={{ width: 120, height: 120 }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }}
          />
        </div>

        <div className="hero__text">
          <h1 id="hero-title" className="hero__title">FocusFlow</h1>
          <p className="hero__subtitle">
            Create immersive soundscapes for study, sleep, and deep focus.
          </p>
          <div className="hero__cta">
            <button className="btn" onClick={onStart}>Start mixing</button>
            <a className="btn ghost" href="#mixer">Browse sounds</a>
          </div>
        </div>
      </div>
    </section>
  );
}
