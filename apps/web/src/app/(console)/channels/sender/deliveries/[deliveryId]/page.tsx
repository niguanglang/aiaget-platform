import { ChannelSenderDeliveryDetailContent } from '@/components/channels/channel-sender-delivery-detail-content';

export default async function ChannelSenderDeliveryDetailPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;

  return <ChannelSenderDeliveryDetailContent deliveryId={deliveryId} />;
}
