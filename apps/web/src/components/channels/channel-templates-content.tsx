'use client';

import type { ChannelOperationsListParams, ChannelTemplateItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Edit, Plus, Power, PowerOff, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
  ChannelOperationRow,
  ChannelOperationStatusBadge,
  formatNumber,
  formatOptionalDateTime,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteChannelTemplate,
  disableChannelTemplate,
  enableChannelTemplate,
  listChannelTemplates,
  type ApiClientError,
} from '@/lib/api-client';

const templatesQueryKey = 'channel-templates-focused-page';
const pageSize = 20;

const templateStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '已审批', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

type TemplateActionTarget = {
  action: 'enable' | 'disable' | 'delete';
  item: ChannelTemplateItem;
};

export function ChannelTemplatesContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateActionTarget, setTemplateActionTarget] = useState<TemplateActionTarget | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listParams = useMemo<ChannelOperationsListParams>(
    () => ({
      page,
      page_size: pageSize,
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      provider: provider.trim() || undefined,
    }),
    [keyword, page, provider, status],
  );

  const templatesQuery = useQuery({
    enabled: permissions.canView,
    queryKey: [templatesQueryKey, listParams],
    queryFn: () => listChannelTemplates(listParams),
  });

  const templates = templatesQuery.data?.items ?? [];
  const total = templatesQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const metrics = useMemo(() => buildTemplateMetrics(templates, total), [templates, total]);

  const templateStatusMutation = useMutation({
    mutationFn: ({ templateId, nextStatus }: { templateId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelTemplate(templateId) : disableChannelTemplate(templateId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '消息模板已启用。' : '消息模板已停用。');
      setActionError(null);
      setTemplateActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [templatesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChannelTemplate,
    onSuccess: async () => {
      setActionNotice('消息模板已删除。');
      setActionError(null);
      setTemplateActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [templatesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
    setSelectedTemplateId(null);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setProvider('');
    setPage(1);
    setSelectedTemplateId(null);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="templates"
        badge="消息模板"
        description="管理渠道消息模板的编码、类型、语言和版本。列表页只暴露核心模板字段，新增与编辑进入独立表单页。"
        permissions={permissions}
        refreshing={templatesQuery.isFetching}
        subtitle="/channels/templates"
        title="消息模板"
        onRefresh={() => void templatesQuery.refetch()}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {permissions.canManage ? (
          <Button asChild>
            <Link href="/channels/templates/create">
              <Plus className="size-4" />
              新建消息模板
            </Link>
          </Button>
        ) : (
          <Button disabled type="button">
            <Plus className="size-4" />
            新建消息模板
          </Button>
        )}
      </div>

      <ChannelAlert message={actionNotice} tone="ready" />
      <ChannelAlert message={actionError ?? (templatesQuery.isError ? '消息模板列表加载失败。' : null)} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看消息模板。" title="无权查看消息模板" />
        </Card>
      ) : (
        <>
          <ChannelMetricGrid loading={templatesQuery.isLoading} metrics={metrics} />

          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold">消息模板列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">只保留模板编码、类型、语言和版本，完整内容结构进入独立表单。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-56 flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => updateFilter(setKeyword, event.target.value)}
                    placeholder="搜索名称、编码、目标"
                    value={keyword}
                  />
                </div>
                <select
                  className="h-10 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => updateFilter(setStatus, event.target.value)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {templateStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  className="w-40"
                  onChange={(event) => updateFilter(setProvider, event.target.value)}
                  placeholder="供应商/渠道"
                  value={provider}
                />
                <Button onClick={clearFilters} type="button" variant="outline">
                  <X className="size-4" />
                  重置
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                共 {formatNumber(total)} 条，当前第 {formatNumber(page)} / {formatNumber(pageCount)} 页
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || templatesQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
                  <ChevronLeft className="size-4" />
                  上一页
                </Button>
                <Button disabled={page >= pageCount || templatesQuery.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">
                  下一页
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {templatesQuery.isLoading ? (
              <TemplateRowSkeleton />
            ) : templates.length === 0 ? (
              <EmptyState description="当前没有消息模板。新增模板后，可在这里按状态、供应商和模板编码筛选。" title="暂无消息模板" />
            ) : (
              <div className="grid gap-3">
                {templates.map((item) => {
                  const selected = selectedTemplateId === item.id;
                  return (
                    <ChannelOperationRow
                      actions={
                        <>
                          {permissions.canManage ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/channels/templates/${encodeURIComponent(item.id)}/edit`}>
                                <Edit className="size-4" />
                                编辑模板
                              </Link>
                            </Button>
                          ) : (
                            <Button disabled size="sm" type="button" variant="outline">
                              <Edit className="size-4" />
                              编辑模板
                            </Button>
                          )}
                          {item.status === 'ACTIVE' ? (
                            <Button
                              disabled={!permissions.canDisable || templateStatusMutation.isPending}
                              onClick={() => setTemplateActionTarget({ action: 'disable', item })}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <PowerOff className="size-4" />
                              停用模板
                            </Button>
                          ) : (
                            <Button
                              disabled={!permissions.canManage || templateStatusMutation.isPending}
                              onClick={() => setTemplateActionTarget({ action: 'enable', item })}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <Power className="size-4" />
                              启用模板
                            </Button>
                          )}
                          <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => setTemplateActionTarget({ action: 'delete', item })} size="sm" type="button" variant="outline">
                            <Trash2 className="size-4" />
                            删除模板
                          </Button>
                        </>
                      }
                      badges={
                        <>
                          <ChannelOperationStatusBadge status={item.status} />
                          <StatusBadge tone="ready">{item.template_type ?? '默认模板'}</StatusBadge>
                        </>
                      }
                      details={[
                        { label: '模板编码', value: item.template_code ?? '未配置' },
                        { label: '模板类型', value: item.template_type ?? '未配置' },
                        { label: '语言/地区', value: item.language ?? '默认' },
                        { label: '模板版本', value: item.version ?? '未记录' },
                        { label: '渠道提供方', value: item.provider_name ?? item.provider_code ?? '未绑定' },
                        { label: '所属渠道', value: item.channel_name ?? item.channel_id ?? '未绑定发布渠道' },
                        { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
                        { label: '创建时间', value: formatOptionalDateTime(item.created_at) },
                      ]}
                      key={item.id}
                      selected={selected}
                      stats={[
                        { label: '模板编码', value: item.template_code ?? '未配置' },
                        { label: '版本', value: item.version ? String(item.version) : '-' },
                      ]}
                      subtitle={
                        <span>
                          模板编码：{item.template_code ?? '未配置'} · 模板类型：{item.template_type ?? '未配置'} · 渠道提供方：
                          {item.provider_name ?? item.provider_code ?? '未绑定'}
                        </span>
                      }
                      title={item.name}
                      onToggle={() => setSelectedTemplateId((current) => (current === item.id ? null : item.id))}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {templateActionTarget ? (
        <ChannelActionConfirmDialog
          body={getTemplateActionBody(templateActionTarget)}
          confirmLabel={getTemplateActionConfirmLabel(templateActionTarget.action)}
          onCancel={() => setTemplateActionTarget(null)}
          onConfirm={() => {
            if (templateActionTarget.action === 'delete') {
              deleteMutation.mutate(templateActionTarget.item.id);
              return;
            }

            templateStatusMutation.mutate({
              templateId: templateActionTarget.item.id,
              nextStatus: templateActionTarget.action === 'enable' ? 'ACTIVE' : 'DISABLED',
            });
          }}
          pending={templateActionTarget.action === 'delete' ? deleteMutation.isPending : templateStatusMutation.isPending}
          title={getTemplateActionTitle(templateActionTarget.action)}
          variant={templateActionTarget.action === 'delete' ? 'destructive' : 'default'}
        />
      ) : null}
    </main>
  );
}

function TemplateRowSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="h-28 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  );
}

function getTemplateActionTitle(action: TemplateActionTarget['action']) {
  if (action === 'enable') return '确认启用消息模板';
  if (action === 'disable') return '确认停用消息模板';

  return '确认删除消息模板';
}

function getTemplateActionConfirmLabel(action: TemplateActionTarget['action']) {
  if (action === 'enable') return '确认启用';
  if (action === 'disable') return '确认停用';

  return '确认删除';
}

function getTemplateActionBody(target: TemplateActionTarget) {
  if (target.action === 'enable') {
    return `确认启用消息模板“${target.item.name}”？启用后该模板可被发布任务和路由命中的渠道发送流程选用。`;
  }
  if (target.action === 'disable') {
    return `确认停用消息模板“${target.item.name}”？停用后依赖该模板的发送任务、自动回复和路由规则将无法继续使用它。`;
  }

  return `确认删除消息模板“${target.item.name}”？删除会影响引用该模板的发送任务、账号配置和路由规则，请确认影响范围已经迁移或清理。`;
}

function buildTemplateMetrics(items: ChannelTemplateItem[], total: number): ChannelOperationMetric[] {
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const approvedCount = items.filter((item) => item.status === 'APPROVED').length;
  const draftCount = items.filter((item) => item.status === 'DRAFT').length;

  return [
    { label: '消息模板', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '启用模板', value: formatNumber(activeCount), helper: '当前页 ACTIVE' },
    { label: '已审批模板', value: formatNumber(approvedCount), helper: '当前页 APPROVED' },
    { label: '草稿模板', value: formatNumber(draftCount), helper: '待补齐内容结构' },
  ];
}
