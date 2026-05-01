'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { KnowledgeBaseDetail, KnowledgeBaseStatus, KnowledgeVisibility, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeStatusLabel, knowledgeVisibilityLabel } from '@/components/knowledge/knowledge-status';

const visibilities = ['PRIVATE', 'TENANT', 'PUBLIC'] as const satisfies readonly KnowledgeVisibility[];
const statuses = ['ACTIVE', 'DISABLED', 'ARCHIVED'] as const satisfies readonly KnowledgeBaseStatus[];

const knowledgeFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。').max(160, '名称过长。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  visibility: z.enum(visibilities),
  status: z.enum(statuses),
  description: z.string().optional(),
  owner_id: z.string().optional(),
});

export type KnowledgeFormValues = z.infer<typeof knowledgeFormSchema>;

function defaults(base?: KnowledgeBaseDetail | null): KnowledgeFormValues {
  return {
    name: base?.name ?? '',
    code: base?.code ?? '',
    visibility: base?.visibility ?? 'PRIVATE',
    status: base?.status ?? 'ACTIVE',
    description: base?.description ?? '',
    owner_id: base?.owner?.id ?? '',
  };
}

export function KnowledgeFormPanel({
  base,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
}: {
  base?: KnowledgeBaseDetail | null;
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: KnowledgeFormValues) => void;
  owners: UserListItem[];
}) {
  const form = useForm<KnowledgeFormValues>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: defaults(base),
  });

  useEffect(() => {
    form.reset(defaults(base));
  }, [base, form, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑知识库' : '新建知识库'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              先配置元数据和访问范围，再上传来源文档。
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
            <Input {...form.register('name')} />
          </Field>
          <Field label="编码" message={form.formState.errors.code?.message}>
            <Input readOnly={isEditing} {...form.register('code')} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="可见范围" message={form.formState.errors.visibility?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('visibility')}>
              {visibilities.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {knowledgeVisibilityLabel(visibility)}
                </option>
              ))}
            </select>
          </Field>
          {isEditing ? (
            <Field label="状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {knowledgeStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>

        <Field label="负责人" message={form.formState.errors.owner_id?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('owner_id')}>
            <option value="">当前用户</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name} ({owner.email})
              </option>
            ))}
          </select>
        </Field>

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
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
            {isEditing ? '保存修改' : '新建知识库'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}
