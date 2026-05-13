'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AgentTeamDetail, AgentTeamFailurePolicy, AgentTeamHandoffPolicy, AgentTeamMode, AgentTeamStatus, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  failurePolicies,
  failurePolicyLabel,
  handoffPolicies,
  handoffPolicyLabel,
  nullableText,
  teamModes,
  teamModeLabel,
  teamStatuses,
  teamStatusLabel,
} from '@/components/agent-teams/agent-teams-shared';

const teamFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  description: z.string().optional(),
  owner_id: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED']),
  mode: z.enum(['SEQUENTIAL', 'PARALLEL', 'SUPERVISOR']),
  max_rounds: z.number().int('请使用整数。').min(1, '至少 1 轮。').max(100, '最多 100 轮。'),
  timeout_seconds: z.number().int('请使用整数。').min(30, '至少 30 秒。').max(86400, '最多 86400 秒。'),
  handoff_policy: z.enum(['AUTO', 'MANUAL', 'APPROVAL_REQUIRED']),
  supervisor_prompt: z.string().optional(),
  failure_policy: z.enum([
    'MATCH_HANDOFF_POLICY',
    'STOP_ON_REQUIRED_FAILURE',
    'WAIT_HUMAN_ON_REQUIRED_FAILURE',
    'CONTINUE_OPTIONAL',
  ]),
  quality_gate_enabled: z.boolean(),
  quality_threshold: z.number().min(0, '最小值为 0。').max(1, '最大值为 1。'),
  budget_token_limit: z.number().int('请使用整数。').min(1, '至少 1 Token。').optional(),
  budget_cost_limit: z.number().min(0.000001, '请输入大于 0 的成本上限。').optional(),
});

export type AgentTeamFormValues = z.infer<typeof teamFormSchema>;

interface AgentTeamFormPanelProps {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: (values: AgentTeamFormValues) => void;
  owners: UserListItem[];
  team?: AgentTeamDetail | null;
}

export function buildTeamInput(values: AgentTeamFormValues) {
  return {
    name: values.name,
    code: values.code,
    description: nullableText(values.description),
    owner_id: values.owner_id || null,
    status: values.status,
    mode: values.mode,
    max_rounds: values.max_rounds,
    timeout_seconds: values.timeout_seconds,
    handoff_policy: values.handoff_policy,
    supervisor_prompt: nullableText(values.supervisor_prompt),
    failure_policy: values.failure_policy,
    quality_gate_enabled: values.quality_gate_enabled,
    quality_threshold: values.quality_threshold,
    budget_token_limit: values.budget_token_limit ?? null,
    budget_cost_limit: values.budget_cost_limit ?? null,
  };
}

function formDefaults(team?: AgentTeamDetail | null): AgentTeamFormValues {
  return {
    name: team?.name ?? '',
    code: team?.code ?? '',
    description: team?.description ?? '',
    owner_id: team?.owner?.id ?? '',
    status: (team?.status ?? 'DRAFT') as AgentTeamStatus,
    mode: (team?.mode ?? 'SEQUENTIAL') as AgentTeamMode,
    max_rounds: team?.max_rounds ?? 3,
    timeout_seconds: team?.timeout_seconds ?? 300,
    handoff_policy: (team?.handoff_policy ?? 'AUTO') as AgentTeamHandoffPolicy,
    supervisor_prompt: team?.supervisor_prompt ?? '',
    failure_policy: (team?.failure_policy ?? 'MATCH_HANDOFF_POLICY') as AgentTeamFailurePolicy,
    quality_gate_enabled: team?.quality_gate_enabled ?? false,
    quality_threshold: team?.quality_threshold ?? 0.75,
    budget_token_limit: team?.budget_token_limit ?? undefined,
    budget_cost_limit: team?.budget_cost_limit ?? undefined,
  };
}

export function AgentTeamFormPanel({
  error,
  isPending,
  mode,
  onCancel,
  onSubmit,
  owners,
  team,
}: AgentTeamFormPanelProps) {
  const form = useForm<AgentTeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: formDefaults(team),
  });

  useEffect(() => {
    form.reset(formDefaults(team));
  }, [form, team]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background shadow-sm">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑协作团队' : '新建协作团队'}</h2>
          </div>
          <Button onClick={onCancel} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-5 p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="团队名称" message={form.formState.errors.name?.message}>
            <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" {...form.register('name')} />
          </Field>

          <Field label="团队编码" message={form.formState.errors.code?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none read-only:bg-muted"
              readOnly={isEditing}
              {...form.register('code')}
            />
          </Field>
        </div>

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none" {...form.register('description')} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="负责人" message={form.formState.errors.owner_id?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('owner_id')}>
              <option value="">当前用户</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
              ))}
            </select>
          </Field>

          <Field label="状态" message={form.formState.errors.status?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('status')}>
              {teamStatuses.map((status) => <option key={status} value={status}>{teamStatusLabel(status)}</option>)}
            </select>
          </Field>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold">协作策略</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="协作模式" message={form.formState.errors.mode?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('mode')}>
                {teamModes.map((item) => <option key={item} value={item}>{teamModeLabel(item)}</option>)}
              </select>
            </Field>

            <Field label="接力策略" message={form.formState.errors.handoff_policy?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('handoff_policy')}>
                {handoffPolicies.map((item) => <option key={item} value={item}>{handoffPolicyLabel(item)}</option>)}
              </select>
            </Field>

            <Field label="最大轮次" message={form.formState.errors.max_rounds?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" min="1" type="number" {...form.register('max_rounds', { valueAsNumber: true })} />
            </Field>

            <Field label="超时时间（秒）" message={form.formState.errors.timeout_seconds?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" min="30" type="number" {...form.register('timeout_seconds', { valueAsNumber: true })} />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold">运行约束</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="失败策略" message={form.formState.errors.failure_policy?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('failure_policy')}>
                {failurePolicies.map((item) => <option key={item} value={item}>{failurePolicyLabel(item)}</option>)}
              </select>
            </Field>

            <Field label="质量阈值" message={form.formState.errors.quality_threshold?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" max="1" min="0" step="0.01" type="number" {...form.register('quality_threshold', { valueAsNumber: true })} />
            </Field>

            <Field label="Token 预算上限" message={form.formState.errors.budget_token_limit?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" min="1" placeholder="不限制" type="number" {...form.register('budget_token_limit', { setValueAs: optionalNumber })} />
            </Field>

            <Field label="成本预算上限" message={form.formState.errors.budget_cost_limit?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" min="0" placeholder="不限制" step="0.000001" type="number" {...form.register('budget_cost_limit', { setValueAs: optionalNumber })} />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('quality_gate_enabled')} />
            启用质量门禁
          </label>
        </div>

        <Field label="主管提示词" message={form.formState.errors.supervisor_prompt?.message}>
          <textarea className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none" {...form.register('supervisor_prompt')} />
        </Field>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="-mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isEditing ? '保存修改' : '新建协作团队'}</Button>
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

function optionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}
