'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft, CheckCircle2, Download, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AgentTeamConfirmDialog } from '@/components/agent-teams/agent-team-confirm-dialog';
import {
  archiveApprovalStatusLabel,
  archiveApprovalStatusTone,
  formatBytes,
  formatDateTime,
  formatInteger,
  nullableText,
} from '@/components/agent-teams/agent-teams-shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveAgentTeamRunReportArchiveApproval,
  deleteAgentTeamRunReportArchive,
  getAgentTeamRunReportArchiveDownloadUrl,
  listAgentTeamRunReportArchiveApprovals,
  listAgentTeamRunReportArchives,
  rejectAgentTeamRunReportArchiveApproval,
  type ApiClientError,
} from '@/lib/api-client';

type ArchiveDeleteTarget = {
  id: string;
  fileName: string;
};

type ApprovalDecisionTarget = {
  id: string;
  fileName: string;
  decision: 'APPROVE' | 'REJECT';
};

export function AgentTeamReportArchivesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [decisionNote, setDecisionNote] = useState('');
  const [archiveDeleteTarget, setArchiveDeleteTarget] = useState<ArchiveDeleteTarget | null>(null);
  const [approvalDecisionTarget, setApprovalDecisionTarget] = useState<ApprovalDecisionTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canReview = isTenantAdmin || hasPermission(permissions, 'security:approval:handle');

  const archivesQuery = useQuery({
    queryKey: ['agent-team-run-report-archives'],
    queryFn: listAgentTeamRunReportArchives,
  });
  const approvalsQuery = useQuery({
    queryKey: ['agent-team-run-report-archive-approvals'],
    queryFn: listAgentTeamRunReportArchiveApprovals,
  });

  const downloadMutation = useMutation({
    mutationFn: getAgentTeamRunReportArchiveDownloadUrl,
    onSuccess: (result) => {
      window.location.href = result.url;
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAgentTeamRunReportArchive,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
      ]);
      setArchiveDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const approveMutation = useMutation({
    mutationFn: (approvalId: string) => approveAgentTeamRunReportArchiveApproval(approvalId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
      ]);
      setDecisionNote('');
      setApprovalDecisionTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const rejectMutation = useMutation({
    mutationFn: (approvalId: string) => rejectAgentTeamRunReportArchiveApproval(approvalId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] });
      setDecisionNote('');
      setApprovalDecisionTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const archives = archivesQuery.data?.items ?? [];
  const approvals = approvalsQuery.data ?? [];

  function confirmApprovalDecision() {
    if (!approvalDecisionTarget) return;

    if (approvalDecisionTarget.decision === 'APPROVE') {
      approveMutation.mutate(approvalDecisionTarget.id);
      return;
    }

    rejectMutation.mutate(approvalDecisionTarget.id);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/agent-teams"><ArrowLeft className="size-4" />Agent 团队</Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">报告归档</StatusBadge>
            <StatusBadge tone={canReview ? 'healthy' : 'planned'}>{canReview ? '可审批' : '查看模式'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Agent 团队报告归档</h1>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard helper={''} label="归档数" value={formatInteger(archivesQuery.data?.summary.archive_count ?? archives.length)} />
        <MetricCard helper={''} label="总大小" value={formatBytes(archivesQuery.data?.summary.total_size_bytes ?? 0)} />
        <MetricCard helper={''} label="待审批" value={formatInteger(approvals.filter((item) => item.status === 'PENDING').length)} />
      </section>

      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">归档文件</h2>
          <p className="mt-1 text-sm text-muted-foreground">下载运行报告，或发起删除审批。</p>
        </div>
        {archivesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">报告归档加载失败。</div>
        ) : archivesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载报告归档...</div>
        ) : archives.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">暂无报告归档。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件', '团队', '运行目标', '大小', '更新时间', '创建人', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr className="border-b last:border-0" key={archive.id}>
                    <td className="px-4 py-3"><div className="font-medium">{archive.file_name}</div><div className="text-xs text-muted-foreground">{archive.key}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{archive.team_name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{archive.run_objective ?? '-'}</td>
                    <td className="px-4 py-3">{formatBytes(archive.size_bytes)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{archive.created_by ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate(archive.id)} size="sm" title="下载" variant="outline"><Download className="size-4" /></Button>
                        <Button disabled={deleteMutation.isPending} onClick={() => setArchiveDeleteTarget({ id: archive.id, fileName: archive.file_name })} size="sm" title="申请删除" variant="destructive"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">删除审批</h2>
          <p className="mt-1 text-sm text-muted-foreground">处理报告归档删除申请。</p>
        </div>
        <div className="border-b p-4">
          <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none" onChange={(event) => setDecisionNote(event.target.value)} placeholder="审批意见（可选）" value={decisionNote} />
        </div>
        {approvalsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">归档审批加载失败。</div>
        ) : approvalsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载归档审批...</div>
        ) : approvals.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">暂无删除审批。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件', '状态', '原因', '申请人', '审批人', '申请时间', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr className="border-b last:border-0" key={approval.id}>
                    <td className="px-4 py-3"><div className="font-medium">{approval.archive_file_name}</div><div className="text-xs text-muted-foreground">{formatBytes(approval.archive_size_bytes)}</div></td>
                    <td className="px-4 py-3"><StatusBadge tone={archiveApprovalStatusTone(approval.status)}>{archiveApprovalStatusLabel(approval.status)}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{approval.reason ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{approval.requested_by?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{approval.reviewed_by?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.requested_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button disabled={!canReview || approval.status !== 'PENDING' || approveMutation.isPending} onClick={() => setApprovalDecisionTarget({ id: approval.id, fileName: approval.archive_file_name, decision: 'APPROVE' })} size="sm" title="通过" variant="outline"><CheckCircle2 className="size-4" /></Button>
                        <Button disabled={!canReview || approval.status !== 'PENDING' || rejectMutation.isPending} onClick={() => setApprovalDecisionTarget({ id: approval.id, fileName: approval.archive_file_name, decision: 'REJECT' })} size="sm" title="拒绝" variant="outline"><XCircle className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {archiveDeleteTarget ? (
        <AgentTeamConfirmDialog
          body={`确认申请删除报告归档「${archiveDeleteTarget.fileName}」？该操作会进入删除审批流程，审批通过后才会删除文件。`}
          confirmLabel="确认申请"
          onCancel={() => setArchiveDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(archiveDeleteTarget.id)}
          pending={deleteMutation.isPending}
          title="申请删除报告归档？"
        />
      ) : null}

      {approvalDecisionTarget ? (
        <AgentTeamConfirmDialog
          body={
            approvalDecisionTarget.decision === 'APPROVE'
              ? `确认通过「${approvalDecisionTarget.fileName}」的删除申请？通过后系统会继续执行归档删除流程。`
              : `确认拒绝「${approvalDecisionTarget.fileName}」的删除申请？申请将保留为拒绝状态。`
          }
          confirmLabel={approvalDecisionTarget.decision === 'APPROVE' ? '确认通过' : '确认拒绝'}
          onCancel={() => setApprovalDecisionTarget(null)}
          onConfirm={confirmApprovalDecision}
          pending={approvalDecisionTarget.decision === 'APPROVE' ? approveMutation.isPending : rejectMutation.isPending}
          title={approvalDecisionTarget.decision === 'APPROVE' ? '通过删除审批？' : '拒绝删除审批？'}
        />
      ) : null}
    </main>
  );
}
