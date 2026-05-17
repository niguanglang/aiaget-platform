'use client';

import type { PromptTemplateDetail } from '@aiaget/shared-types';
import { ArrowLeft, Copy, Edit, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  promptStatusLabel,
  promptStatusTone,
  promptTypeLabel,
} from './prompt-status';

export function PromptDetailHeader({
  canWrite,
  copyPending,
  prompt,
  promptId,
  publishPending,
  onCopy,
  onDelete,
  onPublish,
}: {
  canWrite: boolean;
  copyPending: boolean;
  prompt: PromptTemplateDetail;
  promptId: string;
  publishPending: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
      <div className="min-w-0">
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href="/prompts">
            <ArrowLeft className="size-4" />
            提示词
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge>
          <StatusBadge tone="ready">v{prompt.version}</StatusBadge>
          <StatusBadge tone="healthy">真实模型测试</StatusBadge>
          <StatusBadge tone="planned">{promptTypeLabel(prompt.type)}</StatusBadge>
        </div>
        <h1 className="break-words text-2xl font-semibold">{prompt.name}</h1>
        {prompt.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{prompt.description}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button asChild variant="outline">
            <Link href={`/prompts/${promptId}/edit`}>
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
        <Button disabled={!canWrite || publishPending} onClick={onPublish}>
          <Send className="size-4" />
          发布
        </Button>
        <Button disabled={!canWrite} onClick={onDelete} variant="destructive">
          <Trash2 className="size-4" />
          删除
        </Button>
      </div>
    </section>
  );
}
