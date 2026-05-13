'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ToolApprovalListItem, ToolApprovalStatus, ToolCallTriggerSource } from '@aiaget/shared-types';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  approvalStatusLabel,
  approvalStatusTone,
  executionStatusLabel,
  executionStatusTone,
  triggerSourceLabel,
} from '@/components/approvals/approval-status';
import {
  ApprovalAuditTimeline,
  ApprovalPageShell,
  CardSection,
  DecisionActions,
  DetailRow,
  EmptyApprovalSelection,
  ErrorBanner,
  formatDateTime,
  formatLatency,
  LoadingBlock,
  PreviewCard,
  useApprovalCanHandle,
} from '@/components/approvals/approval-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveToolApproval,
  getToolApproval,
  getToolApprovalOverview,
  listToolApprovals,
  rejectToolApproval,
} from '@/lib/api-client';

const approvalStatuses: ToolApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const triggerSources: ToolCallTriggerSource[] = ['TEST', 'RUNTIME'];

export function ToolApprovalsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const canWrite = useApprovalCanHandle();
  const [keyword, setKeyword] = useState('');
  const [statusValue, setStatusValue] = useState<ToolApprovalStatus | ''>('PENDING');
  const [triggerSource, setTriggerSource] = useState<ToolCallTriggerSource | ''>('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

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
  const activeApprovalId = selectedApprovalId ?? searchParams.get('requestId') ?? approvals[0]?.id ?? null;

  const selectedApprovalQuery = useQuery({
    enabled: Boolean(activeApprovalId),
    queryKey: ['tool-approval', activeApprovalId],
    queryFn: () => getToolApproval(activeApprovalId ?? ''),
  });

  useEffect(() => {
    setDecisionNote('');
    setActionError(null);
  }, [activeApprovalId]);

  const approveMutation = useMutation({
    mutationFn: (approvalId: string) => approveToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (approvalId: string) => rejectToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });

  return (
    <ApprovalPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/approvals">
              <ArrowLeft className="size-4" />
              审批中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">高危工具审批</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'planned'}>{canWrite ? '可处理' : '查看模式'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">高危工具审批</h1>
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
          <RefreshCw className="size-4" />
          刷新数据
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard helper="当前队列" label="待审批" value={`${overviewQuery.data?.pending_count ?? 0}`} />
        <MetricCard helper="累计记录" label="已通过" value={`${overviewQuery.data?.approved_count ?? 0}`} />
        <MetricCard helper="累计记录" label="已拒绝" value={`${overviewQuery.data?.rejected_count ?? 0}`} />
        <MetricCard helper="会话触发" label="运行时待审批" value={`${overviewQuery.data?.runtime_pending_count ?? 0}`} />
        <MetricCard helper="工具测试" label="测试待审批" value={`${overviewQuery.data?.test_pending_count ?? 0}`} />
      </section>

      <ErrorBanner message={actionError} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <CardSection description="按工具、会话、申请人、状态和来源筛选待处理请求。" title="工具审批队列">
          <ToolApprovalFilters
            keyword={keyword}
            onChangeKeyword={setKeyword}
            onChangeStatus={setStatusValue}
            onChangeTriggerSource={setTriggerSource}
            onReset={() => {
              setKeyword('');
              setStatusValue('PENDING');
              setTriggerSource('');
            }}
            statusValue={statusValue}
            triggerSource={triggerSource}
          />
          {approvalsQuery.isError ? (
            <LoadingBlock>工具审批列表加载失败。</LoadingBlock>
          ) : approvalsQuery.isLoading ? (
            <LoadingBlock>正在加载工具审批队列...</LoadingBlock>
          ) : approvals.length === 0 ? (
            <EmptyState description="当前筛选条件下没有工具审批请求。" title="暂无工具审批" />
          ) : (
            <ToolApprovalTable approvals={approvals} onSelect={setSelectedApprovalId} />
          )}
        </CardSection>

        <ToolApprovalDetailPanel
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
    </ApprovalPageShell>
  );
}

function ToolApprovalFilters({
  keyword,
  onChangeKeyword,
  onChangeStatus,
  onChangeTriggerSource,
  onReset,
  statusValue,
  triggerSource,
}: {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onChangeStatus: (value: ToolApprovalStatus | '') => void;
  onChangeTriggerSource: (value: ToolCallTriggerSource | '') => void;
  onReset: () => void;
  statusValue: ToolApprovalStatus | '';
  triggerSource: ToolCallTriggerSource | '';
}) {
  return (
    <div className="grid gap-2 border-b p-4 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_auto]">
      <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          onChange={(event) => onChangeKeyword(event.target.value)}
          placeholder="搜索工具、会话、申请人"
          value={keyword}
        />
      </label>
      <select
        className="h-9 rounded-md border bg-background/80 px-3 text-sm"
        onChange={(event) => onChangeStatus(event.target.value as ToolApprovalStatus | '')}
        value={statusValue}
      >
        <option value="">全部状态</option>
        {approvalStatuses.map((status) => (
          <option key={status} value={status}>
            {approvalStatusLabel(status)}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border bg-background/80 px-3 text-sm"
        onChange={(event) => onChangeTriggerSource(event.target.value as ToolCallTriggerSource | '')}
        value={triggerSource}
      >
        <option value="">全部来源</option>
        {triggerSources.map((source) => (
          <option key={source} value={source}>
            {triggerSourceLabel(source)}
          </option>
        ))}
      </select>
      <Button onClick={onReset} type="button" variant="outline">
        清空
      </Button>
    </div>
  );
}

function ToolApprovalTable({
  approvals,
  onSelect,
}: {
  approvals: ToolApprovalListItem[];
  onSelect: (approvalId: string) => void;
}) {
  return (
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
          {approvals.map((approval) => (
            <tr
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
              key={approval.id}
              onClick={() => onSelect(approval.id)}
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
                <StatusBadge tone={executionStatusTone(approval.execution_status)}>
                  {executionStatusLabel(approval.execution_status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{approval.requested_by?.email ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{approval.conversation_title ?? approval.request_url}</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">{approval.agent_name ?? '无会话上下文'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolApprovalDetailPanel({
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
        <h2 className="text-sm font-semibold">工具审批详情</h2>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">正在加载工具审批详情...</div>
      ) : !detail ? (
        <EmptyApprovalSelection description="选择一条工具审批请求。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={approvalStatusTone(detail.status)}>{approvalStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={executionStatusTone(detail.execution_status)}>{executionStatusLabel(detail.execution_status)}</StatusBadge>
            <StatusBadge tone="planned">{triggerSourceLabel(detail.trigger_source)}</StatusBadge>
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="工具" value={detail.tool_name} />
            <DetailRow label="会话" value={detail.conversation_title} />
            <DetailRow label="智能体" value={detail.agent_name} />
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
          <ApprovalAuditTimeline events={detail.audit_timeline} />

          <DecisionActions
            approveLabel="批准并执行"
            canWrite={canWrite}
            decisionNote={decisionNote}
            disabled={detail.status !== 'PENDING'}
            onApprove={() => onApprove(detail.id)}
            onChangeDecisionNote={onChangeDecisionNote}
            onReject={() => onReject(detail.id)}
            pending={pending}
            placeholder="补充审批备注，可用于说明放行原因或拒绝原因..."
            rejectLabel="拒绝请求"
          />
        </>
      )}
    </Card>
  );
}
