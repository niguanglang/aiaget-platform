'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { PromptStatus, PromptTemplateDetail, PromptType, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const promptTypes = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'] as const satisfies readonly PromptType[];
const promptStatuses = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'] as const satisfies readonly PromptStatus[];

const promptFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(160, 'Name is too long.'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, 'Use 3-100 lowercase letters, numbers, underscores, or hyphens.'),
  type: z.enum(promptTypes),
  status: z.enum(promptStatuses),
  description: z.string().optional(),
  content: z.string().min(1, 'Prompt content is required.'),
  owner_id: z.string().optional(),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

function formDefaults(prompt?: PromptTemplateDetail | null): PromptFormValues {
  return {
    name: prompt?.name ?? '',
    code: prompt?.code ?? '',
    type: prompt?.type ?? 'SYSTEM',
    status: prompt?.status ?? 'DRAFT',
    description: prompt?.description ?? '',
    content:
      prompt?.content ??
      'You are a precise assistant for {{audience}}.\n\nGoal: {{goal}}\n\nReturn a concise answer with clear next steps.',
    owner_id: prompt?.owner?.id ?? '',
  };
}

export function PromptFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  prompt,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: PromptFormValues) => void;
  owners: UserListItem[];
  prompt?: PromptTemplateDetail | null;
}) {
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: formDefaults(prompt),
  });

  useEffect(() => {
    form.reset(formDefaults(prompt));
  }, [form, mode, prompt]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? 'Edit prompt' : 'Create prompt'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prompt templates support versioned publishing, rollback, variables, and render tests.
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid flex-1 gap-5 overflow-y-auto p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" message={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label="Code" message={form.formState.errors.code?.message}>
            <Input readOnly={isEditing} {...form.register('code')} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Type" message={form.formState.errors.type?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('type')}>
              {promptTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          {isEditing ? (
            <Field label="Status" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {promptStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Owner" message={form.formState.errors.owner_id?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('owner_id')}>
              <option value="">Current user</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-20 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <Field label="Prompt content" message={form.formState.errors.content?.message}>
          <textarea
            className="min-h-72 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-ring"
            spellCheck={false}
            {...form.register('content')}
          />
        </Field>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isEditing ? 'Save changes' : 'Create prompt'}
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
