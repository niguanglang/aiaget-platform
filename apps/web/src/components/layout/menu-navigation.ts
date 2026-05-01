'use client';

import type { AuthorizedMenuItem } from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bot,
  ClipboardCheck,
  Coins,
  Database,
  FileText,
  Gauge,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  ListTree,
  MessageSquareText,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  Wrench,
} from 'lucide-react';

import { consoleNavigation } from '@/config/navigation';

export interface NavigationLink {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  level: number;
  children: NavigationLink[];
}

const iconMap: Record<string, LucideIcon> = {
  Activity,
  Bot,
  ClipboardCheck,
  Coins,
  Database,
  FileText,
  Gauge,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  ListTree,
  MessageSquareText,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  Wrench,
};

const codeIconMap: Record<string, LucideIcon> = {
  dashboard: Gauge,
  agent_center: Bot,
  agents: Bot,
  prompts: FileText,
  models: KeyRound,
  knowledge: Database,
  storage: HardDrive,
  tools: Wrench,
  conversations: MessageSquareText,
  monitor: Activity,
  billing: Coins,
  security_center: ShieldCheck,
  security_policies: ShieldCheck,
  approvals: ClipboardCheck,
  audit: ScrollText,
  system_management: Settings,
  settings: Settings,
  departments: Network,
  roles: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  menus: ListTree,
};

export function buildNavigationLinks(menus: AuthorizedMenuItem[] | undefined): NavigationLink[] {
  if (!menus || menus.length === 0) {
    return consoleNavigation.map((item) => ({
      id: item.href,
      title: item.title,
      href: item.href,
      icon: item.icon,
      description: item.description,
      level: 1,
      children: [],
    }));
  }

  return menus.flatMap((menu) => mapAuthorizedMenu(menu, 1));
}

export function flattenNavigationLinks(items: NavigationLink[]) {
  const output: NavigationLink[] = [];

  for (const item of items) {
    if (item.href !== '#') {
      output.push(item);
    }
    output.push(...flattenNavigationLinks(item.children));
  }

  return output;
}

function mapAuthorizedMenu(menu: AuthorizedMenuItem, level: number): NavigationLink[] {
  const children = menu.children.flatMap((child) => mapAuthorizedMenu(child, level + 1));
  const href = menu.type === 'MENU' && menu.path ? menu.path : '#';
  const node: NavigationLink = {
    id: menu.id,
    title: menu.name,
    href,
    icon: resolveIcon(menu),
    description: menu.permission_code ? `权限：${menu.permission_code}` : '租户菜单',
    level,
    children,
  };

  if (menu.type === 'DIRECTORY' && children.length === 0) {
    return [];
  }

  return [node];
}

function resolveIcon(menu: AuthorizedMenuItem) {
  if (menu.icon && iconMap[menu.icon]) {
    return iconMap[menu.icon] ?? SquareTerminal;
  }

  return codeIconMap[menu.code] ?? SquareTerminal;
}
