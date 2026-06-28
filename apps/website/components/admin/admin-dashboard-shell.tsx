'use client';

import { useTranslation } from '@imbustai/i18n';
import {
  Box,
  Inline,
  Button,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@imbustai/ds';
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
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import shell from './admin-dashboard-shell.module.css';
import s from './admin-styles.module.css';

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
  { href: '/admin/settings', labelKey: 'admin.settingsNav', icon: Settings },
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
    <SidebarItem asChild active={active} collapsed={collapsed}>
      <Link href={item.href}>
        <Icon className={s.iconSm} aria-hidden />
        {!collapsed ? <span>{label}</span> : null}
      </Link>
    </SidebarItem>
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
      <Box display="flex" width="full" height="screen">
        <Sidebar collapsed={collapsed}>
          <SidebarHeader collapsed={collapsed}>
            {!collapsed ? (
              <Box display="flex" minWidth="0" flexDirection="column" flexGrow={1}>
                <span className={shell.sidebarHeaderBrand}>
                  {t('admin.shellBrand')}
                </span>
                <span className={shell.sidebarHeaderSub}>
                  {t('admin.shellSubtitle')}
                </span>
              </Box>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={shell.brandBadge}>I</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('admin.shellBrand')} — {t('admin.shellSubtitle')}
                </TooltipContent>
              </Tooltip>
            )}
          </SidebarHeader>

          <Box as="nav" display="flex" flexDirection="column" gap="1" padding="2" flexGrow={1}>
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                label={t(item.labelKey)}
              />
            ))}
          </Box>

          <SidebarFooter>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarItem asChild active={false} collapsed={true}>
                    <Link href="/">
                      <ExternalLink className={s.iconSm} aria-hidden />
                    </Link>
                  </SidebarItem>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('admin.exitToSite')}
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarItem asChild active={false} collapsed={false}>
                <Link href="/">
                  <ExternalLink className={s.iconSm} aria-hidden />
                  {t('admin.exitToSite')}
                </Link>
              </SidebarItem>
            )}
          </SidebarFooter>
        </Sidebar>

        <Box display="flex" minWidth="0" flexGrow={1} flexDirection="column">
          <header className={shell.headerBar}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              disabled={!hydrated}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? t('admin.sidebarExpand')
                  : t('admin.sidebarCollapse')
              }
            >
              {collapsed ? (
                <Menu className={s.iconSm} />
              ) : (
                <PanelLeftClose className={s.iconSm} />
              )}
            </Button>

            <Box minWidth="0" flexGrow={1}>
              <AdminBreadcrumbs />
            </Box>

            <Inline gap="1" wrap={false}>
              {userEmail ? (
                <span className={shell.headerEmail} title={userEmail}>
                  {userEmail}
                </span>
              ) : null}
              <ThemeToggle />
              <LanguageSwitcher />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label={t('nav.logout')}
              >
                <LogOut className={s.iconSm} />
              </Button>
            </Inline>
          </header>

          <main className={shell.mainArea}>
            <Box width="full" maxWidth="container" marginX="auto">
              {children}
            </Box>
          </main>
        </Box>
      </Box>
    </TooltipProvider>
  );
}
