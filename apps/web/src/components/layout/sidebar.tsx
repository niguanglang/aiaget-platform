'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { consoleNavigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-background lg:block">
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <div className="text-sm font-semibold">AIAget Platform</div>
          <div className="text-xs text-muted-foreground">Enterprise Agent Console</div>
        </div>
      </div>
      <nav className="grid gap-1 p-3">
        {consoleNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
              href={item.href}
              key={item.href}
              title={item.description}
            >
              <Icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

