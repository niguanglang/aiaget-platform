import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArchiveRestore,
  Bot,
  BookOpen,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Coins,
  Database,
  FileText,
  FileCheck2,
  Gauge,
  GitBranch,
  HardDrive,
  KeySquare,
  KeyRound,
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
  TrendingUp,
  Wrench,
  Workflow,
} from 'lucide-react';

import { moduleSpecs } from '@/config/modules';

export interface ConsoleNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  permission?: string;
}

const moduleIconMap: Record<string, LucideIcon> = {
  agents: Bot,
  agent_teams: GitBranch,
  role_scenarios: Workflow,
  solution_packages: FileCheck2,
  delivery_reviews: ClipboardCheck,
  delivery_assets: ArchiveRestore,
  customer_success_plans: TrendingUp,
  customer_success_actions: ListChecks,
  channels: RadioTower,
  customer_assessments: ClipboardList,
  prompts: FileText,
  models: KeyRound,
  knowledge: Database,
  storage: HardDrive,
  security: ShieldCheck,
  plugins: Boxes,
  tools: Wrench,
  conversations: MessageSquareText,
  approvals: ClipboardCheck,
  approval_audits: ScrollText,
  monitor: Activity,
  billing: Coins,
  api_keys: KeySquare,
  api_reference: BookOpen,
  audit: ScrollText,
  settings: Settings,
  tenants: Network,
  users: UsersRound,
  departments: Network,
  roles: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  menus: ListTree,
};

export const consoleNavigation: ConsoleNavItem[] = [
  {
    title: '仪表盘',
    href: '/dashboard',
    icon: Gauge,
    description: '平台概览与健康状态',
    permission: 'dashboard:overview:view',
  },
  ...moduleSpecs.map((moduleSpec) => ({
    title: moduleSpec.navTitle,
    href: moduleSpec.href,
    icon: moduleIconMap[moduleSpec.key] ?? SquareTerminal,
    description: moduleSpec.description,
    permission: moduleSpec.permission,
  })),
];
