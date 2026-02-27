'use client';

import { useState, useEffect } from 'react';
import { translations, type Locale, type Translations } from './translations';

export function useLocale(): { locale: Locale; t: Translations } {
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en')) {
      setLocale('en');
    }
    // Update html lang attribute
    document.documentElement.lang = lang.startsWith('en') ? 'en' : 'fr';
  }, []);

  return { locale, t: translations[locale] };
}
