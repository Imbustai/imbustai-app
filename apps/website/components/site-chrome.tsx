import { createClient } from '@/lib/supabase/server';
import { SiteChromeClient } from '@/components/site-chrome-client';
import type { ReactNode } from 'react';

export async function SiteChrome({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <SiteChromeClient email={user?.email} isAdmin={isAdmin}>
      {children}
    </SiteChromeClient>
  );
}
