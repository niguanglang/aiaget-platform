import { ToolDetailContent } from '@/components/tools/tool-detail-content';

export default async function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ToolDetailContent toolId={id} />;
}
