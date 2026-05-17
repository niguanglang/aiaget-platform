'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApprovalAuditArchiveItem } from '@aiaget/shared-types';
import { ArrowLeft, Download, FilePlus2, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ApprovalAuditConfirmDialog,
  ApprovalAuditPageShell,
  ApprovalAuditSummaryTile,
  formatBytes,
  formatDateTime,
} from '@/components/approval-audits/approval-audit-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteApprovalAuditArchive,
  getApprovalAuditArchiveDownloadUrl,
  listApprovalAuditArchives,
} from '@/lib/api-client';

export function ApprovalAuditArchivesContent() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [archiveDeleteTarget, setArchiveDeleteTarget] = useState<ApprovalAuditArchiveItem | null>(null);
  const archivesQuery = useQuery({
    queryKey: ['approval-audit-archives'],
    queryFn: listApprovalAuditArchives,
  });
  const archives = archivesQuery.data?.items ?? [];

  const downloadArchiveMutation = useMutation({
    mutationFn: (archive: ApprovalAuditArchiveItem) => getApprovalAuditArchiveDownloadUrl(archive.id),
    onSuccess: (result) => {
      setErrorMessage(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const deleteArchiveMutation = useMutation({
    mutationFn: (archive: ApprovalAuditArchiveItem) => deleteApprovalAuditArchive(archive.id),
    onSuccess: async (result) => {
      setErrorMessage(null);
      setMessage(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      setArchiveDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] });
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  function confirmArchiveDeleteRequest() {
    if (!archiveDeleteTarget) return;
    deleteArchiveMutation.mutate(archiveDeleteTarget);
  }

  return (
    <ApprovalAuditPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" variant="outline">
            <Link href="/approval-audits">
              <ArrowLeft className="size-4" />
              返回审批审计
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">MinIO 归档</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批审计归档</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/approval-audits/archives/create">
              <FilePlus2 className="size-4" />
              生成归档
            </Link>
          </Button>
          <Button onClick={() => void archivesQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新归档
          </Button>
        </div>
      </section>

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div> : null}
      {errorMessage ? <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{errorMessage}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ApprovalAuditSummaryTile label="归档文件" value={`${archivesQuery.data?.summary.archive_count ?? 0}`} />
        <ApprovalAuditSummaryTile label="归档容量" value={formatBytes(archivesQuery.data?.summary.total_size_bytes ?? 0)} />
        <ApprovalAuditSummaryTile label="展示数量" value={`${archives.length}`} />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">归档文件列表</h2>
        </div>
        {archivesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">审批审计归档加载失败。</div>
        ) : archivesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载归档文件...</div>
        ) : archives.length === 0 ? (
          <EmptyState title="暂无审批审计归档" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件名', '目录', '大小', '更新时间', '对象路径', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr className="border-b last:border-0" key={archive.id}>
                    <td className="px-4 py-3 font-medium">{archive.file_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{archive.folder}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(archive.size_bytes)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{archive.key}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={downloadArchiveMutation.isPending} onClick={() => downloadArchiveMutation.mutate(archive)} size="sm" type="button" variant="outline">
                          <Download className="size-4" />
                          下载
                        </Button>
                        <Button
                          disabled={deleteArchiveMutation.isPending}
                          onClick={() => setArchiveDeleteTarget(archive)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="size-4" />
                          申请删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {archiveDeleteTarget ? (
        <ApprovalAuditConfirmDialog
          body={`这会为归档「${archiveDeleteTarget.file_name}」提交删除审批申请。审批通过前不会直接删除文件，审批通过后会清理对象存储归档并留下审计记录。`}
          confirmLabel="确认申请删除"
          pending={deleteArchiveMutation.isPending}
          title="确认申请删除审批审计归档"
          onCancel={() => setArchiveDeleteTarget(null)}
          onConfirm={confirmArchiveDeleteRequest}
        />
      ) : null}
    </ApprovalAuditPageShell>
  );
}
