'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ToolAuthType, ToolDetail, ToolMethod, ToolRiskLevel, ToolStatus } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { toolAuthLabel, toolMethodLabel, toolRiskLabel, toolStatusLabel } from '@/components/tools/tool-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const methods: ToolMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const riskLevels: ToolRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const authTypes: ToolAuthType[] = ['NONE', 'BEARER', 'API_KEY_HEADER', 'API_KEY_QUERY', 'BASIC'];
const statuses: ToolStatus[] = ['ACTIVE', 'DISABLED'];

const toolFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。').max(160, '名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  description: z.string().optional(),
  method: z.enum(methods),
  url: z.url('请输入有效链接地址。').min(1, '请输入接口链接。'),
  risk_level: z.enum(riskLevels),
  timeout_ms: z.number().int('请使用整数。').min(100, '最小值为 100。').max(120000, '最大值为 120000。'),
  require_approval: z.boolean(),
  auth_type: z.enum(authTypes),
  status: z.enum(statuses),
  headers_text: z.string(),
  auth_config_text: z.string(),
  input_schema_text: z.string(),
  output_schema_text: z.string(),
});

export type ToolFormValues = z.infer<typeof toolFormSchema>;

function defaults(tool?: ToolDetail | null): ToolFormValues {
  return {
    name: tool?.name ?? '',
    code: tool?.code ?? '',
    description: tool?.description ?? '',
    method: tool?.method ?? 'GET',
    url: tool?.url ?? 'http://localhost:8000/runtime/health',
    risk_level: tool?.risk_level ?? 'LOW',
    timeout_ms: tool?.timeout_ms ?? 10000,
    require_approval: tool?.require_approval ?? false,
    auth_type: tool?.auth_type ?? 'NONE',
    status: tool?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    headers_text: stringifyJson(tool?.headers),
    auth_config_text: stringifyJson(tool?.auth_config),
    input_schema_text: stringifyJson(tool?.input_schema, '{\n  "type": "object",\n  "additionalProperties": false\n}'),
    output_schema_text: stringifyJson(tool?.output_schema),
  };
}

export function ToolFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  presentation = 'drawer',
  tool,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: ToolFormValues) => void;
  presentation?: 'drawer' | 'page';
  tool?: ToolDetail | null;
}) {
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: defaults(tool),
  });

  useEffect(() => {
    form.reset(defaults(tool));
  }, [form, tool, mode]);

  const isEditing = mode === 'edit';
  const isPage = presentation === 'page';

  return (
    <section
      className={
        isPage
          ? 'grid rounded-lg border bg-background shadow-sm'
          : 'fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l bg-background/95 shadow-xl backdrop-blur'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑工具' : '新建工具'}</h2>
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

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="工具类型">
            <Input disabled value="HTTP" />
          </Field>
          <Field label="请求方法" message={form.formState.errors.method?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('method')}>
              {methods.map((method) => (
                <option key={method} value={method}>
                  {toolMethodLabel(method)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="状态" message={form.formState.errors.status?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!isEditing} {...form.register('status')}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {toolStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
          <Field label="接口链接" message={form.formState.errors.url?.message}>
            <Input {...form.register('url')} />
          </Field>
          <Field label="风险级别" message={form.formState.errors.risk_level?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('risk_level')}>
              {riskLevels.map((level) => (
                <option key={level} value={level}>
                  {toolRiskLabel(level)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="超时毫秒" message={form.formState.errors.timeout_ms?.message}>
            <Input type="number" {...form.register('timeout_ms', { valueAsNumber: true })} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <Field label="鉴权方式" message={form.formState.errors.auth_type?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('auth_type')}>
              {authTypes.map((authType) => (
                <option key={authType} value={authType}>
                  {toolAuthLabel(authType)}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 rounded-md border bg-background/60 px-3 py-2 text-sm">
            <input type="checkbox" {...form.register('require_approval')} />
            高风险时需要审批
          </label>
        </div>

        <Field label="默认请求头 JSON" message={form.formState.errors.headers_text?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            spellCheck={false}
            {...form.register('headers_text')}
          />
        </Field>

        <Field label="鉴权配置 JSON" message={form.formState.errors.auth_config_text?.message}>
          <textarea
            className="min-h-24 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            spellCheck={false}
            {...form.register('auth_config_text')}
          />
        </Field>

        <div className="grid gap-4 xl:grid-cols-2">
          <Field label="输入结构 JSON" message={form.formState.errors.input_schema_text?.message}>
            <textarea
              className="min-h-48 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
              {...form.register('input_schema_text')}
            />
          </Field>
          <Field label="输出结构 JSON" message={form.formState.errors.output_schema_text?.message}>
            <textarea
              className="min-h-48 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
              {...form.register('output_schema_text')}
            />
          </Field>
        </div>

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
            {isEditing ? '保存修改' : '新建工具'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function stringifyJson(value: unknown, fallback = '{}') {
  if (value === undefined || value === null) return fallback;
  return JSON.stringify(value, null, 2);
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
