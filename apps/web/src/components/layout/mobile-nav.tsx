'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { consoleNavigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background lg:hidden">
      <nav className="flex gap-2 overflow-x-auto px-4 py-2">
        {consoleNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground',
              )}
              href={item.href}
              key={item.href}
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

