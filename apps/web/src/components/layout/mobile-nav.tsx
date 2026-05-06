'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, flattenNavigationLinks } from '@/components/layout/menu-navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = flattenNavigationLinks(buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []));

  return (
    <div className="border-b border-white/70 bg-background/[0.85] shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 lg:hidden">
      <nav className="flex gap-2 overflow-x-auto px-4 py-2">
        {navigation.map((item) => {
          const isActive = !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm',
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200/80 bg-white/75 text-muted-foreground',
              )}
              href={item.href}
              key={item.id}
              rel={item.external ? 'noreferrer' : undefined}
              target={item.external ? '_blank' : undefined}
              title={item.description}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
