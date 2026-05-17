'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ModelProviderDetail, ModelProviderType } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { modelProviderTypeLabel } from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const providerTypes: ModelProviderType[] = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'];

const providerFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  provider_type: z.enum(providerTypes),
  base_url: z.string().min(6, '请输入基础 URL。'),
  description: z.string().optional(),
  is_default: z.boolean(),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

function defaults(provider?: ModelProviderDetail | null): ProviderFormValues {
  return {
    name: provider?.name ?? '',
    code: provider?.code ?? '',
    provider_type: provider?.provider_type ?? 'OPENAI_COMPATIBLE',
    base_url: provider?.base_url ?? '',
    description: provider?.description ?? '',
    is_default: provider?.is_default ?? false,
  };
}

export function ProviderFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  provider,
  presentation = 'drawer',
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: ProviderFormValues) => void;
  provider?: ModelProviderDetail | null;
  presentation?: 'drawer' | 'page';
}) {
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: defaults(provider),
  });

  useEffect(() => {
    form.reset(defaults(provider));
  }, [form, provider]);

  const isEditing = mode === 'edit';
  const isPage = presentation === 'page';

  return (
    <section
      className={
        isPage
          ? 'grid rounded-lg border bg-background shadow-sm'
          : 'fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background/95 shadow-xl backdrop-blur'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑供应商' : '新建供应商'}</h2>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form
        className={isPage ? 'grid gap-5 p-6' : 'grid flex-1 gap-5 overflow-y-auto p-6'}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label="编码" message={form.formState.errors.code?.message}>
            <Input readOnly={isEditing} {...form.register('code')} />
          </Field>
        </div>

        <Field label="供应商类型" message={form.formState.errors.provider_type?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('provider_type')}>
            {providerTypes.map((type) => (
              <option key={type} value={type}>
                {modelProviderTypeLabel(type)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="基础 URL" message={form.formState.errors.base_url?.message}>
          <Input {...form.register('base_url')} />
        </Field>

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('is_default')} />
          设为租户默认供应商
        </label>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div
          className={
            isPage
              ? '-mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4'
              : 'sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4'
          }
        >
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            {isEditing ? '保存修改' : '新建供应商'}
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
