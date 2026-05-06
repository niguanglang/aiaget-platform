'use client';

import type { ConversationDetail } from '@aiaget/shared-types';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  conversationStatusTone,
  conversationToolCallStatusLabel,
  formatLatency,
} from './conversation-status';

export function ConversationReferenceToolsCard({ conversation }: { conversation: ConversationDetail }) {
  const assistantMessages = conversation.messages.filter((message) => message.role === 'ASSISTANT');
  const references = assistantMessages.flatMap((message) => message.references);
  const toolCalls = assistantMessages.flatMap((message) => message.tool_calls);

  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">引用与工具调用</h2>

      <div className="grid gap-3">
        <div className="text-sm font-medium">引用</div>
        {references.length === 0 ? (
          <p className="text-sm text-muted-foreground">当前会话暂无引用线索。</p>
        ) : (
          references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.title}</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{reference.snippet}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="size-4" />
          工具调用摘要
        </div>
        {toolCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">当前会话暂无工具调用。</p>
        ) : (
          toolCalls.map((toolCall, index) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${toolCall.tool_code}-${index}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{toolCall.tool_name}</span>
                <StatusBadge tone={conversationStatusTone(toolCall.status)}>{conversationToolCallStatusLabel(toolCall.status)}</StatusBadge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {toolCall.tool_code} · {toolCall.response_status ? `HTTP ${toolCall.response_status}` : '无状态'} · {formatLatency(toolCall.latency_ms)}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {toolCall.output_preview ?? toolCall.error_message ?? '无附加输出。'}
              </p>
              {toolCall.approval_request_id ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/approvals?requestId=${toolCall.approval_request_id}`}>打开审批请求</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
