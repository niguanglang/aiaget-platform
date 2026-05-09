import { DeliveryReviewDetailContent } from '@/components/delivery-reviews/delivery-review-detail-content';

export default async function DeliveryReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DeliveryReviewDetailContent reviewId={id} />;
}
