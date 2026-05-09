import { DeliveryAssetDetailContent } from '@/components/delivery-assets/delivery-asset-detail-content';

export default async function DeliveryAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DeliveryAssetDetailContent assetId={id} />;
}
