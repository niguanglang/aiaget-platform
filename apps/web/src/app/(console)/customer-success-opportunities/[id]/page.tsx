import { CustomerSuccessOpportunityDetailContent } from '@/components/customer-success-opportunities/customer-success-opportunity-detail-content';

export default async function CustomerSuccessOpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessOpportunityDetailContent opportunityId={id} />;
}
