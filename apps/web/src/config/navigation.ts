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
  prompts: FileText,
  models: KeyRound,
  knowledge: Database,
  storage: HardDrive,
  security: ShieldCheck,
  tools: Wrench,
  conversations: MessageSquareText,
  approvals: ClipboardCheck,
  monitor: Activity,
  billing: Coins,
  audit: ScrollText,
  settings: Settings,
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
