import React, { useEffect, useRef } from 'react';

interface InteractiveParticlesProps {
  lightMode?: boolean;
  density?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  alpha: number;
  phase: number;
  tint: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

const DARK_TINTS = ['255, 255, 255', '198, 170, 254', '147, 197, 253', '96, 165, 250'];
const LIGHT_TINTS = ['30, 58, 138', '37, 99, 235', '79, 70, 229', '15, 23, 42'];

/**
 * Lightweight interactive Canvas 2D constellation particle layer designed to sit
 * cleanly above WebGL gradient shaders without capturing pointer events from UI controls.
 */
export const InteractiveParticles: React.FC<InteractiveParticlesProps> = ({
  lightMode = false,
  density = 68,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightModeRef = useRef(lightMode);
  lightModeRef.current = lightMode;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let rafId = 0;
    let visible = true;

    const pointer = { x: -9999, y: -9999, active: false };
    const ripples: Ripple[] = [];
    let particles: Particle[] = [];

    const createParticles = () => {
      const areaFactor = Math.min(1.25, Math.max(0.55, (width * height) / (1440 * 900)));
      const count = Math.round(density * areaFactor);
      const palette = lightModeRef.current ? LIGHT_TINTS : DARK_TINTS;

      particles = Array.from({ length: count }, (_, idx) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.16 + Math.random() * 0.34;
        const baseVx = Math.cos(angle) * speed;
        const baseVy = Math.sin(angle) * speed;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: baseVx,
          vy: baseVy,
          baseVx,
          baseVy,
          radius: 1.1 + Math.random() * 1.9,
          alpha: 0.28 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          tint: palette[idx % palette.length],
        };
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = Math.max(1, parent.clientWidth);
      height = Math.max(1, parent.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        createParticles();
      } else {
        for (const p of particles) {
          p.x = Math.min(width, Math.max(0, p.x));
          p.y = Math.min(height, Math.max(0, p.y));
        }
      }
    };

    const renderFrame = (timeMs: number) => {
      rafId = 0;
      if (!visible || document.hidden) return;

      const isLight = lightModeRef.current;
      const palette = isLight ? LIGHT_TINTS : DARK_TINTS;
      const lineTint = isLight ? '37, 99, 235' : '198, 170, 254';
      const cursorLineTint = isLight ? '29, 78, 216' : '224, 231, 255';
      const interactionRadius = 150;
      const linkDistance = 120;

      ctx.clearRect(0, 0, width, height);

      // Update & draw click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 5.2;
        rip.alpha *= 0.94;
        if (rip.alpha < 0.015) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cursorLineTint}, ${rip.alpha * 0.45})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      // Update particles & draw subtle constellations
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.tint = palette[i % palette.length];

        if (!reduceMotion) {
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > 0.01 && distSq < interactionRadius * interactionRadius) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / interactionRadius) * 0.65;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          // Smooth damping back to gentle ambient drift
          p.vx += (p.baseVx - p.vx) * 0.035;
          p.vy += (p.baseVy - p.vy) * 0.035;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -12) p.x = width + 12;
          else if (p.x > width + 12) p.x = -12;
          if (p.y < -12) p.y = height + 12;
          else if (p.y > height + 12) p.y = -12;
        }

        // Draw particle links to nearby neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkDistance * linkDistance) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / linkDistance) * (isLight ? 0.16 : 0.22);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${lineTint}, ${opacity})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }

        // Draw interactive link to pointer
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < interactionRadius * interactionRadius) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / interactionRadius) * (isLight ? 0.28 : 0.42);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(${cursorLineTint}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        const twinkle = 0.72 + 0.28 * Math.sin(timeMs * 0.0016 + p.phase);
        const finalAlpha = p.alpha * twinkle * (isLight ? 0.65 : 0.92);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.tint}, ${finalAlpha})`;
        ctx.fill();
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const scheduleFrame = () => {
      if (!rafId && visible && !document.hidden) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer.active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      pointer.x = x;
      pointer.y = y;
      scheduleFrame();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduceMotion) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

      ripples.push({ x, y, radius: 6, alpha: 0.75 });
      if (ripples.length > 5) ripples.shift();

      // Radial impulse push on nearby particles
      for (const p of particles) {
        const dx = p.x - x;
        const dy = p.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist < 210) {
          const impulse = (1 - dist / 210) * 3.2;
          p.vx += (dx / dist) * impulse;
          p.vy += (dy / dist) * impulse;
        }
      }
      scheduleFrame();
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onVisibilityChange = () => {
      if (!document.hidden) scheduleFrame();
    };

    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) scheduleFrame();
    });
    intersectionObserver.observe(canvas);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    resize();
    scheduleFrame();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};

export default InteractiveParticles;
