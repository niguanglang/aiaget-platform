'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ModelProviderDetail, ModelProviderType } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const providerTypes: ModelProviderType[] = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'];

const providerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, 'Use 3-100 lowercase letters, numbers, underscores, or hyphens.'),
  provider_type: z.enum(providerTypes),
  base_url: z.string().min(6, 'Base URL is required.'),
  description: z.string().optional(),
  is_default: z.boolean(),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

function defaults(provider?: ModelProviderDetail | null): ProviderFormValues {
  return {
    name: provider?.name ?? '',
    code: provider?.code ?? '',
    provider_type: provider?.provider_type ?? 'OPENAI_COMPATIBLE',
    base_url: provider?.base_url ?? 'https://api.openai.com/v1',
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
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: ProviderFormValues) => void;
  provider?: ModelProviderDetail | null;
}) {
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: defaults(provider),
  });

  useEffect(() => {
    form.reset(defaults(provider));
  }, [form, provider]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? 'Edit provider' : 'Create provider'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              OpenAI Compatible is the first executable provider adapter.
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

        <Field label="Provider type" message={form.formState.errors.provider_type?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('provider_type')}>
            {providerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Base URL" message={form.formState.errors.base_url?.message}>
          <Input {...form.register('base_url')} />
        </Field>

        <Field label="Description" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('is_default')} />
          Set as tenant default provider
        </label>

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
            {isEditing ? 'Save changes' : 'Create provider'}
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
