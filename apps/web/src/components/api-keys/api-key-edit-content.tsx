'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, KeyRound, RadioTower, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { listAgents, listTenantApiKeys, updateTenantApiKey, type ApiClientError } from '@/lib/api-client';

import {
  DetailRow,
  ErrorBanner,
  Field,
  NoticeBanner,
  formatQuota,
  nullableNumber,
  nullableText,
  normalizedScopes,
  parseLines,
  statusTone,
  tenantStatusLabel,
  type ApiKeyFormValues,
  useCanManageApiKeys,
} from './api-key-shared';

const apiKeyEditSchema = z
  .object({
    name: z.string().min(2, '密钥名称至少需要 2 个字符。'),
    scopes: z.array(z.string()).min(1, '至少选择一个调用范围。'),
    allowed_agent_ids: z.array(z.string()).optional(),
    ip_allowlist_text: z.string().optional(),
    rate_limit_per_minute: z.string().refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 10000;
    }, '分钟限流必须是 1 到 10000 之间的整数。'),
    daily_quota: z.string().optional().refine((value) => {
      if (!value?.trim()) return true;
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue >= 1;
    }, '每日额度必须是大于 0 的整数。'),
    allow_stream: z.boolean(),
    webhook_enabled: z.boolean(),
    webhook_url: z.string().optional(),
    webhook_secret: z.string().optional(),
    expires_at: z.string().optional(),
  })
  .refine((value) => !value.webhook_enabled || Boolean(value.webhook_url?.trim()), {
    message: '启用 Webhook 时必须填写回调地址。',
    path: ['webhook_url'],
  })
  .refine((value) => {
    const url = value.webhook_url?.trim();
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, {
    message: '回调地址必须是有效的 HTTP 或 HTTPS URL。',
    path: ['webhook_url'],
  });

export function ApiKeyEditContent({ apiKeyId }: { apiKeyId: string }) {
  const queryClient = useQueryClient();
  const canManageApiKeys = useCanManageApiKeys();
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiKeysQuery = useQuery({
    queryKey: ['tenant-api-keys'],
    queryFn: listTenantApiKeys,
  });
  const agentsQuery = useQuery({
    queryKey: ['api-key-agents'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const apiKey = useMemo(
    () => (apiKeysQuery.data ?? []).find((item) => item.id === apiKeyId) ?? null,
    [apiKeyId, apiKeysQuery.data],
  );
  const agents = agentsQuery.data?.items ?? [];

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyEditSchema),
    defaultValues: {
      name: '',
      scopes: ['external:agent:chat'],
      allowed_agent_ids: [],
      ip_allowlist_text: '',
      rate_limit_per_minute: '60',
      daily_quota: '',
      allow_stream: true,
      webhook_enabled: false,
      webhook_url: '',
      webhook_secret: '',
      expires_at: '',
    },
  });

  useEffect(() => {
    if (!apiKey) return;
    form.reset({
      name: apiKey.name,
      scopes: apiKey.scopes.filter((scope) => scope !== 'external:agent:stream'),
      allowed_agent_ids: apiKey.allowed_agent_ids,
      ip_allowlist_text: apiKey.ip_allowlist.join('\n'),
      rate_limit_per_minute: String(apiKey.rate_limit_per_minute),
      daily_quota: apiKey.daily_quota ? String(apiKey.daily_quota) : '',
      allow_stream: apiKey.allow_stream,
      webhook_enabled: apiKey.webhook_enabled,
      webhook_url: apiKey.webhook_url ?? '',
      webhook_secret: '',
      expires_at: apiKey.expires_at ? toLocalDateTimeInput(apiKey.expires_at) : '',
    });
  }, [apiKey, form]);

  const updateMutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      updateTenantApiKey(apiKeyId, {
        name: values.name,
        scopes: normalizedScopes(values.scopes, values.allow_stream),
        allowed_agent_ids: values.allowed_agent_ids ?? [],
        ip_allowlist: parseLines(values.ip_allowlist_text),
        rate_limit_per_minute: Number(values.rate_limit_per_minute),
        daily_quota: nullableNumber(values.daily_quota),
        allow_stream: values.allow_stream,
        webhook_enabled: values.webhook_enabled,
        webhook_url: nullableText(values.webhook_url),
        webhook_events: values.webhook_enabled ? ['agent.run.completed'] : [],
        webhook_secret: nullableText(values.webhook_secret),
        expires_at: nullableText(values.expires_at),
      }),
    onSuccess: async (item) => {
      setNotice(`已保存 API Key「${item.name}」配置。`);
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
      await queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  if (apiKeysQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6"><div className="h-80 rounded-lg border bg-muted/30" /></main>;
  }

  if (!apiKey) {
    return (
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" type="button" variant="outline"><Link href="/api-keys"><ArrowLeft className="size-4" />返回列表</Link></Button>
        <EmptyState description="该密钥不存在，或已被删除。" title="未找到 API Key" />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">编辑配置</StatusBadge>
            <StatusBadge tone={statusTone(apiKey.status)}>{tenantStatusLabel(apiKey.status)}</StatusBadge>
            <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '允许保存' : '只读'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">编辑 API Key</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            调整调用范围、Agent 白名单、限流额度、IP 白名单和 Webhook 完成通知。密钥明文不可查看，轮换请回到列表行内执行。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline"><Link href="/api-keys"><ArrowLeft className="size-4" />返回列表</Link></Button>
          <Button asChild type="button" variant="outline"><Link href="/api-reference"><BookOpen className="size-4" />接口文档</Link></Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (agentsQuery.isError ? 'Agent 列表加载失败，请检查接口权限。' : null)} />

      <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-primary" />当前密钥</div>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="名称" value={apiKey.name} />
            <DetailRow label="脱敏密钥" value={apiKey.masked_key} />
            <DetailRow label="状态" value={tenantStatusLabel(apiKey.status)} />
            <DetailRow label="额度" value={formatQuota(apiKey)} />
            <DetailRow label="Webhook 签名" value={apiKey.webhook_secret_configured ? '已配置' : '未配置'} />
          </div>
        </Card>

        <Card className="grid gap-5 p-5">
          {!canManageApiKeys ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">当前账号没有 system:api_key:manage 权限，只能查看配置。</div> : null}

          <form className="grid gap-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Field label="密钥名称" message={form.formState.errors.name?.message}><Input disabled={!canManageApiKeys} placeholder="例如：CRM 服务端调用" {...form.register('name')} /></Field>
              <Field label="过期时间"><Input disabled={!canManageApiKeys} type="datetime-local" {...form.register('expires_at')} /></Field>
            </div>
            <Field label="允许调用的 Agent">
              <select className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70" disabled={!canManageApiKeys} multiple {...form.register('allowed_agent_ids')}>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} / {agent.code}</option>)}
              </select>
              <span className="text-xs font-normal text-muted-foreground">不选择表示允许调用当前用户有权限使用的全部 Agent。</span>
            </Field>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="分钟限流" message={form.formState.errors.rate_limit_per_minute?.message}><Input disabled={!canManageApiKeys} min={1} type="number" {...form.register('rate_limit_per_minute')} /></Field>
              <Field label="每日额度" message={form.formState.errors.daily_quota?.message}><Input disabled={!canManageApiKeys} min={1} placeholder="留空不限" type="number" {...form.register('daily_quota')} /></Field>
              <Field label="调用范围" message={form.formState.errors.scopes?.message}><label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal"><input disabled={!canManageApiKeys} type="checkbox" value="external:agent:chat" {...form.register('scopes')} />非流式 Agent 调用</label></Field>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Field label="IP 白名单"><textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70" disabled={!canManageApiKeys} placeholder="每行一个 IP，留空表示不限" {...form.register('ip_allowlist_text')} /></Field>
              <Field label="流式权限"><label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal"><input disabled={!canManageApiKeys} type="checkbox" {...form.register('allow_stream')} />允许外部 SSE</label></Field>
            </div>
            <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><div className="flex items-center gap-2 text-sm font-semibold"><RadioTower className="size-4 text-primary" />Webhook 完成通知</div><p className="mt-1 text-xs leading-5 text-muted-foreground">保存后会影响该密钥后续所有外部调用完成通知。</p></div>
                <label className="flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal"><input disabled={!canManageApiKeys} type="checkbox" {...form.register('webhook_enabled')} />启用回调</label>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <Field label="回调地址" message={form.formState.errors.webhook_url?.message}><Input disabled={!canManageApiKeys} placeholder="https://example.com/aiaget/webhooks" {...form.register('webhook_url')} /></Field>
                <Field label="签名密钥"><Input disabled={!canManageApiKeys} placeholder="留空则清空签名密钥" type="password" {...form.register('webhook_secret')} /></Field>
              </div>
            </div>
            <div className="flex justify-end"><Button disabled={!canManageApiKeys || updateMutation.isPending} type="submit"><Save className="size-4" />保存配置</Button></div>
          </form>
        </Card>
      </section>
    </main>
  );
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
