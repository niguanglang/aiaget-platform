'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type PromptTemplateDetail,
  PromptVariableItem,
  RenderPromptResult,
  TestPromptResult,
} from '@aiaget/shared-types';
import {
  ArrowLeft,
  Copy,
  Edit,
  FileText,
  FlaskConical,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PromptFormPanel, type PromptFormValues } from '@/components/prompts/prompt-form-panel';
import {
  PromptVariableFormPanel,
  type PromptVariableFormValues,
} from '@/components/prompts/prompt-variable-form-panel';
import {
  formatDateTime,
  promptStatusLabel,
  promptStatusTone,
  promptTestStatusLabel,
  promptTestStatusTone,
  promptTypeLabel,
  promptVariableTypeLabel,
} from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  copyPromptTemplate,
  createPromptVariable,
  deletePromptTemplate,
  deletePromptVariable,
  getPromptTemplate,
  listUsers,
  publishPromptTemplate,
  renderPromptTemplate,
  rollbackPromptTemplate,
  testPromptTemplate,
  updatePromptTemplate,
  updatePromptVariable,
  type ApiClientError,
} from '@/lib/api-client';

export function PromptDetailContent({ promptId }: { promptId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<PromptTemplateDetail | null>(null);
  const [variableMode, setVariableMode] = useState<'create' | 'edit' | null>(null);
  const [editingVariable, setEditingVariable] = useState<PromptVariableItem | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [publishNote, setPublishNote] = useState('');
  const [inputsText, setInputsText] = useState('{}');
  const [formError, setFormError] = useState<string | null>(null);
  const [variableError, setVariableError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<RenderPromptResult | null>(null);
  const [testResult, setTestResult] = useState<TestPromptResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'prompt:template:manage'),
  );

  const promptQuery = useQuery({
    queryKey: ['prompt-template', promptId],
    queryFn: () => getPromptTemplate(promptId),
  });
  const ownersQuery = useQuery({
    queryKey: ['prompt-owners'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });

  const prompt = promptQuery.data ?? null;
  const owners = ownersQuery.data?.items ?? [];

  useEffect(() => {
    if (!prompt) return;

    setEditorContent(prompt.content);
    setInputsText(JSON.stringify(createInputDefaults(prompt), null, 2));
    setRenderResult(null);
    setTestResult(null);
    setRenderError(null);
  }, [prompt]);

  const metrics = useMemo(() => {
    if (!prompt) return [];

    return [
      { label: '变量', value: `${prompt.variables.length}`, helper: '渲染结构' },
      { label: '版本', value: `${prompt.versions.length}`, helper: `当前 v${prompt.version}` },
      { label: '测试', value: `${prompt.test_records.length}`, helper: '最近 20 条' },
      { label: '智能体', value: `${prompt.agent_references.length}`, helper: '提示词绑定' },
    ];
  }, [prompt]);

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PromptFormValues }) =>
      updatePromptTemplate(id, toUpdateInput(values)),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setIsEditingTemplate(false);
      setFormError(null);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const saveContentMutation = useMutation({
    mutationFn: () =>
      updatePromptTemplate(promptId, {
        content: editorContent,
        status: prompt?.status === 'PUBLISHED' ? 'DRAFT' : prompt?.status,
      }),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      publishPromptTemplate(promptId, {
        change_note: publishNote.trim() || null,
      }),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setPublishNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rollbackMutation = useMutation({
    mutationFn: (version: number) => rollbackPromptTemplate(promptId, { version }),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const copyMutation = useMutation({
    mutationFn: copyPromptTemplate,
    onSuccess: async (result) => {
      queryClient.setQueryData(['prompt-template', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      router.push(`/prompts/${result.id}`);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deletePromptTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setDeleteTemplateTarget(null);
      router.push('/prompts');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const createVariableMutation = useMutation({
    mutationFn: (values: PromptVariableFormValues) => createPromptVariable(promptId, toVariableInput(values)),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      closeVariableForm();
    },
    onError: (error: ApiClientError) => setVariableError(error.message),
  });

  const updateVariableMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PromptVariableFormValues }) =>
      updatePromptVariable(promptId, id, toVariableInput(values)),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      closeVariableForm();
    },
    onError: (error: ApiClientError) => setVariableError(error.message),
  });

  const deleteVariableMutation = useMutation({
    mutationFn: (variableId: string) => deletePromptVariable(promptId, variableId),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const renderMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) => renderPromptTemplate(promptId, { inputs }),
    onSuccess: (result) => {
      setRenderResult(result);
      setRenderError(null);
    },
    onError: (error: ApiClientError) => setRenderError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) => testPromptTemplate(promptId, { inputs }),
    onSuccess: async (result) => {
      setTestResult(result);
      setRenderResult({
        rendered_content: result.rendered_content,
        missing_variables: result.missing_variables,
      });
      await queryClient.invalidateQueries({ queryKey: ['prompt-template', promptId] });
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setRenderError(null);
    },
    onError: (error: ApiClientError) => setRenderError(error.message),
  });

  async function applyPromptResult(result: PromptTemplateDetail) {
    queryClient.setQueryData(['prompt-template', result.id], result);
    await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
  }

  function submitTemplate(values: PromptFormValues) {
    setFormError(null);
    updateTemplateMutation.mutate({
      id: promptId,
      values,
    });
  }

  function openCreateVariable() {
    setVariableError(null);
    setEditingVariable(null);
    setVariableMode('create');
  }

  function openEditVariable(variable: PromptVariableItem) {
    setVariableError(null);
    setEditingVariable(variable);
    setVariableMode('edit');
  }

  function closeVariableForm() {
    setVariableError(null);
    setVariableMode(null);
    setEditingVariable(null);
  }

  function submitVariable(values: PromptVariableFormValues) {
    setVariableError(null);

    if (variableMode === 'create') {
      createVariableMutation.mutate(values);
      return;
    }

    if (editingVariable) {
      updateVariableMutation.mutate({
        id: editingVariable.id,
        values,
      });
    }
  }

  function runRender() {
    const parsed = parseJsonObject(inputsText);
    if (!parsed.ok) {
      setRenderError(parsed.message);
      return;
    }

    renderMutation.mutate(parsed.value);
  }

  function runTest() {
    const parsed = parseJsonObject(inputsText);
    if (!parsed.ok) {
      setRenderError(parsed.message);
      return;
    }

    testMutation.mutate(parsed.value);
  }

  if (promptQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          正在加载提示词详情...
        </div>
      </main>
    );
  }

  if (promptQuery.isError || !prompt) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline">
          <Link href="/prompts">
            <ArrowLeft className="size-4" />
            提示词
          </Link>
        </Button>
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
          提示词详情加载失败。
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/prompts">
              <ArrowLeft className="size-4" />
              提示词
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M20</StatusBadge>
            <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge>
            <StatusBadge tone="ready">v{prompt.version}</StatusBadge>
            <StatusBadge tone="healthy">真实模型测试</StatusBadge>
            <StatusBadge tone="planned">{promptTypeLabel(prompt.type)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{prompt.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {prompt.description ?? '暂无描述。'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite} onClick={() => setIsEditingTemplate(true)} variant="outline">
            <Edit className="size-4" />
            编辑
          </Button>
          <Button disabled={!canWrite || copyMutation.isPending} onClick={() => copyMutation.mutate(prompt.id)} variant="outline">
            <Copy className="size-4" />
            复制
          </Button>
          <Button disabled={!canWrite || publishMutation.isPending} onClick={() => publishMutation.mutate()}>
            <Send className="size-4" />
            发布
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteTemplateTarget(prompt)} variant="destructive">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className="rounded-lg border bg-background/85 p-4 shadow-sm backdrop-blur" key={metric.label}>
            <div className="text-sm text-muted-foreground">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <Card>
            <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-sm font-semibold">提示词编辑器</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  当前使用文本域实现，并保留兼容 Monaco 编辑器的替换边界。
                </p>
              </div>
              <Button
                disabled={!canWrite || saveContentMutation.isPending || editorContent.trim().length === 0}
                onClick={() => saveContentMutation.mutate()}
              >
                <Save className="size-4" />
                保存内容
              </Button>
            </div>
            <div className="p-4">
              <textarea
                className="min-h-[420px] w-full resize-y rounded-md border bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!canWrite}
                onChange={(event) => setEditorContent(event.target.value)}
                spellCheck={false}
                value={editorContent}
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-sm font-semibold">变量</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  定义 <code>{'{{name}}'}</code> 与 <code>{'{name}'}</code> 占位符使用的渲染输入。
                </p>
              </div>
              <Button disabled={!canWrite} onClick={openCreateVariable} variant="outline">
                <Plus className="size-4" />
                新建变量
              </Button>
            </div>
            {prompt.variables.length === 0 ? (
              <EmptyState
                action={
                  <Button disabled={!canWrite} onClick={openCreateVariable} variant="outline">
                    <Plus className="size-4" />
                    新建变量
                  </Button>
                }
                description="变量为每个模板提供带类型的渲染契约，并在运行前暴露缺失输入。"
                title="暂无变量"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['名称', '类型', '必填', '默认值', '更新时间', '操作'].map((column) => (
                        <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prompt.variables.map((variable) => (
                      <tr className="border-b last:border-0 hover:bg-muted/25" key={variable.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{variable.name}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {variable.description ?? '暂无描述。'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{promptVariableTypeLabel(variable.variable_type)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{variable.required ? '是' : '否'}</td>
                        <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                          {variable.default_value ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(variable.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              disabled={!canWrite}
                              onClick={() => openEditVariable(variable)}
                              size="sm"
                              title="编辑变量"
                              variant="outline"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              disabled={!canWrite || deleteVariableMutation.isPending}
                              onClick={() => deleteVariableMutation.mutate(variable.id)}
                              size="sm"
                              title="删除变量"
                              variant="outline"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold">版本</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                发布会创建不可变快照；回滚会将内容和变量恢复到草稿状态。
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setPublishNote(event.target.value)}
                  placeholder="变更说明"
                  value={publishNote}
                />
                <Button disabled={!canWrite || publishMutation.isPending} onClick={() => publishMutation.mutate()}>
                  <Send className="size-4" />
                  发布
                </Button>
              </div>
            </div>
            {prompt.versions.length === 0 ? (
              <EmptyState
                description="发布该提示词后会创建首个不可变版本快照。"
                title="暂无已发布版本"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['版本', '状态', '说明', '发布人', '发布时间', '操作'].map((column) => (
                        <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prompt.versions.map((version) => (
                      <tr className="border-b last:border-0 hover:bg-muted/25" key={version.id}>
                        <td className="px-4 py-3 font-medium">v{version.version}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={promptStatusTone(version.status)}>{promptStatusLabel(version.status)}</StatusBadge>
                        </td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground">
                          {version.change_note ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{version.created_by?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(version.published_at)}</td>
                        <td className="px-4 py-3">
                          <Button
                            disabled={!canWrite || rollbackMutation.isPending}
                            onClick={() => rollbackMutation.mutate(version.version)}
                            size="sm"
                            variant="outline"
                          >
                            <RotateCcw className="size-4" />
                            回滚
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">模板资料</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="编码" value={prompt.code} />
              <DetailRow label="负责人" value={prompt.owner?.email ?? '-'} />
              <DetailRow label="创建时间" value={formatDateTime(prompt.created_at)} />
              <DetailRow label="更新时间" value={formatDateTime(prompt.updated_at)} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">渲染与测试</h2>
              <Button
                onClick={() => setInputsText(JSON.stringify(createInputDefaults(prompt), null, 2))}
                size="sm"
                type="button"
                variant="outline"
              >
                默认值
              </Button>
            </div>
            <textarea
              className="mt-3 min-h-44 w-full resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setInputsText(event.target.value)}
              spellCheck={false}
              value={inputsText}
            />
            {renderError ? (
              <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {renderError}
              </div>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              未指定模型时，自动使用租户当前可执行的默认 chat 模型。
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={renderMutation.isPending} onClick={runRender} type="button" variant="outline">
                <FileText className="size-4" />
                渲染
              </Button>
              <Button disabled={!canWrite || testMutation.isPending} onClick={runTest} type="button">
                <FlaskConical className="size-4" />
                运行测试
              </Button>
            </div>
            {renderResult ? (
              <div className="mt-4 rounded-md border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">渲染输出</h3>
                  <span className="text-xs text-muted-foreground">
                    {renderResult.missing_variables.length === 0
                      ? '就绪'
                      : `${renderResult.missing_variables.length} 个变量缺失`}
                  </span>
                </div>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs leading-5">
                  {renderResult.rendered_content}
                </pre>
              </div>
            ) : null}
            {testResult ? (
              <div className="mt-4 rounded-md border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">测试结果</h3>
                  <StatusBadge tone={promptTestStatusTone(testResult.status)}>{promptTestStatusLabel(testResult.status)}</StatusBadge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">延迟 {testResult.latency_ms}ms</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {testResult.model_provider_name ?? '未指定供应商'} · {testResult.request_model ?? '未执行模型'}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {testResult.output_text ?? testResult.error_message ?? '暂无 Runtime 输出。'}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">最近测试</h2>
            <div className="mt-4 grid gap-3">
              {prompt.test_records.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无测试记录。</p>
              ) : (
                prompt.test_records.slice(0, 5).map((record) => (
                  <div className="rounded-md border bg-muted/25 px-3 py-2" key={record.id}>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone={promptTestStatusTone(record.status)}>{promptTestStatusLabel(record.status)}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">延迟 {record.latency_ms}ms</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {record.model_provider_name ?? '未指定供应商'} · {record.request_model ?? '未执行模型'}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {record.output_text ?? record.error_message ?? record.rendered_content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">智能体引用</h2>
            <div className="mt-4 grid gap-3">
              {prompt.agent_references.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  暂无智能体引用该提示词。配置智能体提示词绑定后会显示在这里。
                </p>
              ) : (
                prompt.agent_references.map((reference) => (
                  <div className="rounded-md border bg-muted/25 px-3 py-2" key={reference.id}>
                    <div className="font-medium">{reference.agent_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {reference.agent_code} · {promptTypeLabel(reference.prompt_type as PromptTemplateDetail['type'])} · {formatDateTime(reference.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">活动</h2>
            <div className="mt-4 grid gap-3">
              {prompt.audit_records.map((record) => (
                <div className="rounded-md border bg-muted/25 px-3 py-2" key={record.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{record.action}</div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{record.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {isEditingTemplate ? (
        <PromptFormPanel
          error={formError}
          isPending={updateTemplateMutation.isPending}
          mode="edit"
          onClose={() => {
            setFormError(null);
            setIsEditingTemplate(false);
          }}
          onSubmit={submitTemplate}
          owners={owners}
          prompt={prompt}
        />
      ) : null}

      {variableMode ? (
        <PromptVariableFormPanel
          error={variableError}
          isPending={createVariableMutation.isPending || updateVariableMutation.isPending}
          mode={variableMode}
          onClose={closeVariableForm}
          onSubmit={submitVariable}
          variable={editingVariable}
        />
      ) : null}

      {deleteTemplateTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">删除提示词？</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              这会归档 `{deleteTemplateTarget.name}`，并保留版本历史。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDeleteTemplateTarget(null)} variant="outline">
                取消
              </Button>
              <Button
                disabled={deleteTemplateMutation.isPending}
                onClick={() => deleteTemplateMutation.mutate(deleteTemplateTarget.id)}
                variant="destructive"
              >
                删除
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function toUpdateInput(values: PromptFormValues) {
  return {
    name: values.name,
    type: values.type,
    status: values.status,
    content: values.content,
    description: nullableText(values.description),
    owner_id: nullableId(values.owner_id),
  };
}

function toVariableInput(values: PromptVariableFormValues) {
  return {
    name: values.name,
    variable_type: values.variable_type,
    default_value: nullableText(values.default_value),
    required: values.required,
    description: nullableText(values.description),
    sort_order: values.sort_order,
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function nullableId(value?: string) {
  return value || null;
}

function parseJsonObject(value: string):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { ok: false, message: '输入必须是 JSON 对象。' };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '无效的 JSON 输入。',
    };
  }
}

function createInputDefaults(prompt: PromptTemplateDetail) {
  return Object.fromEntries(
    prompt.variables.map((variable) => [variable.name, coerceVariableDefault(variable.default_value, variable.variable_type)]),
  );
}

function coerceVariableDefault(value: string | null, type: PromptVariableItem['variable_type']) {
  if (value === null || value === '') {
    if (type === 'number') return 0;
    if (type === 'boolean') return false;
    if (type === 'json') return {};
    return '';
  }

  if (type === 'number') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (type === 'boolean') {
    return value === 'true';
  }

  if (type === 'json') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return value;
}
