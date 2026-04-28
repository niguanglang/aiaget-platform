'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ModelCapability, ModelConfigItem, ModelProviderDetail, ModelProviderStatus } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const capabilities: ModelCapability[] = ['chat', 'embedding', 'rerank', 'vision', 'tool_call'];
const statuses: ModelProviderStatus[] = ['ACTIVE', 'DISABLED'];

const modelFormSchema = z.object({
  provider_id: z.string().min(1, 'Select a provider.'),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  model: z.string().min(2, 'Model id is required.'),
  capabilities: z.array(z.enum(capabilities)).min(1, 'Select at least one capability.'),
  context_length: z.number().int().min(512).max(2000000),
  input_price: z.number().min(0),
  output_price: z.number().min(0),
  rate_limit_rpm: z.number().int().min(1).optional(),
  status: z.enum(statuses),
  is_default: z.boolean(),
});

export type ModelFormValues = z.infer<typeof modelFormSchema>;

function defaults(provider?: ModelProviderDetail | null, model?: ModelConfigItem | null): ModelFormValues {
  return {
    provider_id: provider?.id ?? model?.provider_id ?? '',
    name: model?.name ?? '',
    model: model?.model ?? '',
    capabilities: model?.capabilities.length ? model.capabilities : ['chat'],
    context_length: model?.context_length ?? 8192,
    input_price: model?.input_price ?? 0,
    output_price: model?.output_price ?? 0,
    rate_limit_rpm: model?.rate_limit_rpm ?? undefined,
    status: model?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    is_default: model?.is_default ?? false,
  };
}

export function ModelFormPanel({
  error,
  isPending,
  mode,
  model,
  onClose,
  onSubmit,
  providers,
  selectedProvider,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  model?: ModelConfigItem | null;
  onClose: () => void;
  onSubmit: (values: ModelFormValues) => void;
  providers: Array<{ id: string; name: string }>;
  selectedProvider?: ModelProviderDetail | null;
}) {
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: defaults(selectedProvider, model),
  });

  useEffect(() => {
    form.reset(defaults(selectedProvider, model));
  }, [form, model, selectedProvider]);

  const isEditing = mode === 'edit';

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? 'Edit model' : 'Create model'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure capabilities, token pricing, and rate limits for binding to agents.
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid flex-1 gap-5 overflow-y-auto p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Provider" message={form.formState.errors.provider_id?.message}>
          <select
            className="h-10 rounded-md border bg-background/80 px-3 text-sm"
            disabled={isEditing}
            {...form.register('provider_id')}
          >
            <option value="">Select provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" message={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label="Model id" message={form.formState.errors.model?.message}>
            <Input readOnly={isEditing} {...form.register('model')} />
          </Field>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Capabilities</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <label className="flex items-center gap-2 text-sm" key={capability}>
                <input type="checkbox" value={capability} {...form.register('capabilities')} />
                {capability}
              </label>
            ))}
          </div>
          {form.formState.errors.capabilities ? (
            <span className="text-xs text-destructive">{form.formState.errors.capabilities.message}</span>
          ) : null}
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Context length" message={form.formState.errors.context_length?.message}>
            <Input type="number" {...form.register('context_length', { valueAsNumber: true })} />
          </Field>
          <Field label="Rate limit RPM" message={form.formState.errors.rate_limit_rpm?.message}>
            <Input type="number" {...form.register('rate_limit_rpm', { setValueAs: nullableNumber })} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Input price / 1K" message={form.formState.errors.input_price?.message}>
            <Input step="0.000001" type="number" {...form.register('input_price', { valueAsNumber: true })} />
          </Field>
          <Field label="Output price / 1K" message={form.formState.errors.output_price?.message}>
            <Input step="0.000001" type="number" {...form.register('output_price', { valueAsNumber: true })} />
          </Field>
        </div>

        <Field label="Status" message={form.formState.errors.status?.message}>
          <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('is_default')} />
          Set as provider default model
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
            {isEditing ? 'Save changes' : 'Create model'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function nullableNumber(value: unknown) {
  if (value === '' || value === undefined || value === null) return undefined;

  return Number(value);
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
