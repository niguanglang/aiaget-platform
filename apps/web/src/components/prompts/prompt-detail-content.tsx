'use client';

import {
  hasPermission,
  type PromptTemplateDetail,
  type PromptVariableItem,
  type PromptVersionItem,
  type RenderPromptResult,
  type TestPromptResult,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  PromptVariableFormPanel,
  type PromptVariableFormValues,
} from '@/components/prompts/prompt-variable-form-panel';
import { Button } from '@/components/ui/button';
import {
  copyPromptTemplate,
  createPromptVariable,
  deletePromptTemplate,
  deletePromptVariable,
  getPromptTemplate,
  publishPromptTemplate,
  renderPromptTemplate,
  rollbackPromptTemplate,
  testPromptTemplate,
  updatePromptTemplate,
  updatePromptVariable,
  type ApiClientError,
} from '@/lib/api-client';

import { PromptConfirmDialog } from './prompt-confirm-dialog';
import { PromptContentEditorCard } from './prompt-content-editor-card';
import { PromptDetailHeader } from './prompt-detail-header';
import {
  createInputDefaults,
  parseJsonObject,
  toVariableInput,
} from './prompt-detail-utils';
import {
  PromptActivityCard,
  PromptAgentReferencesCard,
  PromptMetadataCard,
  PromptRecentTestsCard,
} from './prompt-history-cards';
import { PromptRenderTestCard } from './prompt-render-test-card';
import { PromptVariablesCard } from './prompt-variables-card';
import { PromptVersionsCard } from './prompt-versions-card';

type PromptActionTarget =
  | { type: 'publish'; source: 'header' | 'versions' }
  | { type: 'rollback'; version: PromptVersionItem }
  | { type: 'delete-variable'; variable: PromptVariableItem };

export function PromptDetailContent({ promptId }: { promptId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<PromptTemplateDetail | null>(null);
  const [promptActionTarget, setPromptActionTarget] = useState<PromptActionTarget | null>(null);
  const [variableMode, setVariableMode] = useState<'create' | 'edit' | null>(null);
  const [editingVariable, setEditingVariable] = useState<PromptVariableItem | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [publishNote, setPublishNote] = useState('');
  const [inputsText, setInputsText] = useState('{}');
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

  const prompt = promptQuery.data ?? null;

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
      setPromptActionTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rollbackMutation = useMutation({
    mutationFn: (version: number) => rollbackPromptTemplate(promptId, { version }),
    onSuccess: async (result) => {
      await applyPromptResult(result);
      setPromptActionTarget(null);
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
      setPromptActionTarget(null);
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

  function confirmPromptAction() {
    if (!promptActionTarget) return;

    if (promptActionTarget.type === 'publish') {
      publishMutation.mutate();
      return;
    }

    if (promptActionTarget.type === 'rollback') {
      rollbackMutation.mutate(promptActionTarget.version.version);
      return;
    }

    deleteVariableMutation.mutate(promptActionTarget.variable.id);
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
      <PromptDetailHeader
        canWrite={canWrite}
        copyPending={copyMutation.isPending}
        prompt={prompt}
        promptId={promptId}
        publishPending={publishMutation.isPending}
        onCopy={() => copyMutation.mutate(prompt.id)}
        onDelete={() => setDeleteTemplateTarget(prompt)}
        onPublish={() => setPromptActionTarget({ type: 'publish', source: 'header' })}
      />

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
          <PromptContentEditorCard
            canWrite={canWrite}
            content={editorContent}
            onChangeContent={setEditorContent}
            onSave={() => saveContentMutation.mutate()}
            pending={saveContentMutation.isPending}
          />
          <PromptVariablesCard
            canWrite={canWrite}
            deletePending={deleteVariableMutation.isPending}
            prompt={prompt}
            onCreate={openCreateVariable}
            onDelete={(variable) => setPromptActionTarget({ type: 'delete-variable', variable })}
            onEdit={openEditVariable}
          />
          <PromptVersionsCard
            canWrite={canWrite}
            note={publishNote}
            onChangeNote={setPublishNote}
            onPublish={() => setPromptActionTarget({ type: 'publish', source: 'versions' })}
            onRollback={(version) => setPromptActionTarget({ type: 'rollback', version })}
            prompt={prompt}
            publishPending={publishMutation.isPending}
            rollbackPending={rollbackMutation.isPending}
          />
        </div>

        <div className="grid gap-4">
          <PromptMetadataCard prompt={prompt} />
          <PromptRenderTestCard
            canWrite={canWrite}
            inputText={inputsText}
            onChangeInput={setInputsText}
            onLoadDefaults={() => setInputsText(JSON.stringify(createInputDefaults(prompt), null, 2))}
            onRender={runRender}
            onTest={runTest}
            renderError={renderError}
            renderPending={renderMutation.isPending}
            renderResult={renderResult}
            testPending={testMutation.isPending}
            testResult={testResult}
          />
          <PromptRecentTestsCard prompt={prompt} />
          <PromptAgentReferencesCard prompt={prompt} />
          <PromptActivityCard prompt={prompt} />
        </div>
      </section>

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
        <PromptConfirmDialog
          body={`这会归档 ${deleteTemplateTarget.name}，并保留版本历史。`}
          pending={deleteTemplateMutation.isPending}
          title="删除提示词？"
          onCancel={() => setDeleteTemplateTarget(null)}
          onConfirm={() => deleteTemplateMutation.mutate(deleteTemplateTarget.id)}
        />
      ) : null}
      {promptActionTarget ? (
        <PromptActionConfirmDialog
          pending={publishMutation.isPending || rollbackMutation.isPending || deleteVariableMutation.isPending}
          target={promptActionTarget}
          onCancel={() => setPromptActionTarget(null)}
          onConfirm={confirmPromptAction}
        />
      ) : null}
    </main>
  );
}

function PromptActionConfirmDialog({
  onCancel,
  onConfirm,
  pending,
  target,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  target: PromptActionTarget;
}) {
  const title =
    target.type === 'publish'
      ? '确认发布提示词'
      : target.type === 'rollback'
        ? '确认回滚提示词版本'
        : '确认删除提示词变量';
  const body =
    target.type === 'publish'
      ? '发布会创建新的不可变版本快照，已绑定 Agent 后续会读取最新可发布内容。请确认提示词内容、变量和测试结果已经检查。'
      : target.type === 'rollback'
        ? `这会将提示词内容和变量恢复到 v${target.version.version} 并进入草稿状态，后续发布前需要重新确认差异。`
        : `这会删除变量「${target.variable.name}」。如果模板内容仍引用该变量，渲染或测试时会出现缺失输入。`;
  const confirmLabel =
    target.type === 'publish' ? '确认发布' : target.type === 'rollback' ? '确认回滚' : '确认删除';

  return (
    <PromptConfirmDialog
      body={body}
      confirmLabel={confirmLabel}
      pending={pending}
      title={title}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
