'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { buildNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';
import { findActivePathIds, isNavigationItemActive } from '@/components/layout/navigation-utils';
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
  const [collapsedFlyout, setCollapsedFlyout] = useState<string | null>(null);

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
      <nav className={cn('grid flex-1 content-start gap-1 pb-4 pt-4', isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto px-3')}>
        {navigation.map((item) => (
          <SidebarNavItem
            collapsedFlyout={collapsedFlyout}
            expandedIds={expandedIds}
            isCollapsed={isCollapsed}
            item={item}
            key={item.id}
            onSetCollapsedFlyout={setCollapsedFlyout}
            onToggleExpanded={handleToggleExpanded}
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarNavItem({
  collapsedFlyout,
  expandedIds,
  isCollapsed,
  item,
  onSetCollapsedFlyout,
  onToggleExpanded,
  pathname,
}: {
  collapsedFlyout: string | null;
  expandedIds: Set<string>;
  isCollapsed: boolean;
  item: NavigationLink;
  onSetCollapsedFlyout: (itemId: string | null) => void;
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
        <div
          className="relative"
          onFocus={() => onSetCollapsedFlyout(item.id)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onSetCollapsedFlyout(null);
            }
            if (event.key === 'ArrowRight') {
              onSetCollapsedFlyout(item.id);
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              onSetCollapsedFlyout(null);
            }
          }}
          onMouseEnter={() => onSetCollapsedFlyout(item.id)}
          onMouseLeave={() => onSetCollapsedFlyout(null)}
        >
          <button
            aria-controls={`collapsed-menu-${item.id}`}
            aria-expanded={collapsedFlyout === item.id}
            aria-haspopup="menu"
            aria-label={`打开${item.title}子菜单`}
            className={rowClassName}
            onClick={() => onSetCollapsedFlyout(collapsedFlyout === item.id ? null : item.id)}
            title={item.title}
            type="button"
          >
            {content}
          </button>
          {collapsedFlyout === item.id ? (
            <CollapsedFlyoutMenu item={item} onClose={() => onSetCollapsedFlyout(null)} pathname={pathname} sidebarTitle={sidebarNavTitle(item.title)} />
          ) : null}
        </div>
      ) : hasClickableRoute && hasChildren ? (
        <div className={routedRowClassName}>
          <Link
            aria-current={isExactActive ? 'page' : undefined}
            className={linkRowClassName}
            href={item.href}
            rel={item.external ? 'noreferrer' : undefined}
            target={item.external ? '_blank' : undefined}
            title={item.title}
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
          title={item.title}
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
          title={item.title}
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
              collapsedFlyout={collapsedFlyout}
              onSetCollapsedFlyout={onSetCollapsedFlyout}
              onToggleExpanded={onToggleExpanded}
              pathname={pathname}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CollapsedFlyoutMenu({
  item,
  onClose,
  pathname,
  sidebarTitle,
}: {
  item: NavigationLink;
  onClose: () => void;
  pathname: string;
  sidebarTitle: string;
}) {
  return (
    <div
      aria-label="收起侧栏子菜单"
      className="absolute left-full top-0 z-50 min-w-56 rounded-lg border border-white/80 bg-white/95 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl"
      id={`collapsed-menu-${item.id}`}
      role="menu"
    >
      <div className="mb-1 border-b border-slate-100 px-3 pb-2 pt-1 text-sm font-semibold text-slate-900">{sidebarTitle}</div>
      <div className="grid gap-1">
        {item.children.map((child) => (
          <CollapsedFlyoutMenuItem item={child} key={child.id} onClose={onClose} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function CollapsedFlyoutMenuItem({ item, onClose, pathname }: { item: NavigationLink; onClose: () => void; pathname: string }) {
  const Icon = item.icon;
  const hasChildren = item.children.length > 0;
  const isActive = isNavigationItemActive(item, pathname);
  const isExactActive = !item.external && item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`));
  const itemClassName = cn(
    'group/flyout flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
    isExactActive
      ? 'bg-blue-50 text-blue-700'
      : isActive
        ? 'text-blue-700 hover:bg-slate-50'
        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700',
  );
  const content = (
    <>
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {hasChildren ? <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover/flyout:text-blue-700" /> : null}
    </>
  );

  return (
    <div className="group/collapsed-flyout relative">
      {item.href !== '#' ? (
        <Link
          aria-current={isExactActive ? 'page' : undefined}
          className={itemClassName}
          href={item.href}
          onClick={onClose}
          rel={item.external ? 'noreferrer' : undefined}
          role="menuitem"
          target={item.external ? '_blank' : undefined}
          title={item.title}
        >
          {content}
        </Link>
      ) : (
        <button aria-haspopup={hasChildren ? 'menu' : undefined} className={itemClassName} role="menuitem" title={item.title} type="button">
          {content}
        </button>
      )}
      {hasChildren ? (
        <div
          aria-label={`${item.title}下级菜单`}
          className="invisible absolute left-full top-0 z-50 min-w-56 rounded-lg border border-white/80 bg-white/95 p-2 opacity-0 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl transition group-hover/collapsed-flyout:visible group-hover/collapsed-flyout:opacity-100 group-focus-within/collapsed-flyout:visible group-focus-within/collapsed-flyout:opacity-100"
          role="menu"
        >
          {item.children.map((child) => (
            <CollapsedFlyoutMenuItem item={child} key={child.id} onClose={onClose} pathname={pathname} />
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
