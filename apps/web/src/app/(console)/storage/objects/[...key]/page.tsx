import { StorageObjectDetailContent } from '@/components/storage/storage-object-detail-content';
import { decodeStorageObjectKey } from '@/components/storage/storage-shared';

export default async function StorageObjectDetailPage({ params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;

  return <StorageObjectDetailContent objectKey={decodeStorageObjectKey(key)} />;
}
