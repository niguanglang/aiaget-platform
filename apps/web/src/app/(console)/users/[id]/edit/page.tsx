import { UserEditContent } from '@/components/users/user-edit-content';

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <UserEditContent userId={id} />;
}
