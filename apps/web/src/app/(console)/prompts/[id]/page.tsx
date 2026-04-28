import { PromptDetailContent } from '@/components/prompts/prompt-detail-content';

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PromptDetailContent promptId={id} />;
}
