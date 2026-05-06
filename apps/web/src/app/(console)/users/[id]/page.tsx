import { UserDetailContent } from '@/components/users/user-detail-content';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <UserDetailContent userId={id} />;
}
