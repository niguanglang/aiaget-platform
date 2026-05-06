import { RoleDetailContent } from '@/components/roles/role-detail-content';

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RoleDetailContent roleId={id} />;
}
