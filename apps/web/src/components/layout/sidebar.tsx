'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar({
  isCollapsed,
  onToggleCollapsed,
}: {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const navigation = useMemo(
    () => buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []),
    [currentUser?.menus, currentUser?.user.permissions],
  );
  const activePathIds = useMemo(() => findActivePathIds(navigation, pathname), [navigation, pathname]);
  const activePathKey = activePathIds.join('/');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(activePathIds));

  useEffect(() => {
    const nextActivePathIds = activePathKey.split('/').filter(Boolean);
    if (nextActivePathIds.length === 0) return;
    setExpandedIds((current) => {
      const hasEveryActiveId = nextActivePathIds.every((id) => current.has(id));
      if (hasEveryActiveId) return current;
      const next = new Set(current);
      for (const id of nextActivePathIds) {
        next.add(id);
      }
      return next;
    });
  }, [activePathKey]);

  function handleToggleExpanded(itemId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/70 bg-background/[0.88] shadow-[8px_0_35px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-[width] duration-200 supports-[backdrop-filter]:bg-background/[0.78] lg:flex',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      <div className={cn('relative flex h-[66px] items-center border-b border-white/70', isCollapsed ? 'justify-center px-3' : 'justify-between px-5')}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm">
            <Boxes className="size-5" />
          </span>
          <div className={cn('min-w-0 transition-opacity', isCollapsed && 'hidden')}>
            <div className="text-sm font-semibold tracking-tight">AIAget 平台</div>
            <div className="text-xs text-muted-foreground">企业智能体控制台</div>
          </div>
        </div>
        <Button
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          className={cn('shrink-0', isCollapsed && 'absolute left-9 top-3 size-7 translate-x-1/2')}
          onClick={onToggleCollapsed}
          size="icon"
          type="button"
          variant="ghost"
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
      <nav className={cn('grid flex-1 content-start gap-1 overflow-y-auto pb-4 pt-4', isCollapsed ? 'px-2' : 'px-3')}>
        {navigation.map((item) => (
          <SidebarNavItem
            expandedIds={expandedIds}
            isCollapsed={isCollapsed}
            item={item}
            key={item.id}
            onExpandSidebar={onToggleCollapsed}
            onToggleExpanded={handleToggleExpanded}
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarNavItem({
  expandedIds,
  isCollapsed,
  item,
  onExpandSidebar,
  onToggleExpanded,
  pathname,
}: {
  expandedIds: Set<string>;
  isCollapsed: boolean;
  item: NavigationLink;
  onExpandSidebar: () => void;
  onToggleExpanded: (itemId: string) => void;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = isNavigationItemActive(item, pathname);
  const isExactActive = !item.external && item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`));
  const hasChildren = item.children.length > 0;
  const isExpanded = expandedIds.has(item.id);
  const hasClickableRoute = item.href !== '#';
  const childIndentClass = item.level === 2 ? 'pl-7 text-[13px]' : item.level > 2 ? 'pl-10 text-[12px]' : '';
  const rowStateClassName = cn(
    isExactActive
      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
      : isActive
        ? 'text-blue-700 hover:border-slate-200/70 hover:bg-white/70'
        : 'text-slate-700 hover:border-slate-200/70 hover:bg-white/70 hover:text-blue-700',
  );
  const rowClassName = cn(
    'group flex min-h-10 w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm font-medium transition-colors',
    item.level > 1 && 'min-h-9',
    !isCollapsed && childIndentClass,
    isCollapsed && 'justify-center px-0',
    rowStateClassName,
  );
  const routedRowClassName = cn(
    'group flex min-h-10 w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm font-medium transition-colors',
    item.level > 1 && 'min-h-9',
    !isCollapsed && childIndentClass,
    rowStateClassName,
  );
  const linkRowClassName = cn(
    'flex min-w-0 flex-1 items-center gap-3 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2',
    isCollapsed && 'justify-center',
  );

  if (isCollapsed && item.level > 1) {
    return null;
  }

  const content = (
    <span className={cn('flex min-w-0 flex-1 items-center gap-3', isCollapsed && 'justify-center')}>
      <Icon className="size-4 shrink-0" />
      <span className={cn('truncate', isCollapsed && 'sr-only')}>{sidebarNavTitle(item.title)}</span>
    </span>
  );

  const chevron = hasChildren && !isCollapsed ? (
    <button
      aria-expanded={isExpanded}
      aria-label={isExpanded ? '收起子菜单' : '展开子菜单'}
      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition hover:bg-slate-100 hover:text-slate-900"
      onClick={() => onToggleExpanded(item.id)}
      type="button"
    >
      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  ) : null;

  return (
    <div>
      {isCollapsed && hasChildren ? (
        <button
          aria-expanded={isExpanded}
          aria-label={`展开${item.title}`}
          className={rowClassName}
          onClick={() => {
            onExpandSidebar();
            onToggleExpanded(item.id);
          }}
          title={item.title}
          type="button"
        >
          {content}
        </button>
      ) : hasClickableRoute && hasChildren ? (
        <div className={routedRowClassName}>
          <Link
            aria-current={isExactActive ? 'page' : undefined}
            className={linkRowClassName}
            href={item.href}
            rel={item.external ? 'noreferrer' : undefined}
            target={item.external ? '_blank' : undefined}
            title={item.description}
          >
            {content}
          </Link>
          {chevron}
        </div>
      ) : hasClickableRoute ? (
        <Link
          aria-current={isExactActive ? 'page' : undefined}
          className={rowClassName}
          href={item.href}
          rel={item.external ? 'noreferrer' : undefined}
          target={item.external ? '_blank' : undefined}
          title={isCollapsed ? item.title : item.description}
        >
          {content}
        </Link>
      ) : (
        <button
          aria-expanded={hasChildren ? isExpanded : undefined}
          className={cn(
            'flex min-h-10 w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:border-slate-200/70 hover:bg-white/70 hover:text-blue-700',
            item.level > 1 && 'min-h-9',
            !isCollapsed && childIndentClass,
            isActive && 'text-blue-700',
          )}
          onClick={() => hasChildren && onToggleExpanded(item.id)}
          title={item.description}
          type="button"
        >
          {content}
          {chevron}
        </button>
      )}
      {hasChildren && isExpanded && !isCollapsed ? (
        <div className="mt-1 grid gap-1 overflow-hidden">
          {item.children.map((child) => (
            <SidebarNavItem
              expandedIds={expandedIds}
              isCollapsed={isCollapsed}
              item={child}
              key={child.id}
              onExpandSidebar={onExpandSidebar}
              onToggleExpanded={onToggleExpanded}
              pathname={pathname}
            />
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

function isNavigationItemActive(item: NavigationLink, pathname: string): boolean {
  if (item.external) return false;

  if (item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }

  return item.children.some((child) => isNavigationItemActive(child, pathname));
}

function findActivePathIds(items: NavigationLink[], pathname: string): string[] {
  for (const item of items) {
    if (!isNavigationItemActive(item, pathname)) continue;
    const childPath = findActivePathIds(item.children, pathname);
    return [item.id, ...childPath];
  }

  return [];
}
