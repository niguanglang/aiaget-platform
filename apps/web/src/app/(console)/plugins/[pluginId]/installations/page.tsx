import { PluginInstallationsContent } from '@/components/plugins/plugin-installations-content';

export default async function PluginInstallationsPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;

  return <PluginInstallationsContent pluginId={pluginId} />;
}
