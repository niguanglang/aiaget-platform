'use client';

import {
  hasPermission,
  type ProductionReadinessCategory,
  type ProductionReadinessCheckItem,
  type ProductionReadinessStatus,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { SettingsPageShell, SettingsStatTile } from '@/components/settings/settings-shared';
import {
  acceptProductionReadinessCheck,
  getProductionReadinessOverview,
  type ApiClientError,
} from '@/lib/api-client';

const categoryAnchors: Record<ProductionReadinessCategory, string> = {
  ENVIRONMENT: 'environment',
  EXTERNAL_SERVICE: 'external-service',
  THIRD_PARTY: 'third-party',
  RELEASE_VALIDATION: 'release-validation',
  RISK: 'risk',
};

const categoryLabels: Record<ProductionReadinessCategory, string> = {
  ENVIRONMENT: '环境配置',
  EXTERNAL_SERVICE: '外部服务',
  THIRD_PARTY: '第三方联调',
  RELEASE_VALIDATION: '发布验收',
  RISK: '风险项',
};

export function ProductionReadinessContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [acceptanceDrafts, setAcceptanceDrafts] = useState<Record<string, string>>({});
  const [acceptanceErrors, setAcceptanceErrors] = useState<Record<string, string>>({});
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canAcceptReadiness = Boolean(isTenantAdmin || hasPermission(permissions, 'system:settings:manage'));
  const readinessQuery = useQuery({
    queryKey: ['production-readiness-overview'],
    queryFn: getProductionReadinessOverview,
  });
  const acceptMutation = useMutation({
    mutationFn: ({ checkId, note }: { checkId: string; note: string }) =>
      acceptProductionReadinessCheck(checkId, { note }),
    onSuccess: async (_, variables) => {
      setAcceptanceDrafts((current) => ({ ...current, [variables.checkId]: '' }));
      setAcceptanceErrors((current) => ({ ...current, [variables.checkId]: '' }));
      await queryClient.invalidateQueries({ queryKey: ['production-readiness-overview'] });
    },
    onError: (error: ApiClientError, variables) => {
      setAcceptanceErrors((current) => ({ ...current, [variables.checkId]: error.message }));
    },
  });
  const overview = readinessQuery.data;
  const metrics = [
    {
      label: '检查项',
      value: `${overview?.summary.total_checks ?? 0}`,
      helper: '生产落地清单',
    },
    {
      label: '已就绪',
      value: `${overview?.summary.ready_checks ?? 0}`,
      helper: '可由配置自动确认',
    },
    {
      label: '人工验收',
      value: `${overview?.summary.manual_checks ?? 0}`,
      helper: '需要目标环境证据',
    },
    {
      label: '阻塞项',
      value: `${overview?.summary.blocked_checks ?? 0}`,
      helper: '上线前必须关闭',
    },
    {
      label: '落地分',
      value: `${overview?.summary.production_score ?? 0}`,
      helper: '就绪与人工证据折算',
    },
  ];

  return (
    <SettingsPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">生产验收</StatusBadge>
            <StatusBadge tone="planned">证据验收</StatusBadge>
            <StatusBadge tone={overview?.summary.blocked_checks ? 'unavailable' : 'degraded'}>
              {overview?.summary.blocked_checks ? '存在阻塞' : '待人工确认'}
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">生产落地中心</h1>
          <div className="mt-3 text-xs text-muted-foreground">生成时间：{formatDateTime(overview?.generated_at)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/monitor/observability">
              <ExternalLink className="size-4" />
              可观测性质量
            </Link>
          </Button>
          <Button disabled={readinessQuery.isFetching} onClick={() => void readinessQuery.refetch()} type="button">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <SettingsStatTile detail={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {readinessQuery.isError ? (
        <EmptyState
          description="请确认当前账号拥有 system:settings:view 权限，并检查控制服务是否可用。"
          title="生产落地清单加载失败"
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">验收分组</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {(overview?.categories ?? []).map((category) => (
              <a
                className="rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                href={`#${categoryAnchors[category.category]}`}
                key={category.category}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{categoryLabels[category.category] ?? category.label}</span>
                  <span className="text-xs text-muted-foreground">{category.items.length}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {category.ready_count ? <StatusBadge tone="healthy">就绪 {category.ready_count}</StatusBadge> : null}
                  {category.manual_count ? <StatusBadge tone="planned">人工 {category.manual_count}</StatusBadge> : null}
                  {category.warning_count ? <StatusBadge tone="degraded">关注 {category.warning_count}</StatusBadge> : null}
                  {category.blocked_count ? <StatusBadge tone="unavailable">阻塞 {category.blocked_count}</StatusBadge> : null}
                </div>
              </a>
            ))}
            {!overview && readinessQuery.isLoading ? <div className="text-sm text-muted-foreground">正在读取生产落地清单...</div> : null}
          </div>
        </Card>

        <div className="grid gap-4">
          {(overview?.categories ?? []).map((category) => (
            <div id={categoryAnchors[category.category]} key={category.category}>
              <Card className="p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-base font-semibold">{categoryLabels[category.category] ?? category.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="healthy">就绪 {category.ready_count}</StatusBadge>
                    <StatusBadge tone="planned">人工 {category.manual_count}</StatusBadge>
                    <StatusBadge tone="degraded">关注 {category.warning_count}</StatusBadge>
                    <StatusBadge tone="unavailable">阻塞 {category.blocked_count}</StatusBadge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {category.items.map((item) => (
                    <ReadinessItemCard
                      canAccept={canAcceptReadiness}
                      draftValue={acceptanceDrafts[item.id] ?? ''}
                      error={acceptanceErrors[item.id]}
                      isAccepting={acceptMutation.isPending && acceptMutation.variables?.checkId === item.id}
                      item={item}
                      key={item.id}
                      onDraftChange={(value) => setAcceptanceDrafts((current) => ({ ...current, [item.id]: value }))}
                      onSubmitAcceptance={() => {
                        const note = (acceptanceDrafts[item.id] ?? '').trim();
                        if (!note) {
                          setAcceptanceErrors((current) => ({ ...current, [item.id]: '请输入生产验收说明。' }));
                          return;
                        }
                        acceptMutation.mutate({ checkId: item.id, note });
                      }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </SettingsPageShell>
  );
}

function ReadinessItemCard({
  canAccept,
  draftValue,
  error,
  isAccepting,
  item,
  onDraftChange,
  onSubmitAcceptance,
}: {
  canAccept: boolean;
  draftValue: string;
  error?: string;
  isAccepting: boolean;
  item: ProductionReadinessCheckItem;
  onDraftChange: (value: string) => void;
  onSubmitAcceptance: () => void;
}) {
  const Icon = item.status === 'READY' ? CheckCircle2 : item.status === 'BLOCKED' ? ShieldAlert : AlertTriangle;

  return (
    <div className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/20 xl:grid-cols-[1fr_240px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <StatusBadge tone={readinessStatusTone(item.status)}>{readinessStatusLabel(item.status)}</StatusBadge>
          <StatusBadge tone={item.severity === 'HIGH' ? 'unavailable' : item.severity === 'MEDIUM' ? 'degraded' : 'planned'}>
            {readinessSeverityLabel(item.severity)}
          </StatusBadge>
          <StatusBadge tone="planned">{item.owner}</StatusBadge>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        {item.evidence_summary || item.observability_signal ? (
          <div className="mt-3 rounded-md border border-sky-200 bg-sky-50/60 px-3 py-2">
            <div className="text-xs font-medium text-sky-950">可观测性证据</div>
            {item.evidence_summary ? <div className="mt-1 text-xs leading-5 text-sky-900">{item.evidence_summary}</div> : null}
            {item.observability_signal ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <TraceEvidencePill label="Trace 覆盖率" value={item.observability_signal.trace_coverage_label} />
                <TraceEvidencePill label="孤立事件" value={item.observability_signal.orphan_event_label} />
                <TraceEvidencePill label="错误链路" value={item.observability_signal.error_trace_label} />
                <TraceEvidencePill label="慢链路" value={item.observability_signal.slow_trace_label} />
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3 grid gap-2">
          {item.evidence.map((evidence) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground" key={evidence}>
              {evidence}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border bg-muted/10 px-3 py-2">
          <div className="text-xs font-medium">验收记录</div>
          {item.acceptance ? (
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              <div>{item.acceptance.note}</div>
              <div>
                {item.acceptance.accepted_by?.name ?? '系统'} · {formatDateTime(item.acceptance.accepted_at)}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">暂无人工验收记录。</div>
          )}
        </div>
      </div>
      <div className="grid h-fit gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={item.action_href}>
            {item.action_label}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Input
          disabled={!canAccept || isAccepting}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="填写生产验收说明"
          value={draftValue}
        />
        <Button disabled={!canAccept || isAccepting || !draftValue.trim()} onClick={onSubmitAcceptance} size="sm" type="button">
          <CheckCircle2 className="size-4" />
          {isAccepting ? '提交中' : '提交验收'}
        </Button>
        {!canAccept ? <div className="text-xs text-muted-foreground">需要 system:settings:manage 权限。</div> : null}
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
      </div>
    </div>
  );
}

function TraceEvidencePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-sky-200 bg-background/80 px-2 py-1">
      <div className="text-[11px] font-medium text-sky-950">{label}</div>
      <div className="mt-0.5 text-xs leading-5 text-sky-800">{value}</div>
    </div>
  );
}

function readinessStatusLabel(status: ProductionReadinessStatus) {
  if (status === 'READY') return '已就绪';
  if (status === 'WARNING') return '需关注';
  if (status === 'BLOCKED') return '阻塞';
  return '人工验收';
}

function readinessStatusTone(status: ProductionReadinessStatus) {
  if (status === 'READY') return 'healthy';
  if (status === 'WARNING') return 'degraded';
  if (status === 'BLOCKED') return 'unavailable';
  return 'planned';
}

function readinessSeverityLabel(severity: ProductionReadinessCheckItem['severity']) {
  if (severity === 'HIGH') return '高风险';
  if (severity === 'MEDIUM') return '中风险';
  return '低风险';
}
