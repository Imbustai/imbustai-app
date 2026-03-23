'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/context';

export function AdminTopbar() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <Link
        href="/game"
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('admin.backToGame')}
      </Link>
      <div className="flex items-center gap-3">
        {email && (
          <span className="text-sm text-muted-foreground">{email}</span>
        )}
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
          <LogOut className="size-4" />
          {t('admin.signOut')}
        </Button>
      </div>
    </header>
  );
}
