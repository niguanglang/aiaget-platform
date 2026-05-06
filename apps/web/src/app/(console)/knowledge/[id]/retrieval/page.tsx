import { KnowledgeRetrievalContent } from '@/components/knowledge/knowledge-retrieval-content';

export default async function KnowledgeRetrievalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <KnowledgeRetrievalContent knowledgeId={id} />;
}
