import { ModelProviderDetailContent } from '@/components/models/model-provider-detail-content';

export default async function ModelProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ModelProviderDetailContent providerId={id} />;
}
