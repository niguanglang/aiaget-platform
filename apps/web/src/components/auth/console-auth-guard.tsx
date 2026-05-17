'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth/auth-provider';

export function ConsoleAuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, router, session]);

  if (isLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground shadow-sm">
          正在加载工作台...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
