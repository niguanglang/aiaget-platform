import { KnowledgeDetailContent } from '@/components/knowledge/knowledge-detail-content';

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <KnowledgeDetailContent knowledgeId={id} />;
}
