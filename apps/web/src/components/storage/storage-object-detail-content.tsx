'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteStorageObject, getStorageDownloadUrl, listStorageObjects } from '@/lib/api-client';

import {
  ConfirmCard,
  formatBytes,
  formatDateTime,
  InfoRow,
  invalidateStorage,
  PageMessage,
  RefreshButton,
  StorageWorkspaceHeader,
  useStoragePermissions,
} from './storage-shared';

export function StorageObjectDetailContent({ objectKey }: { objectKey: string }) {
  const queryClient = useQueryClient();
  const storagePermissions = useStoragePermissions();
  const [message, setMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const objectQuery = useQuery({
    queryKey: ['storage-object-detail', objectKey],
    queryFn: () =>
      listStorageObjects({
        page: 1,
        page_size: 100,
        keyword: objectKey,
      }),
  });

  const object = useMemo(
    () => objectQuery.data?.items.find((item) => item.relative_key === objectKey || item.key === objectKey) ?? null,
    [objectKey, objectQuery.data?.items],
  );

  const downloadMutation = useMutation({
    mutationFn: () => getStorageDownloadUrl(object?.key ?? objectKey),
    onSuccess: (result) => {
      setMessage(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStorageObject(object?.key ?? objectKey),
    onSuccess: async () => {
      setDeleteConfirmOpen(false);
      setMessage('文件已删除。');
      await invalidateStorage(queryClient);
    },
  });

  const copyPath = async () => {
    await navigator.clipboard.writeText(object?.relative_key ?? objectKey);
    setMessage('路径已复制。');
  };

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <StorageWorkspaceHeader
	        actions={<RefreshButton loading={objectQuery.isFetching} onClick={() => void objectQuery.refetch()} />}
	        backHref="/storage"
	        badge="对象详情"
	        title="对象详情"
	      />

      {message ? <PageMessage tone="success" value={message} /> : null}
      {objectQuery.isError ? <PageMessage tone="error" value="对象详情加载失败。" /> : null}
      {downloadMutation.isError ? <PageMessage tone="error" value={downloadMutation.error.message} /> : null}
      {deleteMutation.isError ? <PageMessage tone="error" value={deleteMutation.error.message} /> : null}

      {objectQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载对象详情...</Card>
      ) : !object ? (
	        <EmptyState title="未找到对象" />
      ) : (
        <Card className="grid gap-5 p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="healthy">MinIO 对象</StatusBadge>
                <StatusBadge tone="planned">{object.folder || '根目录'}</StatusBadge>
                <StatusBadge tone={storagePermissions.canManage ? 'mock' : 'planned'}>
                  {storagePermissions.canManage ? '可管理' : '只读'}
                </StatusBadge>
              </div>
              <h2 className="mt-3 break-words text-lg font-semibold">{object.file_name}</h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{object.relative_key}</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/storage/upload">继续上传</Link>
            </Button>
          </div>

          <section className="grid gap-3 md:grid-cols-2">
            <InfoRow label="目录" value={object.folder || '-'} />
            <InfoRow label="大小" value={formatBytes(object.size_bytes)} />
            <InfoRow label="ETag" value={object.etag ?? '-'} />
            <InfoRow label="更新时间" value={formatDateTime(object.last_modified)} />
            <InfoRow label="对象 Key" value={object.key} />
            <InfoRow label="相对路径" value={object.relative_key} />
          </section>

          {deleteConfirmOpen ? (
            <ConfirmCard
              body="删除后对象会从 MinIO 桶中移除，知识库或归档引用可能无法继续下载。"
              confirmLabel="确认删除"
              onCancel={() => setDeleteConfirmOpen(false)}
              onConfirm={() => deleteMutation.mutate()}
              pending={deleteMutation.isPending}
              title="确认删除这个文件？"
            />
          ) : (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()} type="button">
                <Download className="size-4" />
                {downloadMutation.isPending ? '正在生成链接...' : '下载'}
              </Button>
              <Button onClick={() => void copyPath()} type="button" variant="outline">
                <Copy className="size-4" />
                复制路径
              </Button>
              <Button disabled={!storagePermissions.canManage} onClick={() => setDeleteConfirmOpen(true)} type="button" variant="outline">
                <Trash2 className="size-4" />
                删除
              </Button>
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
