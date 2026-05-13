'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Copy, KeyRound, LockKeyhole, RadioTower } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { createTenantApiKey, getExternalAgentChatEndpoint, listAgents, type ApiClientError } from '@/lib/api-client';

import { ErrorBanner, Field, NoticeBanner, nullableNumber, nullableText, normalizedScopes, parseLines, type ApiKeyFormValues, useCanManageApiKeys } from './api-key-shared';

const apiKeyFormSchema = z
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

export function ApiKeyCreateContent() {
  const queryClient = useQueryClient();
  const canManageApiKeys = useCanManageApiKeys();
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const agentsQuery = useQuery({
    queryKey: ['api-key-agents'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const agents = agentsQuery.data?.items ?? [];
  const endpoint = getExternalAgentChatEndpoint();
  const exampleEndpoint = getExternalAgentChatEndpoint(agents[0]?.id ?? '{agentId}');

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
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

  const createMutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      createTenantApiKey({
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
    onSuccess: async (result) => {
      setCreatedSecret(result.api_key);
      setErrorMessage(null);
      setNotice('接口密钥已创建，请立即保存明文密钥。');
      form.reset({ name: '', scopes: ['external:agent:chat'], allowed_agent_ids: [], ip_allowlist_text: '', rate_limit_per_minute: '60', daily_quota: '', allow_stream: true, webhook_enabled: false, webhook_url: '', webhook_secret: '', expires_at: '' });
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard?.writeText(value);
      setNotice(message);
      setErrorMessage(null);
    } catch {
      setNotice(null);
      setErrorMessage('复制失败，请手动选中文本复制。');
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">创建密钥</StatusBadge>
            <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '允许创建' : '只读'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">创建 API Key</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">配置调用范围、Agent 白名单、限流、额度、IP 白名单和 Webhook。明文密钥仅展示一次。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline"><a href="/api-keys">返回列表</a></Button>
          <Button asChild type="button" variant="outline"><a href="/api-reference"><BookOpen className="size-4" />接口文档</a></Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (agentsQuery.isError ? 'Agent 列表加载失败，请检查接口权限。' : null)} />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="size-4 text-primary" />外部调用入口</div>
          <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
            <div className="text-xs font-medium text-muted-foreground">通用地址</div>
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
              <span className="min-w-0 flex-1 break-all">{endpoint}</span>
              <Button onClick={() => void copyText(endpoint, '通用调用地址已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" /></Button>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">{`POST ${exampleEndpoint}\nAuthorization: Bearer ak_xxx\nContent-Type: application/json\n\n{\n  "message": "请总结今天的运行异常",\n  "title": "外部系统调用"\n}`}</pre>
        </Card>

        <Card className="grid gap-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-primary" />创建受控密钥</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">没有管理权限时表单保持只读。</p>
            </div>
            <StatusBadge tone={canManageApiKeys ? 'healthy' : 'planned'}>{canManageApiKeys ? '允许创建' : '只读'}</StatusBadge>
          </div>

          {!canManageApiKeys ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">当前账号没有 system:api_key:manage 权限，只能查看接口密钥。</div> : null}

          <form className="grid gap-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
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
                <div><div className="flex items-center gap-2 text-sm font-semibold"><RadioTower className="size-4 text-primary" />Webhook 完成通知</div><p className="mt-1 text-xs leading-5 text-muted-foreground">外部 Agent 调用完成后异步 POST 到回调地址。</p></div>
                <label className="flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal"><input disabled={!canManageApiKeys} type="checkbox" {...form.register('webhook_enabled')} />启用回调</label>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <Field label="回调地址" message={form.formState.errors.webhook_url?.message}><Input disabled={!canManageApiKeys} placeholder="https://example.com/aiaget/webhooks" {...form.register('webhook_url')} /></Field>
                <Field label="签名密钥"><Input disabled={!canManageApiKeys} placeholder="留空则不签名" type="password" {...form.register('webhook_secret')} /></Field>
              </div>
            </div>
            <div className="flex justify-end"><Button disabled={!canManageApiKeys || createMutation.isPending} type="submit">创建密钥</Button></div>
          </form>

          {createdSecret ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="flex items-center justify-between gap-3"><div className="font-medium">请立即保存新密钥</div><Button onClick={() => void copyText(createdSecret, '新密钥已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" />复制</Button></div>
              <div className="mt-2 break-all rounded-md border border-emerald-200 bg-white/70 px-3 py-2 font-mono text-xs">{createdSecret}</div>
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}
