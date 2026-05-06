import { PluginSecurityContent } from '@/components/plugins/plugin-security-content';

export default async function PluginSecurityPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;

  return <PluginSecurityContent pluginId={pluginId} />;
}
