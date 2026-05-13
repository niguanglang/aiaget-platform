'use client';

import { hasPermission, type AuthorizedMenuItem } from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArchiveRestore,
  BarChart3,
  BellRing,
  Blocks,
  Bot,
  BookOpen,
  Building2,
  Cable,
  ClipboardCheck,
  Coins,
  Database,
  FileArchive,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  Handshake,
  KeySquare,
  KeyRound,
  LayoutDashboard,
  LineChart,
  ListChecks,
  ListTree,
  MessageSquareReply,
  MessageSquareText,
  Network,
  Boxes,
  RadioTower,
  ReceiptText,
  Rocket,
  ServerCog,
  Send,
  UsersRound,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  UploadCloud,
  TrendingUp,
  WalletCards,
  Webhook,
  Workflow,
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
  affix: boolean;
  hideBreadcrumb: boolean;
  children: NavigationLink[];
}

const iconMap: Record<string, LucideIcon> = {
  Activity,
  ArchiveRestore,
  BarChart3,
  BellRing,
  Blocks,
  Bot,
  BookOpen,
  Building2,
  Cable,
  Boxes,
  ClipboardCheck,
  Coins,
  Database,
  FileArchive,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  Handshake,
  KeySquare,
  KeyRound,
  LayoutDashboard,
  LineChart,
  ListChecks,
  ListTree,
  MessageSquareReply,
  MessageSquareText,
  Network,
  RadioTower,
  ReceiptText,
  Rocket,
  ServerCog,
  Send,
  UsersRound,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquareTerminal,
  UploadCloud,
  TrendingUp,
  WalletCards,
  Webhook,
  Workflow,
  Wrench,
};

const codeIconMap: Record<string, LucideIcon> = {
  dashboard: Gauge,
  agent_center: Bot,
  agent_platform: Bot,
  customer_delivery: Building2,
  channel_operations: RadioTower,
  plugin_ecosystem: Boxes,
  external_access: Cable,
  observability_center: Activity,
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
  knowledge_activity: ClipboardCheck,
  knowledge_health: ServerCog,
  storage: HardDrive,
  storage_upload: UploadCloud,
  storage_settings: Settings,
  tools: Wrench,
  conversations: MessageSquareText,
  monitor: Activity,
  monitor_observability: LineChart,
  runtime_workflows: Workflow,
  platform_usage: BarChart3,
  billing: Coins,
  api_keys: KeySquare,
  api_key_observability: LineChart,
  api_key_webhook_deliveries: Webhook,
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
  settings_notification_policy: BellRing,
  settings_notification_policy_snapshots: FileArchive,
  settings_production_readiness: Rocket,
  plugins: Boxes,
  tenants: Network,
  users: UsersRound,
  departments: Network,
  roles: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  menus: ListTree,
  customer_success_opportunities: BarChart3,
  customer_success_opportunity_analytics: BarChart3,
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
        description: '',
        level: 1,
        affix: item.href === '/dashboard',
        hideBreadcrumb: false,
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
    description: '',
    level,
    affix: menu.affix,
    hideBreadcrumb: menu.hide_breadcrumb,
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
      description: '',
      level: 1,
      affix: false,
      hideBreadcrumb: false,
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
