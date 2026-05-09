import { CustomerSuccessActionEditContent } from '@/components/customer-success-actions/customer-success-action-edit-content';

export default async function CustomerSuccessActionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessActionEditContent actionId={id} />;
}
