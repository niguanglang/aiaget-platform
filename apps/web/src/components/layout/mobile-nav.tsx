'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []);
  const navigationLevels = buildMobileNavigationLevels(navigation, pathname);

  return (
    <div className="border-b border-white/70 bg-background/[0.85] shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 lg:hidden">
      {navigationLevels.map((items, index) => (
        <nav className={cn('flex gap-2 overflow-x-auto px-4 py-2', index > 0 && 'border-t border-white/60')} key={`level-${index}`}>
          {items.map((item) => {
            const isActive = isNavigationItemActive(item, pathname);
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-md border',
                  index === 0 ? 'h-9 px-3 text-sm' : 'h-8 px-2.5 text-xs',
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                    : index === 0
                      ? 'border-slate-200/80 bg-white/75 text-muted-foreground'
                      : 'border-slate-200/80 bg-white/70 text-muted-foreground',
                )}
                href={item.href}
                key={item.id}
                rel={item.external ? 'noreferrer' : undefined}
                target={item.external ? '_blank' : undefined}
                title={item.description}
              >
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

function buildMobileNavigationLevels(items: NavigationLink[], pathname: string): NavigationLink[][] {
  const levels: NavigationLink[][] = [];
  let currentItems = items;

  while (currentItems.length > 0) {
    levels.push(currentItems);
    const activeItem = currentItems.find((item) => isNavigationItemActive(item, pathname));
    if (!activeItem || activeItem.children.length === 0) break;
    currentItems = activeItem.children;
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
