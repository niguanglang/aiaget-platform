'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type ToolApprovalStatus, type ToolCallTriggerSource } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { CheckCheck, Search, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  approvalStatusLabel,
  approvalStatusTone,
  executionStatusLabel,
  executionStatusTone,
  formatDateTime,
  formatLatency,
  triggerSourceLabel,
} from '@/components/approvals/approval-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ApiClientError,
  approveToolApproval,
  getToolApproval,
  getToolApprovalOverview,
  listToolApprovals,
  rejectToolApproval,
} from '@/lib/api-client';

const approvalStatuses: ToolApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const triggerSources: ToolCallTriggerSource[] = ['TEST', 'RUNTIME'];

export function ApprovalContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [statusValue, setStatusValue] = useState<ToolApprovalStatus | ''>('PENDING');
  const [triggerSource, setTriggerSource] = useState<ToolCallTriggerSource | ''>('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );

  const overviewQuery = useQuery({
    queryKey: ['tool-approval-overview'],
    queryFn: getToolApprovalOverview,
  });

  const approvalsQuery = useQuery({
    queryKey: ['tool-approvals', keyword, statusValue, triggerSource],
    queryFn: () =>
      listToolApprovals({
        page: 1,
        page_size: 40,
        keyword,
        status: statusValue || undefined,
        trigger_source: triggerSource || undefined,
      }),
  });

  const approvals = approvalsQuery.data?.items ?? [];
  const requestedApprovalId = searchParams.get('requestId');
  const activeApprovalId = selectedApprovalId ?? requestedApprovalId ?? approvals[0]?.id ?? null;

  const selectedApprovalQuery = useQuery({
    enabled: Boolean(activeApprovalId),
    queryKey: ['tool-approval', activeApprovalId],
    queryFn: () => getToolApproval(activeApprovalId ?? ''),
  });

  useEffect(() => {
    setDecisionNote('');
    setActionError(null);
  }, [activeApprovalId]);

  const metrics = useMemo(() => {
    const overview = overviewQuery.data;
    if (!overview) return [];

    return [
      { label: '待审批', value: `${overview.pending_count}`, helper: '当前队列' },
      { label: '已通过', value: `${overview.approved_count}`, helper: '累计记录' },
      { label: '已拒绝', value: `${overview.rejected_count}`, helper: '累计记录' },
      { label: '运行时待审批', value: `${overview.runtime_pending_count}`, helper: '会话触发' },
      { label: '测试待审批', value: `${overview.test_pending_count}`, helper: '工具测试' },
    ];
  }, [overviewQuery.data]);

  const approveMutation = useMutation({
    mutationFn: (approvalId: string) => approveToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['tool'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (approvalId: string) => rejectToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['tool'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M16</StatusBadge>
            <StatusBadge tone="healthy">真实审批</StatusBadge>
            <StatusBadge tone="planned">工具风险控制</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            集中处理高风险工具的待审批请求，覆盖测试调用与运行时调用，并保留完整请求上下文。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void approvalsQuery.refetch();
            void selectedApprovalQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          刷新数据
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">审批队列</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    优先处理待审批请求，查看请求来源、工具、上下文和当前执行状态。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {approvals.length} / {approvalsQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索工具、会话、申请人"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatusValue(event.target.value as ToolApprovalStatus | '')} value={statusValue}>
                  <option value="">全部状态</option>
                  {approvalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {approvalStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setTriggerSource(event.target.value as ToolCallTriggerSource | '')} value={triggerSource}>
                  <option value="">全部来源</option>
                  {triggerSources.map((source) => (
                    <option key={source} value={source}>
                      {triggerSourceLabel(source)}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => {
                    setKeyword('');
                    setStatusValue('PENDING');
                    setTriggerSource('');
                  }}
                  type="button"
                  variant="outline"
                >
                  清空
                </Button>
              </div>
            </div>
          </div>

          {approvalsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">审批列表加载失败。</div>
          ) : approvalsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载审批队列...</div>
          ) : approvals.length === 0 ? (
            <EmptyState description="当前筛选条件下没有审批请求。" title="暂无审批请求" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['时间', '工具', '来源', '审批状态', '执行状态', '申请人', '上下文'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={approval.id}
                      onClick={() => setSelectedApprovalId(approval.id)}
                      transition={{ delay: index * 0.02, duration: 0.22 }}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{approval.tool_name}</div>
                        <div className="text-xs text-muted-foreground">{approval.tool_code}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{triggerSourceLabel(approval.trigger_source)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={approvalStatusTone(approval.status)}>{approvalStatusLabel(approval.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={executionStatusTone(approval.execution_status)}>{executionStatusLabel(approval.execution_status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{approval.requested_by?.email ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{approval.conversation_title ?? approval.request_url}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {approval.agent_name ?? '无会话上下文'}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ApprovalDetailPanel
          canWrite={canWrite}
          decisionNote={decisionNote}
          detail={selectedApprovalQuery.data ?? null}
          loading={selectedApprovalQuery.isLoading}
          onApprove={(approvalId) => approveMutation.mutate(approvalId)}
          onChangeDecisionNote={setDecisionNote}
          onReject={(approvalId) => rejectMutation.mutate(approvalId)}
          pending={approveMutation.isPending || rejectMutation.isPending}
        />
      </section>
    </main>
  );
}

function ApprovalDetailPanel({
  canWrite,
  decisionNote,
  detail,
  loading,
  onApprove,
  onChangeDecisionNote,
  onReject,
  pending,
}: {
  canWrite: boolean;
  decisionNote: string;
  detail: Awaited<ReturnType<typeof getToolApproval>> | null;
  loading: boolean;
  onApprove: (approvalId: string) => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: (approvalId: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">审批详情</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          查看原始请求、执行结果和上下文后，决定是否继续执行当前工具调用。
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          正在加载审批详情...
        </div>
      ) : !detail ? (
        <EmptyState description="从左侧选择一条审批请求查看详情。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={approvalStatusTone(detail.status)}>{approvalStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={executionStatusTone(detail.execution_status)}>{executionStatusLabel(detail.execution_status)}</StatusBadge>
            <StatusBadge tone="planned">{triggerSourceLabel(detail.trigger_source)}</StatusBadge>
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="工具" value={detail.tool_name} />
            <DetailRow label="会话" value={detail.conversation_title ?? '-'} />
            <DetailRow label="智能体" value={detail.agent_name ?? '-'} />
            <DetailRow label="申请人" value={detail.requested_by ? `${detail.requested_by.name} (${detail.requested_by.email})` : '-'} />
            <DetailRow label="审批人" value={detail.reviewed_by ? `${detail.reviewed_by.name} (${detail.reviewed_by.email})` : '-'} />
            <DetailRow label="审批时间" value={formatDateTime(detail.reviewed_at)} />
            <DetailRow label="请求方法" value={detail.request_method} />
            <DetailRow label="请求地址" value={detail.request_url} />
            <DetailRow label="执行耗时" value={formatLatency(detail.latency_ms)} />
            <DetailRow label="响应状态" value={detail.response_status ? `HTTP ${detail.response_status}` : '-'} />
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文链接</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/tools/${detail.tool_id}`}>打开工具</Link>
              </Button>
              {detail.conversation_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/conversations/${detail.conversation_id}`}>打开会话</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {detail.reason ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">申请原因：</span>
              {detail.reason}
            </div>
          ) : null}

          {detail.error_message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {detail.error_message}
            </div>
          ) : null}

          <PreviewCard title="请求头" value={detail.request_headers} />
          <PreviewCard title="请求体" value={detail.request_body} />
          <PreviewCard title="响应头" value={detail.response_headers} />
          <PreviewCard title="响应体" value={detail.response_body} />

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="size-4 text-muted-foreground" />
              审批动作
            </div>
            <textarea
              className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={!canWrite || pending || detail.status !== 'PENDING'}
              onChange={(event) => onChangeDecisionNote(event.target.value)}
              placeholder="补充审批备注，可用于说明放行原因或拒绝原因..."
              value={decisionNote}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onApprove(detail.id)}
                type="button"
              >
                <CheckCheck className="size-4" />
                批准并执行
              </Button>
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onReject(detail.id)}
                type="button"
                variant="destructive"
              >
                <X className="size-4" />
                拒绝请求
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}
