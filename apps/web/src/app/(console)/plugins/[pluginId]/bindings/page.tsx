import { PluginBindingsContent } from '@/components/plugins/plugin-bindings-content';

export default async function PluginBindingsPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;

  return <PluginBindingsContent pluginId={pluginId} />;
}
