'use client';

import type { ReactNode } from 'react';
import { HtmlLangSync, I18nProvider, type Locale } from '@imbustai/i18n';
import en from '@/lib/i18n/en.json';
import it from '@/lib/i18n/it.json';

const messages = {
  en: en as Record<string, unknown>,
  it: it as Record<string, unknown>,
} satisfies Record<Locale, Record<string, unknown>>;

export function I18nLayoutShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider messages={messages}>
      <HtmlLangSync />
      {children}
    </I18nProvider>
  );
}
