import React, { useEffect, useRef } from 'react';

export default function AmbientDecor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    let w = 0, h = 0;
    let P: { x:number; y:number; vx:number; vy:number; }[] = [];
    const cfg = { count: 36, speed: 0.06, link: 140 };

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) cfg.count = 20;

    const resize = () => {
      const rect = document.documentElement.getBoundingClientRect();
      w = Math.floor(rect.width * dpr);
      h = Math.floor(rect.height * dpr);
      canvas.width = w; canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      P = Array.from({ length: cfg.count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.speed * dpr,
        vy: (Math.random() - 0.5) * cfg.speed * dpr
      }));
    };

    const step = () => {
      if (!runningRef.current) return;
      const s = getComputedStyle(document.documentElement);
      const dot = s.getPropertyValue('--mesh-dot').trim();
      const ln = s.getPropertyValue('--mesh-line').trim();
      const fade = s.getPropertyValue('--mesh-fade').trim();

      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);

      for (const p of P) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }

      ctx.lineWidth = dpr;
      ctx.strokeStyle = ln;
      const thresh2 = Math.pow(cfg.link * dpr, 2);
      for (let i=0; i<P.length; i++){
        const a = P[i];
        for (let j=i+1; j<P.length; j++){
          const b = P[j];
          const dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
          if (d2 < thresh2) {
            ctx.globalAlpha = (1 - d2/thresh2) * 0.35;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = dot;
      for (const p of P){ ctx.beginPath(); ctx.arc(p.x, p.y, 1.3*dpr, 0, Math.PI*2); ctx.fill(); }

      rafRef.current = requestAnimationFrame(step);
    };

    const onVis = () => {
      runningRef.current = document.visibilityState === 'visible';
      if (runningRef.current && rafRef.current === null) rafRef.current = requestAnimationFrame(step);
    };

    resize();
    ctx.fillStyle = 'transparent'; ctx.fillRect(0,0,w,h);
    rafRef.current = requestAnimationFrame(step);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas className="ambient-mesh" ref={canvasRef} aria-hidden="true" />;
}
