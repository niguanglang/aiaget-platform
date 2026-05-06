import { PromptEditContent } from '@/components/prompts/prompt-edit-content';

export default async function PromptEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PromptEditContent promptId={id} />;
}
