import { CustomerSuccessPlanEditContent } from '@/components/customer-success-plans/customer-success-plan-edit-content';

export default async function CustomerSuccessPlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessPlanEditContent planId={id} />;
}
