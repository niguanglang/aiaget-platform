import { MenuDetailContent } from '@/components/menus/menu-detail-content';

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <MenuDetailContent menuId={id} />;
}
