'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Locale = 'en' | 'it';

type Messages = Record<string, unknown>;

function getAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export interface I18nProviderProps {
  children: React.ReactNode;
  messages: Record<Locale, Messages>;
  /** localStorage key for persisted locale */
  storageKey?: string;
  /** Locale used for SSR / before hydration (must match first paint) */
  fallbackLocale?: Locale;
}

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  tArray: (key: string) => string[];
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectLocale(storageKey: string): Locale {
  if (typeof window === 'undefined') return 'it';
  const stored = localStorage.getItem(storageKey);
  if (stored === 'en' || stored === 'it') return stored;
  const browserLang = navigator.language.slice(0, 2);
  return browserLang === 'it' ? 'it' : 'en';
}

function makeHelpers(messages: Messages) {
  const t = (key: string): string => {
    const value = getAtPath(messages, key);
    return typeof value === 'string' ? value : key;
  };
  const tArray = (key: string): string[] => {
    const value = getAtPath(messages, key);
    if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
      return value as string[];
    }
    return [];
  };
  return { t, tArray };
}

export function I18nProvider({
  children,
  messages,
  storageKey = 'imbustai-locale',
  fallbackLocale = 'it',
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(fallbackLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale(storageKey));
    setHydrated(true);
  }, [storageKey]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      localStorage.setItem(storageKey, newLocale);
    },
    [storageKey]
  );

  const fallbackMessages = messages[fallbackLocale];
  const activeMessages = messages[locale];

  const fallbackHelpers = useMemo(
    () => makeHelpers(fallbackMessages),
    [fallbackMessages]
  );
  const activeHelpers = useMemo(
    () => makeHelpers(activeMessages),
    [activeMessages]
  );

  const value = useMemo((): I18nContextType => {
    const { t, tArray } = hydrated ? activeHelpers : fallbackHelpers;
    return {
      locale: hydrated ? locale : fallbackLocale,
      t,
      tArray,
      setLocale,
    };
  }, [
    hydrated,
    locale,
    fallbackLocale,
    activeHelpers,
    fallbackHelpers,
    setLocale,
  ]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

/** Sets <html lang="…"> from the active locale (client-only). */
export function HtmlLangSync() {
  const { locale } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
