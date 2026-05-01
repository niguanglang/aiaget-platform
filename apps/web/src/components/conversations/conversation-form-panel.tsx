'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AgentListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const conversationFormSchema = z.object({
  agent_id: z.string().min(1, '请选择智能体。'),
  title: z.string().optional(),
  message: z.string().min(1, '请输入首条消息。').max(4000, '消息过长。'),
});

export type ConversationFormValues = z.infer<typeof conversationFormSchema>;

export function ConversationFormPanel({
  agents,
  error,
  isPending,
  onClose,
  onSubmit,
}: {
  agents: AgentListItem[];
  error?: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ConversationFormValues) => void;
}) {
  const form = useForm<ConversationFormValues>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      agent_id: agents[0]?.id ?? '',
      title: '',
      message: '',
    },
  });

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">新建会话</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              选择一个智能体并发送首条消息，系统会立即生成第一轮回复。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid flex-1 gap-5 overflow-y-auto p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="智能体" message={form.formState.errors.agent_id?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('agent_id')}>
            <option value="">选择智能体</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="标题" message={form.formState.errors.title?.message}>
          <Input placeholder="留空时根据首条消息自动生成标题" {...form.register('title')} />
        </Field>

        <Field label="首条消息" message={form.formState.errors.message?.message}>
          <textarea
            className="min-h-48 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('message')}
          />
        </Field>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            创建并发送
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  children,
  label,
  message,
}: {
  children: React.ReactNode;
  label: string;
  message?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}
