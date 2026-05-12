'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = useMemo(
    () => buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []),
    [currentUser?.menus, currentUser?.user.permissions],
  );
  const activePathIds = useMemo(() => findActivePathIds(navigation, pathname), [navigation, pathname]);
  const [drilldownPathIds, setDrilldownPathIds] = useState<string[]>(activePathIds);
  const navigationLevels = buildMobileNavigationLevels(navigation, drilldownPathIds);

  useEffect(() => {
    setDrilldownPathIds(activePathIds);
  }, [activePathIds.join('/')]);

  function onDrilldown(item: NavigationLink, levelIndex: number) {
    setDrilldownPathIds((current) => [...current.slice(0, levelIndex), item.id]);
  }

  return (
    <div className="border-b border-white/70 bg-background/[0.85] shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 lg:hidden">
      {navigationLevels.map((items, index) => (
        <nav className={cn('flex gap-2 overflow-x-auto px-4 py-2', index > 0 && 'border-t border-white/60')} key={`level-${index}`}>
          {items.map((item) => {
            const isActive = isNavigationItemActive(item, pathname);
            const Icon = item.icon;
            const isExpanded = drilldownPathIds[index] === item.id;
            const isDirectoryOnly = item.href === '#' && item.children.length > 0;
            const itemClassName = cn(
              'inline-flex shrink-0 items-center gap-2 rounded-md border transition-colors',
              index === 0 ? 'h-9 px-3 text-sm' : 'h-8 px-2.5 text-xs',
              isActive || isExpanded
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                : index === 0
                  ? 'border-slate-200/80 bg-white/75 text-muted-foreground'
                  : 'border-slate-200/80 bg-white/70 text-muted-foreground',
            );

            if (isDirectoryOnly) {
              return (
                <button
                  aria-expanded={isExpanded}
                  className={itemClassName}
                  key={item.id}
                  onClick={() => onDrilldown(item, index)}
                  title={item.description}
                  type="button"
                >
                  <Icon className={index === 0 ? 'size-4' : 'size-3.5'} />
                  {item.title}
                </button>
              );
            }

            return (
              <Link className={itemClassName} href={item.href} key={item.id} rel={item.external ? 'noreferrer' : undefined} target={item.external ? '_blank' : undefined} title={item.description}>
                <Icon className={index === 0 ? 'size-4' : 'size-3.5'} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      ))}
    </div>
  );
}

function buildMobileNavigationLevels(items: NavigationLink[], pathIds: string[]): NavigationLink[][] {
  const levels: NavigationLink[][] = [];
  let currentItems = items;
  let levelIndex = 0;

  while (currentItems.length > 0) {
    levels.push(currentItems);
    const selectedItem = currentItems.find((item) => item.id === pathIds[levelIndex]);
    if (!selectedItem || selectedItem.children.length === 0) break;
    currentItems = selectedItem.children;
    levelIndex += 1;
  }

  return levels;
}

function isNavigationItemActive(item: NavigationLink, pathname: string): boolean {
  if (item.external) return false;

  if (item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }

  return item.children.some((child) => isNavigationItemActive(child, pathname));
}

function findActivePathIds(items: NavigationLink[], pathname: string): string[] {
  for (const item of items) {
    if (!isNavigationItemActive(item, pathname)) continue;
    const childPath = findActivePathIds(item.children, pathname);
    return [item.id, ...childPath];
  }

  return [];
}
