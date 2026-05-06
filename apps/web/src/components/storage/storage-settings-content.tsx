'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, HardDrive, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ensureStorageBucket, getStorageSettings } from '@/lib/api-client';

import {
  formatDateTime,
  InfoRow,
  invalidateStorage,
  PageMessage,
  RefreshButton,
  statusLabels,
  storageTone,
  StorageWorkspaceHeader,
} from './storage-shared';

export function StorageSettingsContent() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['storage-settings'],
    queryFn: getStorageSettings,
  });

  const ensureBucketMutation = useMutation({
    mutationFn: ensureStorageBucket,
    onSuccess: async () => {
      await invalidateStorage(queryClient);
    },
  });

  const settings = settingsQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:px-6">
      <StorageWorkspaceHeader
        actions={
          <RefreshButton loading={settingsQuery.isFetching} onClick={() => void settingsQuery.refetch()} />
        }
        backHref="/storage"
        badge="存储设置"
        description="集中查看 MinIO 连接、桶状态和访问密钥掩码，并在控制面完成桶验证或创建。"
        title="存储设置"
      />

      {ensureBucketMutation.isSuccess ? (
        <PageMessage
          tone="success"
          value={
            ensureBucketMutation.data.bucket_created
              ? `已创建桶 ${ensureBucketMutation.data.bucket}。`
              : `桶 ${ensureBucketMutation.data.bucket} 已可用。`
          }
        />
      ) : null}
      {settingsQuery.isError ? <PageMessage tone="error" value="存储设置加载失败。" /> : null}
      {ensureBucketMutation.isError ? <PageMessage tone="error" value={ensureBucketMutation.error.message} /> : null}

      <Card className="grid gap-5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="size-4 text-primary" />
            MinIO 连接配置
          </div>
          {settings ? (
            <StatusBadge tone={storageTone(settings.status)}>{statusLabels[settings.status]}</StatusBadge>
          ) : (
            <StatusBadge tone="loading">加载中</StatusBadge>
          )}
        </div>

        {settingsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">正在检测 MinIO 设置...</div>
        ) : !settings ? (
          <EmptyState description="无法读取存储设置，请确认后端存储配置。" title="设置不可用" />
        ) : (
          <div className="grid gap-5">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="供应商" value={settings.provider} />
              <InfoRow label="服务地址" value={settings.endpoint} />
              <InfoRow label="控制台地址" value={settings.console_url} />
              <InfoRow label="存储桶" value={settings.bucket} />
              <InfoRow label="区域" value={settings.region} />
              <InfoRow label="访问密钥" value={settings.access_key_masked} />
              <InfoRow label="路径样式" value={settings.force_path_style ? '启用' : '关闭'} />
              <InfoRow label="桶状态" value={settings.bucket_exists ? '已就绪' : '未就绪'} />
              <InfoRow label="最近检测" value={formatDateTime(settings.last_checked_at)} />
            </section>

            {settings.error_message ? <PageMessage tone="error" value={settings.error_message} /> : null}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                disabled={ensureBucketMutation.isPending}
                onClick={() => ensureBucketMutation.mutate()}
                type="button"
              >
                <HardDrive className="size-4" />
                {ensureBucketMutation.isPending ? '正在验证...' : '验证 / 创建桶'}
              </Button>
              <Button asChild type="button" variant="outline">
                <a href={settings.console_url} rel="noreferrer" target="_blank">
                  <ExternalLink className="size-4" />
                  打开控制台
                </a>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
