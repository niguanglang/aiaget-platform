'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type AgentListItem,
  type ExternalApiCallLogItem,
  type ExternalApiObservabilityWindow,
  type ExternalApiQuotaRiskLevel,
  type ExternalApiSecurityDenialItem,
  type WebhookDeliveryDetail,
  type WebhookDeliveryListItem,
  type WebhookDeliveryStatus,
  type TenantApiKeyListItem,
  type TenantStatus,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Copy,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createTenantApiKey,
  deleteTenantApiKey,
  getExternalAgentChatEndpoint,
  getExternalApiObservability,
  getWebhookDelivery,
  listAgents,
  listWebhookDeliveries,
  listTenantApiKeys,
  retryWebhookDelivery,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const apiKeyFormSchema = z
  .object({
    name: z.string().min(2, '密钥名称至少需要 2 个字符。'),
    scopes: z.array(z.string()).min(1, '至少选择一个调用范围。'),
    allowed_agent_ids: z.array(z.string()).optional(),
    ip_allowlist_text: z.string().optional(),
    rate_limit_per_minute: z
      .string()
      .refine((value) => {
        const numberValue = Number(value);
        return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 10000;
      }, '分钟限流必须是 1 到 10000 之间的整数。'),
    daily_quota: z
      .string()
      .optional()
      .refine((value) => {
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
  .refine((value) => {
    if (!value.webhook_enabled) return true;
    return Boolean(value.webhook_url?.trim());
  }, {
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

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;
type QuotaRisk = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNLIMITED';

const windowOptions: Array<{ label: string; value: ExternalApiObservabilityWindow }> = [
  { label: '近 24 小时', value: '24h' },
  { label: '近 7 天', value: '7d' },
];

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const riskLabels: Record<QuotaRisk, string> = {
  NORMAL: '正常',
  WARNING: '预警',
  CRITICAL: '高危',
  UNLIMITED: '未设额度',
};

export function ApiKeyContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantApiKeyListItem | null>(null);
  const [deliveryFilterKeyId, setDeliveryFilterKeyId] = useState<string>('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [observabilityWindow, setObservabilityWindow] = useState<ExternalApiObservabilityWindow>('24h');

  const canManageApiKeys = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:api_key:manage'),
  );

  const apiKeysQuery = useQuery({
    queryKey: ['tenant-api-keys'],
    queryFn: listTenantApiKeys,
  });

  const agentsQuery = useQuery({
    queryKey: ['api-key-agents'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const observabilityQuery = useQuery({
    queryKey: ['external-api-observability', observabilityWindow],
    queryFn: () => getExternalApiObservability({ window: observabilityWindow }),
  });

  const webhookDeliveriesQuery = useQuery({
    queryKey: ['webhook-deliveries', deliveryFilterKeyId],
    queryFn: () => listWebhookDeliveries({ api_key_id: deliveryFilterKeyId || undefined }),
  });

  const selectedDeliveryQuery = useQuery({
    queryKey: ['webhook-delivery', selectedDeliveryId],
    queryFn: () => getWebhookDelivery(selectedDeliveryId ?? ''),
    enabled: Boolean(selectedDeliveryId),
  });

  const retryMutation = useMutation({
    mutationFn: retryWebhookDelivery,
    onSuccess: async (result) => {
      setNotice('Webhook 投递已重新发送。');
      setErrorMessage(null);
      setSelectedDeliveryId(result.item.delivery_id);
      await Promise.all([
        webhookDeliveriesQuery.refetch(),
        apiKeysQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const apiKeys = apiKeysQuery.data ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const endpoint = getExternalAgentChatEndpoint();

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
      setCreatedApiKey(result.api_key);
      setErrorMessage(null);
      setNotice('接口密钥已创建，请立即保存明文密钥。');
      form.reset({
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
      });
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenantApiKey,
    onSuccess: async () => {
      setNotice(deleteTarget ? `已删除接口密钥 ${deleteTarget.name}。` : '接口密钥已删除。');
      setErrorMessage(null);
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const filteredKeys = useMemo(
    () =>
      apiKeys.filter((apiKey) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const agentText = formatAllowedAgents(apiKey.allowed_agent_ids, agents).toLowerCase();
        const matchesKeyword =
          !normalizedKeyword ||
          apiKey.name.toLowerCase().includes(normalizedKeyword) ||
          apiKey.masked_key.toLowerCase().includes(normalizedKeyword) ||
          agentText.includes(normalizedKeyword);
        const matchesStatus = !statusFilter || apiKey.status === statusFilter;
        const matchesRisk = !riskFilter || quotaRisk(apiKey) === riskFilter;

        return matchesKeyword && matchesStatus && matchesRisk;
      }),
    [agents, apiKeys, keyword, riskFilter, statusFilter],
  );

  const metrics = useMemo(() => {
    const activeKeys = apiKeys.filter((apiKey) => apiKey.status === 'ACTIVE');
    const streamKeys = apiKeys.filter((apiKey) => apiKey.allow_stream);
    const webhookKeys = apiKeys.filter((apiKey) => apiKey.webhook_enabled);
    const riskyKeys = apiKeys.filter((apiKey) => ['WARNING', 'CRITICAL'].includes(quotaRisk(apiKey)));
    const recentlyUsed = apiKeys.filter((apiKey) => isWithinDays(apiKey.last_used_at, 7));
    const limitedAgents = apiKeys.filter((apiKey) => apiKey.allowed_agent_ids.length > 0);
    const ipRestricted = apiKeys.filter((apiKey) => apiKey.ip_allowlist.length > 0);

    return [
      { label: '接口密钥', value: `${apiKeys.length}`, helper: '租户外部调用凭证' },
      { label: '启用密钥', value: `${activeKeys.length}`, helper: '可用于 Agent 调用' },
      { label: '额度风险', value: `${riskyKeys.length}`, helper: '日额度超过 80%' },
      { label: '流式权限', value: `${streamKeys.length}`, helper: '允许外部 SSE 调用' },
      { label: 'Webhook 回调', value: `${webhookKeys.length}`, helper: '启用完成通知' },
      { label: 'Agent 白名单', value: `${limitedAgents.length}`, helper: '限定可调用对象' },
      { label: 'IP 白名单', value: `${ipRestricted.length}`, helper: `近 7 日使用 ${recentlyUsed.length} 个` },
    ];
  }, [apiKeys]);

  const webhookMetrics = useMemo(() => {
    const deliveries = webhookDeliveriesQuery.data?.items ?? [];
    const successCount = deliveries.filter((item) => item.status === 'SUCCESS').length;
    const failedCount = deliveries.filter((item) => item.status === 'FAILED').length;
    const retryingCount = deliveries.filter((item) => item.status === 'RETRYING').length;
    const averageLatency = average(deliveries.map((item) => item.latency_ms).filter(isNumber));

    return [
      { label: '投递总数', value: `${webhookDeliveriesQuery.data?.total ?? 0}`, helper: '近 30 条' },
      { label: '成功投递', value: `${successCount}`, helper: '状态 SUCCESS' },
      { label: '失败投递', value: `${failedCount}`, helper: '可重试记录' },
      { label: '重试中', value: `${retryingCount}`, helper: '最近一次重试' },
      { label: '平均耗时', value: formatLatency(averageLatency), helper: '响应和网络耗时' },
    ];
  }, [webhookDeliveriesQuery.data]);

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

  function refreshAll() {
    void Promise.all([
      apiKeysQuery.refetch(),
      agentsQuery.refetch(),
      observabilityQuery.refetch(),
    ]);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M50</StatusBadge>
            <StatusBadge tone="healthy">外部调用</StatusBadge>
            <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>
              {canManageApiKeys ? '可管理' : '仅查看'}
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">API Key 管理中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            为外部服务端、自动化任务和集成系统发放受限 Agent 调用密钥，统一控制 Agent 白名单、调用范围、限流、额度、IP 白名单和过期时间。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void copyText(endpoint, '外部调用地址已复制。')} type="button" variant="outline">
            <Copy className="size-4" />
            复制地址
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/api-reference">
              <BookOpen className="size-4" />
              接口文档
            </a>
          </Button>
          <Button onClick={refreshAll} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </motion.section>

      <section className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.08),transparent_30%)]" />

      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
      {errorMessage || apiKeysQuery.isError || agentsQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage ?? 'API Key 数据加载失败，请检查登录状态或接口权限。'}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apiKeysQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
      </section>

      <section className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M62</StatusBadge>
                <StatusBadge tone="healthy">Webhook 投递日志</StatusBadge>
                <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '可重试' : '只读'}</StatusBadge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">Webhook 投递日志</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                查看 Agent 运行完成后的回调投递记录、响应状态、失败原因和重试链路。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setDeliveryFilterKeyId(event.target.value)}
                value={deliveryFilterKeyId}
              >
                <option value="">全部 API Key</option>
                {apiKeys.map((apiKey) => (
                  <option key={apiKey.id} value={apiKey.id}>
                    {apiKey.name}
                  </option>
                ))}
              </select>
              <Button onClick={() => void webhookDeliveriesQuery.refetch()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                刷新日志
              </Button>
            </div>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {webhookDeliveriesQuery.isLoading
            ? Array.from({ length: 5 }).map((_, index) => <div className="h-24 rounded-lg border bg-muted/30" key={index} />)
            : webhookMetrics.map((metric) => (
                <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
              ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="grid gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">最近投递</h3>
                <p className="mt-1 text-sm text-muted-foreground">按最近时间排序，点击一条记录查看 payload 和响应详情。</p>
              </div>
              <StatusBadge tone="mock">{webhookDeliveriesQuery.data?.total ?? 0} 条</StatusBadge>
            </div>

            {webhookDeliveriesQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-md border bg-muted/30" key={index} />)}
              </div>
            ) : (webhookDeliveriesQuery.data?.items ?? []).length === 0 ? (
              <EmptyState
                description="当前没有 Webhook 投递记录。完成一次外部 Agent 调用后，记录会出现在这里。"
                title="暂无投递日志"
              />
            ) : (
              <div className="grid gap-3">
                {(webhookDeliveriesQuery.data?.items ?? []).map((item) => (
                  <WebhookDeliveryRow
                    item={item}
                    key={item.id}
                    onCopy={(value, message) => void copyText(value, message)}
                    onOpen={() => setSelectedDeliveryId(item.delivery_id)}
                    onRetry={() => retryMutation.mutate(item.delivery_id)}
                    canManage={canManageApiKeys}
                    selected={selectedDeliveryId === item.delivery_id}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="grid gap-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">投递详情</h3>
              <p className="mt-1 text-sm text-muted-foreground">查看请求头、payload、响应正文和重试链路。</p>
            </div>

            {!selectedDeliveryId ? (
              <EmptyState description="先选择一条投递日志查看明细。" title="未选择投递" />
            ) : selectedDeliveryQuery.isLoading ? (
              <div className="grid gap-3">
                <div className="h-20 rounded-md border bg-muted/30" />
                <div className="h-28 rounded-md border bg-muted/30" />
              </div>
            ) : selectedDeliveryQuery.data ? (
              <WebhookDeliveryDetailCard
                canManage={canManageApiKeys}
                item={selectedDeliveryQuery.data}
                onRetry={() => retryMutation.mutate(selectedDeliveryQuery.data.delivery_id)}
              />
            ) : (
              <EmptyState description="投递详情加载失败。" title="详情不可用" />
            )}
          </Card>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <EndpointCard
          endpoint={endpoint}
          firstAgentId={agents[0]?.id ?? null}
          onCopy={(value, message) => void copyText(value, message)}
        />
        <CreateKeyCard
          agents={agents}
          canManage={canManageApiKeys}
          createdApiKey={createdApiKey}
          form={form}
          pending={createMutation.isPending}
          onCopy={(value, message) => void copyText(value, message)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      </section>

      <ExternalObservabilitySection
        loading={observabilityQuery.isLoading}
        overview={observabilityQuery.data ?? null}
        window={observabilityWindow}
        onCopy={(value, message) => void copyText(value, message)}
        onRefresh={() => void observabilityQuery.refetch()}
        onWindowChange={setObservabilityWindow}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">密钥清单</h2>
              <p className="mt-1 text-sm text-muted-foreground">查看外部调用密钥的状态、额度、白名单和最近使用情况。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="w-52 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、密钥或 Agent"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="">全部状态</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
                <option value="DELETED">已删除</option>
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setRiskFilter(event.target.value)}
                value={riskFilter}
              >
                <option value="">全部风险</option>
                <option value="NORMAL">正常</option>
                <option value="WARNING">预警</option>
                <option value="CRITICAL">高危</option>
                <option value="UNLIMITED">未设额度</option>
              </select>
            </div>
          </div>

          {apiKeysQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-24 rounded-md border bg-muted/30" key={index} />
              ))}
            </div>
          ) : filteredKeys.length === 0 ? (
            <EmptyState
              description={apiKeys.length === 0 ? '创建第一枚密钥后，外部系统即可通过受控范围调用已授权 Agent。' : '当前筛选条件下没有匹配的接口密钥。'}
              title={apiKeys.length === 0 ? '暂无接口密钥' : '没有匹配结果'}
            />
          ) : (
            <div className="grid gap-3">
              {filteredKeys.map((apiKey) => (
                <ApiKeyRow
                  agents={agents}
                  apiKey={apiKey}
                  canManage={canManageApiKeys}
                  key={apiKey.id}
                  onDelete={() => setDeleteTarget(apiKey)}
                />
              ))}
            </div>
          )}
        </Card>

        <GovernanceCard canManage={canManageApiKeys} />
      </section>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会删除接口密钥 ${deleteTarget.name}，删除后外部系统无法继续使用该密钥调用 Agent。`}
          pending={deleteMutation.isPending}
          title="删除接口密钥？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function EndpointCard({
  endpoint,
  firstAgentId,
  onCopy,
}: {
  endpoint: string;
  firstAgentId: string | null;
  onCopy: (value: string, message: string) => void;
}) {
  const exampleEndpoint = getExternalAgentChatEndpoint(firstAgentId ?? '{agentId}');

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LockKeyhole className="size-4 text-primary" />
            外部调用入口
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            外部服务通过租户 API Key 调用指定 Agent。密钥只在创建成功后明文展示一次。
          </p>
        </div>
        <StatusBadge tone="mock">Bearer / x-api-key</StatusBadge>
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
        <div className="text-xs font-medium text-muted-foreground">通用地址</div>
        <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs">
          <span className="min-w-0 flex-1 break-all">{endpoint}</span>
          <Button onClick={() => onCopy(endpoint, '通用调用地址已复制。')} size="sm" type="button" variant="outline">
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
        <div className="text-xs font-medium text-muted-foreground">请求示例</div>
        <pre className="overflow-x-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{`POST ${exampleEndpoint}
Authorization: Bearer ak_xxx
Content-Type: application/json

{
  "message": "请总结今天的运行异常",
  "title": "外部系统调用"
}`}
        </pre>
        <div className="flex justify-end">
          <Button onClick={() => onCopy(exampleEndpoint, '示例调用地址已复制。')} size="sm" type="button" variant="outline">
            <Copy className="size-4" />
            复制示例地址
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreateKeyCard({
  agents,
  canManage,
  createdApiKey,
  form,
  pending,
  onCopy,
  onSubmit,
}: {
  agents: AgentListItem[];
  canManage: boolean;
  createdApiKey: string | null;
  form: ReturnType<typeof useForm<ApiKeyFormValues>>;
  pending: boolean;
  onCopy: (value: string, message: string) => void;
  onSubmit: (values: ApiKeyFormValues) => void;
}) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-primary" />
            创建受控密钥
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            设置调用范围、Agent 白名单、限流和额度。没有管理权限时表单会保持只读。
          </p>
        </div>
        <StatusBadge tone={canManage ? 'healthy' : 'planned'}>{canManage ? '允许创建' : '只读'}</StatusBadge>
      </div>

      {!canManage ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前账号没有 `system:api_key:manage` 权限，只能查看接口密钥。
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Field label="密钥名称" message={form.formState.errors.name?.message}>
            <Input disabled={!canManage} placeholder="例如：CRM 服务端调用" {...form.register('name')} />
          </Field>
          <Field label="过期时间">
            <Input disabled={!canManage} type="datetime-local" {...form.register('expires_at')} />
          </Field>
        </div>

        <Field label="允许调用的 Agent">
          <select
            className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
            disabled={!canManage}
            multiple
            {...form.register('allowed_agent_ids')}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} / {agent.code}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-muted-foreground">不选择表示允许调用当前用户有权限使用的全部 Agent。</span>
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="分钟限流" message={form.formState.errors.rate_limit_per_minute?.message}>
            <Input disabled={!canManage} min={1} type="number" {...form.register('rate_limit_per_minute')} />
          </Field>
          <Field label="每日额度" message={form.formState.errors.daily_quota?.message}>
            <Input disabled={!canManage} min={1} placeholder="留空不限" type="number" {...form.register('daily_quota')} />
          </Field>
          <Field label="调用范围" message={form.formState.errors.scopes?.message}>
            <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal">
              <input disabled={!canManage} type="checkbox" value="external:agent:chat" {...form.register('scopes')} />
              非流式 Agent 调用
            </label>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Field label="IP 白名单">
            <textarea
              className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
              disabled={!canManage}
              placeholder="每行一个 IP，留空表示不限"
              {...form.register('ip_allowlist_text')}
            />
          </Field>
          <Field label="流式权限">
            <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal">
              <input disabled={!canManage} type="checkbox" {...form.register('allow_stream')} />
              允许外部 SSE
            </label>
          </Field>
        </div>

        <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <RadioTower className="size-4 text-primary" />
                Webhook 完成通知
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                外部 Agent 调用完成后异步 POST 到回调地址，主调用不会等待回调成功。
              </p>
            </div>
            <label className="flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal">
              <input disabled={!canManage} type="checkbox" {...form.register('webhook_enabled')} />
              启用回调
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Field label="回调地址" message={form.formState.errors.webhook_url?.message}>
              <Input
                disabled={!canManage}
                placeholder="https://example.com/aiaget/webhooks"
                {...form.register('webhook_url')}
              />
            </Field>
            <Field label="签名密钥">
              <Input
                disabled={!canManage}
                placeholder="留空则不签名"
                type="password"
                {...form.register('webhook_secret')}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <StatusBadge tone="mock">事件：Agent 运行完成</StatusBadge>
            <span>请求头包含 x-aiaget-event、x-aiaget-delivery-id、x-aiaget-timestamp 和可选签名。</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button disabled={!canManage || pending} type="submit">
            创建密钥
          </Button>
        </div>
      </form>

      {createdApiKey ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">请立即保存新密钥</div>
            <Button onClick={() => onCopy(createdApiKey, '新密钥已复制。')} size="sm" type="button" variant="outline">
              <Copy className="size-4" />
              复制
            </Button>
          </div>
          <div className="mt-2 break-all rounded-md border border-emerald-200 bg-white/70 px-3 py-2 font-mono text-xs">
            {createdApiKey}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ApiKeyRow({
  agents,
  apiKey,
  canManage,
  onDelete,
}: {
  agents: AgentListItem[];
  apiKey: TenantApiKeyListItem;
  canManage: boolean;
  onDelete: () => void;
}) {
  const risk = quotaRisk(apiKey);

  return (
    <div className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10 xl:grid-cols-[minmax(0,1fr)_220px_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{apiKey.name}</h3>
          <StatusBadge tone={statusTone(apiKey.status)}>{tenantStatusLabel(apiKey.status)}</StatusBadge>
          <StatusBadge tone={riskTone(risk)}>{riskLabels[risk]}</StatusBadge>
          {apiKey.allow_stream ? <StatusBadge tone="mock">流式</StatusBadge> : null}
          {apiKey.webhook_enabled ? (
            <StatusBadge tone={webhookTone(apiKey.webhook_last_status)}>Webhook</StatusBadge>
          ) : null}
        </div>
        <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{apiKey.masked_key}</div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
          <span>范围：{apiKey.scopes.join('、') || '未配置'}</span>
          <span>Agent：{formatAllowedAgents(apiKey.allowed_agent_ids, agents)}</span>
          <span>IP：{apiKey.ip_allowlist.length > 0 ? apiKey.ip_allowlist.join('、') : '不限'}</span>
          <span>创建：{formatDateTime(apiKey.created_at)}</span>
          <span>Webhook：{apiKey.webhook_enabled ? formatWebhookTarget(apiKey.webhook_url) : '未启用'}</span>
          <span>签名：{apiKey.webhook_secret_configured ? '已配置' : '未配置'}</span>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs">
        <DetailRow label="分钟限流" value={`${apiKey.rate_limit_per_minute}/分钟`} />
        <DetailRow label="日额度" value={formatQuota(apiKey)} />
        <DetailRow label="最近使用" value={apiKey.last_used_at ? formatDateTime(apiKey.last_used_at) : '从未'} />
        <DetailRow label="回调状态" value={formatWebhookDelivery(apiKey)} />
      </div>

      <div className="flex items-start justify-end">
        <Button disabled={!canManage} onClick={onDelete} size="sm" type="button" variant="outline">
          <Trash2 className="size-4" />
          删除
        </Button>
      </div>
    </div>
  );
}

function WebhookDeliveryRow({
  item,
  canManage,
  onCopy,
  selected,
  onOpen,
  onRetry,
}: {
  item: WebhookDeliveryListItem;
  canManage: boolean;
  onCopy: (value: string, message: string) => void;
  selected: boolean;
  onOpen: () => void;
  onRetry: () => void;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-md border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-muted/10',
        selected ? 'border-primary/40 bg-primary/5' : '',
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={webhookDeliveryTone(item.status)}>{webhookDeliveryLabel(item.status)}</StatusBadge>
            <span className="text-sm font-semibold">{item.api_key_name}</span>
            <span className="font-mono text-xs text-muted-foreground">{item.response_status ?? '无响应码'}</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <span>投递 ID：{item.delivery_id}</span>
            <span>父级：{item.parent_delivery_id ?? '无'}</span>
            <span>事件：{item.event}</span>
            <span>目标：{formatWebhookTarget(item.target_url)}</span>
            <span>投递时间：{formatDateTime(item.delivered_at ?? item.created_at)}</span>
            <span>更新：{formatDateTime(item.created_at)}</span>
          </div>
          {item.error_message ? <div className="mt-2 line-clamp-2 text-xs text-destructive">{item.error_message}</div> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="mock">{formatLatency(item.latency_ms)}</StatusBadge>
            <StatusBadge tone="mock">重试 {item.retry_count} 次</StatusBadge>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onCopy(item.delivery_id, '投递 ID 已复制。');
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <Copy className="size-4" />
              复制
            </Button>
            <Button
              disabled={!canManage || item.status !== 'FAILED'}
              onClick={(event) => {
                event.stopPropagation();
                onRetry();
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              重试
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookDeliveryDetailCard({
  canManage,
  item,
  onRetry,
}: {
  canManage: boolean;
  item: WebhookDeliveryDetail;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs">
        <DetailRow label="投递 ID" value={item.delivery_id} />
        <DetailRow label="父级投递 ID" value={item.parent_delivery_id ?? '无'} />
        <DetailRow label="API Key" value={`${item.api_key_name} / ${item.api_key_prefix}`} />
        <DetailRow label="事件类型" value={item.event} />
        <DetailRow label="目标地址" value={formatWebhookTarget(item.target_url)} />
        <DetailRow label="投递状态" value={webhookDeliveryLabel(item.status)} />
        <DetailRow label="响应状态码" value={item.response_status === null ? '无' : `${item.response_status}`} />
        <DetailRow label="耗时" value={formatLatency(item.latency_ms)} />
        <DetailRow label="重试次数" value={`${item.retry_count}`} />
        <DetailRow label="投递时间" value={formatDateTime(item.delivered_at ?? item.created_at)} />
        <DetailRow label="更新时间" value={formatDateTime(item.updated_at)} />
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">请求头</div>
        <pre className="max-h-60 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(item.request_headers)}
        </pre>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">payload</div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(item.payload)}
        </pre>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">响应正文</div>
        <pre className="max-h-48 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{item.response_body ?? '无响应正文'}
        </pre>
      </div>

      {item.error_message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {item.error_message}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          disabled={!canManage || item.status !== 'FAILED'}
          onClick={onRetry}
          type="button"
          variant="outline"
        >
          <RotateCcw className="size-4" />
          重试失败投递
        </Button>
      </div>
    </div>
  );
}

function ExternalObservabilitySection({
  loading,
  overview,
  window,
  onCopy,
  onRefresh,
  onWindowChange,
}: {
  loading: boolean;
  overview: Awaited<ReturnType<typeof getExternalApiObservability>> | null;
  window: ExternalApiObservabilityWindow;
  onCopy: (value: string, message: string) => void;
  onRefresh: () => void;
  onWindowChange: (window: ExternalApiObservabilityWindow) => void;
}) {
  const summary = overview?.summary;
  const metrics = [
    { label: '外部请求', value: formatInteger(summary?.total_requests), helper: `${windowLabel(window)} 窗口` },
    { label: '成功率', value: summary ? formatPercent(summary.success_rate) : '-', helper: `${formatInteger(summary?.success_requests)} 次成功` },
    { label: '拒绝事件', value: formatInteger(summary?.denied_requests), helper: '安全/权限拦截' },
    { label: '词元消耗', value: formatInteger(summary?.total_tokens), helper: formatMoney(summary?.total_cost) },
  ];

  return (
    <section className="grid gap-4">
      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M57</StatusBadge>
              <StatusBadge tone="healthy">外部调用观测</StatusBadge>
              <StatusBadge tone="mock">{windowLabel(window)}</StatusBadge>
            </div>
            <h2 className="mt-3 text-lg font-semibold">外部 API 调用观测</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              聚合外部系统通过 API Key 调用 Agent 的请求、额度消耗、安全拒绝和 Trace 线索，用于排查调用来源、失败原因和成本风险。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              onChange={(event) => onWindowChange(event.target.value as ExternalApiObservabilityWindow)}
              value={window}
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button onClick={onRefresh} type="button" variant="outline">
              <RefreshCw className="size-4" />
              刷新观测
            </Button>
            <Button asChild type="button" variant="outline">
              <a href="/api-reference">
                <BookOpen className="size-4" />
                接口文档
              </a>
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <ExternalCallListCard calls={overview?.recent_calls ?? []} loading={loading} onCopy={onCopy} window={window} />
        <div className="grid gap-4">
          <QuotaWatchCard items={overview?.quota_watch ?? []} loading={loading} />
          <SecurityDenialCard items={overview?.security_denials ?? []} loading={loading} onCopy={onCopy} window={window} />
        </div>
      </section>
    </section>
  );
}

function ExternalCallListCard({
  calls,
  loading,
  onCopy,
  window,
}: {
  calls: ExternalApiCallLogItem[];
  loading: boolean;
  onCopy: (value: string, message: string) => void;
  window: ExternalApiObservabilityWindow;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">最近外部调用</h3>
          <p className="mt-1 text-sm text-muted-foreground">按操作日志聚合外部 Agent 调用，并尽量关联会话 Run、Trace、词元和成本。</p>
        </div>
        <StatusBadge tone="mock">{calls.length} 条</StatusBadge>
      </div>
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => <div className="h-24 rounded-md border bg-muted/30" key={index} />)}
        </div>
      ) : calls.length === 0 ? (
        <EmptyState description="当前时间窗口内没有外部调用记录。真实外部系统调用后会在这里展示。" title="暂无外部调用" />
      ) : (
        <div className="grid gap-3">
          {calls.map((call) => (
            <div className="rounded-md border bg-background/90 p-4" key={call.event_id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={callStatusTone(call.status)}>{callStatusLabel(call.status)}</StatusBadge>
                    <span className="text-sm font-semibold">{call.agent_name ?? call.agent_id ?? '未知 Agent'}</span>
                    <span className="font-mono text-xs text-muted-foreground">{call.status_code}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    <span>密钥：{call.api_key_name ?? call.masked_key ?? '未关联'}</span>
                    <span>时间：{formatDateTime(call.occurred_at)}</span>
                    <span>词元：{formatInteger(call.total_tokens)} · 成本：{formatMoney(call.cost_total)}</span>
                    <span>延迟：{formatLatency(call.latency_ms)}</span>
                    <span>IP：{call.ip ?? '未知'}</span>
                    <span className="truncate">请求：{call.request_id}</span>
                  </div>
                  {call.error_message ? <div className="mt-2 text-xs text-destructive">{call.error_message}</div> : null}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {call.trace_id ? (
                    <>
                      <Button onClick={() => onCopy(call.trace_id ?? '', 'Trace ID 已复制。')} size="sm" type="button" variant="outline">
                        <Copy className="size-4" />
                        Trace
                      </Button>
                      <Button asChild size="sm" type="button" variant="outline">
                        <a href={`/monitor?trace=${encodeURIComponent(call.trace_id)}&window=${window}`}>
                          <ExternalLink className="size-4" />
                          监控
                        </a>
                      </Button>
                    </>
                  ) : null}
                  <Button onClick={() => onCopy(call.request_id, 'Request ID 已复制。')} size="sm" type="button" variant="outline">
                    <Copy className="size-4" />
                    请求
                  </Button>
                  <Button asChild size="sm" type="button" variant="outline">
                    <a href={`/audit?keyword=${encodeURIComponent(call.request_id)}&window=${window}`}>
                      审计
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function QuotaWatchCard({ items, loading }: { items: Awaited<ReturnType<typeof getExternalApiObservability>>['quota_watch']; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h3 className="text-sm font-semibold">额度关注</h3>
        <p className="mt-1 text-sm text-muted-foreground">按日额度使用率排序，优先展示风险密钥。</p>
      </div>
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, index) => <div className="h-16 rounded-md border bg-muted/30" key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState description="暂无可观测的 API Key 额度数据。" title="暂无额度数据" />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/20 p-3" key={item.api_key_id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.api_key_name}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{item.masked_key}</div>
                </div>
                <StatusBadge tone={quotaRiskTone(item.risk_level)}>{quotaRiskLabel(item.risk_level)}</StatusBadge>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <span>今日：{formatInteger(item.used_count_today)} / {item.daily_quota === null ? '不限' : formatInteger(item.daily_quota)}</span>
                <span>剩余：{item.remaining_today === null ? '不限' : formatInteger(item.remaining_today)}</span>
                <span>使用率：{item.usage_rate === null ? '未设额度' : formatPercent(item.usage_rate)}</span>
                <span>最近使用：{formatDateTime(item.last_used_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SecurityDenialCard({
  items,
  loading,
  onCopy,
  window,
}: {
  items: ExternalApiSecurityDenialItem[];
  loading: boolean;
  onCopy: (value: string, message: string) => void;
  window: ExternalApiObservabilityWindow;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h3 className="text-sm font-semibold">安全拒绝</h3>
        <p className="mt-1 text-sm text-muted-foreground">展示外部调用触发的权限、数据范围、资源授权和安全策略拒绝。</p>
      </div>
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 2 }).map((_, index) => <div className="h-20 rounded-md border bg-muted/30" key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有外部调用安全拒绝事件。" title="暂无拒绝事件" />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3" key={item.event_id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-amber-900">{item.reason}</div>
                  <div className="mt-1 grid gap-1 text-xs text-amber-800">
                    <span>来源：{item.source ?? '安全事件'}</span>
                    <span>密钥：{item.api_key_prefix ? `${item.api_key_prefix}****` : item.api_key_id ?? '未关联'}</span>
                    <span>Agent：{item.agent_id ?? '未知'}</span>
                    <span>时间：{formatDateTime(item.occurred_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {item.trace_id ? (
                    <Button onClick={() => onCopy(item.trace_id ?? '', 'Trace ID 已复制。')} size="sm" type="button" variant="outline">
                      <Copy className="size-4" />
                      Trace
                    </Button>
                  ) : null}
                  <Button asChild size="sm" type="button" variant="outline">
                    <a href={`/audit?keyword=${encodeURIComponent(item.request_id)}&window=${window}`}>
                      审计
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function GovernanceCard({ canManage }: { canManage: boolean }) {
  return (
    <Card className="h-fit p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4 text-primary" />
        外部调用治理
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <GovernanceItem
          title="密钥只展示一次"
          description="创建成功后立即保存明文密钥。列表只展示脱敏前缀。"
        />
        <GovernanceItem
          title="Agent 白名单优先"
          description="生产集成建议绑定到指定 Agent，避免一枚密钥覆盖全部能力。"
        />
        <GovernanceItem
          title="额度和 IP 双限制"
          description="对外部系统使用日额度、分钟限流和 IP 白名单共同降低风险。"
        />
        <GovernanceItem
          title="权限仍在后端校验"
          description="外部调用会继续校验 API Key scope、创建人权限、数据范围和资源授权。"
        />
        <GovernanceItem
          title="Webhook 异步投递"
          description="Agent 运行完成后发送回调，失败只记录投递状态，不阻塞外部调用主响应。"
        />
        <GovernanceItem
          title="签名密钥可选"
          description="配置签名密钥后会生成 HMAC 签名，接收方可校验时间戳和正文完整性。"
        />
      </div>
      <div className="mt-5 rounded-md border bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <AlertTriangle className="size-4 text-amber-600" />
          当前权限
        </div>
        <div className="mt-2">
          {canManage ? '当前账号可以创建和删除外部调用密钥。' : '当前账号只能查看密钥配置，请联系租户管理员分配管理权限。'}
        </div>
      </div>
    </Card>
  );
}

function GovernanceItem({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  body,
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">删除</Button>
        </div>
      </div>
    </section>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function parseLines(value?: string) {
  return Array.from(new Set((value ?? '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

function normalizedScopes(scopes: string[], allowStream: boolean) {
  const output = new Set(scopes);
  if (allowStream) output.add('external:agent:stream');
  return Array.from(output);
}

function formatAllowedAgents(agentIds: string[], agents: AgentListItem[]) {
  if (agentIds.length === 0) return '全部有权 Agent';
  const agentNameById = new Map(agents.map((agent) => [agent.id, agent.name]));
  return agentIds.map((id) => agentNameById.get(id) ?? id).join('、');
}

function quotaRisk(apiKey: TenantApiKeyListItem): QuotaRisk {
  if (!apiKey.daily_quota) return 'UNLIMITED';
  const ratio = apiKey.used_count_today / apiKey.daily_quota;
  if (ratio >= 0.95) return 'CRITICAL';
  if (ratio >= 0.8) return 'WARNING';
  return 'NORMAL';
}

function riskTone(risk: QuotaRisk) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

function statusTone(status: TenantStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

function tenantStatusLabel(status: TenantStatus) {
  return tenantStatusLabels[status] ?? status;
}

function webhookTone(status: TenantApiKeyListItem['webhook_last_status'] | null) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  return 'planned';
}

function formatWebhookTarget(value: string | null) {
  if (!value) return '未配置地址';
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

function webhookDeliveryTone(status: WebhookDeliveryStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'RETRYING') return 'degraded';
  return 'planned';
}

function webhookDeliveryLabel(status: WebhookDeliveryStatus) {
  const labels: Record<WebhookDeliveryStatus, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '待投递',
    RETRYING: '重试中',
  };

  return labels[status] ?? status;
}

function stringifyPretty(value: unknown) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatWebhookDelivery(apiKey: TenantApiKeyListItem) {
  if (!apiKey.webhook_enabled) return '未启用';
  if (!apiKey.webhook_last_status) return '暂无投递';

  const statusLabels: Record<NonNullable<TenantApiKeyListItem['webhook_last_status']>, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    SKIPPED: '跳过',
  };
  const time = apiKey.webhook_last_sent_at ? formatDateTime(apiKey.webhook_last_sent_at) : '未知时间';
  const error = apiKey.webhook_last_error ? `：${apiKey.webhook_last_error}` : '';

  return `${statusLabels[apiKey.webhook_last_status]} · ${time}${error}`;
}

function formatQuota(apiKey: TenantApiKeyListItem) {
  if (!apiKey.daily_quota) return '不限';
  return `${apiKey.used_count_today}/${apiKey.daily_quota}`;
}

function isWithinDays(value: string | null, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `¥${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
  }).format(value)}`;
}

function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} 秒`;
  return `${Math.round(value)} 毫秒`;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function windowLabel(window: ExternalApiObservabilityWindow) {
  return window === '7d' ? '近 7 天' : '近 24 小时';
}

function callStatusTone(status: ExternalApiCallLogItem['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

function callStatusLabel(status: ExternalApiCallLogItem['status']) {
  const labels: Record<ExternalApiCallLogItem['status'], string> = {
    SUCCESS: '成功',
    DEGRADED: '异常',
    FAILED: '失败',
  };

  return labels[status] ?? status;
}

function quotaRiskTone(risk: ExternalApiQuotaRiskLevel) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

function quotaRiskLabel(risk: ExternalApiQuotaRiskLevel) {
  const labels: Record<ExternalApiQuotaRiskLevel, string> = {
    NORMAL: '正常',
    WARNING: '预警',
    CRITICAL: '高危',
    UNLIMITED: '未设额度',
  };

  return labels[risk] ?? risk;
}
