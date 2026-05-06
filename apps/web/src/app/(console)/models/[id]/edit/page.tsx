import { ModelProviderEditContent } from '@/components/models/model-provider-edit-content';

export default async function ModelProviderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ModelProviderEditContent providerId={id} />;
}
