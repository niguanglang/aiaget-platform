import { DataScopeEditContent } from '@/components/data-scopes/data-scope-edit-content';

export default async function DataScopeRoleEditPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;

  return <DataScopeEditContent roleId={roleId} />;
}
