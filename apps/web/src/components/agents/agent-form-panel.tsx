'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AgentCategoryItem, AgentDetail, AgentStatus, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { agentStatusLabel } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';

const agentStatuses = ['DRAFT', 'TESTING', 'PENDING', 'PUBLISHED', 'DISABLED', 'ARCHIVED'] as const;

const agentFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  category_id: z.string().optional(),
  owner_id: z.string().optional(),
  status: z.enum(agentStatuses),
  temperature: z.number().min(0, '最小值为 0。').max(2, '最大值为 2。'),
  max_context_tokens: z
    .number()
    .int('请使用整数。')
    .min(512, '最小值为 512。')
    .max(200000, '最大值为 200000。'),
  enable_stream: z.boolean(),
  enable_log: z.boolean(),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

interface AgentFormPanelProps {
  agent?: AgentDetail | null;
  categories: AgentCategoryItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: AgentFormValues) => void;
  owners: UserListItem[];
}

function formDefaults(agent?: AgentDetail | null): AgentFormValues {
  return {
    name: agent?.name ?? '',
    code: agent?.code ?? '',
    description: agent?.description ?? '',
    avatar_url: agent?.avatar_url ?? '',
    category_id: agent?.category?.id ?? '',
    owner_id: agent?.owner?.id ?? '',
    status: (agent?.status ?? 'DRAFT') as AgentStatus,
    temperature: agent?.temperature ?? 0.7,
    max_context_tokens: agent?.max_context_tokens ?? 4096,
    enable_stream: agent?.enable_stream ?? true,
    enable_log: agent?.enable_log ?? true,
  };
}

export function AgentFormPanel({
  agent,
  categories,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
}: AgentFormPanelProps) {
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: formDefaults(agent),
  });

  useEffect(() => {
    form.reset(formDefaults(agent));
  }, [agent, form, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background shadow-xl">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑智能体' : '新建智能体'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              基础资料和运行默认值会在发布前生成版本快照。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid flex-1 gap-5 overflow-y-auto p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={form.formState.errors.name?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('name')}
            />
          </Field>

          <Field label="编码" message={form.formState.errors.code?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none read-only:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              readOnly={isEditing}
              {...form.register('code')}
            />
          </Field>
        </div>

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <Field label="头像链接" message={form.formState.errors.avatar_url?.message}>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="粘贴头像链接"
            {...form.register('avatar_url')}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="分类" message={form.formState.errors.category_id?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('category_id')}>
              <option value="">未分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="负责人" message={form.formState.errors.owner_id?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('owner_id')}>
              <option value="">当前用户</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {isEditing ? (
          <Field label="状态" message={form.formState.errors.status?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('status')}>
              {agentStatuses.map((status) => (
                <option key={status} value={status}>
                  {agentStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold">运行默认值</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="温度" message={form.formState.errors.temperature?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                max="2"
                min="0"
                step="0.01"
                type="number"
                {...form.register('temperature', { valueAsNumber: true })}
              />
            </Field>

            <Field label="最大上下文词元" message={form.formState.errors.max_context_tokens?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min="512"
                step="1"
                type="number"
                {...form.register('max_context_tokens', { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('enable_stream')} />
              流式响应
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('enable_log')} />
              写入运行日志
            </label>
          </div>
        </div>

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
            {isEditing ? '保存修改' : '新建智能体'}
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
