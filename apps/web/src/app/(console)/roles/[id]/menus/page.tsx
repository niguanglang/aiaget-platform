import { RoleMenusContent } from '@/components/roles/role-menus-content';

export default async function RoleMenusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RoleMenusContent roleId={id} />;
}
