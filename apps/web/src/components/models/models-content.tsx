'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type ModelConfigItem,
  ModelProviderDetail,
  ModelProviderListItem,
  ModelProviderStatus,
  TestModelProviderResult,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Activity,
  Edit,
  KeyRound,
  Plus,
  Power,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { ProviderFormPanel, type ProviderFormValues } from '@/components/models/provider-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createModelApiKey,
  createModelConfig,
  createModelProvider,
  deleteModelApiKey,
  deleteModelConfig,
  deleteModelProvider,
  disableModelConfig,
  disableModelProvider,
  enableModelConfig,
  enableModelProvider,
  getModelProvider,
  listModelProviders,
  testModelProvider,
  updateModelConfig,
  updateModelProvider,
  type ApiClientError,
} from '@/lib/api-client';

const providerTypes = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'] as const;
const statuses: ModelProviderStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
const capabilities = ['chat', 'embedding', 'rerank', 'vision', 'tool_call'] as const;

export function ModelsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [providerType, setProviderType] = useState('');
  const [status, setStatus] = useState('');
  const [capability, setCapability] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerFormMode, setProviderFormMode] = useState<'create' | 'edit' | null>(null);
  const [modelFormMode, setModelFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingModel, setEditingModel] = useState<ModelConfigItem | null>(null);
  const [deleteProviderTarget, setDeleteProviderTarget] = useState<ModelProviderListItem | null>(null);
  const [deleteModelTarget, setDeleteModelTarget] = useState<ModelConfigItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('主密钥');
  const [apiKey, setApiKey] = useState('');
  const [testPrompt, setTestPrompt] = useState('用一句中文回复兼容性检查结果。');
  const [testResult, setTestResult] = useState<TestModelProviderResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'model:config:manage'),
  );

  const providersQuery = useQuery({
    queryKey: ['model-providers', keyword, providerType, status, capability],
    queryFn: () =>
      listModelProviders({
        page: 1,
        page_size: 20,
        keyword,
        provider_type: providerType,
        status,
        capability,
      }),
  });

  const selectedProviderQuery = useQuery({
    enabled: Boolean(selectedProviderId),
    queryKey: ['model-provider', selectedProviderId],
    queryFn: () => getModelProvider(selectedProviderId ?? ''),
  });

  const providers = providersQuery.data?.items ?? [];
  const selectedProvider = selectedProviderQuery.data ?? null;
  const providerOptions = providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
  }));

  const metrics = useMemo(() => {
    const enabledModels = providers.reduce((sum, provider) => sum + provider.enabled_model_count, 0);

    return [
      { label: '供应商', value: `${providersQuery.data?.total ?? 0}`, helper: '租户范围' },
      { label: '启用模型', value: `${enabledModels}`, helper: '当前页' },
      { label: '今日调用', value: `${selectedProvider?.call_logs.length ?? 0}`, helper: '选中供应商' },
      {
        label: '今日成本',
        value: formatMoney(
          selectedProvider?.call_logs.reduce((sum, log) => sum + log.total_cost, 0) ?? 0,
        ),
        helper: '选中供应商',
      },
    ];
  }, [providers, providersQuery.data?.total, selectedProvider?.call_logs]);

  const createProviderMutation = useMutation({
    mutationFn: createModelProvider,
    onSuccess: async (provider) => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      queryClient.setQueryData(['model-provider', provider.id], provider);
      setSelectedProviderId(provider.id);
      closeProviderForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProviderFormValues }) =>
      updateModelProvider(id, {
        name: values.name,
        provider_type: values.provider_type,
        base_url: values.base_url,
        description: nullableText(values.description),
        is_default: values.is_default,
      }),
    onSuccess: async (provider) => {
      await refreshProvider(provider);
      closeProviderForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
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
    onSuccess: async (provider) => {
      await refreshProvider(provider);
      closeModelForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
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
    onSuccess: async (provider) => {
      await refreshProvider(provider);
      closeModelForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const providerStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableModelProvider(id) : disableModelProvider(id),
    onSuccess: refreshProvider,
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const modelStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableModelConfig(id) : disableModelConfig(id),
    onSuccess: refreshProvider,
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteProviderMutation = useMutation({
    mutationFn: deleteModelProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setSelectedProviderId(null);
      setDeleteProviderTarget(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteModelConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      if (selectedProviderId) {
        await queryClient.invalidateQueries({ queryKey: ['model-provider', selectedProviderId] });
      }
      setDeleteModelTarget(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const createKeyMutation = useMutation({
    mutationFn: ({ providerId, name, key }: { providerId: string; name: string; key: string }) =>
      createModelApiKey(providerId, {
        name,
        api_key: key,
      }),
    onSuccess: async (provider) => {
      await refreshProvider(provider);
      setApiKey('');
      setKeyName('主密钥');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: ({ providerId, keyId }: { providerId: string; keyId: string }) =>
      deleteModelApiKey(providerId, keyId),
    onSuccess: refreshProvider,
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: ({ providerId, prompt }: { providerId: string; prompt: string }) =>
      testModelProvider(providerId, {
        model_config_id: selectedProvider?.models.find((model) => model.is_default)?.id ?? null,
        prompt,
      }),
    onSuccess: async (result) => {
      setTestResult(result);
      if (selectedProviderId) {
        await queryClient.invalidateQueries({ queryKey: ['model-provider', selectedProviderId] });
      }
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshProvider(provider: ModelProviderDetail) {
    queryClient.setQueryData(['model-provider', provider.id], provider);
    await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
    setSelectedProviderId(provider.id);
    setActionError(null);
  }

  function openCreateProvider() {
    setFormError(null);
    setProviderFormMode('create');
  }

  function openEditProvider(provider: ModelProviderListItem) {
    setFormError(null);
    setSelectedProviderId(provider.id);
    setProviderFormMode('edit');
  }

  function closeProviderForm() {
    setFormError(null);
    setProviderFormMode(null);
  }

  function openCreateModel(provider?: ModelProviderListItem | ModelProviderDetail | null) {
    if (provider) setSelectedProviderId(provider.id);
    setFormError(null);
    setEditingModel(null);
    setModelFormMode('create');
  }

  function openEditModel(model: ModelConfigItem) {
    setFormError(null);
    setEditingModel(model);
    setModelFormMode('edit');
  }

  function closeModelForm() {
    setFormError(null);
    setEditingModel(null);
    setModelFormMode(null);
  }

  function submitProvider(values: ProviderFormValues) {
    setFormError(null);

    if (providerFormMode === 'create') {
      createProviderMutation.mutate({
        name: values.name,
        code: values.code,
        provider_type: values.provider_type,
        base_url: values.base_url,
        description: nullableText(values.description),
        is_default: values.is_default,
      });
      return;
    }

    if (selectedProvider) {
      updateProviderMutation.mutate({
        id: selectedProvider.id,
        values,
      });
    }
  }

  function submitModel(values: ModelFormValues) {
    setFormError(null);

    if (modelFormMode === 'create') {
      createModelMutation.mutate(values);
      return;
    }

    if (editingModel) {
      updateModelMutation.mutate({
        id: editingModel.id,
        values,
      });
    }
  }

  function clearFilters() {
    setKeyword('');
    setProviderType('');
    setStatus('');
    setCapability('');
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ModelCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M17</StatusBadge>
            <StatusBadge tone="healthy">OpenAI 兼容</StatusBadge>
            <StatusBadge tone="healthy">真实调用</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">模型中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            配置租户模型供应商、模型能力、脱敏接口密钥、词元价格、限流、真实兼容性测试和调用日志。
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={!canWrite} onClick={openCreateProvider}>
            <Plus className="size-4" />
            新建供应商
          </Button>
          <Button disabled={!canWrite || providers.length === 0} onClick={() => openCreateModel(selectedProvider)} variant="outline">
            <Plus className="size-4" />
            新建模型
          </Button>
        </div>
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">供应商</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    管理供应商连接资料，并查看对应模型清单。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {providers.length} / {providersQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_190px_160px_160px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索供应商、链接、模型"
                    value={keyword}
                  />
                </label>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setProviderType(event.target.value)}
                  value={providerType}
                >
                  <option value="">全部类型</option>
                  {providerTypes.map((type) => (
                    <option key={type} value={type}>
                      {modelProviderTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {statuses.map((option) => (
                    <option key={option} value={option}>
                      {modelProviderStatusLabel(option)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setCapability(event.target.value)}
                  value={capability}
                >
                  <option value="">全部能力</option>
                  {capabilities.map((option) => (
                    <option key={option} value={option}>
                      {modelCapabilityLabel(option)}
                    </option>
                  ))}
                </select>
                <Button onClick={clearFilters} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {providersQuery.isError ? (
            <div className="p-6 text-sm text-destructive">模型供应商加载失败。</div>
          ) : providersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载模型供应商...</div>
          ) : providers.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={openCreateProvider}>
                  <Plus className="size-4" />
                  新建供应商
                </Button>
              }
              description="创建 OpenAI 兼容供应商，添加脱敏接口密钥，再注册可绑定到智能体的模型配置。"
              title="暂无模型供应商"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['供应商', '类型', '状态', '模型', '密钥', '最近调用', '更新时间', '操作'].map(
                      (column) => (
                        <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={provider.id}
                      transition={{ delay: index * 0.025, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="grid max-w-sm gap-1 text-left"
                          onClick={() => setSelectedProviderId(provider.id)}
                          type="button"
                        >
                          <span className="font-medium">{provider.name}</span>
                          <span className="text-xs text-muted-foreground">{provider.code}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{provider.base_url}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{modelProviderTypeLabel(provider.provider_type)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{provider.enabled_model_count}</div>
                        <div className="text-xs text-muted-foreground">共 {provider.model_count}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{provider.api_key_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(provider.last_call_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(provider.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button onClick={() => openEditProvider(provider)} size="sm" variant="outline">
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            disabled={!canWrite || providerStatusMutation.isPending}
                            onClick={() =>
                              providerStatusMutation.mutate({
                                id: provider.id,
                                nextStatus: provider.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                              })
                            }
                            size="sm"
                            variant="outline"
                          >
                            <Power className="size-4" />
                          </Button>
                          <Button disabled={!canWrite} onClick={() => setDeleteProviderTarget(provider)} size="sm" variant="outline">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ProviderDetailPanel
          apiKey={apiKey}
          canWrite={canWrite}
          createKeyPending={createKeyMutation.isPending}
          deleteKeyPending={deleteKeyMutation.isPending}
          keyName={keyName}
          onAddKey={() => {
            if (!selectedProvider) return;
            createKeyMutation.mutate({ providerId: selectedProvider.id, name: keyName, key: apiKey });
          }}
          onChangeApiKey={setApiKey}
          onChangeKeyName={setKeyName}
          onChangeTestPrompt={setTestPrompt}
          onDeleteKey={(keyId) => {
            if (!selectedProvider) return;
            deleteKeyMutation.mutate({ providerId: selectedProvider.id, keyId });
          }}
          onEditModel={openEditModel}
          onDeleteModel={setDeleteModelTarget}
          onNewModel={() => openCreateModel(selectedProvider)}
          onToggleModel={(model) =>
            modelStatusMutation.mutate({
              id: model.id,
              nextStatus: model.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          provider={selectedProvider}
          providerLoading={selectedProviderQuery.isLoading}
          testPending={testMutation.isPending}
          testPrompt={testPrompt}
          testResult={testResult}
          onRunTest={() => {
            if (!selectedProvider) return;
            testMutation.mutate({ providerId: selectedProvider.id, prompt: testPrompt });
          }}
        />
      </section>

      {providerFormMode ? (
        <ProviderFormPanel
          error={formError}
          isPending={createProviderMutation.isPending || updateProviderMutation.isPending}
          mode={providerFormMode}
          onClose={closeProviderForm}
          onSubmit={submitProvider}
          provider={providerFormMode === 'edit' ? selectedProvider : null}
        />
      ) : null}

      {modelFormMode ? (
        <ModelFormPanel
          error={formError}
          isPending={createModelMutation.isPending || updateModelMutation.isPending}
          mode={modelFormMode}
          model={editingModel}
          onClose={closeModelForm}
          onSubmit={submitModel}
          providers={providerOptions}
          selectedProvider={selectedProvider}
        />
      ) : null}

      {deleteProviderTarget ? (
        <ConfirmDialog
          description={`这会软删除供应商 ${deleteProviderTarget.name}、其模型和接口密钥。`}
          isPending={deleteProviderMutation.isPending}
          onCancel={() => setDeleteProviderTarget(null)}
          onConfirm={() => deleteProviderMutation.mutate(deleteProviderTarget.id)}
          title="删除供应商？"
        />
      ) : null}

      {deleteModelTarget ? (
        <ConfirmDialog
          description={`这会软删除模型 ${deleteModelTarget.model}。`}
          isPending={deleteModelMutation.isPending}
          onCancel={() => setDeleteModelTarget(null)}
          onConfirm={() => deleteModelMutation.mutate(deleteModelTarget.id)}
          title="删除模型？"
        />
      ) : null}
    </main>
  );
}

function ProviderDetailPanel({
  apiKey,
  canWrite,
  createKeyPending,
  deleteKeyPending,
  keyName,
  onAddKey,
  onChangeApiKey,
  onChangeKeyName,
  onChangeTestPrompt,
  onDeleteKey,
  onDeleteModel,
  onEditModel,
  onNewModel,
  onRunTest,
  onToggleModel,
  provider,
  providerLoading,
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
  onChangeTestPrompt: (value: string) => void;
  onDeleteKey: (keyId: string) => void;
  onDeleteModel: (model: ModelConfigItem) => void;
  onEditModel: (model: ModelConfigItem) => void;
  onNewModel: () => void;
  onRunTest: () => void;
  onToggleModel: (model: ModelConfigItem) => void;
  provider: ModelProviderDetail | null;
  providerLoading: boolean;
  testPending: boolean;
  testPrompt: string;
  testResult: TestModelProviderResult | null;
}) {
  if (providerLoading) {
    return (
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">正在加载供应商详情...</div>
      </Card>
    );
  }

  if (!provider) {
    return (
      <Card>
        <EmptyState
          description="选择供应商后查看脱敏密钥、模型配置、成本规则、限流、调用测试和日志。"
          title="未选择供应商"
        />
      </Card>
    );
  }

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{provider.name}</h2>
            <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge>
            {provider.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">{provider.base_url}</p>
        </div>
        <Button disabled={!canWrite} onClick={onNewModel} size="sm" variant="outline">
          <Plus className="size-4" />
          模型
        </Button>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">模型</h3>
          <div className="text-xs text-muted-foreground">{provider.models.length} 个配置</div>
        </div>
        {provider.models.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            暂无模型配置。
          </div>
        ) : (
          <div className="grid gap-2">
            {provider.models.map((model) => (
              <div className="rounded-md border bg-muted/20 p-3" key={model.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      <StatusBadge tone={modelStatusTone(model.status)}>{modelProviderStatusLabel(model.status)}</StatusBadge>
                      {model.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
                    </div>
                    <div className="mt-1 break-all text-xs text-muted-foreground">{model.model}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button disabled={!canWrite} onClick={() => onEditModel(model)} size="sm" variant="outline">
                      <Edit className="size-4" />
                    </Button>
                    <Button disabled={!canWrite} onClick={() => onToggleModel(model)} size="sm" variant="outline">
                      <Power className="size-4" />
                    </Button>
                    <Button disabled={!canWrite} onClick={() => onDeleteModel(model)} size="sm" variant="outline">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {model.capabilities.map((capability) => (
                    <span className="rounded-md border bg-background/70 px-2 py-0.5 text-xs" key={capability}>
                      {modelCapabilityLabel(capability)}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>上下文 {model.context_length}</span>
                  <span>输入 {formatMoney(model.input_price)}</span>
                  <span>输出 {formatMoney(model.output_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">脱敏接口密钥</h3>
        <div className="grid gap-2">
          {provider.api_keys.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              暂无接口密钥。密钥只写入一次，创建后仅显示脱敏内容。
            </div>
          ) : (
            provider.api_keys.map((key) => (
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2" key={key.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="size-4 text-muted-foreground" />
                    {key.name}
                  </div>
                  <div className="mt-1 break-all text-xs text-muted-foreground">
                    {key.masked_key} · 最近使用 {formatDateTime(key.last_used_at)}
                  </div>
                </div>
                <Button disabled={!canWrite || deleteKeyPending} onClick={() => onDeleteKey(key.id)} size="sm" variant="outline">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="grid gap-2">
          <Input disabled={!canWrite} onChange={(event) => onChangeKeyName(event.target.value)} placeholder="密钥名称" value={keyName} />
          <Input disabled={!canWrite} onChange={(event) => onChangeApiKey(event.target.value)} placeholder="仅粘贴一次接口密钥" type="password" value={apiKey} />
          <Button disabled={!canWrite || createKeyPending || apiKey.length < 8} onClick={onAddKey} type="button" variant="outline">
            <KeyRound className="size-4" />
            添加脱敏密钥
          </Button>
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">调用测试</h3>
        <textarea
          className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangeTestPrompt(event.target.value)}
          value={testPrompt}
        />
        <Button disabled={!canWrite || testPending || provider.models.length === 0} onClick={onRunTest}>
          <Send className="size-4" />
          运行兼容性测试
        </Button>
        {testResult ? (
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge tone={modelStatusTone(testResult.status)}>{modelCallStatusLabel(testResult.status)}</StatusBadge>
              <span className="text-xs text-muted-foreground">{testResult.latency_ms} ms</span>
            </div>
            <p className="mt-2 text-muted-foreground">{testResult.output_text}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {testResult.request_model} · {testResult.total_tokens} 个词元 · {formatMoney(testResult.total_cost)}
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">调用日志</h3>
          <Activity className="size-4 text-muted-foreground" />
        </div>
        {provider.call_logs.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            暂无调用日志。
          </div>
        ) : (
          <div className="grid gap-2">
            {provider.call_logs.map((log) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={log.id}>
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge tone={modelStatusTone(log.status)}>{modelCallStatusLabel(log.status)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                </div>
                <div className="mt-1 break-all text-xs text-muted-foreground">{log.trace_id}</div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>{log.total_tokens} 个词元</span>
                  <span>{log.latency_ms} ms</span>
                  <span>{formatMoney(log.total_cost)}</span>
                </div>
                {log.error_message ? <p className="mt-2 text-xs text-destructive">{log.error_message}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </Card>
  );
}

function ConfirmDialog({
  description,
  isPending,
  onCancel,
  onConfirm,
  title,
}: {
  description: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button onClick={onCancel} size="icon" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">
            取消
          </Button>
          <Button disabled={isPending} onClick={onConfirm} variant="destructive">
            删除
          </Button>
        </div>
      </div>
    </section>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
