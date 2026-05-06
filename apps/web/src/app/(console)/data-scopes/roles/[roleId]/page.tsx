import { DataScopeDetailContent } from '@/components/data-scopes/data-scope-detail-content';

export default async function DataScopeRoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;

  return <DataScopeDetailContent roleId={roleId} />;
}
