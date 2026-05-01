'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { PromptVariableItem, PromptVariableType } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { promptVariableTypeLabel } from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const variableTypes = ['string', 'number', 'boolean', 'json'] as const satisfies readonly PromptVariableType[];

const variableFormSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]{0,99}$/, '请使用字母、数字和下划线，并以字母或下划线开头。'),
  variable_type: z.enum(variableTypes),
  default_value: z.string().optional(),
  required: z.boolean(),
  description: z.string().optional(),
  sort_order: z.number().int('请使用整数。').min(0, '最小值为 0。'),
});

export type PromptVariableFormValues = z.infer<typeof variableFormSchema>;

function formDefaults(variable?: PromptVariableItem | null): PromptVariableFormValues {
  return {
    name: variable?.name ?? '',
    variable_type: variable?.variable_type ?? 'string',
    default_value: variable?.default_value ?? '',
    required: variable?.required ?? true,
    description: variable?.description ?? '',
    sort_order: variable?.sort_order ?? 0,
  };
}

export function PromptVariableFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  variable,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: PromptVariableFormValues) => void;
  variable?: PromptVariableItem | null;
}) {
  const form = useForm<PromptVariableFormValues>({
    resolver: zodResolver(variableFormSchema),
    defaultValues: formDefaults(variable),
  });

  useEffect(() => {
    form.reset(formDefaults(variable));
  }, [form, mode, variable]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑变量' : '新建变量'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              变量会从双花括号和单花括号占位符中渲染。
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
          <Field label="排序" message={form.formState.errors.sort_order?.message}>
            <Input min="0" step="1" type="number" {...form.register('sort_order', { valueAsNumber: true })} />
          </Field>
        </div>

        <Field label="类型" message={form.formState.errors.variable_type?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('variable_type')}>
            {variableTypes.map((type) => (
              <option key={type} value={type}>
                {promptVariableTypeLabel(type)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="默认值" message={form.formState.errors.default_value?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('default_value')}
          />
        </Field>

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-20 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('required')} />
          渲染时必填
        </label>

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
            {isEditing ? '保存变量' : '新建变量'}
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
