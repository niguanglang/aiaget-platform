import { CustomerSuccessPlanDetailContent } from '@/components/customer-success-plans/customer-success-plan-detail-content';

export default async function CustomerSuccessPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessPlanDetailContent planId={id} />;
}
