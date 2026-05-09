import { ChannelJobDetailContent } from '@/components/channels/channel-job-detail-content';

export default async function ChannelJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return <ChannelJobDetailContent jobId={jobId} />;
}
