'use client';

import { hasPermission, type KnowledgeBaseDetail } from '@aiaget/shared-types';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { knowledgeStatusLabel, knowledgeStatusTone, knowledgeVisibilityLabel } from '@/components/knowledge/knowledge-status';

export function useKnowledgeWritePermission() {
  const { currentUser } = useAuth();

  return Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:manage'),
  );
}

export function KnowledgeWorkspaceHeader({
  actions,
  base,
  description,
  eyebrow = '知识库中心',
  title,
}: {
  actions?: ReactNode;
  base?: KnowledgeBaseDetail | null;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="min-w-0">
        <Button asChild className="mb-4 w-fit" size="sm" variant="outline">
          <Link href="/knowledge">
            <ArrowLeft className="size-4" />
            知识库中心
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">{eyebrow}</StatusBadge>
          {base ? <StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge> : null}
          {base ? <StatusBadge tone="planned">{knowledgeVisibilityLabel(base.visibility)}</StatusBadge> : null}
          <StatusBadge tone="healthy">MinIO 原文</StatusBadge>
          <StatusBadge tone="healthy">Qdrant</StatusBadge>
          <StatusBadge tone="healthy">OpenSearch</StatusBadge>
        </div>
        <h1 className="break-words text-2xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function RefreshButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <Button disabled={loading} onClick={onClick} type="button" variant="outline">
      <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
      刷新
    </Button>
  );
}

export function PageMessage({ tone, value }: { tone: 'success' | 'error'; value: string }) {
  return (
    <div
      className={
        tone === 'success'
          ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
          : 'rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'
      }
    >
      {value}
    </div>
  );
}

export function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

export function ConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <Card className="w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </section>
  );
}

export function KnowledgeConfirmDialog(props: Parameters<typeof ConfirmDialog>[0]) {
  return <ConfirmDialog {...props} />;
}

export function formatStoragePath(value: string | null) {
  if (!value) return '-';
  return value.replace(/^minio:\/\/[^/]+\//, '');
}

export function hasActiveKnowledgeBackgroundWork(base: KnowledgeBaseDetail | null) {
  if (!base) return false;

  return (
    base.documents.some((document) => document.status === 'PROCESSING') ||
    base.tasks.some((task) => task.status === 'PENDING' || task.status === 'RUNNING')
  );
}
