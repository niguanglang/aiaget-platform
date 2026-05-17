'use client';

import type { ToolDetail } from '@aiaget/shared-types';
import { ArrowLeft, Copy, Edit, Power, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  toolMethodLabel,
  toolRiskLabel,
  toolStatusLabel,
  toolStatusTone,
} from './tool-status';

export function ToolDetailHeader({
  canWrite,
  copyPending,
  statusPending,
  tool,
  toolId,
  onCopy,
  onDelete,
  onToggleStatus,
}: {
  canWrite: boolean;
  copyPending: boolean;
  statusPending: boolean;
  tool: ToolDetail;
  toolId: string;
  onCopy: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="min-w-0">
        <Button asChild className="mb-4" size="sm" variant="outline">
          <Link href="/tools">
            <ArrowLeft className="size-4" />
            工具中心
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone={toolStatusTone(tool.status)}>{toolStatusLabel(tool.status)}</StatusBadge>
          <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
            {toolRiskLabel(tool.risk_level)}
          </StatusBadge>
          <StatusBadge tone="planned">{toolMethodLabel(tool.method)}</StatusBadge>
        </div>
        <h1 className="break-words text-2xl font-semibold">{tool.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{tool.code}</p>
        {tool.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{tool.description}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button asChild variant="outline">
            <Link href={`/tools/${toolId}/edit`}>
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
        <Button disabled={!canWrite || copyPending} onClick={onCopy} variant="outline">
          <Copy className="size-4" />
          复制
        </Button>
        <Button disabled={!canWrite || statusPending} onClick={onToggleStatus} variant="outline">
          <Power className="size-4" />
          {tool.status === 'ACTIVE' ? '停用' : '启用'}
        </Button>
        <Button disabled={!canWrite} onClick={onDelete} variant="destructive">
          <Trash2 className="size-4" />
          删除
        </Button>
      </div>
    </section>
  );
}
