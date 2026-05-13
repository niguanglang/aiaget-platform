'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Eye, Folder, Search, Settings2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { getStorageSettings, listStorageObjects } from '@/lib/api-client';

import {
  formatBytes,
  formatDateTime,
  RefreshButton,
  statusLabels,
  storageObjectDetailHref,
  StorageWorkspaceHeader,
} from './storage-shared';

export function StorageContent() {
  const [keyword, setKeyword] = useState('');
  const [prefix, setPrefix] = useState('');

  const settingsQuery = useQuery({
    queryKey: ['storage-settings'],
    queryFn: getStorageSettings,
  });

  const objectsQuery = useQuery({
    queryKey: ['storage-objects', keyword, prefix],
    queryFn: () =>
      listStorageObjects({
        page: 1,
        page_size: 50,
        keyword,
        prefix,
      }),
  });

  const settings = settingsQuery.data ?? null;
  const objects = objectsQuery.data?.items ?? [];
  const summary = objectsQuery.data?.summary ?? null;

  const metrics = useMemo(
    () => [
      {
        helper: '当前租户前缀',
        label: '文件对象',
        value: summary ? `${summary.object_count}` : '--',
      },
      {
        helper: 'MinIO 对象容量',
        label: '总容量',
        value: summary ? formatBytes(summary.total_size_bytes) : '--',
      },
      {
        helper: settings?.bucket ?? '未配置',
        label: '桶状态',
        value: settings?.bucket_exists ? '可用' : '未就绪',
      },
      {
        helper: settings?.endpoint ?? '等待检测',
        label: '连接状态',
        value: settings ? statusLabels[settings.status] : '--',
      },
    ],
    [settings, summary],
  );

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
        <StorageWorkspaceHeader
          actions={
            <>
              <RefreshButton
                loading={settingsQuery.isFetching || objectsQuery.isFetching}
                onClick={() => {
                  void settingsQuery.refetch();
                  void objectsQuery.refetch();
                }}
              />
              <Button asChild variant="outline">
                <Link href="/storage/settings">
                  <Settings2 className="size-4" />
                  存储设置
                </Link>
              </Button>
              <Button asChild>
                <Link href="/storage/upload">
                  <UploadCloud className="size-4" />
                  上传文件
                </Link>
              </Button>
            </>
          }
          badge="文件对象"
          description="管理当前租户在 MinIO 中的文件对象，支持查询、筛选、容量概览、文件查看和存储配置。"
          title="文件存储中心"
        />
      </motion.div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-semibold">文件对象列表</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                查看当前租户前缀下的对象，按文件名、目录、大小和更新时间快速定位文件。
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              显示 {objects.length} / {objectsQuery.data?.total ?? 0}
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_220px_auto]">
            <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索文件名或路径"
                value={keyword}
              />
            </label>
            <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
              <Folder className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setPrefix(event.target.value)}
                placeholder="目录前缀，如 uploads"
                value={prefix}
              />
            </label>
            <Button
              onClick={() => {
                setKeyword('');
                setPrefix('');
              }}
              type="button"
              variant="outline"
            >
              清空
            </Button>
          </div>
        </div>

        {objectsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">文件列表加载失败。</div>
        ) : objectsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载文件列表...</div>
        ) : objects.length === 0 ? (
          <EmptyState description="当前筛选条件下没有文件对象。" title="暂无文件" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件名', '目录', '大小', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objects.map((item, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={item.key}
                    transition={{ delay: index * 0.02, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.file_name}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">{item.relative_key}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.folder || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(item.size_bytes)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.last_modified)}</td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={storageObjectDetailHref(item)}>
                          <Eye className="size-4" />
                          查看详情
                        </Link>
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
