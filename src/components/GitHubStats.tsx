'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitHubIcon } from './Icons';
import type { Translations } from '@/i18n/translations';

interface GitHubData {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
}

export default function GitHubStats({ t }: { t: Translations }) {
  const [data, setData] = useState<GitHubData | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/users/Thomas-TP')
      .then((res) => res.json())
      .then((json) => {
        if (json && typeof json.public_repos === 'number') {
          setData({
            login: json.login,
            name: json.name || json.login,
            avatar_url: json.avatar_url,
            html_url: json.html_url,
            public_repos: json.public_repos,
            public_gists: json.public_gists,
            followers: json.followers,
            following: json.following
          });
        }
      })
      .catch(() => null);
  }, []);

  if (!data) return null;

  return (
    <motion.a
      href={data.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-[1px] rounded-2xl bg-gradient-to-br from-zinc-300/30 to-zinc-400/30 dark:from-zinc-800/30 dark:to-zinc-700/30 hover:from-zinc-400/60 hover:to-zinc-500/60 dark:hover:from-zinc-700/60 dark:hover:to-zinc-600/60 transition-colors duration-300 text-left outline-none cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/90 dark:bg-white/[0.06] backdrop-blur-xl hover:bg-white/95 dark:hover:bg-white/[0.09] transition-colors">
        <GitHubIcon className="w-5 h-5 text-gray-700 dark:text-white/70 flex-shrink-0" />
        <div className="flex gap-5">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white font-heading leading-tight">
              {data.public_repos}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-white/50 font-body">
              {t.githubStats.repos}
            </div>
          </div>
          <div className="w-px bg-gray-200 dark:bg-white/10 self-stretch" />
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white font-heading leading-tight">
              {data.followers}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-white/50 font-body">
              {t.githubStats.followers}
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
