import { TenantDetailContent } from '@/components/tenants/tenant-detail-content';

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TenantDetailContent tenantId={id} />;
}
