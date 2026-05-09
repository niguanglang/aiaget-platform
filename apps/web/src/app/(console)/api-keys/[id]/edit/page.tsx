import { ApiKeyEditContent } from '@/components/api-keys/api-key-edit-content';

export default async function ApiKeyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApiKeyEditContent apiKeyId={id} />;
}
