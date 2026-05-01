'use client';

import { Bell, ChevronDown, Search, ShieldCheck } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-white/70 bg-background/[0.85] shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-[66px] w-full items-center gap-4 px-4 lg:pl-[39px] lg:pr-[27px]">
        <div className="hidden h-9 w-[500px] flex-none items-center rounded-lg border border-slate-200/80 bg-white/90 px-3 text-sm text-muted-foreground shadow-sm backdrop-blur md:flex">
          <Search className="mr-2 size-4" />
          <span className="min-w-0 flex-1 truncate">搜索智能体、提示词、模型、工具...</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">
            ⌘ K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden rounded-lg border border-slate-200/80 bg-white/[0.85] px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur md:block">
            租户：{currentUser?.tenant.name ?? 'Default Enterprise'}
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/[0.85] px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
            <ShieldCheck className="size-4 text-emerald-600" />
            系统健康
          </div>
          <span
            aria-hidden="true"
            className="hidden size-9 place-items-center rounded-lg border border-slate-200/80 bg-white/[0.85] text-muted-foreground shadow-sm backdrop-blur sm:grid"
          >
            <Bell className="size-4" />
          </span>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-400 via-cyan-300 to-violet-400 text-sm font-semibold text-white shadow-sm">
              {(currentUser?.user.name ?? 'A').slice(0, 1).toUpperCase()}
            </span>
            <div className="text-right">
              <div className="text-sm font-medium">{currentUser?.user.name}</div>
              <div className="text-xs text-muted-foreground">{currentUser?.user.email}</div>
            </div>
          </div>
          <Button aria-label="退出登录" onClick={handleLogout} size="icon" variant="outline">
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
