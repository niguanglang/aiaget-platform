'use client';

import { Button } from '@/components/ui/button';

export function PromptConfirmDialog({
  body,
  confirmLabel = '删除',
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  confirmLabel?: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
