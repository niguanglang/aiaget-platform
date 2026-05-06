import { KnowledgeUploadContent } from '@/components/knowledge/knowledge-upload-content';

export default async function KnowledgeUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <KnowledgeUploadContent knowledgeId={id} />;
}
