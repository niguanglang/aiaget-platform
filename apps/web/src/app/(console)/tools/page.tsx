import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function ToolsPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('tools')} />;
}

