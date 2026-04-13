'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export function SiteHeader({
  email,
  isAdmin,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link
          href="/"
          className="font-heading text-xl font-bold text-foreground"
        >
          IMBUSTAI
        </Link>
        <nav className="ml-4 flex flex-1 flex-wrap items-center gap-1 sm:gap-3">
          <Link
            href="/shop"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('nav.shop')}
          </Link>
          {email && isAdmin ? (
            <>
              <Link
                href="/admin/games"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('nav.games')}
              </Link>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('nav.admin')}
              </Link>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          {email ? (
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={signOut}>
              {t('nav.logout')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t('nav.register')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
