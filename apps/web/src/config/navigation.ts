import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bot,
  Database,
  FileText,
  Gauge,
  KeyRound,
  MessageSquareText,
  ScrollText,
  Settings,
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
  tools: Wrench,
  conversations: MessageSquareText,
  monitor: Activity,
  audit: ScrollText,
  settings: Settings,
};

export const consoleNavigation: ConsoleNavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Gauge,
    description: 'Platform overview and health',
    permission: 'dashboard.read',
  },
  ...moduleSpecs.map((moduleSpec) => ({
    title: moduleSpec.navTitle,
    href: moduleSpec.href,
    icon: moduleIconMap[moduleSpec.key] ?? SquareTerminal,
    description: moduleSpec.description,
    permission: moduleSpec.permission,
  })),
];

