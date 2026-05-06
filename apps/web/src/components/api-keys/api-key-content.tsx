'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { BookOpen, Copy, Eye, Plus, RefreshCw, RadioTower, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteTenantApiKey, getExternalAgentChatEndpoint, listAgents, listTenantApiKeys, type ApiClientError } from '@/lib/api-client';

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
            <StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '可管理' : '仅查看'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">API Key 管理中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            管理外部服务端、自动化任务和集成系统使用的受控 Agent 调用密钥。创建、观测和 Webhook 排障已拆分为独立页面，避免在列表页丢失关键状态。
          </p>
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
      </motion.section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (apiKeysQuery.isError || agentsQuery.isError ? 'API Key 数据加载失败，请检查登录状态或接口权限。' : null)} />

      <Card className="grid gap-3 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">外部调用入口</h2>
            <p className="mt-1 text-sm text-muted-foreground">外部系统可通过 Bearer 或 x-api-key 调用已授权 Agent。</p>
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
          : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

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
                <ApiKeyRow agents={agents} apiKey={apiKey} canManage={canManageApiKeys} key={apiKey.id} onDelete={() => setDeleteTarget(apiKey)} />
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
