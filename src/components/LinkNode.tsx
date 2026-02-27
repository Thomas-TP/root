'use client';

import { motion } from 'framer-motion';
import { iconMap, ExternalLinkIcon, DownloadIcon } from './Icons';
import type { LinkItem } from '@/data/links';
import type { Translations } from '@/i18n/translations';

interface LinkNodeProps {
  link: LinkItem;
  t: Translations;
  index: number;
  variant?: 'orbit' | 'card';
}

export default function LinkNode({ link, t, index, variant = 'orbit' }: LinkNodeProps) {
  const Icon = iconMap[link.icon];
  const linkData = t.links[link.id as keyof typeof t.links];
  const label = linkData.label;
  const desc = linkData.desc;

  if (variant === 'orbit') {
    return (
      <motion.a
        href={link.url}
        target={link.isDownload ? '_self' : '_blank'}
        rel={link.isDownload ? undefined : 'noopener noreferrer'}
        download={link.isDownload || undefined}
        className="group relative flex flex-col items-center gap-2.5 cursor-pointer"
        whileHover={{ scale: 1.18 }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Glow ring on hover */}
        <div className="absolute -inset-4 rounded-full bg-zinc-200 dark:bg-zinc-800 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Node circle */}
        <div className="relative p-[1.5px] rounded-2xl bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-all duration-500">
          <div className="relative p-4 rounded-2xl bg-white dark:bg-black backdrop-blur-xl">
            <Icon className="w-7 h-7 text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-300" />
            {/* Shimmer overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-zinc-100 dark:via-zinc-800 to-transparent animate-shimmer pointer-events-none" />
          </div>
        </div>

        {/* Label */}
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors whitespace-nowrap font-heading">
          {label}
        </span>
      </motion.a>
    );
  }

  // ─── Card variant (mobile) ───
  return (
    <motion.a
      href={link.url}
      target={link.isDownload ? '_self' : '_blank'}
      rel={link.isDownload ? undefined : 'noopener noreferrer'}
      download={link.isDownload || undefined}
      className="group relative block"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Gradient border wrapper */}
      <div className="p-[1px] rounded-2xl bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-all duration-500">
        <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-black overflow-hidden">
          {/* Icon */}
          <div className="flex-shrink-0 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300">
            <Icon className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-black dark:text-white font-heading">
              {label}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate font-body">
              {desc}
            </div>
          </div>

          {/* Arrow */}
          {link.isDownload ? (
            <DownloadIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0" />
          ) : (
            <ExternalLinkIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0" />
          )}

          {/* Shimmer */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-zinc-50 dark:via-zinc-800 to-transparent animate-shimmer pointer-events-none" />
        </div>
      </div>
    </motion.a>
  );
}
