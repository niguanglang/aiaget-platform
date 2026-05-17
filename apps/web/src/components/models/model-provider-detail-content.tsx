'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type ModelApiKeyItem,
  type ModelConfigItem,
  type TestModelProviderResult,
} from '@aiaget/shared-types';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ModelApiKeyCard } from '@/components/models/model-api-key-card';
import { ModelConfigCard } from '@/components/models/model-config-card';
import { ModelCostLogCard } from '@/components/models/model-cost-log-card';
import { ModelFormPanel, type ModelFormValues } from '@/components/models/model-form-panel';
import { ModelProviderConfirmDialog } from '@/components/models/model-provider-confirm-dialog';
import { ModelProviderDetailHeader } from '@/components/models/model-provider-detail-header';
import { ModelProviderTestCard } from '@/components/models/model-provider-test-card';
import { formatDateTime } from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const [apiKeyDeleteTarget, setApiKeyDeleteTarget] = useState<ModelApiKeyItem | null>(null);
  const [providerStatusTarget, setProviderStatusTarget] = useState<'ACTIVE' | 'DISABLED' | null>(null);
  const [modelStatusTarget, setModelStatusTarget] = useState<ModelConfigItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modelFormError, setModelFormError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testPrompt, setTestPrompt] = useState('');
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
      setProviderStatusTarget(null);
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
        max_output_tokens: values.max_output_tokens ?? null,
        api_version: values.api_version ?? null,
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
        max_output_tokens: values.max_output_tokens ?? null,
        api_version: values.api_version ?? null,
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
      setProviderStatusTarget(null);
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
      setModelStatusTarget(null);
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
      setKeyName('');
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
      setApiKeyDeleteTarget(null);
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

  function confirmApiKeyDelete() {
    if (!apiKeyDeleteTarget || !provider) return;

    deleteKeyMutation.mutate({
      providerId: provider.id,
      keyId: apiKeyDeleteTarget.id,
    });
  }

  if (providerQuery.isLoading) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-muted-foreground">正在加载供应商详情</div>
        </Card>
      </main>
    );
  }

  if (providerQuery.isError || !provider) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
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
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <ModelProviderDetailHeader
        canWrite={canWrite}
        onToggleStatus={() => setProviderStatusTarget(provider.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
        pending={providerStatusMutation.isPending}
        provider={provider}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <ModelProviderMetricTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
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
            setModelStatusTarget(model)
          }
          provider={provider}
        />

        <div className="grid gap-4">
          <ModelApiKeyCard
            apiKey={apiKey}
            canWrite={canWrite}
            createKeyPending={createKeyMutation.isPending}
            deleteKeyPending={deleteKeyMutation.isPending}
            keyName={keyName}
            onAddKey={() => createKeyMutation.mutate({ providerId: provider.id, name: keyName, key: apiKey })}
            onChangeApiKey={setApiKey}
            onChangeKeyName={setKeyName}
            onDeleteKey={(key) => setApiKeyDeleteTarget(key)}
            provider={provider}
          />
          <ModelProviderTestCard
            canWrite={canWrite}
            onChangePrompt={setTestPrompt}
            onRunTest={() => testMutation.mutate({ providerId: provider.id, prompt: testPrompt })}
            provider={provider}
            testPending={testMutation.isPending}
            testPrompt={testPrompt}
            testResult={testResult}
          />
        </div>
      </section>

      <section className="grid gap-4">
        <ModelCostLogCard provider={provider} />
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
        <ModelProviderConfirmDialog
          body={`这会软删除模型 ${deleteModelTarget.name}（${deleteModelTarget.model}），已绑定智能体需要重新选择可用模型。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteModelTarget(null)}
          onConfirm={() => deleteModelMutation.mutate(deleteModelTarget.id)}
          pending={deleteModelMutation.isPending}
          title="删除模型？"
        />
      ) : null}
      {providerStatusTarget ? (
        <ModelProviderConfirmDialog
          body={
            providerStatusTarget === 'DISABLED'
              ? `这会停用供应商 ${provider.name}，已绑定该供应商的 Agent 将无法继续使用其模型配置。`
              : `这会启用供应商 ${provider.name}，可用模型和密钥将重新进入调度范围。`
          }
          confirmLabel={providerStatusTarget === 'DISABLED' ? '确认停用' : '确认启用'}
          onCancel={() => setProviderStatusTarget(null)}
          onConfirm={() => providerStatusMutation.mutate(providerStatusTarget)}
          pending={providerStatusMutation.isPending}
          title={providerStatusTarget === 'DISABLED' ? '停用供应商？' : '启用供应商？'}
        />
      ) : null}
      {apiKeyDeleteTarget ? (
        <ModelProviderConfirmDialog
          body={`确认删除接口密钥「${apiKeyDeleteTarget.name}」后，使用该密钥的模型调用会立即失效。密钥只显示脱敏内容 ${apiKeyDeleteTarget.masked_key}，删除后不能恢复。`}
          confirmLabel="确认删除"
          onCancel={() => setApiKeyDeleteTarget(null)}
          onConfirm={confirmApiKeyDelete}
          pending={deleteKeyMutation.isPending}
          title="确认删除接口密钥"
        />
      ) : null}
      {modelStatusTarget ? (
        <ModelProviderConfirmDialog
          body={
            modelStatusTarget.status === 'ACTIVE'
              ? `这会停用模型 ${modelStatusTarget.name}（${modelStatusTarget.model}），已绑定智能体需要重新选择可用模型。`
              : `这会启用模型 ${modelStatusTarget.name}（${modelStatusTarget.model}），该模型将重新进入可绑定和调用范围。`
          }
          confirmLabel={modelStatusTarget.status === 'ACTIVE' ? '确认停用' : '确认启用'}
          onCancel={() => setModelStatusTarget(null)}
          onConfirm={() =>
            modelStatusMutation.mutate({
              id: modelStatusTarget.id,
              nextStatus: modelStatusTarget.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          pending={modelStatusMutation.isPending}
          title={modelStatusTarget.status === 'ACTIVE' ? '停用模型？' : '启用模型？'}
        />
      ) : null}
    </main>
  );
}

function ModelProviderMetricTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
