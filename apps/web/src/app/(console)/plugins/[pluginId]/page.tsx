import { PluginDetailContent } from '@/components/plugins/plugin-detail-content';

export default async function PluginDetailPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;

  return <PluginDetailContent pluginId={pluginId} />;
}
