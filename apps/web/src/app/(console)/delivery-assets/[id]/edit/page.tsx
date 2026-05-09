import { DeliveryAssetEditContent } from '@/components/delivery-assets/delivery-asset-edit-content';

export default async function DeliveryAssetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DeliveryAssetEditContent assetId={id} />;
}
