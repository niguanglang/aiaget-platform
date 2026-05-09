import { CustomerAssessmentDetailContent } from '@/components/customer-assessments/customer-assessment-detail-content';

export default async function CustomerAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CustomerAssessmentDetailContent assessmentId={id} />;
}
