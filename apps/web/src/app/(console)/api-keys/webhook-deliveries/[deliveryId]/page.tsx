import { WebhookDeliveryDetailContent } from '@/components/api-keys/webhook-delivery-detail-content';

export default async function WebhookDeliveryDetailPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;

  return <WebhookDeliveryDetailContent deliveryId={decodeURIComponent(deliveryId)} />;
}
