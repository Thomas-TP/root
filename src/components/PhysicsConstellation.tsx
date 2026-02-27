'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { iconMap } from './Icons';
import GitHubStats from './GitHubStats';
import { MapPinIcon } from './Icons';
import { links } from '@/data/links';
import type { Translations, Locale } from '@/i18n/translations';

/* ───────────────────── Types ───────────────────── */

interface Vec2 {
  x: number;
  y: number;
}

interface NodeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging: boolean;
  hovered: boolean;
  settled: boolean;
  entryDelay: number;
  floatPhase: number;
  glowWidth: number;
  glowOpacity: number;
}

interface Pulse {
  t: number;
  speed: number;
}

/* ───────────────────── Constants ───────────────────── */

const NODE_RADIUS = 42;
const CENTER_RADIUS = 100;
const EDGE_PADDING = 45;
const BOUNCE = 0.5;
const COLLISION_PUSH = 0.35;

/* ───────────────────── Helpers ───────────────────── */

function bezierPoint(t: number, p0: Vec2, cp: Vec2, p2: Vec2): Vec2 {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * cp.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * cp.y + t * t * p2.y,
  };
}

function cableControl(start: Vec2, end: Vec2): Vec2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = -(dy / (dist || 1));
  const ny = dx / (dist || 1);
  const curve = Math.min(dist * 0.06, 18);
  const sag = Math.min(dist * 0.04, 14) + 4;
  return {
    x: (start.x + end.x) / 2 + nx * curve,
    y: (start.y + end.y) / 2 + sag,
  };
}

function cablePath(start: Vec2, end: Vec2): string {
  const cp = cableControl(start, end);
  return `M ${start.x} ${start.y} Q ${cp.x} ${cp.y} ${end.x} ${end.y}`;
}

/* ───────────────────── Component ───────────────────── */

interface Props {
  t: Translations;
  locale: Locale;
}

