'use client';

import { LogOut, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="hidden min-w-0 flex-1 items-center rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="mr-2 size-4" />
          Search agents, prompts, models, tools...
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden rounded-md border px-3 py-1.5 text-xs text-muted-foreground md:block">
            Tenant: {currentUser?.tenant.name ?? 'Unknown'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            JWT session
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium">{currentUser?.user.name}</div>
            <div className="text-xs text-muted-foreground">{currentUser?.user.email}</div>
          </div>
          <Button aria-label="Logout" onClick={handleLogout} size="icon" variant="outline">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
