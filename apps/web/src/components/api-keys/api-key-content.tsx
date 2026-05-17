'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Copy, Eye, Plus, RefreshCw, RadioTower, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteTenantApiKey,
  disableTenantApiKey,
  enableTenantApiKey,
  getExternalAgentChatEndpoint,
  listAgents,
  listTenantApiKeys,
  rotateTenantApiKey,
  type ApiClientError,
} from '@/lib/api-client';

import {
  ApiKeyRow,
  ConfirmDialog,
  ErrorBanner,
  GovernanceCard,
  NoticeBanner,
  formatAllowedAgents,
  isWithinDays,
  quotaRisk,
  useCanManageApiKeys,
} from './api-key-shared';

export function ApiKeyContent() {
  const queryClient = useQueryClient();
  const canManageApiKeys = useCanManageApiKeys();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Awaited<ReturnType<typeof listTenantApiKeys>>[number] | null>(null);
  const [apiKeyActionTarget, setApiKeyActionTarget] = useState<ApiKeyActionTarget | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<{ name: string; secret: string } | null>(null);

  const apiKeysQuery = useQuery({
    queryKey: ['tenant-api-keys'],
    queryFn: listTenantApiKeys,
  });

  const agentsQuery = useQuery({
    queryKey: ['api-key-agents'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
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

  const disableMutation = useMutation({
    mutationFn: disableTenantApiKey,
    onSuccess: async (item) => {
      setNotice(`已停用接口密钥 ${item.name}。`);
      setErrorMessage(null);
      setApiKeyActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const enableMutation = useMutation({
    mutationFn: enableTenantApiKey,
    onSuccess: async (item) => {
      setNotice(`已启用接口密钥 ${item.name}。`);
      setErrorMessage(null);
      setApiKeyActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: rotateTenantApiKey,
    onSuccess: async (result) => {
      setRotatedSecret({ name: result.item.name, secret: result.api_key });
      setNotice('接口密钥已轮换，请立即保存新密钥。');
      setErrorMessage(null);
      setApiKeyActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const apiKeys = apiKeysQuery.data ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const endpoint = getExternalAgentChatEndpoint();

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

    return [
      { label: '接口密钥', value: `${apiKeys.length}`, helper: '租户外部调用凭证' },
      { label: '启用密钥', value: `${activeKeys.length}`, helper: '可用于 Agent 调用' },
      { label: '额度风险', value: `${riskyKeys.length}`, helper: '日额度超过 80%' },
      { label: '流式权限', value: `${streamKeys.length}`, helper: '允许外部 SSE 调用' },
      { label: 'Webhook 回调', value: `${webhookKeys.length}`, helper: '启用完成通知' },
      { label: '近 7 日使用', value: `${recentlyUsed.length}`, helper: '最近发生外部调用' },
    ];
  }, [apiKeys]);

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

  function refreshList() {
    void Promise.all([apiKeysQuery.refetch(), agentsQuery.refetch()]);
  }

  function confirmApiKeyAction() {
    if (!apiKeyActionTarget) return;
    if (apiKeyActionTarget.type === 'DISABLE') {
      disableMutation.mutate(apiKeyActionTarget.apiKey.id);
      return;
    }
    if (apiKeyActionTarget.type === 'ENABLE') {
      enableMutation.mutate(apiKeyActionTarget.apiKey.id);
      return;
    }
    rotateMutation.mutate(apiKeyActionTarget.apiKey.id);
  }

  function apiKeyActionCopy(target: ApiKeyActionTarget) {
    if (target.type === 'DISABLE') {
      return {
        title: '确认停用 API Key？',
        body: `停用「${target.apiKey.name}」后，外部系统会立即无法继续使用该密钥调用 Agent。`,
      };
    }
    if (target.type === 'ENABLE') {
      return {
        title: '确认启用 API Key？',
        body: `启用「${target.apiKey.name}」后，外部系统可以重新使用该密钥调用授权 Agent。`,
      };
    }

    return {
      title: '确认轮换 API Key？',
      body: `轮换「${target.apiKey.name}」会立即废弃旧密钥。新密钥仅展示一次。`,
    };
  }

  const actionPending = disableMutation.isPending || enableMutation.isPending || rotateMutation.isPending;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">API Key</StatusBadge>
            <StatusBadge tone="healthy">外部调用</StatusBadge>
            <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '可管理' : '仅查看'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">API Key 管理中心</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <a href="/api-keys/create">
              <Plus className="size-4" />
              创建密钥
            </a>
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/api-keys/observability">
              <Eye className="size-4" />
              调用观测
            </a>
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/api-keys/webhook-deliveries">
              <RadioTower className="size-4" />
              Webhook 投递
            </a>
          </Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (apiKeysQuery.isError || agentsQuery.isError ? 'API Key 数据加载失败，请检查登录状态或接口权限。' : null)} />

      {rotatedSecret ? (
        <Card className="grid gap-3 border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-semibold">请立即保存新密钥</h2>
              <p className="mt-1 text-sm">「{rotatedSecret.name}」的新密钥只会展示一次。</p>
            </div>
            <Button onClick={() => void copyText(rotatedSecret.secret, '新密钥已复制。')} type="button" variant="outline">
              <Copy className="size-4" />
              复制新密钥
            </Button>
          </div>
          <div className="break-all rounded-md border border-emerald-200 bg-white/70 px-3 py-2 font-mono text-xs">{rotatedSecret.secret}</div>
        </Card>
      ) : null}

      <Card className="grid gap-3 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-semibold">外部调用入口</h2>
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
            <Button onClick={refreshList} type="button" variant="outline">
              <RefreshCw className="size-4" />
              刷新
            </Button>
          </div>
        </div>
        <div className="break-all rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs">{endpoint}</div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apiKeysQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => (
              <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm" key={metric.label}>
                <div className="text-xs font-medium text-muted-foreground">{metric.label}</div>
                <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
              </div>
            ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold">密钥清单</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input className="w-52 bg-transparent outline-none" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索名称、密钥或 Agent" value={keyword} />
              </label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="">全部状态</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
                <option value="DELETED">已删除</option>
              </select>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setRiskFilter(event.target.value)} value={riskFilter}>
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
              {Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-muted/30" key={index} />)}
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
                  onDisable={() => setApiKeyActionTarget({ apiKey, type: 'DISABLE' })}
                  onEnable={() => setApiKeyActionTarget({ apiKey, type: 'ENABLE' })}
                  onRotate={() => setApiKeyActionTarget({ apiKey, type: 'ROTATE' })}
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
      {apiKeyActionTarget ? (
        <ConfirmDialog
          body={apiKeyActionCopy(apiKeyActionTarget).body}
          pending={actionPending}
          title={apiKeyActionCopy(apiKeyActionTarget).title}
          onCancel={() => setApiKeyActionTarget(null)}
          onConfirm={confirmApiKeyAction}
        />
      ) : null}
    </main>
  );
}

type ApiKeyActionTarget = {
  apiKey: Awaited<ReturnType<typeof listTenantApiKeys>>[number];
  type: 'DISABLE' | 'ENABLE' | 'ROTATE';
};
