'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gamepad2, Settings, FlaskConical, Sun, Moon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme-context';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', labelKey: 'admin.sidebar.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/mocked-dashboard', labelKey: 'admin.sidebar.demoDashboard', icon: FlaskConical },
  { href: '/admin/games', labelKey: 'admin.sidebar.games', icon: Gamepad2 },
  { href: '/admin/settings', labelKey: 'admin.sidebar.settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="text-base font-semibold tracking-tight">
          {t('admin.sidebar.title')}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {theme === 'dark' ? t('admin.sidebar.lightMode') : t('admin.sidebar.darkMode')}
        </button>
      </div>
    </aside>
  );
}
