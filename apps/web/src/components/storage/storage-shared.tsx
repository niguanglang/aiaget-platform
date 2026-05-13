'use client';

import type { StorageConnectionStatus, StorageObjectItem } from '@aiaget/shared-types';
import { hasPermission } from '@aiaget/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export const statusLabels: Record<StorageConnectionStatus, string> = {
  CONNECTED: '已连接',
  DEGRADED: '降级',
  UNAVAILABLE: '不可用',
};

export function storageTone(status: StorageConnectionStatus) {
  if (status === 'CONNECTED') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

export function storageObjectDetailHref(item: Pick<StorageObjectItem, 'relative_key' | 'key'> | string) {
  const key = typeof item === 'string' ? item : item.relative_key || item.key;
  const segments = key.split('/').filter(Boolean).map((segment) => encodeURIComponent(segment));
  return `/storage/objects/${segments.join('/')}`;
}

export function decodeStorageObjectKey(segments: string[]) {
  return segments.map((segment) => decodeURIComponent(segment)).join('/');
}

export function useStoragePermissions() {
  const { currentUser } = useAuth();
  const roles = currentUser?.user.roles ?? [];
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = roles.some((role) => role.code === 'tenant_admin');

  return {
    canManage: isTenantAdmin || hasPermission(permissions, 'storage:object:manage'),
    canView: isTenantAdmin || hasPermission(permissions, 'storage:object:view'),
  };
}

export async function invalidateStorage(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['storage-settings'] }),
    queryClient.invalidateQueries({ queryKey: ['storage-objects'] }),
  ]);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败。'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function StorageWorkspaceHeader({
  actions,
  backHref,
  badge,
  title,
	}: {
	  actions?: ReactNode;
	  backHref?: string;
	  badge: string;
	  title: string;
	}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        {backHref ? (
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              文件存储
            </Link>
          </Button>
        ) : null}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">{badge}</StatusBadge>
          <StatusBadge tone="healthy">MinIO</StatusBadge>
          <StatusBadge tone="planned">对象存储</StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function RefreshButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <Button disabled={loading} onClick={onClick} type="button" variant="outline">
      <RefreshCw className={cn('size-4', loading ? 'animate-spin' : '')} />
      刷新
    </Button>
  );
}

export function PageMessage({ tone, value }: { tone: 'success' | 'error'; value: string }) {
  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {value}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

export function ConfirmCard({
  body,
  cancelLabel = '取消',
  confirmLabel = '确认',
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4">
      <div className="text-sm font-medium text-destructive">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
          {pending ? '处理中...' : confirmLabel}
        </Button>
        <Button onClick={onCancel} type="button" variant="outline">
          {cancelLabel}
        </Button>
      </div>
    </Card>
  );
}
