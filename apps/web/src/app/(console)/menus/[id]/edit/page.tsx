import { MenuEditContent } from '@/components/menus/menu-edit-content';

export default async function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <MenuEditContent menuId={id} />;
}
