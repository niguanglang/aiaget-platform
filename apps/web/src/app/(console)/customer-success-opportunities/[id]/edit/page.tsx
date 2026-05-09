import { CustomerSuccessOpportunityEditContent } from '@/components/customer-success-opportunities/customer-success-opportunity-edit-content';

export default async function CustomerSuccessOpportunityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessOpportunityEditContent opportunityId={id} />;
}
