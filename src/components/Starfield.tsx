'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const isDarkRef = useRef(true);

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 3500);
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.3,
      baseOpacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    isDarkRef.current = darkQuery.matches;
    const handleThemeChange = (e: MediaQueryListEvent) => {
      isDarkRef.current = e.matches;
    };
    darkQuery.addEventListener('change', handleThemeChange);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };

    const spawnShootingStar = () => {
      if (shootingStarsRef.current.length >= 2) return;
      shootingStarsRef.current.push({
        x: Math.random() * canvas.width * 0.7,
        y: Math.random() * canvas.height * 0.3,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 4 + 3,
        angle: Math.PI / 4 + (Math.random() * 0.3 - 0.15),
        opacity: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    };

    const shootingInterval = setInterval(() => {
      if (Math.random() < 0.35) spawnShootingStar();
    }, 4000);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = isDarkRef.current;

      // Draw stars
      for (const star of starsRef.current) {
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.65;
        const alpha = star.baseOpacity * twinkle;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(100, 70, 180, ${alpha * 0.25})`;
        }
        ctx.fill();

        // Glow for larger stars
        if (star.size > 1.8) {
          const g = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 5,
          );
          if (isDark) {
            g.addColorStop(0, `rgba(124, 58, 237, ${alpha * 0.25})`);
            g.addColorStop(0.5, `rgba(6, 182, 212, ${alpha * 0.1})`);
            g.addColorStop(1, 'transparent');
          } else {
            g.addColorStop(0, `rgba(124, 58, 237, ${alpha * 0.12})`);
            g.addColorStop(1, 'transparent');
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity = 1 - ss.life / ss.maxLife;

        if (ss.life >= ss.maxLife) return false;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        gradient.addColorStop(0, 'transparent');
        if (isDark) {
          gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity * 0.8})`);
        } else {
          gradient.addColorStop(1, `rgba(124, 58, 237, ${ss.opacity * 0.5})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      clearInterval(shootingInterval);
      darkQuery.removeEventListener('change', handleThemeChange);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
