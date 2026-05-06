'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type ModelConfigItem,
  type ModelProviderDetail,
  type TestModelProviderResult,
} from '@aiaget/shared-types';
import { Activity, Edit, KeyRound, Plus, Power, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ModelCenterBackground } from '@/components/models/model-center-background';
import { ModelFormPanel, type ModelFormValues } from '@/components/models/model-form-panel';
import {
  formatDateTime,
  formatMoney,
  modelCallStatusLabel,
  modelCapabilityLabel,
  modelProviderStatusLabel,
  modelProviderTypeLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createModelApiKey,
  createModelConfig,
  deleteModelApiKey,
  deleteModelConfig,
  disableModelConfig,
  disableModelProvider,
  enableModelConfig,
  enableModelProvider,
  getModelProvider,
  testModelProvider,
  updateModelConfig,
  type ApiClientError,
} from '@/lib/api-client';

export function ModelProviderDetailContent({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [modelFormMode, setModelFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingModel, setEditingModel] = useState<ModelConfigItem | null>(null);
  const [deleteModelTarget, setDeleteModelTarget] = useState<ModelConfigItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modelFormError, setModelFormError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('主密钥');
  const [apiKey, setApiKey] = useState('');
  const [testPrompt, setTestPrompt] = useState('用一句中文回复兼容性检查结果。');
  const [testResult, setTestResult] = useState<TestModelProviderResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'model:config:manage'),
  );

  const providerQuery = useQuery({
    queryKey: ['model-provider', providerId],
    queryFn: () => getModelProvider(providerId),
  });

  const provider = providerQuery.data ?? null;

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) return null;
      return getModelProvider(providerId);
    },
    onSuccess: async (result) => {
      if (!result) return;
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setActionError(null);
    },
  });

  const createModelMutation = useMutation({
    mutationFn: (values: ModelFormValues) =>
      createModelConfig({
        provider_id: values.provider_id,
        name: values.name,
        model: values.model,
        capabilities: values.capabilities,
        context_length: values.context_length,
        input_price: values.input_price,
        output_price: values.output_price,
        rate_limit_rpm: values.rate_limit_rpm ?? null,
        status: values.status,
        is_default: values.is_default,
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setModelFormMode(null);
      setEditingModel(null);
      setModelFormError(null);
    },
    onError: (error: ApiClientError) => setModelFormError(error.message),
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ModelFormValues }) =>
      updateModelConfig(id, {
        name: values.name,
        capabilities: values.capabilities,
        context_length: values.context_length,
        input_price: values.input_price,
        output_price: values.output_price,
        rate_limit_rpm: values.rate_limit_rpm ?? null,
        status: values.status,
        is_default: values.is_default,
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setModelFormMode(null);
      setEditingModel(null);
      setModelFormError(null);
    },
    onError: (error: ApiClientError) => setModelFormError(error.message),
  });

  const providerStatusMutation = useMutation({
    mutationFn: (nextStatus: 'ACTIVE' | 'DISABLED') =>
      nextStatus === 'ACTIVE' ? enableModelProvider(providerId) : disableModelProvider(providerId),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const modelStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableModelConfig(id) : disableModelConfig(id),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteModelConfig,
    onSuccess: async () => {
      await refreshMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setDeleteModelTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const createKeyMutation = useMutation({
    mutationFn: ({ providerId: inputProviderId, name, key }: { providerId: string; name: string; key: string }) =>
      createModelApiKey(inputProviderId, {
        name,
        api_key: key,
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setApiKey('');
      setKeyName('主密钥');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: ({ providerId: inputProviderId, keyId }: { providerId: string; keyId: string }) =>
      deleteModelApiKey(inputProviderId, keyId),
    onSuccess: async (result) => {
      queryClient.setQueryData(['model-provider', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: ({ providerId: inputProviderId, prompt }: { providerId: string; prompt: string }) =>
      testModelProvider(inputProviderId, {
        model_config_id: provider?.models.find((model) => model.is_default)?.id ?? null,
        prompt,
      }),
    onSuccess: async (result) => {
      setTestResult(result);
      await refreshMutation.mutateAsync();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const metrics = provider
    ? [
        { label: '模型', value: `${provider.model_count}`, helper: '供应商范围' },
        { label: '启用模型', value: `${provider.enabled_model_count}`, helper: '可用配置' },
        { label: '接口密钥', value: `${provider.api_key_count}`, helper: '脱敏显示' },
        { label: '最近调用', value: formatDateTime(provider.last_call_at), helper: '供应商日志' },
      ]
    : [];

  function openCreateModel() {
    setModelFormError(null);
    setEditingModel(null);
    setModelFormMode('create');
  }

  function openEditModel(model: ModelConfigItem) {
    setModelFormError(null);
    setEditingModel(model);
    setModelFormMode('edit');
  }

  function closeModelForm() {
    setModelFormError(null);
    setEditingModel(null);
    setModelFormMode(null);
  }

  function submitModel(values: ModelFormValues) {
    setModelFormError(null);

    if (modelFormMode === 'create') {
      createModelMutation.mutate(values);
      return;
    }

    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel.id, values });
    }
  }

  if (providerQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <ModelCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载供应商详情...</div>
        </Card>
      </main>
    );
  }

  if (providerQuery.isError || !provider) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <ModelCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-destructive">供应商加载失败。</div>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/models">
              <Plus className="size-4" />
              返回模型中心
            </Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ModelCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/models">
              <Plus className="size-4 rotate-45" />
              模型中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">详情页</StatusBadge>
            <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge>
            <StatusBadge tone="planned">{modelProviderTypeLabel(provider.provider_type)}</StatusBadge>
            {provider.is_default ? <StatusBadge tone="healthy">默认</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">{provider.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{provider.code}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {provider.description ?? '暂无描述。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Button asChild variant="outline">
              <Link href={`/models/${provider.id}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
          )}
          <Button disabled={!canWrite || providerStatusMutation.isPending} onClick={() => providerStatusMutation.mutate(provider.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')} variant="outline">
            <Power className="size-4" />
            {provider.status === 'ACTIVE' ? '停用' : '启用'}
          </Button>
          <Button disabled={!canWrite} onClick={() => setActionError('供应商删除暂不在详情页提供，需要在列表页使用删除确认。')} variant="destructive">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModelConfigCard
          canWrite={canWrite}
          onDelete={(model) => setDeleteModelTarget(model)}
          onEdit={openEditModel}
          onNew={openCreateModel}
          onToggle={(model) =>
            modelStatusMutation.mutate({
              id: model.id,
              nextStatus: model.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          provider={provider}
        />
        <ApiKeyAndTestCard
          apiKey={apiKey}
          canWrite={canWrite}
          createKeyPending={createKeyMutation.isPending}
          deleteKeyPending={deleteKeyMutation.isPending}
          keyName={keyName}
          onAddKey={() => createKeyMutation.mutate({ providerId: provider.id, name: keyName, key: apiKey })}
          onChangeApiKey={setApiKey}
          onChangeKeyName={setKeyName}
          onChangePrompt={setTestPrompt}
          onDeleteKey={(keyId) => deleteKeyMutation.mutate({ providerId: provider.id, keyId })}
          onRunTest={() => testMutation.mutate({ providerId: provider.id, prompt: testPrompt })}
          provider={provider}
          testPending={testMutation.isPending}
          testPrompt={testPrompt}
          testResult={testResult}
        />
      </section>

      <section className="grid gap-4">
        <CostAndLogCard provider={provider} />
      </section>

      {modelFormMode ? (
        <ModelFormPanel
          error={modelFormError}
          isPending={createModelMutation.isPending || updateModelMutation.isPending}
          mode={modelFormMode}
          model={editingModel}
          onClose={closeModelForm}
          onSubmit={submitModel}
          providers={[{ id: provider.id, name: provider.name }]}
          selectedProvider={provider}
        />
      ) : null}

      {deleteModelTarget ? (
        <ConfirmDialog
          body={`这会软删除模型 ${deleteModelTarget.name}（${deleteModelTarget.model}），已绑定智能体需要重新选择可用模型。`}
          onCancel={() => setDeleteModelTarget(null)}
          onConfirm={() => deleteModelMutation.mutate(deleteModelTarget.id)}
          pending={deleteModelMutation.isPending}
          title="删除模型？"
        />
      ) : null}
    </main>
  );
}

function ModelConfigCard({
  canWrite,
  onDelete,
  onEdit,
  onNew,
  onToggle,
  provider,
}: {
  canWrite: boolean;
  onDelete: (model: ModelConfigItem) => void;
  onEdit: (model: ModelConfigItem) => void;
  onNew: () => void;
  onToggle: (model: ModelConfigItem) => void;
  provider: ModelProviderDetail;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">模型配置</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理供应商下可绑定到 Agent 的模型能力、价格、上下文和限流。
          </p>
        </div>
        <Button disabled={!canWrite} onClick={onNew} size="sm" type="button">
          <Plus className="size-4" />
          新建模型
        </Button>
      </div>

      {provider.models.length === 0 ? (
        <EmptyState
          action={
            <Button disabled={!canWrite} onClick={onNew} variant="outline">
              <Plus className="size-4" />
              新建模型
            </Button>
          }
          className="rounded-lg border border-dashed"
          description="先创建模型配置，再把它绑定到智能体或用于供应商兼容性测试。"
          title="暂无模型配置"
        />
      ) : (
        <div className="grid gap-3">
          {provider.models.map((model) => (
            <div className="rounded-lg border bg-background/80 p-4 shadow-sm" key={model.id}>
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-semibold">{model.name}</h3>
                    <StatusBadge tone={modelStatusTone(model.status)}>{modelProviderStatusLabel(model.status)}</StatusBadge>
                    {model.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{model.model}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!canWrite} onClick={() => onEdit(model)} size="sm" type="button" variant="outline">
                    <Edit className="size-4" />
                    编辑
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onToggle(model)} size="sm" type="button" variant="outline">
                    <Power className="size-4" />
                    {model.status === 'ACTIVE' ? '停用' : '启用'}
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(model)} size="sm" type="button" variant="outline">
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {model.capabilities.map((capability) => (
                  <span className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs" key={capability}>
                    {modelCapabilityLabel(capability)}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <DetailLine label="上下文" value={`${model.context_length.toLocaleString()} tokens`} />
                <DetailLine label="输入价格" value={formatMoney(model.input_price)} />
                <DetailLine label="输出价格" value={formatMoney(model.output_price)} />
                <DetailLine label="每分钟限流" value={model.rate_limit_rpm ? `${model.rate_limit_rpm}` : '-'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ApiKeyAndTestCard({
  apiKey,
  canWrite,
  createKeyPending,
  deleteKeyPending,
  keyName,
  onAddKey,
  onChangeApiKey,
  onChangeKeyName,
  onChangePrompt,
  onDeleteKey,
  onRunTest,
  provider,
  testPending,
  testPrompt,
  testResult,
}: {
  apiKey: string;
  canWrite: boolean;
  createKeyPending: boolean;
  deleteKeyPending: boolean;
  keyName: string;
  onAddKey: () => void;
  onChangeApiKey: (value: string) => void;
  onChangeKeyName: (value: string) => void;
  onChangePrompt: (value: string) => void;
  onDeleteKey: (keyId: string) => void;
  onRunTest: () => void;
  provider: ModelProviderDetail;
  testPending: boolean;
  testPrompt: string;
  testResult: TestModelProviderResult | null;
}) {
  const defaultModel = provider.models.find((model) => model.is_default) ?? provider.models[0] ?? null;

  return (
    <Card className="grid gap-5 p-5">
      <section className="grid gap-3">
        <div>
          <h2 className="text-sm font-semibold">接口密钥</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            密钥仅写入一次，详情页只显示脱敏内容和最近使用时间。
          </p>
        </div>

        {provider.api_keys.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无接口密钥。添加后即可执行兼容性测试和真实模型调用。
          </div>
        ) : (
          <div className="grid gap-2">
            {provider.api_keys.map((key) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2" key={key.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="size-4 text-muted-foreground" />
                    {key.name}
                  </div>
                  <div className="mt-1 break-all text-xs text-muted-foreground">
                    {key.masked_key} · 前缀 {key.key_prefix} · 最近使用 {formatDateTime(key.last_used_at)}
                  </div>
                </div>
                <Button disabled={!canWrite || deleteKeyPending} onClick={() => onDeleteKey(key.id)} size="sm" type="button" variant="outline">
                  <Trash2 className="size-4" />
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          <Input disabled={!canWrite} onChange={(event) => onChangeKeyName(event.target.value)} placeholder="密钥名称" value={keyName} />
          <Input disabled={!canWrite} onChange={(event) => onChangeApiKey(event.target.value)} placeholder="仅粘贴一次接口密钥" type="password" value={apiKey} />
          <Button
            disabled={!canWrite || createKeyPending || keyName.trim().length < 1 || apiKey.trim().length < 8}
            onClick={onAddKey}
            type="button"
            variant="outline"
          >
            <KeyRound className="size-4" />
            添加脱敏密钥
          </Button>
        </div>
      </section>

      <section className="grid gap-3 border-t pt-5">
        <div>
          <h2 className="text-sm font-semibold">兼容性测试</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            使用 {defaultModel ? defaultModel.model : '默认模型'} 发起一次真实模型调用，并写入调用日志。
          </p>
        </div>
        <textarea
          className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangePrompt(event.target.value)}
          value={testPrompt}
        />
        <Button disabled={!canWrite || testPending || !defaultModel || provider.api_keys.length === 0} onClick={onRunTest} type="button">
          <Send className="size-4" />
          运行测试
        </Button>

        {testResult ? (
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge tone={modelStatusTone(testResult.status)}>{modelCallStatusLabel(testResult.status)}</StatusBadge>
              <span className="text-xs text-muted-foreground">{testResult.latency_ms} ms</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{testResult.output_text || testResult.error_message || '-'}</p>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>{testResult.request_model}</span>
              <span>{testResult.total_tokens} tokens</span>
              <span>{formatMoney(testResult.total_cost)}</span>
            </div>
            <div className="mt-2 break-all text-xs text-muted-foreground">Trace {testResult.trace_id}</div>
          </div>
        ) : null}
      </section>
    </Card>
  );
}

function CostAndLogCard({ provider }: { provider: ModelProviderDetail }) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">成本规则与调用日志</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            成本规则由模型价格生成，调用日志用于审计、成本核算和问题追踪。
          </p>
        </div>
        <StatusBadge tone="planned">最近 {provider.call_logs.length} 条</StatusBadge>
      </div>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">成本规则</h3>
        {provider.cost_rules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无独立成本规则，当前按模型配置中的输入/输出价格估算。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['币种', '输入价格', '输出价格', '单位', '状态', '生效时间'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provider.cost_rules.map((rule) => (
                  <tr className="border-b last:border-0" key={rule.id}>
                    <td className="px-3 py-2">{rule.currency}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(rule.input_price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(rule.output_price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{rule.unit}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={modelStatusTone(rule.status)}>{modelProviderStatusLabel(rule.status)}</StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(rule.effective_from)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 border-t pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">调用日志</h3>
          <Activity className="size-4 text-muted-foreground" />
        </div>
        {provider.call_logs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无调用日志。执行兼容性测试或 Agent 调用后会在这里展示。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['时间', '模型', '状态', 'Tokens', '耗时', '成本', 'Trace', '错误'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provider.call_logs.map((log) => (
                  <tr className="border-b last:border-0" key={log.id}>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2">{log.request_model}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={modelStatusTone(log.status)}>{modelCallStatusLabel(log.status)}</StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {log.total_tokens} <span className="text-xs">({log.prompt_tokens}/{log.completion_tokens})</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{log.latency_ms} ms</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(log.total_cost)}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-muted-foreground" title={log.trace_id}>
                      {log.trace_id}
                    </td>
                    <td className="max-w-56 truncate px-3 py-2 text-destructive" title={log.error_message ?? undefined}>
                      {log.error_message ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Card>
  );
}

function ConfirmDialog({
  body,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            确认删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words font-medium">{value}</div>
    </div>
  );
}
