import { ToolEditContent } from '@/components/tools/tool-edit-content';

export default async function ToolEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ToolEditContent toolId={id} />;
}
