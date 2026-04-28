import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function ModelsPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('models')} />;
}

