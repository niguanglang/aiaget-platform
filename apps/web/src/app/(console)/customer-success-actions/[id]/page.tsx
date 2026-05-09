import { CustomerSuccessActionDetailContent } from '@/components/customer-success-actions/customer-success-action-detail-content';

export default async function CustomerSuccessActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessActionDetailContent actionId={id} />;
}
