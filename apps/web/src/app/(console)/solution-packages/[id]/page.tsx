import { SolutionPackageDetailContent } from '@/components/solution-packages/solution-package-detail-content';

export default async function SolutionPackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SolutionPackageDetailContent packageId={id} />;
}
