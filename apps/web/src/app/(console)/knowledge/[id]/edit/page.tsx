import { KnowledgeEditContent } from '@/components/knowledge/knowledge-edit-content';

export default async function KnowledgeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <KnowledgeEditContent knowledgeId={id} />;
}
