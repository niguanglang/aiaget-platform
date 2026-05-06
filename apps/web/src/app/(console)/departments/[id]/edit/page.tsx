import { DepartmentEditContent } from '@/components/departments/department-edit-content';

export default async function DepartmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DepartmentEditContent departmentId={id} />;
}

