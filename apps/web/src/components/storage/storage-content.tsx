'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  StorageConnectionStatus,
  StorageObjectItem,
  StorageSettings,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Copy,
  Download,
  ExternalLink,
  Folder,
  HardDrive,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteStorageObject,
  ensureStorageBucket,
  getStorageDownloadUrl,
  getStorageSettings,
  listStorageObjects,
  uploadStorageObject,
} from '@/lib/api-client';

const statusLabels: Record<StorageConnectionStatus, string> = {
  CONNECTED: '已连接',
  DEGRADED: '降级',
  UNAVAILABLE: '不可用',
};

function storageTone(status: StorageConnectionStatus) {
  if (status === 'CONNECTED') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

export function StorageContent() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [prefix, setPrefix] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('uploads');
  const [selectedObject, setSelectedObject] = useState<StorageObjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StorageObjectItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const ensureBucketMutation = useMutation({
    mutationFn: ensureStorageBucket,
    onSuccess: async (result) => {
      setErrorMessage(null);
      setMessage(result.bucket_created ? `已创建桶 ${result.bucket}。` : `桶 ${result.bucket} 已可用。`);
      await invalidateStorage(queryClient);
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('请选择要上传的文件。');
      }

      return uploadStorageObject({
        content_base64: await fileToBase64(selectedFile),
        content_type: selectedFile.type || 'application/octet-stream',
        file_name: selectedFile.name,
        folder: uploadFolder,
      });
    },
    onSuccess: async (result) => {
      setErrorMessage(null);
      setMessage(`已上传 ${result.item.file_name}。`);
      setSelectedFile(null);
      setSelectedObject(result.item);
      await invalidateStorage(queryClient);
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (target: StorageObjectItem) => deleteStorageObject(target.key),
    onSuccess: async () => {
      setMessage(deleteTarget ? `已删除 ${deleteTarget.file_name}。` : '文件已删除。');
      setErrorMessage(null);
      setSelectedObject(null);
      setDeleteTarget(null);
      await invalidateStorage(queryClient);
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (target: StorageObjectItem) => getStorageDownloadUrl(target.key),
    onSuccess: (result) => {
      setErrorMessage(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

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
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M24</StatusBadge>
            <StatusBadge tone="healthy">MinIO</StatusBadge>
            <StatusBadge tone="planned">对象存储</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">文件存储中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            接入 MinIO 对象存储，管理租户文件、桶初始化和存储连接设置，为知识库原始文件存储做准备。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void settingsQuery.refetch();
              void objectsQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button
            disabled={ensureBucketMutation.isPending}
            onClick={() => ensureBucketMutation.mutate()}
            type="button"
          >
            <HardDrive className="size-4" />
            初始化桶
          </Button>
        </div>
      </motion.section>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <StorageSettingsCard
          loading={settingsQuery.isLoading}
          onEnsureBucket={() => ensureBucketMutation.mutate()}
          settings={settings}
        />
        <UploadPanel
          folder={uploadFolder}
          isUploading={uploadMutation.isPending}
          onFileChange={setSelectedFile}
          onFolderChange={setUploadFolder}
          onUpload={() => uploadMutation.mutate()}
          selectedFile={selectedFile}
        />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">文件管理</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  仅展示当前租户前缀下的对象，删除和下载都会经过控制面权限校验。
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
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['文件名', '目录', '大小', 'ETag', '更新时间', '操作'].map((column) => (
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
                      onClick={() => setSelectedObject(item)}
                      transition={{ delay: index * 0.02, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.file_name}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{item.relative_key}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.folder || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatBytes(item.size_bytes)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.etag ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.last_modified)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadMutation.mutate(item);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Download className="size-4" />
                            下载
                          </Button>
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(item);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ObjectDetailPanel
          deleteTarget={deleteTarget}
          isDeleting={deleteMutation.isPending}
          object={selectedObject}
          onCancelDelete={() => setDeleteTarget(null)}
          onConfirmDelete={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
          onCopy={async (value) => {
            await navigator.clipboard.writeText(value);
            setMessage('路径已复制。');
          }}
          onDownload={(item) => downloadMutation.mutate(item)}
        />
      </section>
    </main>
  );
}

function StorageSettingsCard({
  loading,
  onEnsureBucket,
  settings,
}: {
  loading: boolean;
  onEnsureBucket: () => void;
  settings: StorageSettings | null;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings2 className="size-4 text-primary" />
          存储设置
        </div>
        {settings ? (
          <StatusBadge tone={storageTone(settings.status)}>{statusLabels[settings.status]}</StatusBadge>
        ) : (
          <StatusBadge tone="loading">加载中</StatusBadge>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在检测 MinIO 设置...</div>
      ) : !settings ? (
        <EmptyState description="无法读取存储设置。" title="设置不可用" />
      ) : (
        <div className="grid gap-3">
          <InfoRow label="供应商" value={settings.provider} />
          <InfoRow label="服务地址" value={settings.endpoint} />
          <InfoRow label="控制台地址" value={settings.console_url} />
          <InfoRow label="存储桶" value={settings.bucket} />
          <InfoRow label="区域" value={settings.region} />
          <InfoRow label="访问密钥" value={settings.access_key_masked} />
          <InfoRow label="路径样式" value={settings.force_path_style ? '启用' : '关闭'} />
          <InfoRow label="最近检测" value={formatDateTime(settings.last_checked_at)} />

          {settings.error_message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {settings.error_message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onEnsureBucket} type="button" variant="outline">
              <HardDrive className="size-4" />
              验证 / 创建桶
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
  );
}

function UploadPanel({
  folder,
  isUploading,
  onFileChange,
  onFolderChange,
  onUpload,
  selectedFile,
}: {
  folder: string;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onFolderChange: (value: string) => void;
  onUpload: () => void;
  selectedFile: File | null;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <UploadCloud className="size-4 text-primary" />
        上传文件
      </div>
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">目标目录</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition-colors focus:border-primary/50"
            onChange={(event) => onFolderChange(event.target.value)}
            placeholder="uploads"
            value={folder}
          />
        </label>
        <label className="grid gap-2 text-sm" htmlFor="storage-upload-file">
          <span className="font-medium">选择文件</span>
          <input
            className="sr-only"
            id="storage-upload-file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm transition-colors hover:border-primary/40">
            <span className="min-w-0 truncate text-muted-foreground">
              {selectedFile ? selectedFile.name : '点击选择本地文件'}
            </span>
            <span className="shrink-0 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              浏览
            </span>
          </span>
        </label>
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {selectedFile ? (
            <>
              <div className="font-medium text-foreground">{selectedFile.name}</div>
              <div className="mt-1">{formatBytes(selectedFile.size)} · {selectedFile.type || 'application/octet-stream'}</div>
            </>
          ) : (
            '请选择一个文件，单次 API 上传限制为 25MB。'
          )}
        </div>
        <Button disabled={!selectedFile || isUploading} onClick={onUpload} type="button">
          <UploadCloud className="size-4" />
          {isUploading ? '正在上传...' : '上传到 MinIO'}
        </Button>
      </div>
    </Card>
  );
}

function ObjectDetailPanel({
  deleteTarget,
  isDeleting,
  object,
  onCancelDelete,
  onConfirmDelete,
  onCopy,
  onDownload,
}: {
  deleteTarget: StorageObjectItem | null;
  isDeleting: boolean;
  object: StorageObjectItem | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCopy: (value: string) => void | Promise<void>;
  onDownload: (item: StorageObjectItem) => void;
}) {
  if (!object && !deleteTarget) {
    return (
      <Card className="grid gap-4 p-5">
        <EmptyState description="选择一个文件后，在这里查看路径、大小、ETag 和操作。" title="未选择文件" />
      </Card>
    );
  }

  const activeObject = deleteTarget ?? object;
  if (!activeObject) return null;

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="healthy">MinIO 对象</StatusBadge>
          <StatusBadge tone="planned">{activeObject.folder || '根目录'}</StatusBadge>
        </div>
        <h2 className="mt-3 break-words text-base font-semibold">{activeObject.file_name}</h2>
        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{activeObject.relative_key}</p>
      </div>

      <div className="grid gap-3 text-sm">
        <InfoRow label="目录" value={activeObject.folder || '-'} />
        <InfoRow label="大小" value={formatBytes(activeObject.size_bytes)} />
        <InfoRow label="ETag" value={activeObject.etag ?? '-'} />
        <InfoRow label="更新时间" value={formatDateTime(activeObject.last_modified)} />
      </div>

      {deleteTarget ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="text-sm font-medium text-destructive">确认删除这个文件？</div>
          <p className="mt-1 text-sm text-muted-foreground">删除后对象会从 MinIO 桶中移除。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={isDeleting} onClick={onConfirmDelete} type="button" variant="destructive">
              <Trash2 className="size-4" />
              {isDeleting ? '正在删除...' : '确认删除'}
            </Button>
            <Button onClick={onCancelDelete} type="button" variant="outline">
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onDownload(activeObject)} type="button">
            <Download className="size-4" />
            下载
          </Button>
          <Button onClick={() => void onCopy(activeObject.relative_key)} type="button" variant="outline">
            <Copy className="size-4" />
            复制路径
          </Button>
        </div>
      )}
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

async function invalidateStorage(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['storage-settings'] }),
    queryClient.invalidateQueries({ queryKey: ['storage-objects'] }),
  ]);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败。'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
