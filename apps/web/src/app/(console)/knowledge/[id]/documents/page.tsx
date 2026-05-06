import { KnowledgeDocumentsContent } from '@/components/knowledge/knowledge-documents-content';

export default async function KnowledgeDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <KnowledgeDocumentsContent knowledgeId={id} />;
}
