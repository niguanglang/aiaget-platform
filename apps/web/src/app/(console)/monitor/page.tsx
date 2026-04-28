import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function MonitorPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('monitor')} />;
}