export default function PhysicsConstellation({ t, locale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeElemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cableMainRef = useRef<(SVGPathElement | null)[]>([]);
  const cableGlowRef = useRef<(SVGPathElement | null)[]>([]);
  const pulseElemsRef = useRef<(SVGCircleElement | null)[][]>([]);

  const profileRef = useRef<HTMLDivElement>(null);

  const nodesRef = useRef<NodeState[]>([]);
  const pulsesRef = useRef<Pulse[][]>([]);
  const centerRef = useRef<Vec2>({ x: 0, y: 0 });
  const boundsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const targetsRef = useRef<Vec2[]>([]);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(0);

  const dragIdxRef = useRef(-1);
  const lastPointerRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastPointerTimeRef = useRef(0);
  const dragDistRef = useRef(0);

  const [ready, setReady] = useState(false);

  /* ────── Initialise layout ────── */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // Skip if hidden

      // Measure center from profile image if available, else fallback to container center
      const profileEl = profileRef.current;
      let cx: number;
      let cy: number;
      if (profileEl && profileEl.getBoundingClientRect().width > 0) {
        const pRect = profileEl.getBoundingClientRect();
        cx = pRect.left - rect.left + pRect.width / 2;
        cy = pRect.top - rect.top + pRect.height / 2;
      } else {
        cx = rect.width / 2;
        cy = rect.height / 2;
      }

      const oldCenter = centerRef.current;
      const isFirst = boundsRef.current.w === 0;

      const shift = {
        x: isFirst ? 0 : cx - oldCenter.x,
        y: isFirst ? 0 : cy - oldCenter.y
      };

      centerRef.current = { x: cx, y: cy };
      boundsRef.current = { w: rect.width, h: rect.height };

      let radius = Math.min(rect.width, rect.height) * 0.38;
      // Prevent links from having to squeeze too much by guaranteeing a minimum radius based on count
      const minRadius = (links.length * NODE_RADIUS * 2.2) / (2 * Math.PI);
      radius = Math.max(radius, minRadius);

      targetsRef.current = links.map((_, i) => {
        const angle = (i / links.length) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
      });

      if (nodesRef.current.length > 0) {
        nodesRef.current.forEach((n) => {
          n.x += shift.x;
          n.y += shift.y;
          // When resizing, flag as not settled so they organically float to new position
          n.settled = false;
        });
      } else {
        nodesRef.current = links.map((_, i) => ({
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + (Math.random() - 0.5) * 10,
          vx: 0,
          vy: 0,
          isDragging: false,
          hovered: false,
          settled: false,
          entryDelay: i * 10,
          floatPhase: Math.random() * Math.PI * 2,
          glowWidth: 6,
          glowOpacity: 0.12,
        }));
        pulsesRef.current = links.map(() =>
          Array.from({ length: 3 }, (_, j) => ({
            t: j / 3,
            speed: 0.0025 + Math.random() * 0.0015,
          })),
        );
        nodeElemsRef.current = new Array(links.length).fill(null);
        cableMainRef.current = new Array(links.length).fill(null);
        cableGlowRef.current = new Array(links.length).fill(null);
        pulseElemsRef.current = links.map(() => new Array(3).fill(null));
        setReady(true);
      }
    };

    const resizeObserver = new ResizeObserver(() => compute());
    resizeObserver.observe(el);

    compute();
    const timer = setTimeout(compute, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);

  /* ────── Physics + render loop ────── */

  useEffect(() => {
    if (!ready) return;

    lastFrameRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastFrameRef.current) / 16.67, 3);
      lastFrameRef.current = now;
      const targets = targetsRef.current;
      const { w, h } = boundsRef.current;

      // Measure cable anchor from actual profile image position every frame
      const containerEl = containerRef.current;
      const profileEl = profileRef.current;
      let center = centerRef.current;
      if (containerEl && profileEl) {
        const cRect = containerEl.getBoundingClientRect();
        const pRect = profileEl.getBoundingClientRect();
        center = {
          x: pRect.left - cRect.left + pRect.width / 2,
          y: pRect.top - cRect.top + pRect.height / 2,
        };
        centerRef.current = center;
      }

      /* ── Step 1: movement ── */
      for (let i = 0; i < nodesRef.current.length; i++) {
        const n = nodesRef.current[i];

        if (n.isDragging) {
          // position set by pointer handler
        } else if (!n.settled) {
          if (n.entryDelay > 0) {
            n.entryDelay -= dt;
          } else {
            const dx = targets[i].x - n.x;
            const dy = targets[i].y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            n.vx += dx * 0.045 * dt;
            n.vy += dy * 0.045 * dt;
            n.vx *= 0.87;
            n.vy *= 0.87;
            n.x += n.vx * dt;
            n.y += n.vy * dt;

            if (dist < 1.5 && Math.abs(n.vx) < 0.08 && Math.abs(n.vy) < 0.08) {
              n.settled = true;
              n.x = targets[i].x;
              n.y = targets[i].y;
              n.vx = 0;
              n.vy = 0;
            }
          }
        } else {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.vx *= 0.988;
          n.vy *= 0.988;
          if (Math.abs(n.vx) < 0.005) n.vx = 0;
          if (Math.abs(n.vy) < 0.005) n.vy = 0;
        }
      }

      /* ── Step 2: collisions between link nodes ── */
      for (let i = 0; i < nodesRef.current.length; i++) {
        const a = nodesRef.current[i];
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const b = nodesRef.current[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = NODE_RADIUS * 2;

          if (dist < minDist) {
            // Apply a micro jitter if they are exactly perfectly overlapped
            if (dist < 0.01) {
              const angle = Math.random() * Math.PI * 2;
              dx = Math.cos(angle) * 0.1;
              dy = Math.sin(angle) * 0.1;
              dist = 0.1;
            }

            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            if (!a.isDragging) {
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
            }
            if (!b.isDragging) {
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;
            }

            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const dot = dvx * nx + dvy * ny;

            if (dot > 0) {
              const impulse = dot * BOUNCE;
              if (!a.isDragging) {
                a.vx -= impulse * nx + nx * COLLISION_PUSH;
                a.vy -= impulse * ny + ny * COLLISION_PUSH;
              }
              if (!b.isDragging) {
                b.vx += impulse * nx + nx * COLLISION_PUSH;
                b.vy += impulse * ny + ny * COLLISION_PUSH;
              }
            }
          }
        }
      }

      /* ── Step 3: soft push-out from center profile (no bounce) ── */
      for (let i = 0; i < nodesRef.current.length; i++) {
        const n = nodesRef.current[i];
        let dx = n.x - center.x;
        let dy = n.y - center.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = NODE_RADIUS + CENTER_RADIUS;

        if (dist < minDist) {
          if (dist < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            dx = Math.cos(angle) * 0.1;
            dy = Math.sin(angle) * 0.1;
            dist = 0.1;
          }

          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Gently slide out — no velocity change, just reposition
          n.x += nx * overlap * 0.15 * dt;
          n.y += ny * overlap * 0.15 * dt;
        }
      }

      /* ── Step 4: boundary clamping (bounce off edges) ── */
      for (let i = 0; i < nodesRef.current.length; i++) {
        const n = nodesRef.current[i];

        if (n.x < EDGE_PADDING) {
          n.x = EDGE_PADDING;
          if (n.vx < 0) n.vx *= -BOUNCE;
        } else if (n.x > w - EDGE_PADDING) {
          n.x = w - EDGE_PADDING;
          if (n.vx > 0) n.vx *= -BOUNCE;
        }

        if (n.y < EDGE_PADDING) {
          n.y = EDGE_PADDING;
          if (n.vy < 0) n.vy *= -BOUNCE;
        } else if (n.y > h - EDGE_PADDING) {
          n.y = h - EDGE_PADDING;
          if (n.vy > 0) n.vy *= -BOUNCE;
        }
      }

      /* ── Step 5: render to DOM ── */
      for (let i = 0; i < nodesRef.current.length; i++) {
        const n = nodesRef.current[i];

        if (!n.isDragging) n.floatPhase += 0.012 * dt;
        const wX = n.isDragging ? 0 : Math.sin(n.floatPhase) * 2.5;
        const wY = n.isDragging ? 0 : Math.cos(n.floatPhase * 0.73) * 1.8;
        const visX = n.x + wX;
        const visY = n.y + wY;

        const tgtGW = n.isDragging ? 16 : n.hovered ? 11 : 6;
        const tgtGO = n.isDragging ? 0.4 : n.hovered ? 0.25 : 0.12;
        n.glowWidth += (tgtGW - n.glowWidth) * 0.12 * dt;
        n.glowOpacity += (tgtGO - n.glowOpacity) * 0.12 * dt;

        const elem = nodeElemsRef.current[i];
        if (elem) {
          elem.style.transform = `translate(${visX}px, ${visY}px) translate(-50%, -50%)`;
          if (n.entryDelay <= 0) {
            elem.style.opacity = '1';
            elem.style.scale = '1';
          }
        }

        const vis: Vec2 = { x: visX, y: visY };
        const d = cablePath(center, vis);
        const mainPath = cableMainRef.current[i];
        const glowPath = cableGlowRef.current[i];
        if (mainPath) {
          mainPath.setAttribute('d', d);
          mainPath.style.opacity = n.entryDelay <= 0 ? '1' : '0';
        }
        if (glowPath) {
          glowPath.setAttribute('d', d);
          glowPath.setAttribute('stroke-width', String(n.glowWidth));
          glowPath.style.opacity = n.entryDelay <= 0 ? String(n.glowOpacity) : '0';
        }

        const cp = cableControl(center, vis);
        const pulses = pulsesRef.current[i];
        if (pulses) {
          for (let j = 0; j < pulses.length; j++) {
            const p = pulses[j];
            p.t = (p.t + p.speed * dt) % 1;
            const pt = bezierPoint(p.t, center, cp, vis);
            const fade = p.t < 0.12 ? p.t / 0.12 : p.t > 0.88 ? (1 - p.t) / 0.12 : 1;
            const c = pulseElemsRef.current[i]?.[j];
            if (c) {
              c.setAttribute('cx', String(pt.x));
              c.setAttribute('cy', String(pt.y));
              c.style.opacity = n.entryDelay <= 0 ? String(fade * 0.75) : '0';
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const tm = setTimeout(() => {
      rafRef.current = requestAnimationFrame(loop);
    }, 200);

    return () => {
      clearTimeout(tm);
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  /* ────── Drag handlers ────── */

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragIdxRef.current = idx;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      lastPointerTimeRef.current = performance.now();
      dragDistRef.current = 0;
      const n = nodesRef.current[idx];
      n.isDragging = true;
      n.vx = 0;
      n.vy = 0;
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const idx = dragIdxRef.current;
      if (idx < 0) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      const now = performance.now();
      const dtMs = now - lastPointerTimeRef.current;
      const { w, h } = boundsRef.current;

      const n = nodesRef.current[idx];
      n.x = Math.max(EDGE_PADDING, Math.min(w - EDGE_PADDING, n.x + dx));
      n.y = Math.max(EDGE_PADDING, Math.min(h - EDGE_PADDING, n.y + dy));

      if (dtMs > 0) {
        const scale = 16.67 / dtMs;
        n.vx = dx * scale * 0.55;
        n.vy = dy * scale * 0.55;
      }

      dragDistRef.current += Math.sqrt(dx * dx + dy * dy);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      lastPointerTimeRef.current = now;
    };

    const onUp = () => {
      const idx = dragIdxRef.current;
      if (idx < 0) return;
      nodesRef.current[idx].isDragging = false;
      dragIdxRef.current = -1;

      if (dragDistRef.current < 8) {
        const link = links[idx];
        if (link.isDownload) {
          const a = document.createElement('a');
          a.href = link.url;
          a.download = '';
          a.click();
        } else if (link.url.startsWith('mailto:')) {
          window.location.href = link.url;
        } else {
          window.open(link.url, '_blank', 'noopener,noreferrer');
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handleDoubleClick = useCallback((idx: number) => {
    const n = nodesRef.current[idx];
    n.settled = false;
    n.vx = 0;
    n.vy = 0;
  }, []);

  const handlePointerEnter = useCallback((idx: number) => {
    if (dragIdxRef.current >= 0) return;
    nodesRef.current[idx].hovered = true;
  }, []);

  const handlePointerLeave = useCallback((idx: number) => {
    nodesRef.current[idx].hovered = false;
  }, []);

  /* ───────────────────── Render ───────────────────── */

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-zinc-300/[0.07] dark:bg-zinc-800/[0.07] dark:bg-zinc-300/[0.04] dark:bg-zinc-800/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-400/[0.07] dark:bg-zinc-700/[0.07] dark:bg-zinc-400/[0.04] dark:bg-zinc-700/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* ── SVG cable layer ── */}
      {ready && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-purple)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
            <linearGradient id="cgg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-purple)" />
              <stop offset="100%" stopColor="var(--color-accent-cyan)" />
            </linearGradient>
            <radialGradient id="pg">
              <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-accent-purple)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {links.map((_, i) => (
            <g key={i}>
              <path
                ref={(el) => { cableGlowRef.current[i] = el; }}
                fill="none"
                stroke="url(#cgg)"
                strokeWidth="6"
                strokeLinecap="round"
                style={{ opacity: 0, transition: 'none' }}
              />
              <path
                ref={(el) => { cableMainRef.current[i] = el; }}
                fill="none"
                stroke="url(#cg)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
              {[0, 1, 2].map((j) => (
                <circle
                  key={j}
                  ref={(el) => {
                    if (!pulseElemsRef.current[i]) pulseElemsRef.current[i] = [];
                    pulseElemsRef.current[i][j] = el;
                  }}
                  r="2.5"
                  fill="url(#pg)"
                  style={{ opacity: 0 }}
                />
              ))}
            </g>
          ))}
        </svg>
      )}

      {/* ── Center profile — image at true center, text below ── */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Positioning wrapper: top-1/2 + left-1/2 places the top-left at center,
            -translate-x-1/2 centers horizontally, -translate-y-[72px] shifts up
            by exactly half the image height so the image center = viewport center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[72px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: 'spring', stiffness: 80, damping: 14 }}
            className="flex flex-col items-center"
          >
            {/* Image — center of this div = viewport center */}
            <div ref={profileRef} className="relative">
              <div className="absolute inset-[-12px] bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-800 dark:to-zinc-700 rounded-full blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-white/20 dark:border-white/10 shadow-2xl bg-white/20 dark:bg-white/5 backdrop-blur-md">
                <Image
                  src={`${process.env.NODE_ENV === 'production' ? '/links' : ''}/memoji-nobg.webp`}
                  alt="Thomas Prud'homme"
                  width={144}
                  height={144}
                  className="object-cover w-full h-full drop-shadow-md"
                  priority
                  fetchPriority="high"
                />
              </div>
            </div>
            {/* Text flows below without shifting image upward */}
            <div className="text-center mt-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
                {t.title}
              </h1>
              <p className="text-base text-gray-600 dark:text-white/60 mt-1.5 font-body">
                {t.subtitle}
              </p>
              <p className="text-sm text-gray-500 dark:text-white/40 font-body">
                {t.subtitleDetail}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Draggable link nodes ── */}
      {ready &&
        links.map((link, i) => {
          const Icon = iconMap[link.icon];
          const linkData = t.links[link.id as keyof typeof t.links];
          return (
            <div
              key={link.id}
              ref={(el) => { nodeElemsRef.current[i] = el; }}
              className="absolute top-0 left-0 z-30 cursor-grab active:cursor-grabbing"
              style={{
                touchAction: 'none',
                willChange: 'transform',
                opacity: 0,
                scale: '0',
                transition: 'opacity 0.4s ease, scale 0.5s cubic-bezier(.34,1.56,.64,1)',
              }}
              onPointerDown={(e) => handleNodePointerDown(e, i)}
              onPointerEnter={() => handlePointerEnter(i)}
              onPointerLeave={() => handlePointerLeave(i)}
              onDoubleClick={() => handleDoubleClick(i)}
            >
              <div className="group relative flex flex-col items-center gap-3">
                <div className="absolute -inset-5 rounded-full bg-gradient-to-br from-zinc-300/20 to-zinc-400/20 dark:from-zinc-800/20 dark:to-zinc-700/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="p-[1.5px] rounded-2xl bg-gradient-to-br from-zinc-300/40 to-zinc-400/40 dark:from-zinc-800/40 dark:to-zinc-700/40 group-hover:from-zinc-400/80 group-hover:to-zinc-500/80 dark:group-hover:from-zinc-700/80 dark:group-hover:to-zinc-600/80 transition-all duration-400">
                  <div className="relative p-5 rounded-2xl bg-white/90 dark:bg-white/[0.07] backdrop-blur-xl shadow-lg">
                    <Icon className="w-9 h-9 text-gray-700 dark:text-white/90 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-accent-cyan transition-colors duration-300 pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-600 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-white/70 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-accent-cyan transition-colors whitespace-nowrap font-heading pointer-events-none select-none">
                  {linkData.label}
                </span>
              </div>
            </div>
          );
        })}

      {/* ── Badges ── */}
      <motion.div
        className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-gray-200/60 dark:border-white/10 z-20"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <MapPinIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        <span className="text-sm text-gray-700 dark:text-white/70 font-body">
          {t.location}
        </span>
      </motion.div>

      <motion.div
        className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-gray-200/60 dark:border-white/10 z-20"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm text-gray-700 dark:text-white/70 font-body">
          {t.available}
        </span>
      </motion.div>

      <motion.div
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        <GitHubStats t={t} />
      </motion.div>
    </div>
  );
}
