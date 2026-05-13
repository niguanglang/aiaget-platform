'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import {
  formatPluginDateTime,
  pluginHookStatusLabel,
  pluginHookStatusTone,
  pluginRiskLabel,
  pluginRiskTone,
  pluginRuntimeLabel,
  pluginRuntimeTone,
  pluginSourceLabel,
  pluginStatusLabel,
  pluginStatusTone,
} from '@/components/plugins/plugin-status';
import {
  DetailList,
  formatManifestValue,
  InfoBlock,
  ManifestSummary,
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

export function PluginDetailContent({ pluginId }: { pluginId: string }) {
  const { canAudit, canView } = usePluginPermissions();
  const detailQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-installation', pluginId],
    queryFn: () => getPluginInstallation(pluginId),
  });
  const detail = detailQuery.data ?? null;

  if (!canView) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <PluginCenterBackground />
        <EmptyState description="当前账号没有 plugin:center:view 权限，无法查看插件详情。" title="无权限访问插件详情" />
      </main>
    );
  }

  if (detailQuery.isLoading) {
    return <PluginStatePanel description="正在加载插件 Manifest、安装状态、权限和绑定摘要。" title="正在加载插件详情" />;
  }

  if (detailQuery.isError || !detail) {
    return <PluginStatePanel description="插件详情加载失败，可能是插件安装实例不存在或权限不足。" title="插件详情加载失败" />;
  }

  const metrics = [
    { label: '安装状态', value: pluginStatusLabel(detail.status), helper: pluginRuntimeLabel(detail.runtime_status) },
    { label: '权限声明', value: `${detail.permission_preview.length}`, helper: 'Manifest 权限' },
    { label: '菜单绑定', value: `${detail.menu_bindings.length}`, helper: '控制台入口摘要' },
    { label: 'Hook 绑定', value: `${detail.hooks.length}`, helper: '扩展点摘要' },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/plugins">
              <ArrowLeft className="size-4" />
              插件生态中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">插件详情</StatusBadge>
            <StatusBadge tone={pluginStatusTone(detail.status)}>{pluginStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={pluginRuntimeTone(detail.runtime_status)}>{pluginRuntimeLabel(detail.runtime_status)}</StatusBadge>
            <StatusBadge tone={pluginRiskTone(detail.risk_level)}>{pluginRiskLabel(detail.risk_level)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{detail.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {detail.code} · {detail.provider} · {pluginSourceLabel(detail.source_type)}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{detail.description ?? '暂无描述。'}</p>
        </div>
        <div className="grid gap-2">
          <PluginSectionNav active="detail" pluginId={pluginId} />
          <div className="flex justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/plugins/${pluginId}/installations`}>
                <Settings2 className="size-4" />
                安装配置
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/plugins/${pluginId}/security`}>
                <ShieldCheck className="size-4" />
                安全审核
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/plugins/${pluginId}/bindings`}>
                <SlidersHorizontal className="size-4" />
                绑定配置
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">Manifest 与安装摘要</h2>
        </div>
        <div className="grid gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoBlock label="已安装版本" value={detail.installed_version} />
            <InfoBlock label="最新版本" value={detail.latest_version} />
            <InfoBlock label="安装时间" value={formatPluginDateTime(detail.installed_at)} />
          </div>

          <section className="rounded-lg border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold">Manifest 摘要</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <ManifestSummary label="入口" value={formatManifestValue(detail.manifest_json, ['entry', 'entry_point', 'main', 'main_entry'])} />
              <ManifestSummary label="能力" value={formatManifestValue(detail.manifest_json, ['capabilities', 'features', 'actions'])} />
              <ManifestSummary label="Hook" value={formatManifestValue(detail.manifest_json, ['hooks'])} />
              <ManifestSummary label="菜单" value={formatManifestValue(detail.manifest_json, ['menus', 'menu_bindings', 'menu_entries'])} />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DetailList title="权限预览" subtitle="插件声明的权限编码会进入角色、资源授权和安全策略校验。">
              {detail.permission_preview.length === 0 ? (
                <EmptyState className="p-6" description="暂无记录。" title="暂无权限声明" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.permission_preview.map((permission) => (
                    <span className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={permission}>
                      {permission}
                    </span>
                  ))}
                </div>
              )}
            </DetailList>

            <DetailList title="安全摘要" subtitle="安全审核页负责策略、风险检查和准入判断。">
              <p className="text-sm leading-6 text-muted-foreground">{detail.security_preview.summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <SummaryItem label="审核要求" value={detail.security_preview.review_required ? '需要审核' : '无需审核'} />
                <SummaryItem label="启用准入" value={detail.security_preview.can_enable === false ? '已阻断' : '允许启用'} />
              </div>
            </DetailList>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DetailList title="菜单摘要" subtitle="完整菜单绑定编辑在绑定配置页完成。">
              {detail.menu_bindings.length === 0 ? (
                <EmptyState className="p-6" description="暂无记录。" title="暂无菜单绑定" />
              ) : (
                detail.menu_bindings.slice(0, 4).map((binding) => (
                  <div className="rounded-md border bg-background p-3" key={binding.id}>
                    <div className="text-sm font-medium">{binding.menu_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{binding.menu_code} · {binding.path ?? '无路由'}</div>
                  </div>
                ))
              )}
            </DetailList>

            <DetailList title="Hook 摘要" subtitle="完整 Hook 配置在绑定配置页完成。">
              {detail.hooks.length === 0 ? (
                <EmptyState className="p-6" description="暂无记录。" title="暂无 Hook" />
              ) : (
                detail.hooks.slice(0, 4).map((hook) => (
                  <div className="rounded-md border bg-background p-3" key={hook.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{hook.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{hook.code} · {hook.hook_type} · {hook.method}</div>
                      </div>
                      <StatusBadge tone={pluginHookStatusTone(hook.status)}>{pluginHookStatusLabel(hook.status)}</StatusBadge>
                    </div>
                  </div>
                ))
              )}
            </DetailList>
          </section>

          <DetailList title="审计记录" subtitle="安装、启停、升级、Hook 和菜单变更会保留审计摘要。">
            {!canAudit ? (
              <EmptyState className="p-6" description="当前账号没有 plugin:center:audit 权限，审计详情已隐藏。" title="无审计权限" />
            ) : detail.audit_logs.length === 0 ? (
              <EmptyState className="p-6" description="暂无记录。" title="暂无审计" />
            ) : (
              detail.audit_logs.slice(0, 5).map((log) => (
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

function PluginStatePanel({ description, title }: { description: string; title: string }) {
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
