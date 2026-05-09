import { ChannelAccountEditContent } from '@/components/channels/channel-account-edit-content';

export default async function ChannelAccountEditPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;

  return <ChannelAccountEditContent accountId={accountId} />;
}
