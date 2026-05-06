'use client';

import type { ConversationDetail } from '@aiaget/shared-types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { formatDateTime } from './conversation-status';

export function ConversationFeedbackCard({
  canWrite,
  conversation,
  error,
  feedbackRating,
  feedbackText,
  onChangeRating,
  onChangeText,
  onSubmit,
  pending,
}: {
  canWrite: boolean;
  conversation: ConversationDetail;
  error: string | null;
  feedbackRating: number;
  feedbackText: string;
  onChangeRating: (value: number) => void;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">反馈</h2>
      <div className="grid gap-3">
        <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChangeRating(Number(event.target.value))} value={feedbackRating}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} 分
            </option>
          ))}
        </select>
        <textarea
          className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangeText(event.target.value)}
          placeholder="记录本轮会话质量、结果准确性或后续建议..."
          value={feedbackText}
        />
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <Button disabled={!canWrite || pending} onClick={onSubmit} type="button">
          提交反馈
        </Button>
      </div>
      <div className="grid gap-3">
        {conversation.feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无反馈记录。</p>
        ) : (
          conversation.feedback.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.rating} 分</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.comment ?? '无附加说明。'}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
