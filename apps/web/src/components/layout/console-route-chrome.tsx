'use client';

import { useEffect, useMemo, useState } from 'react';
import { Home, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, flattenNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { cn } from '@/lib/utils';

const MAX_VISITED_TABS = 10;

interface VisitedTab {
  href: string;
  title: string;
  affix: boolean;
}

export function ConsoleRouteChrome() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = useMemo(
    () => buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []),
    [currentUser?.menus, currentUser?.user.permissions],
  );
  const activePath = useMemo(() => findActivePath(navigation, pathname), [navigation, pathname]);
  const activeItem = activePath.at(-1);
  const [visitedTabs, setVisitedTabs] = useState<VisitedTab[]>(() => [createDashboardTab()]);

  useEffect(() => {
    if (!activeItem || activeItem.href === '#') return;
    setVisitedTabs((current) => {
      const nextTab = {
        href: activeItem.href,
        title: activeItem.title,
        affix: activeItem.affix || activeItem.href === '/dashboard',
      };
      const withoutCurrent = current.filter((tab) => tab.href !== nextTab.href);
      const fixedTabs = withoutCurrent.filter((tab) => tab.affix);
      const normalTabs = withoutCurrent.filter((tab) => !tab.affix);
      return [...fixedTabs, ...normalTabs, nextTab].slice(-MAX_VISITED_TABS);
    });
  }, [activeItem?.href, activeItem?.title, activeItem?.affix]);

  function closeVisitedTab(href: string) {
    setVisitedTabs((current) => current.filter((tab) => tab.href !== href || tab.affix));
  }

  const shouldShowBreadcrumb = activePath.length > 0 && !activeItem?.hideBreadcrumb;

  return (
    <div className="sticky top-[66px] z-20 hidden border-b border-white/70 bg-background/[0.78] shadow-[0_8px_24px_rgba(15,23,42,0.025)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/[0.68] lg:block">
      {shouldShowBreadcrumb ? (
        <nav aria-label="面包屑" className="flex h-10 items-center gap-2 overflow-x-auto px-6 text-xs text-muted-foreground">
          <Link className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-slate-600 hover:bg-white/80 hover:text-blue-700" href="/dashboard">
            <Home className="size-3.5" />
            工作台
          </Link>
          {activePath.filter((item) => item.href !== '/dashboard').map((item) => (
            <span className="inline-flex items-center gap-2" key={item.id}>
              <span className="text-slate-300">/</span>
              {item.href === '#' ? (
                <span className="whitespace-nowrap">{item.title}</span>
              ) : (
                <Link className="whitespace-nowrap rounded px-1.5 py-1 hover:bg-white/80 hover:text-blue-700" href={item.href}>
                  {item.title}
                </Link>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div aria-label="访问页签" className="flex h-10 items-center gap-2 overflow-x-auto border-t border-white/60 px-6">
        {visitedTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <span
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors',
                isActive ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200/80 bg-white/75 text-slate-600 hover:text-blue-700',
              )}
              key={tab.href}
            >
              <Link className="max-w-[160px] truncate" href={tab.href}>
                {tab.title}
              </Link>
              {!tab.affix ? (
                <button
                  aria-label={`关闭${tab.title}`}
                  className="grid size-4 place-items-center rounded hover:bg-slate-100"
                  onClick={() => closeVisitedTab(tab.href)}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function createDashboardTab(): VisitedTab {
  return {
    href: '/dashboard',
    title: '工作台',
    affix: true,
  };
}

function findActivePath(items: NavigationLink[], pathname: string): NavigationLink[] {
  for (const item of items) {
    if (!isNavigationItemActive(item, pathname)) continue;
    const childPath = findActivePath(item.children, pathname);
    return [item, ...childPath];
  }

  return [];
}

function isNavigationItemActive(item: NavigationLink, pathname: string): boolean {
  if (item.external) return false;

  if (item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }

  return item.children.some((child) => isNavigationItemActive(child, pathname));
}

export function searchNavigationItems(items: NavigationLink[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const flatItems = flattenNavigationLinks(items).filter((item) => item.href !== '#');
  if (!normalizedKeyword) return flatItems.slice(0, 8);
  return flatItems
    .filter((item) => `${item.title} ${item.href} ${item.description}`.toLowerCase().includes(normalizedKeyword))
    .slice(0, 12);
}
