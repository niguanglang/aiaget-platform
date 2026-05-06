import type { ModelProviderDetail } from '@aiaget/shared-types';
import { Edit, Plus, Power } from 'lucide-react';
import Link from 'next/link';

import {
  modelProviderStatusLabel,
  modelProviderTypeLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export function ModelProviderDetailHeader({
  canWrite,
  onToggleStatus,
  pending,
  provider,
}: {
  canWrite: boolean;
  onToggleStatus: () => void;
  pending: boolean;
  provider: ModelProviderDetail;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="min-w-0">
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href="/models">
            <Plus className="size-4 rotate-45" />
            模型中心
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">详情页</StatusBadge>
          <StatusBadge tone={modelStatusTone(provider.status)}>
            {modelProviderStatusLabel(provider.status)}
          </StatusBadge>
          <StatusBadge tone="planned">{modelProviderTypeLabel(provider.provider_type)}</StatusBadge>
          {provider.is_default ? <StatusBadge tone="healthy">默认</StatusBadge> : null}
        </div>
        <h1 className="text-2xl font-semibold">{provider.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{provider.code}</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {provider.description ?? '暂无描述。'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button asChild variant="outline">
            <Link href={`/models/${provider.id}/edit`}>
              <Edit className="size-4" />
              编辑
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline">
            <Edit className="size-4" />
            编辑
          </Button>
        )}
        <Button disabled={!canWrite || pending} onClick={onToggleStatus} variant="outline">
          <Power className="size-4" />
          {provider.status === 'ACTIVE' ? '停用' : '启用'}
        </Button>
      </div>
    </section>
  );
}
