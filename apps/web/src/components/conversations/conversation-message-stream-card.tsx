'use client';

import type { ConversationDetail } from '@aiaget/shared-types';
import { MessageSquareText, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  conversationMessageRoleLabel,
  formatDateTime,
} from './conversation-status';

export function ConversationMessageStreamCard({
  canWrite,
  conversation,
  error,
  isStreaming,
  onChangeReply,
  onSend,
  pending,
  replyText,
}: {
  canWrite: boolean;
  conversation: ConversationDetail;
  error: string | null;
  isStreaming: boolean;
  onChangeReply: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  replyText: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquareText className="size-4" />
        消息流
      </div>

      <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
        {conversation.messages.map((message) => (
          <div className="rounded-md border bg-muted/20 px-3 py-3" key={message.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{conversationMessageRoleLabel(message.role)}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          </div>
        ))}
      </div>

      <textarea
        className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={!canWrite || conversation.status === 'ARCHIVED'}
        onChange={(event) => onChangeReply(event.target.value)}
        placeholder="继续输入消息..."
        value={replyText}
      />
      {isStreaming ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          助手正在流式生成回复...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button disabled={!canWrite || pending || conversation.status === 'ARCHIVED'} onClick={onSend} type="button">
        <Send className="size-4" />
        继续会话
      </Button>
    </Card>
  );
}
