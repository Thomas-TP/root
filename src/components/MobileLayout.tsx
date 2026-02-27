'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import LinkNode from './LinkNode';
import GitHubStats from './GitHubStats';
import { MapPinIcon } from './Icons';
import { links } from '@/data/links';
import type { Translations, Locale } from '@/i18n/translations';

interface MobileLayoutProps {
  t: Translations;
  locale: Locale;
}

export default function MobileLayout({ t, locale }: MobileLayoutProps) {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-12 gap-8">
      {/* Ambient gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-zinc-300/15 dark:bg-zinc-800/15 dark:bg-zinc-300/10 dark:bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-zinc-400/15 dark:bg-zinc-700/15 dark:bg-zinc-400/10 dark:bg-zinc-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Profile header ── */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Memoji */}
        <div className="relative">
          <div className="absolute inset-[-6px] bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-800 dark:to-zinc-700 rounded-full blur-2xl opacity-30 animate-pulse-glow" />
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 dark:border-white/10 shadow-2xl bg-white/20 dark:bg-white/5 backdrop-blur-md">
            <Image
              src={`${process.env.NODE_ENV === 'production' ? '/links' : ''}/memoji-nobg.webp`}
              alt="Thomas Prud'homme"
              width={112}
              height={112}
              className="object-cover w-full h-full drop-shadow-md"
              priority
              fetchPriority="high"
            />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
            {t.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/60 mt-1.5 font-body">
            {t.subtitle}
          </p>
          <p className="text-xs text-gray-500 dark:text-white/40 font-body">
            {t.subtitleDetail}
          </p>
        </div>

        {/* Location + availability badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-gray-200/60 dark:border-white/10">
            <MapPinIcon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs text-gray-600 dark:text-white/60 font-body">
              {t.location}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-gray-200/60 dark:border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-600 dark:text-white/60 font-body">
              {t.available}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Link cards ── */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {links.map((link, i) => (
          <LinkNode key={link.id} link={link} t={t} index={i} variant="card" />
        ))}
      </div>

      {/* ── GitHub stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <GitHubStats t={t} />
      </motion.div>

      {/* ── Footer spacer ── */}
      <div className="h-4" />
    </div>
  );
}
