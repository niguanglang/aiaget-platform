import { TenantEditContent } from '@/components/tenants/tenant-edit-content';

export default async function TenantEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TenantEditContent tenantId={id} />;
}
