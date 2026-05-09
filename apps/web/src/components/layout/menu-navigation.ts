'use client';

import { hasPermission, type AuthorizedMenuItem } from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bot,
  BookOpen,
  ClipboardCheck,
  Coins,
  Database,
  FileArchive,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  KeySquare,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ListTree,
  MessageSquareText,
  Network,
  Boxes,
  RadioTower,
  UsersRound,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  UploadCloud,
  Wrench,
} from 'lucide-react';

import { consoleNavigation } from '@/config/navigation';

export interface NavigationLink {
  id: string;
  title: string;
  href: string;
  external: boolean;
  icon: LucideIcon;
  description: string;
  level: number;
  children: NavigationLink[];
}

const iconMap: Record<string, LucideIcon> = {
  Activity,
  Bot,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Coins,
  Database,
  FileArchive,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  KeySquare,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ListTree,
  MessageSquareText,
  Network,
  RadioTower,
  UsersRound,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  UploadCloud,
  Wrench,
};

const codeIconMap: Record<string, LucideIcon> = {
  dashboard: Gauge,
  agent_center: Bot,
  agents: Bot,
  agent_teams: GitBranch,
  agent_team_report_archives: FileArchive,
  channels: RadioTower,
  channel_publish: RadioTower,
  channel_providers: RadioTower,
  channel_accounts: KeyRound,
  channel_templates: FileText,
  channel_route_rules: GitBranch,
  channel_jobs: ClipboardCheck,
  channel_deliveries: Activity,
  channel_replies: MessageSquareText,
  channel_sender: RadioTower,
  channel_release: UploadCloud,
  prompts: FileText,
  models: KeyRound,
  knowledge: Database,
  storage: HardDrive,
  storage_upload: UploadCloud,
  storage_settings: Settings,
  tools: Wrench,
  conversations: MessageSquareText,
  monitor: Activity,
  billing: Coins,
  api_keys: KeySquare,
  api_reference: BookOpen,
  security_center: ShieldCheck,
  security_overview: ShieldCheck,
  security_policies: ShieldCheck,
  security_events: Activity,
  security_alerts: ClipboardCheck,
  security_recovery: Wrench,
  security_archives: FileArchive,
  approvals: ClipboardCheck,
  approval_audits: ScrollText,
  approval_audit_archives: FileArchive,
  audit: ScrollText,
  system_management: Settings,
  settings: Settings,
  plugins: Boxes,
  tenants: Network,
  users: UsersRound,
  departments: Network,
  roles: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  menus: ListTree,
  customer_success_actions: ListChecks,
};

export function buildNavigationLinks(menus: AuthorizedMenuItem[] | undefined, permissions: readonly string[] = []): NavigationLink[] {
  if (!menus || menus.length === 0) {
    return consoleNavigation
      .filter((item) => !item.permission || hasPermission(permissions, item.permission))
      .map((item) => ({
        id: item.href,
        title: item.title,
        href: item.href,
        external: false,
        icon: item.icon,
        description: item.description,
        level: 1,
        children: [],
      }));
  }

  const navigation = menus.flatMap((menu) => mapAuthorizedMenu(menu, 1));

  return appendFallbackModules(navigation, permissions);
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
  const href = resolveHref(menu);
  const node: NavigationLink = {
    id: menu.id,
    title: menu.name,
    href,
    external: Boolean(menu.is_external && menu.external_url),
    icon: resolveIcon(menu),
    description: menu.permission_code ? `权限：${menu.permission_code}` : '租户菜单',
    level,
    children,
  };

  if (menu.type === 'DIRECTORY' && children.length === 0 && href === '#') {
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

function appendFallbackModules(navigation: NavigationLink[], permissions: readonly string[]) {
  const existingHrefs = new Set(flattenNavigationLinks(navigation).map((item) => item.href));
  const additions = consoleNavigation
    .filter((item) => item.href === '/api-reference')
    .filter((item) => !existingHrefs.has(item.href))
    .filter((item) => !item.permission || hasPermission(permissions, item.permission))
    .map((item) => ({
      id: item.href,
      title: item.title,
      href: item.href,
      external: false,
      icon: item.icon,
      description: item.description,
      level: 1,
      children: [],
    }));

  return [...navigation, ...additions];
}

function resolveHref(menu: AuthorizedMenuItem) {
  if (menu.is_external && menu.external_url) return menu.external_url;
  if (menu.type === 'MENU' && menu.path) return menu.path;
  if (menu.redirect_path) return menu.redirect_path;

  return '#';
}
