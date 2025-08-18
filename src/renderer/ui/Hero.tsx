import React, { useEffect, useMemo, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// NOTE: path is from src/renderer/ui/Hero.tsx -> project root /assets/icons/…
import meditatingBrain from '../../../assets/icons/Meditating Brain.json';

type Props = { onStart: () => void };

export default function Hero({ onStart }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Respect reduced-motion
  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    []
  );

  // Optionally slow/speed animation by theme (reads <html data-theme="...">)
  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    const speed =
      theme === 'dark-soft' ? 0.8 :
      theme === 'light-warm' ? 0.9 :
      1;
    try { lottieRef.current?.setSpeed(speed); } catch {}
  }, []);

  // If you cannot enable `resolveJsonModule`, you can instead fetch the JSON:
  // const [anim, setAnim] = React.useState<any>(null);
  // useEffect(() => {
  //   fetch(new URL('../../../assets/icons/Meditating Brain.json', import.meta.url))
  //     .then(r => r.json()).then(setAnim).catch(()=>{});
  // }, []);
  // …then pass `animationData={anim}` below.

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        {/* Animated logo */}
        <div className="hero__logo" aria-hidden="true" style={{ width: 120, height: 120 }}>
          <Lottie
            lottieRef={lottieRef}
            animationData={meditatingBrain}
            autoplay={!prefersReducedMotion}
            loop={!prefersReducedMotion}
            style={{ width: 120, height: 120 }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true }}
          />
        </div>

        <div className="hero__text">
          <h1 id="hero-title" className="hero__title">FocusFlow</h1>
          <p className="hero__subtitle">Create immersive soundscapes for study, sleep, and deep focus.</p>
          <div className="hero__cta">
            <button className="btn" onClick={onStart}>Start mixing</button>
            <a className="btn ghost" href="#mixer">Browse sounds</a>
          </div>
        </div>
      </div>
    </section>
  );
}
