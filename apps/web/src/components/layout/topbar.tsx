'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, ExternalLink, Search, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { searchNavigationItems } from '@/components/layout/navigation-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const navigation = useMemo(
    () => buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []),
    [currentUser?.menus, currentUser?.user.permissions],
  );

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-background/[0.85] shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-[66px] w-full items-center gap-4 px-4 lg:pl-[39px] lg:pr-[27px]">
        <CommandSearch navigation={navigation} />

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

function CommandSearch({ navigation }: { navigation: NavigationLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const searchResults = useMemo(() => searchNavigationItems(navigation, keyword), [navigation, keyword]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        className="hidden h-9 w-[500px] flex-none items-center rounded-lg border border-slate-200/80 bg-white/90 px-3 text-left text-sm text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-blue-200 hover:text-blue-700 md:flex"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Search className="mr-2 size-4" />
        <span className="min-w-0 flex-1 truncate">搜索菜单、路由或模块</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">⌘ K</kbd>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm" onMouseDown={() => setIsOpen(false)} role="presentation">
          <div
            aria-label="命令搜索"
            className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-lg border border-white/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/80 p-4">
              <Search className="size-4 text-muted-foreground" />
              <Input autoFocus className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索菜单、路由或模块" value={keyword} />
              <Button aria-label="关闭搜索" onClick={() => setIsOpen(false)} size="icon" type="button" variant="ghost">
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="rounded-md border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">暂无匹配菜单</div>
              ) : (
                <div className="grid gap-1">
                  {searchResults.map((item) => {
                    const Icon = item.icon;
                    const content = (
                      <>
                        <span className="grid size-8 place-items-center rounded-md bg-blue-50 text-blue-700">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{item.href}</span>
                        </span>
                        {item.external ? <ExternalLink className="size-4 text-muted-foreground" /> : null}
                      </>
                    );

                    return item.external ? (
                      <a className={searchResultClassName} href={item.href} key={item.id} onClick={() => setIsOpen(false)} rel="noreferrer" target="_blank">
                        {content}
                      </a>
                    ) : (
                      <Link className={searchResultClassName} href={item.href} key={item.id} onClick={() => setIsOpen(false)}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const searchResultClassName = cn('flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-blue-50');
