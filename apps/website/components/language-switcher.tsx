'use client';

import { useTranslation } from '@imbustai/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
      className="gap-1.5 border border-cornsilk/35 bg-[#283618]/92 text-[#fefae0] shadow-sm backdrop-blur-sm hover:bg-[#283618] hover:text-[#fefae0]"
      aria-label={locale === 'it' ? 'Switch to English' : 'Passa all’italiano'}
    >
      <Globe className="h-4 w-4" aria-hidden />
      {locale === 'it' ? 'EN' : 'IT'}
    </Button>
  );
}
