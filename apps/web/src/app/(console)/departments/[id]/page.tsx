import { DepartmentDetailContent } from '@/components/departments/department-detail-content';

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DepartmentDetailContent departmentId={id} />;
}

