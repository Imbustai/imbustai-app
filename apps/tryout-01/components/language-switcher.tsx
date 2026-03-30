'use client';

import { useTranslation } from '@imbustai/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
      className="gap-1.5 text-muted-foreground"
    >
      <Globe className="h-4 w-4" />
      {locale === 'it' ? 'EN' : 'IT'}
    </Button>
  );
}
