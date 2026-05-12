'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { buildMobileNavigationLevels, findActivePathIds, isNavigationItemActive } from '@/components/layout/navigation-utils';
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
