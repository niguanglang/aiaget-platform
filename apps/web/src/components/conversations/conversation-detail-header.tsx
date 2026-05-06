'use client';

import type {
  ConversationDetail,
  ConversationRunItem,
} from '@aiaget/shared-types';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  conversationRunStatusLabel,
  conversationStatusLabel,
  conversationStatusTone,
} from './conversation-status';

export function ConversationDetailHeader({
  canWrite,
  conversation,
  latestRun,
  onArchive,
}: {
  canWrite: boolean;
  conversation: ConversationDetail;
  latestRun: ConversationRunItem | null;
  onArchive: () => void;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="min-w-0">
        <Button asChild className="mb-4" size="sm" variant="outline">
          <Link href="/conversations">
            <ArrowLeft className="size-4" />
            会话中心
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone={conversationStatusTone(conversation.status)}>{conversationStatusLabel(conversation.status)}</StatusBadge>
          {latestRun ? (
            <StatusBadge tone={conversationStatusTone(latestRun.status)}>{conversationRunStatusLabel(latestRun.status)}</StatusBadge>
          ) : null}
        </div>
        <h1 className="break-words text-2xl font-semibold">{conversation.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {conversation.agent_name} · {conversation.user?.email ?? '-'}
        </p>
      </div>
      <Button disabled={!canWrite} onClick={onArchive} variant="destructive">
        <Trash2 className="size-4" />
        归档会话
      </Button>
    </section>
  );
}
