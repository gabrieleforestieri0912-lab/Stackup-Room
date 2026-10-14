'use client';

import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  amp: number;
  phase: number;
  speed: number;
  color: string;
};

type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

// Cielo notturno stellato per la Room: canvas fixed, economico
// (stelle con twinkle + meteora occasionale, fermo se reduced-motion o tab nascosta).
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteor = performance.now() + 4000 + Math.random() * 6000;
    let w = 0;
    let h = 0;
    let running = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(60, Math.min(240, Math.round((w * h) / 8500)));
      const count = w < 640 ? Math.round(target * 0.6) : target;
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + Math.random() * 1.2,
          base: 0.25 + Math.random() * 0.45,
          amp: 0.1 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.4,
          color: roll < 0.72 ? '232,244,255' : roll < 0.9 ? '143,240,222' : '255,217,160',
        };
      });
    };

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 0 : Math.sin(t * s.speed + s.phase) * s.amp;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color},${Math.min(1, s.base + tw).toFixed(3)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Meteora occasionale (solo desktop, no reduced-motion)
      if (!reduced && w >= 640) {
        if (!meteor && now >= nextMeteor) {
          const sx = w * (0.3 + Math.random() * 0.7);
          meteor = { x: sx, y: -20, vx: -(5 + Math.random() * 4), vy: 3 + Math.random() * 2, life: 0, max: 50 + Math.random() * 30 };
          nextMeteor = now + 6000 + Math.random() * 9000;
        }
        if (meteor) {
          meteor.life += 1;
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          const k = 1 - meteor.life / meteor.max;
          if (k <= 0 || meteor.x < -200 || meteor.y > h + 200) {
            meteor = null;
          } else {
            const tx = meteor.x - meteor.vx * 14;
            const ty = meteor.y - meteor.vy * 14;
            const g = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
            g.addColorStop(0, `rgba(143,240,222,${(0.9 * k).toFixed(3)})`);
            g.addColorStop(1, 'rgba(143,240,222,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }
        }
      }
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      build();
      if (reduced) draw(performance.now());
    };
    const onVis = () => {
      running = !document.hidden;
      if (running && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };

    build();
    if (reduced) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0" />;
}
