import { ChannelProviderEditContent } from '@/components/channels/channel-provider-edit-content';

export default async function ChannelProviderEditPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;

  return <ChannelProviderEditContent providerId={providerId} />;
}
