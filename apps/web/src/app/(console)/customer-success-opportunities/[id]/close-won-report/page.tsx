import { CustomerSuccessOpportunityCloseWonReportContent } from '@/components/customer-success-opportunities/customer-success-opportunity-close-won-report-content';

export default async function CustomerSuccessOpportunityCloseWonReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerSuccessOpportunityCloseWonReportContent opportunityId={id} />;
}
