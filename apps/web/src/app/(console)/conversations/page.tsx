import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function ConversationsPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('conversations')} />;
}

