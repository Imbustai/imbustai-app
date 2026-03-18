'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en.json';
import it from './it.json';

type Locale = 'en' | 'it';
type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, it };

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'it';
  const stored = localStorage.getItem('imbustai-locale');
  if (stored === 'en' || stored === 'it') return stored;
  const browserLang = navigator.language.slice(0, 2);
  return browserLang === 'it' ? 'it' : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('it');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('imbustai-locale', newLocale);
  }, []);

  const t = useCallback(
    (key: string) => getNestedValue(translations[locale] as unknown as Record<string, unknown>, key),
    [locale]
  );

  if (!hydrated) {
    return (
      <I18nContext.Provider value={{ locale: 'it', t: (key) => getNestedValue(it as unknown as Record<string, unknown>, key), setLocale }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within I18nProvider');
  return context;
}
