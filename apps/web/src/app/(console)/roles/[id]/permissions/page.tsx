import { RolePermissionsContent } from '@/components/roles/role-permissions-content';

export default async function RolePermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RolePermissionsContent roleId={id} />;
}
