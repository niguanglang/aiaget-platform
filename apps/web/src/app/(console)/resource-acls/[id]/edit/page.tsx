import { ResourceAclEditContent } from '@/components/resource-acls/resource-acl-edit-content';

export default async function ResourceAclEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ResourceAclEditContent resourceAclId={id} />;
}
