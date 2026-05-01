'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { AgentDetail, PromptType } from '@aiaget/shared-types';
import { Bot, Database, Edit, FileText, Trash2, type LucideIcon, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgentKnowledgeBinding,
  createAgentModelBinding,
  createAgentPromptBinding,
  createAgentToolBinding,
  deleteAgentKnowledgeBinding,
  deleteAgentModelBinding,
  deleteAgentPromptBinding,
  deleteAgentToolBinding,
  getModelProvider,
  listKnowledgeBases,
  listModelProviders,
  listPromptTemplates,
  listTools,
  updateAgentKnowledgeBinding,
  updateAgentToolBinding,
  type ApiClientError,
} from '@/lib/api-client';

const promptTypes: PromptType[] = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'];
const promptTypeLabels: Record<PromptType, string> = {
  SYSTEM: '系统提示词',
  USER: '用户提示词',
  ASSISTANT: '助手提示词',
  TOOL: '工具提示词',
};
const selectClassName =
  'h-10 w-full rounded-md border border-border/70 bg-background/70 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

export function AgentBindingManager({
  agent,
  canWrite,
  onAgentChange,
  onError,
}: {
  agent: AgentDetail;
  canWrite: boolean;
  onAgentChange: (agent: AgentDetail) => void;
  onError: (message: string | null) => void;
}) {
  const [providerId, setProviderId] = useState('');
  const [modelId, setModelId] = useState('');
  const [promptId, setPromptId] = useState('');
  const [promptType, setPromptType] = useState<PromptType>('SYSTEM');
  const [knowledgeId, setKnowledgeId] = useState('');
  const [knowledgeWeight, setKnowledgeWeight] = useState(100);
  const [knowledgeTopK, setKnowledgeTopK] = useState(5);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [toolId, setToolId] = useState('');
  const [toolRequireApproval, setToolRequireApproval] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const providersQuery = useQuery({
    queryKey: ['binding-model-providers'],
    queryFn: () => listModelProviders({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const providers = providersQuery.data?.items ?? [];
  const firstProviderId = providers[0]?.id ?? '';
  const activeProviderId = providerId || firstProviderId;

  const providerDetailQuery = useQuery({
    enabled: Boolean(activeProviderId),
    queryKey: ['binding-model-provider', activeProviderId],
    queryFn: () => getModelProvider(activeProviderId),
  });
  const providerDetail = providerDetailQuery.data ?? null;
  const modelOptions = providerDetail?.models.filter((model) => model.status === 'ACTIVE') ?? [];

  const promptsQuery = useQuery({
    queryKey: ['binding-prompts'],
    queryFn: () => listPromptTemplates({ page: 1, page_size: 100 }),
  });
  const promptOptions =
    promptsQuery.data?.items.filter((prompt) => prompt.status !== 'DISABLED' && prompt.status !== 'ARCHIVED') ?? [];

  const knowledgeQuery = useQuery({
    queryKey: ['binding-knowledge'],
    queryFn: () => listKnowledgeBases({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const knowledgeOptions = knowledgeQuery.data?.items ?? [];

  const toolsQuery = useQuery({
    queryKey: ['binding-tools'],
    queryFn: () => listTools({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const toolOptions = toolsQuery.data?.items ?? [];

  useEffect(() => {
    if (!providers.length) {
      if (providerId) setProviderId('');
      return;
    }

    if (!providerId || !providers.some((provider) => provider.id === providerId)) {
      setProviderId(firstProviderId);
    }
  }, [firstProviderId, providerId, providers]);

  useEffect(() => {
    if (modelId && !modelOptions.some((model) => model.id === modelId)) {
      setModelId('');
    }
  }, [modelId, modelOptions]);

  useEffect(() => {
    if (promptId && !promptOptions.some((prompt) => prompt.id === promptId)) {
      setPromptId('');
    }
  }, [promptId, promptOptions]);

  useEffect(() => {
    if (knowledgeId && !knowledgeOptions.some((knowledge) => knowledge.id === knowledgeId)) {
      setKnowledgeId('');
    }
  }, [knowledgeId, knowledgeOptions]);

  useEffect(() => {
    if (toolId && !toolOptions.some((tool) => tool.id === toolId)) {
      setToolId('');
    }
  }, [toolId, toolOptions]);

  const createModelBindingMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: Parameters<typeof createAgentModelBinding>[1] }) =>
      createAgentModelBinding(agentId, input),
    onSuccess: (nextAgent) => {
      setModelId('');
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const deleteModelBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId }: { agentId: string; bindingId: string }) => deleteAgentModelBinding(agentId, bindingId),
    onSuccess: onAgentChange,
    onError: (error: ApiClientError) => onError(error.message),
  });
  const createPromptBindingMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: Parameters<typeof createAgentPromptBinding>[1] }) =>
      createAgentPromptBinding(agentId, input),
    onSuccess: (nextAgent) => {
      setPromptId('');
      setPromptType('SYSTEM');
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const deletePromptBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId }: { agentId: string; bindingId: string }) => deleteAgentPromptBinding(agentId, bindingId),
    onSuccess: onAgentChange,
    onError: (error: ApiClientError) => onError(error.message),
  });
  const createKnowledgeBindingMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: Parameters<typeof createAgentKnowledgeBinding>[1] }) =>
      createAgentKnowledgeBinding(agentId, input),
    onSuccess: (nextAgent) => {
      setKnowledgeId('');
      setKnowledgeWeight(100);
      setKnowledgeTopK(5);
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const updateKnowledgeBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId, weight, recall_top_k }: { agentId: string; bindingId: string; weight: number; recall_top_k: number }) =>
      updateAgentKnowledgeBinding(agentId, bindingId, { weight, recall_top_k }),
    onSuccess: (nextAgent) => {
      setEditingKnowledgeId(null);
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const deleteKnowledgeBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId }: { agentId: string; bindingId: string }) => deleteAgentKnowledgeBinding(agentId, bindingId),
    onSuccess: onAgentChange,
    onError: (error: ApiClientError) => onError(error.message),
  });
  const createToolBindingMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: Parameters<typeof createAgentToolBinding>[1] }) =>
      createAgentToolBinding(agentId, input),
    onSuccess: (nextAgent) => {
      setToolId('');
      setToolRequireApproval(false);
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const updateToolBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId, require_approval }: { agentId: string; bindingId: string; require_approval: boolean }) =>
      updateAgentToolBinding(agentId, bindingId, { require_approval }),
    onSuccess: (nextAgent) => {
      setEditingToolId(null);
      onAgentChange(nextAgent);
    },
    onError: (error: ApiClientError) => onError(error.message),
  });
  const deleteToolBindingMutation = useMutation({
    mutationFn: ({ agentId, bindingId }: { agentId: string; bindingId: string }) => deleteAgentToolBinding(agentId, bindingId),
    onSuccess: onAgentChange,
    onError: (error: ApiClientError) => onError(error.message),
  });

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <BindingCard
        count={agent.bindings.models.length}
        description="先选择模型供应商，再绑定当前可用模型。"
        icon={Bot}
        title="模型绑定"
      >
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <FieldGroup hint="切换供应商后，模型列表会自动更新。" label="供应商">
            <select
              className={selectClassName}
              onChange={(event) => {
                setProviderId(event.target.value);
                setModelId('');
              }}
              value={activeProviderId}
            >
              {providers.length === 0 ? <option value="">暂无可用供应商</option> : null}
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup
            hint={providerDetailQuery.isFetching ? '正在加载当前供应商的模型。' : '仅展示已启用模型。'}
            label="模型"
          >
            <select
              className={selectClassName}
              onChange={(event) => setModelId(event.target.value)}
              value={modelId}
            >
              <option value="">选择模型</option>
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>{model.name} ({model.model})</option>
              ))}
            </select>
          </FieldGroup>
          <ActionField>
            <Button
              disabled={!canWrite || !modelId || createModelBindingMutation.isPending}
              onClick={() => createModelBindingMutation.mutate({
                agentId: agent.id,
                input: { model_id: modelId, binding_type: 'DEFAULT' },
              })}
              type="button"
            >
              绑定
            </Button>
          </ActionField>
        </div>
        <BindingList
          canWrite={canWrite}
          emptyText="暂无模型绑定。"
          items={agent.bindings.models.map((binding) => ({
            id: binding.id,
            title: binding.model_name,
            subtitle: `${binding.provider_name} · ${binding.model_code}`,
            extra: binding.binding_type === 'DEFAULT' ? '默认模型' : binding.binding_type,
          }))}
          onDelete={(bindingId) => deleteModelBindingMutation.mutate({ agentId: agent.id, bindingId })}
        />
      </BindingCard>

      <BindingCard
        count={agent.bindings.prompts.length}
        description="将提示词挂到不同消息角色，复用同一套上下文规范。"
        icon={FileText}
        title="提示词绑定"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <FieldGroup hint="展示草稿和已发布模板，停用与归档模板不参与绑定。" label="提示词">
            <select className={selectClassName} onChange={(event) => setPromptId(event.target.value)} value={promptId}>
              <option value="">选择提示词</option>
              {promptOptions.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>{prompt.name} ({prompt.code}) · {prompt.status === 'PUBLISHED' ? '已发布' : '草稿'}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup hint="角色决定提示词注入时机。" label="绑定角色">
            <select
              className={selectClassName}
              onChange={(event) => setPromptType(event.target.value as PromptType)}
              value={promptType}
            >
              {promptTypes.map((type) => (
                <option key={type} value={type}>{promptTypeLabels[type]}</option>
              ))}
            </select>
          </FieldGroup>
          <ActionField>
            <Button
              disabled={!canWrite || !promptId || createPromptBindingMutation.isPending}
              onClick={() => createPromptBindingMutation.mutate({
                agentId: agent.id,
                input: { prompt_id: promptId, prompt_type: promptType },
              })}
              type="button"
            >
              绑定
            </Button>
          </ActionField>
        </div>
        <BindingList
          canWrite={canWrite}
          emptyText="暂无提示词绑定。"
          items={agent.bindings.prompts.map((binding) => ({
            id: binding.id,
            title: binding.prompt_name,
            subtitle: binding.prompt_code,
            extra: promptTypeLabels[binding.prompt_type],
          }))}
          onDelete={(bindingId) => deletePromptBindingMutation.mutate({ agentId: agent.id, bindingId })}
        />
      </BindingCard>

      <BindingCard
        count={agent.bindings.knowledge.length}
        description="配置召回权重和 TopK，用于控制知识注入强度。"
        icon={Database}
        title="知识库绑定"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_110px_110px_auto]">
          <FieldGroup hint="仅展示已启用知识库。" label="知识库">
            <select className={selectClassName} onChange={(event) => setKnowledgeId(event.target.value)} value={knowledgeId}>
              <option value="">选择知识库</option>
              {knowledgeOptions.map((knowledge) => (
                <option key={knowledge.id} value={knowledge.id}>{knowledge.name} ({knowledge.code})</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup hint="建议 1-100。" label="权重">
            <Input
              min="1"
              onChange={(event) => setKnowledgeWeight(Number(event.target.value))}
              type="number"
              value={knowledgeWeight}
            />
          </FieldGroup>
          <FieldGroup hint="单次召回条数。" label="TopK">
            <Input
              min="1"
              onChange={(event) => setKnowledgeTopK(Number(event.target.value))}
              type="number"
              value={knowledgeTopK}
            />
          </FieldGroup>
          <ActionField>
            <Button
              disabled={!canWrite || !knowledgeId || createKnowledgeBindingMutation.isPending}
              onClick={() => createKnowledgeBindingMutation.mutate({
                agentId: agent.id,
                input: {
                  knowledge_id: knowledgeId,
                  weight: knowledgeWeight,
                  recall_top_k: knowledgeTopK,
                },
              })}
              type="button"
            >
              绑定
            </Button>
          </ActionField>
        </div>
        <BindingList
          canWrite={canWrite}
          emptyText="暂无知识库绑定。"
          items={agent.bindings.knowledge.map((binding) => ({
            id: binding.id,
            title: binding.knowledge_name,
            subtitle: `${binding.knowledge_code} · TopK ${binding.recall_top_k}`,
            extra: `权重 ${binding.weight}`,
          }))}
          onDelete={(bindingId) => deleteKnowledgeBindingMutation.mutate({ agentId: agent.id, bindingId })}
          onEdit={(bindingId) => {
            const binding = agent.bindings.knowledge.find((item) => item.id === bindingId);
            if (!binding) return;
            setEditingKnowledgeId(bindingId);
            setKnowledgeId(binding.knowledge_id);
            setKnowledgeWeight(binding.weight);
            setKnowledgeTopK(binding.recall_top_k);
          }}
          renderEditAction={editingKnowledgeId ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
              <Button
                disabled={!canWrite || updateKnowledgeBindingMutation.isPending}
                onClick={() => updateKnowledgeBindingMutation.mutate({
                  agentId: agent.id,
                  bindingId: editingKnowledgeId,
                  weight: knowledgeWeight,
                  recall_top_k: knowledgeTopK,
                })}
                size="sm"
                type="button"
                variant="outline"
              >
                保存知识配置
              </Button>
              <Button
                disabled={!canWrite || updateKnowledgeBindingMutation.isPending}
                onClick={() => {
                  setEditingKnowledgeId(null);
                  setKnowledgeId('');
                  setKnowledgeWeight(100);
                  setKnowledgeTopK(5);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                取消编辑
              </Button>
            </div>
          ) : null}
        />
      </BindingCard>

      <BindingCard
        count={agent.bindings.tools.length}
        description="按工具单独控制审批要求，适配不同风险等级。"
        icon={Wrench}
        title="工具绑定"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <FieldGroup hint="仅展示已启用工具。" label="工具">
            <select className={selectClassName} onChange={(event) => setToolId(event.target.value)} value={toolId}>
              <option value="">选择工具</option>
              {toolOptions.map((tool) => (
                <option key={tool.id} value={tool.id}>{tool.name} ({tool.code})</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup hint="高风险工具建议开启审批。" label="审批策略">
            <label className="flex h-10 items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 text-sm">
              <input
                checked={toolRequireApproval}
                className="size-4 rounded border-border"
                onChange={(event) => setToolRequireApproval(event.target.checked)}
                type="checkbox"
              />
              需要审批
            </label>
          </FieldGroup>
          <ActionField>
            <Button
              disabled={!canWrite || !toolId || createToolBindingMutation.isPending}
              onClick={() => createToolBindingMutation.mutate({
                agentId: agent.id,
                input: {
                  tool_id: toolId,
                  require_approval: toolRequireApproval,
                },
              })}
              type="button"
            >
              绑定
            </Button>
          </ActionField>
        </div>
        <BindingList
          canWrite={canWrite}
          emptyText="暂无工具绑定。"
          items={agent.bindings.tools.map((binding) => ({
            id: binding.id,
            title: binding.tool_name,
            subtitle: binding.tool_code,
            extra: binding.require_approval ? '需要审批' : '无需审批',
          }))}
          onDelete={(bindingId) => deleteToolBindingMutation.mutate({ agentId: agent.id, bindingId })}
          onEdit={(bindingId) => {
            const binding = agent.bindings.tools.find((item) => item.id === bindingId);
            if (!binding) return;
            setEditingToolId(bindingId);
            setToolId(binding.tool_id);
            setToolRequireApproval(binding.require_approval);
          }}
          renderEditAction={editingToolId ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
              <Button
                disabled={!canWrite || updateToolBindingMutation.isPending}
                onClick={() => updateToolBindingMutation.mutate({
                  agentId: agent.id,
                  bindingId: editingToolId,
                  require_approval: toolRequireApproval,
                })}
                size="sm"
                type="button"
                variant="outline"
              >
                保存工具配置
              </Button>
              <Button
                disabled={!canWrite || updateToolBindingMutation.isPending}
                onClick={() => {
                  setEditingToolId(null);
                  setToolId('');
                  setToolRequireApproval(false);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                取消编辑
              </Button>
            </div>
          ) : null}
        />
      </BindingCard>
    </section>
  );
}

function ActionField({ children }: { children: React.ReactNode }) {
  return <div className="flex items-end">{children}</div>;
}

function BindingCard({
  children,
  count,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  count: number;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Card className="grid gap-4 border-border/70 bg-background/80 p-5 shadow-sm shadow-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/20 text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="pt-1 text-right">
          <div className="text-sm font-medium">{count}</div>
          <div className="text-xs text-muted-foreground">已绑定</div>
        </div>
      </div>
      {children}
    </Card>
  );
}

function FieldGroup({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function BindingList({
  canWrite,
  emptyText,
  items,
  onDelete,
  onEdit,
  renderEditAction,
}: {
  canWrite: boolean;
  emptyText: string;
  items: Array<{ id: string; title: string; subtitle: string; extra: string }>;
  onDelete: (bindingId: string) => void;
  onEdit?: (bindingId: string) => void;
  renderEditAction?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        items.map((item) => (
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3" key={item.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
              </div>
              <StatusBadge tone="planned">{item.extra}</StatusBadge>
            </div>
            <div className="mt-3 flex gap-2">
              {onEdit ? (
                <Button disabled={!canWrite} onClick={() => onEdit(item.id)} size="sm" type="button" variant="outline">
                  <Edit className="size-4" />
                </Button>
              ) : null}
              <Button disabled={!canWrite} onClick={() => onDelete(item.id)} size="sm" type="button" variant="outline">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))
      )}
      {renderEditAction}
    </div>
  );
}
