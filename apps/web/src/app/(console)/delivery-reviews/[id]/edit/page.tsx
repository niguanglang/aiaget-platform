import { DeliveryReviewEditContent } from '@/components/delivery-reviews/delivery-review-edit-content';

export default async function DeliveryReviewEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DeliveryReviewEditContent reviewId={id} />;
}
