import { ChannelDeliveryDetailContent } from '@/components/channels/channel-delivery-detail-content';

export default async function ChannelDeliveryDetailPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;

  return <ChannelDeliveryDetailContent deliveryId={deliveryId} />;
}
