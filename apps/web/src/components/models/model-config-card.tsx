import type { ModelConfigItem, ModelProviderDetail } from '@aiaget/shared-types';
import { Edit, Plus, Power, Trash2 } from 'lucide-react';

import { ModelDetailLine } from '@/components/models/model-detail-line';
import {
  formatMoney,
  modelCapabilityLabel,
  modelProviderStatusLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export function ModelConfigCard({
  canWrite,
  onDelete,
  onEdit,
  onNew,
  onToggle,
  provider,
}: {
  canWrite: boolean;
  onDelete: (model: ModelConfigItem) => void;
  onEdit: (model: ModelConfigItem) => void;
  onNew: () => void;
  onToggle: (model: ModelConfigItem) => void;
  provider: ModelProviderDetail;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">模型配置</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理供应商下可绑定到 Agent 的模型能力、价格、上下文和限流。
          </p>
        </div>
        <Button disabled={!canWrite} onClick={onNew} size="sm" type="button">
          <Plus className="size-4" />
          新建模型
        </Button>
      </div>

      {provider.models.length === 0 ? (
        <EmptyState
          action={
            <Button disabled={!canWrite} onClick={onNew} variant="outline">
              <Plus className="size-4" />
              新建模型
            </Button>
          }
          className="rounded-lg border border-dashed"
          description="先创建模型配置，再把它绑定到智能体或用于供应商兼容性测试。"
          title="暂无模型配置"
        />
      ) : (
        <div className="grid gap-3">
          {provider.models.map((model) => (
            <div className="rounded-lg border bg-background/80 p-4 shadow-sm" key={model.id}>
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-semibold">{model.name}</h3>
                    <StatusBadge tone={modelStatusTone(model.status)}>
                      {modelProviderStatusLabel(model.status)}
                    </StatusBadge>
                    {model.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{model.model}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!canWrite} onClick={() => onEdit(model)} size="sm" type="button" variant="outline">
                    <Edit className="size-4" />
                    编辑
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onToggle(model)} size="sm" type="button" variant="outline">
                    <Power className="size-4" />
                    {model.status === 'ACTIVE' ? '停用' : '启用'}
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(model)} size="sm" type="button" variant="outline">
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {model.capabilities.map((capability) => (
                  <span className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs" key={capability}>
                    {modelCapabilityLabel(capability)}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                <ModelDetailLine label="上下文" value={`${model.context_length.toLocaleString()} tokens`} />
                <ModelDetailLine
                  label="最大输出"
                  value={model.max_output_tokens ? `${model.max_output_tokens.toLocaleString()} tokens` : '-'}
                />
                <ModelDetailLine label="API 版本" value={model.api_version ?? '-'} />
                <ModelDetailLine label="输入价格" value={formatMoney(model.input_price)} />
                <ModelDetailLine label="输出价格" value={formatMoney(model.output_price)} />
                <ModelDetailLine label="每分钟限流" value={model.rate_limit_rpm ? `${model.rate_limit_rpm}` : '-'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
