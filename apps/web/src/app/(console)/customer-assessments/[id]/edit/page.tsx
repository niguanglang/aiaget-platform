import { CustomerAssessmentEditContent } from '@/components/customer-assessments/customer-assessment-edit-content';

export default async function CustomerAssessmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CustomerAssessmentEditContent assessmentId={id} />;
}
