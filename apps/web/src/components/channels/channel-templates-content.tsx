'use client';

import type { ChannelTemplateItem } from '@aiaget/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  ChannelOperationStatusBadge,
  formatNumber,
  formatOptionalDateTime,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteChannelTemplate,
  disableChannelTemplate,
  enableChannelTemplate,
  listChannelTemplates,
  type ApiClientError,
} from '@/lib/api-client';

const templatesQueryKey = 'channel-templates-focused-page';

const templateStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '已审批', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

export function ChannelTemplatesContent() {
  const queryClient = useQueryClient();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const templateStatusMutation = useMutation({
    mutationFn: ({ templateId, nextStatus }: { templateId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelTemplate(templateId) : disableChannelTemplate(templateId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '消息模板已启用。' : '消息模板已停用。');
      setActionError(null);
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
      await queryClient.invalidateQueries({ queryKey: [templatesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  return (
    <ChannelOperationsListPage
      activeRoute="templates"
      actionError={actionError}
      actionNotice={actionNotice}
      badge="消息模板"
      buildMetrics={(input) => buildTemplateMetrics(input.items, input.total)}
      description="管理渠道消息模板的编码、类型、语言和版本。列表页只暴露核心模板字段，审批、内容结构等细节进入更多区域。"
      emptyDescription="当前没有消息模板。新增模板后，可在这里按状态、供应商和模板编码筛选。"
      emptyTitle="暂无消息模板"
      errorMessage="消息模板列表加载失败。"
      getItemId={(item) => item.id}
      listQuery={listChannelTemplates}
      providerFilterLabel="供应商/渠道"
      queryKey={templatesQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
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
          actions={
            <>
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || templateStatusMutation.isPending}
                  onClick={() => templateStatusMutation.mutate({ templateId: item.id, nextStatus: 'DISABLED' })}
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
                  onClick={() => templateStatusMutation.mutate({ templateId: item.id, nextStatus: 'ACTIVE' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用模板
                </Button>
              )}
              <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)} size="sm" type="button" variant="outline">
                <Trash2 className="size-4" />
                删除模板
              </Button>
            </>
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={templateStatusOptions}
      subtitle="/channels/templates"
      title="消息模板"
    />
  );
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
