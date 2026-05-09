import { ChannelReplyDetailContent } from '@/components/channels/channel-reply-detail-content';

export default async function ChannelReplyDetailPage({ params }: { params: Promise<{ replyId: string }> }) {
  const { replyId } = await params;

  return <ChannelReplyDetailContent replyId={replyId} />;
}
