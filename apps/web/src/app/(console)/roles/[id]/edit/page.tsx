import { RoleEditContent } from '@/components/roles/role-edit-content';

export default async function RoleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RoleEditContent roleId={id} />;
}
