'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApprovalAuditArchiveItem } from '@aiaget/shared-types';
import { ArrowLeft, Download, FilePlus2, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { formatBytes, formatDateTime } from '@/components/approval-audits/approval-audit-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
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
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] });
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" variant="outline">
            <Link href="/approval-audits">
              <ArrowLeft className="size-4" />
              返回审批审计
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M80</StatusBadge>
            <StatusBadge tone="planned">MinIO 归档</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批审计归档</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            集中管理审批审计 CSV 归档文件，下载留痕文件或提交删除审批申请。
          </p>
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
        <MetricCard helper="对象存储文件" label="归档文件" value={`${archivesQuery.data?.summary.archive_count ?? 0}`} />
        <MetricCard helper="CSV 总容量" label="归档容量" value={formatBytes(archivesQuery.data?.summary.total_size_bytes ?? 0)} />
        <MetricCard helper="当前列表" label="展示数量" value={`${archives.length}`} />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">归档文件列表</h2>
          <p className="mt-1 text-sm text-muted-foreground">删除归档不会直接执行，会创建归档删除审批记录。</p>
        </div>
        {archivesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">审批审计归档加载失败。</div>
        ) : archivesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载归档文件...</div>
        ) : archives.length === 0 ? (
          <EmptyState description="前往生成归档页面后，当前筛选结果会保存为 CSV 文件。" title="暂无审批审计归档" />
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
                          onClick={() => {
                            if (window.confirm(`确认申请删除归档 ${archive.file_name}？该操作需要审批后生效。`)) {
                              deleteArchiveMutation.mutate(archive);
                            }
                          }}
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
    </main>
  );
}

