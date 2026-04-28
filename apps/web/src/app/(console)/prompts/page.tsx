import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function PromptsPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('prompts')} />;
}

