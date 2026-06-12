'use client';

import { useTranslation } from '@imbustai/i18n';
import {
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  BookOpen,
  PanelLeftClose,
  PlusCircle,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'imbustai-admin-sidebar-collapsed';

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { href: '/admin', labelKey: 'admin.dashboardNav', icon: LayoutDashboard },
  { href: '/admin/stories', labelKey: 'admin.storiesNav', icon: BookOpen },
  { href: '/admin/games', labelKey: 'admin.allGamesNav', icon: Gamepad2 },
  { href: '/admin/orders', labelKey: 'admin.ordersNav', icon: ScrollText },
  {
    href: '/admin/order/create',
    labelKey: 'admin.createFreeOrder',
    icon: PlusCircle,
  },
];

function navActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/games')
    return (
      pathname.startsWith('/admin/games') || pathname.startsWith('/admin/game/')
    );
  if (href === '/admin/stories') return pathname.startsWith('/admin/stories');
  return pathname.startsWith(href);
}

function SidebarLink({
  item,
  collapsed,
  label,
}: {
  item: NavItem;
  collapsed: boolean;
  label: string;
}) {
  const pathname = usePathname();
  const active = navActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        collapsed ? 'justify-center px-2' : '',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function AdminDashboardShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="admin-dashboard flex min-h-screen w-full bg-background">
        <aside
          className={cn(
            'flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-out',
            collapsed ? 'w-[4.5rem]' : 'w-56'
          )}
        >
          <div
            className={cn(
              'flex h-14 items-center border-b border-border px-3',
              collapsed ? 'justify-center' : 'gap-2'
            )}
          >
            <div
              className={cn(
                'flex min-w-0 flex-col',
                collapsed ? 'hidden' : 'flex-1'
              )}
            >
              <span className="font-heading text-sm font-bold leading-tight tracking-tight">
                {t('admin.shellBrand')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('admin.shellSubtitle')}
              </span>
            </div>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 font-heading text-xs font-bold text-primary">
                    I
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('admin.shellBrand')} — {t('admin.shellSubtitle')}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-2">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                label={t(item.labelKey)}
              />
            ))}
          </nav>

          <div className="border-t border-border p-2">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="flex items-center justify-center rounded-lg px-2 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="size-5" aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('admin.exitToSite')}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-5 shrink-0" aria-hidden />
                {t('admin.exitToSite')}
              </Link>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={toggleSidebar}
              disabled={!hydrated}
              title={
                collapsed
                  ? t('admin.sidebarExpand')
                  : t('admin.sidebarCollapse')
              }
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? t('admin.sidebarExpand')
                  : t('admin.sidebarCollapse')
              }
            >
              {collapsed ? (
                <Menu className="size-5" />
              ) : (
                <PanelLeftClose className="size-5" />
              )}
            </Button>

            <AdminBreadcrumbs className="min-w-0 flex-1" />

            <div className="flex items-center gap-0.5 sm:gap-1">
              {userEmail ? (
                <span
                  className="hidden max-w-[8rem] truncate text-xs text-muted-foreground lg:inline xl:max-w-[12rem]"
                  title={userEmail}
                >
                  {userEmail}
                </span>
              ) : null}
              <ThemeToggle />
              <LanguageSwitcher />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={signOut}
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-muted/30 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
