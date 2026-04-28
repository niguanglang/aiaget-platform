import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function KnowledgePage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('knowledge')} />;
}

