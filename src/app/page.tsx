'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/i18n/useLocale';
import Starfield from '@/components/Starfield';
import PhysicsConstellation from '@/components/PhysicsConstellation';
import MobileLayout from '@/components/MobileLayout';

export default function Home() {
  const { t, locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main className="min-h-screen bg-zinc-50 dark:bg-black" />;
  }

  return (
    <AnimatePresence>
      <motion.main
        className="relative min-h-screen bg-zinc-50 dark:bg-black overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Starfield />

        {/* Desktop: physics constellation */}
        <div className="hidden md:block">
          <PhysicsConstellation t={t} locale={locale} />
        </div>

        {/* Mobile: card layout */}
        <div className="md:hidden">
          <MobileLayout t={t} locale={locale} />
        </div>
      </motion.main>
    </AnimatePresence>
  );
}
