'use client';

import { Boxes, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []);

  return (
    <aside className="sticky top-0 hidden h-screen w-[222px] shrink-0 flex-col border-r border-white/70 bg-background/[0.88] shadow-[8px_0_35px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/[0.78] lg:flex">
      <div className="flex h-[66px] items-center justify-between border-b border-white/70 px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm">
            <Boxes className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight">AIAget 平台</div>
            <div className="text-xs text-muted-foreground">企业智能体控制台</div>
          </div>
        </div>
        <PanelLeftClose className="size-4 text-muted-foreground" />
      </div>
      <nav className="grid flex-1 content-start gap-1.5 overflow-y-auto px-4 pb-4 pt-5">
        {navigation.map((item) => (
          <SidebarNavItem item={item} key={item.id} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarNavItem({ item, pathname }: { item: NavigationLink; pathname: string }) {
  const Icon = item.icon;
  const isActive = !item.external && item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`));
  const hasClickableRoute = item.href !== '#';
  const childIndentClass = item.level === 2 ? 'pl-7 text-[13px]' : item.level > 2 ? 'pl-10 text-[12px]' : '';
  const content = (
    <>
      <Icon className="size-4" />
      <span className="truncate">{sidebarNavTitle(item.title)}</span>
    </>
  );

  return (
    <div>
      {hasClickableRoute ? (
        <Link
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex min-h-10 items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors',
            item.level > 1 && 'min-h-9',
            childIndentClass,
            isActive
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
              : 'text-slate-700 hover:border-slate-200/70 hover:bg-white/70 hover:text-blue-700',
          )}
          href={item.href}
          rel={item.external ? 'noreferrer' : undefined}
          target={item.external ? '_blank' : undefined}
          title={item.description}
        >
          {content}
        </Link>
      ) : (
        <div
          className={cn(
            'mt-2 flex min-h-8 items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground',
            childIndentClass,
          )}
          title={item.description}
        >
          {content}
        </div>
      )}
      {item.children.length > 0 ? (
        <div className="mt-1 grid gap-1">
          {item.children.map((child) => (
            <SidebarNavItem item={child} key={child.id} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function sidebarNavTitle(title: string) {
  const labels: Record<string, string> = {
    智能体: 'Agent 中心',
    模型: '模型中心',
    工具: '工具中心',
    会话: '会话中心',
    审批: '审批中心',
    监控: '监控告警',
    审计: '审计日志',
    设置: '设置中心',
  };

  return labels[title] ?? title;
}
