import { SolutionPackageEditContent } from '@/components/solution-packages/solution-package-edit-content';

export default async function SolutionPackageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SolutionPackageEditContent packageId={id} />;
}
