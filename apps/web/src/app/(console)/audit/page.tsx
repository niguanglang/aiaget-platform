import { ModulePageShell } from '@/components/modules/module-page-shell';
import { requireModuleSpec } from '@/config/modules';

export default function AuditPage() {
  return <ModulePageShell moduleSpec={requireModuleSpec('audit')} />;
}

