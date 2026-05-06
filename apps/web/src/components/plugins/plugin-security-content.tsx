'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import { formatPluginDateTime, pluginRiskLabel, pluginRiskTone, pluginStatusLabel, pluginStatusTone } from '@/components/plugins/plugin-status';
import {
  DetailList,
  formatPluginReviewStatus,
  pluginReviewStatusTone,
  PluginSectionNav,
  SummaryItem,
  usePluginPermissions,
} from '@/components/plugins/plugin-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPluginInstallation } from '@/lib/api-client';

export function PluginSecurityContent({ pluginId }: { pluginId: string }) {
  const { canAudit, canView } = usePluginPermissions();
  const detailQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-installation', pluginId],
    queryFn: () => getPluginInstallation(pluginId),
  });
  const detail = detailQuery.data ?? null;

  if (!canView) return <SecurityStatePanel description="当前账号没有 plugin:center:view 权限。" title="无权限访问安全审核" />;
  if (detailQuery.isLoading) return <SecurityStatePanel description="正在加载插件安全审核、策略和风险检查。" title="正在加载安全审核" />;
  if (detailQuery.isError || !detail) return <SecurityStatePanel description="安全审核加载失败，可能是插件不存在或权限不足。" title="安全审核加载失败" />;

  const reviewRequired = detail.security_preview.review_required ?? (detail.risk_level === 'HIGH' || detail.risk_level === 'CRITICAL');
  const canEnable = detail.security_preview.can_enable ?? true;
  const reviewStatus = detail.security_preview.review_status ?? null;
  const blockReason = detail.security_preview.block_reason ?? null;
  const signals = [
    { helper: '插件风险等级', label: '风险等级', value: pluginRiskLabel(detail.risk_level) },
    { helper: 'Manifest 权限声明', label: '权限声明', value: `${detail.permission_preview.length}` },
    { helper: '控制台入口', label: '菜单绑定', value: `${detail.menu_bindings.length}` },
    { helper: '扩展点', label: 'Hook 绑定', value: `${detail.hooks.length}` },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href={`/plugins/${pluginId}`}>
              <ArrowLeft className="size-4" />
              插件详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">安全审核</StatusBadge>
            <StatusBadge tone={pluginStatusTone(detail.status)}>{pluginStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={canEnable ? 'healthy' : 'unavailable'}>{canEnable ? '允许启用' : '启用阻断'}</StatusBadge>
            <StatusBadge tone={reviewRequired ? 'degraded' : 'planned'}>{reviewRequired ? '需要审核' : '无需审核'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{detail.name} · 安全审查</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">集中查看插件策略、风险检查、审核状态、启用准入和审计摘要。</p>
        </div>
        <PluginSectionNav active="security" pluginId={pluginId} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="border-b p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold">安全审核与策略准入</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail.security_preview.summary}</p>
              {blockReason ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">阻断原因：{blockReason}</div> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5">
          <section className="grid gap-3 md:grid-cols-3">
            <SummaryItem label="审核要求" value={reviewRequired ? '需要审核' : '无需审核'} />
            <SummaryItem label="审核状态" value={formatPluginReviewStatus(reviewStatus)} />
            <SummaryItem label="启用准入" value={canEnable ? '允许启用' : '已阻断'} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DetailList title="风险检查" subtitle="根据 Manifest、风险等级、权限、Hook 和菜单注入形成风险信号。">
              <div className="grid gap-2 md:grid-cols-2">
                <RiskSignal label="风险等级" tone={pluginRiskTone(detail.risk_level)} value={pluginRiskLabel(detail.risk_level)} />
                <RiskSignal label="审核状态" tone={pluginReviewStatusTone(reviewStatus)} value={formatPluginReviewStatus(reviewStatus)} />
                <RiskSignal label="权限声明" tone={detail.permission_preview.length > 0 ? 'ready' : 'healthy'} value={`${detail.permission_preview.length} 项`} />
                <RiskSignal label="绑定规模" tone={detail.menu_bindings.length + detail.hooks.length > 0 ? 'ready' : 'healthy'} value={`${detail.menu_bindings.length} 菜单 / ${detail.hooks.length} Hook`} />
              </div>
            </DetailList>

            <DetailList title="策略说明" subtitle="控制面只登记声明和绑定，不执行任意第三方代码。">
              <div className="grid gap-2">
                {detail.security_preview.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无额外策略说明。</p>
                ) : (
                  detail.security_preview.notes.map((note) => (
                    <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground" key={note}>说明：{note}</div>
                  ))
                )}
              </div>
            </DetailList>
          </section>

          <DetailList title="风险列表" subtitle="需要安全审核或策略关注的风险项。">
            {detail.security_preview.risks.length === 0 ? (
              <EmptyState className="p-6" description="当前安全预览没有风险项。" title="暂无风险" />
            ) : (
              detail.security_preview.risks.map((risk) => (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" key={risk}>风险：{risk}</div>
              ))
            )}
          </DetailList>

          <DetailList title="审核审计" subtitle="安全审核页展示最近审计记录，便于追踪策略和准入变更。">
            {!canAudit ? (
              <EmptyState className="p-6" description="当前账号没有 plugin:center:audit 权限，审计详情已隐藏。" title="无审计权限" />
            ) : detail.audit_logs.length === 0 ? (
              <EmptyState className="p-6" description="当前插件还没有审计记录。" title="暂无审计" />
            ) : (
              detail.audit_logs.slice(0, 8).map((log) => (
                <div className="rounded-md border bg-background p-3" key={log.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{log.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{log.summary}</p>
                    </div>
                    <StatusBadge tone={pluginRiskTone(log.risk_level)}>{pluginRiskLabel(log.risk_level)}</StatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{formatPluginDateTime(log.created_at)}</div>
                </div>
              ))
            )}
          </DetailList>
        </div>
      </Card>
    </main>
  );
}

function RiskSignal({ label, tone, value }: { label: string; tone: 'healthy' | 'ready' | 'degraded' | 'unavailable' | 'planned'; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{value}</span>
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
    </div>
  );
}

function SecurityStatePanel({ description, title }: { description: string; title: string }) {
  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <Button asChild className="w-fit" variant="outline">
        <Link href="/plugins">
          <ArrowLeft className="size-4" />
          插件生态中心
        </Link>
      </Button>
      <Card className="p-6">
        <EmptyState description={description} title={title} />
      </Card>
    </main>
  );
}
