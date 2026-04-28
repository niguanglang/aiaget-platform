'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  PromptTemplateDetail,
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
  pluralize,
  promptStatusTone,
  promptTestStatusTone,
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
      currentUser?.user.permissions.includes('prompt.write'),
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
      { label: 'Variables', value: `${prompt.variables.length}`, helper: 'Render schema' },
      { label: 'Versions', value: `${prompt.versions.length}`, helper: `Current v${prompt.version}` },
      { label: 'Tests', value: `${prompt.test_records.length}`, helper: 'Latest 20 records' },
      { label: 'Agents', value: `${prompt.agent_references.length}`, helper: 'Prompt bindings' },
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
          Loading prompt detail...
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
            Prompts
          </Link>
        </Button>
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
          Failed to load prompt detail.
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
              Prompts
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={promptStatusTone(prompt.status)}>{prompt.status}</StatusBadge>
            <StatusBadge tone="ready">v{prompt.version}</StatusBadge>
            <StatusBadge tone="planned">{prompt.type}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{prompt.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {prompt.description ?? 'No description.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite} onClick={() => setIsEditingTemplate(true)} variant="outline">
            <Edit className="size-4" />
            Edit
          </Button>
          <Button disabled={!canWrite || copyMutation.isPending} onClick={() => copyMutation.mutate(prompt.id)} variant="outline">
            <Copy className="size-4" />
            Copy
          </Button>
          <Button disabled={!canWrite || publishMutation.isPending} onClick={() => publishMutation.mutate()}>
            <Send className="size-4" />
            Publish
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteTemplateTarget(prompt)} variant="destructive">
            <Trash2 className="size-4" />
            Delete
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
                <h2 className="text-sm font-semibold">Prompt editor</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Textarea implementation with a Monaco-compatible boundary for a future editor swap.
                </p>
              </div>
              <Button
                disabled={!canWrite || saveContentMutation.isPending || editorContent.trim().length === 0}
                onClick={() => saveContentMutation.mutate()}
              >
                <Save className="size-4" />
                Save content
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
                <h2 className="text-sm font-semibold">Variables</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define render inputs used by <code>{'{{name}}'}</code> and <code>{'{name}'}</code> placeholders.
                </p>
              </div>
              <Button disabled={!canWrite} onClick={openCreateVariable} variant="outline">
                <Plus className="size-4" />
                New variable
              </Button>
            </div>
            {prompt.variables.length === 0 ? (
              <EmptyState
                action={
                  <Button disabled={!canWrite} onClick={openCreateVariable} variant="outline">
                    <Plus className="size-4" />
                    New variable
                  </Button>
                }
                description="Variables give each template a typed render contract and make missing inputs visible before runtime."
                title="No variables defined"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['Name', 'Type', 'Required', 'Default', 'Updated', 'Actions'].map((column) => (
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
                            {variable.description ?? 'No description.'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{variable.variable_type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{variable.required ? 'Yes' : 'No'}</td>
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
                              title="Edit variable"
                              variant="outline"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              disabled={!canWrite || deleteVariableMutation.isPending}
                              onClick={() => deleteVariableMutation.mutate(variable.id)}
                              size="sm"
                              title="Delete variable"
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
              <h2 className="text-sm font-semibold">Versions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Publish creates immutable snapshots. Rollback restores content and variables to draft state.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setPublishNote(event.target.value)}
                  placeholder="Change note"
                  value={publishNote}
                />
                <Button disabled={!canWrite || publishMutation.isPending} onClick={() => publishMutation.mutate()}>
                  <Send className="size-4" />
                  Publish
                </Button>
              </div>
            </div>
            {prompt.versions.length === 0 ? (
              <EmptyState
                description="Publish this prompt to create the first immutable version snapshot."
                title="No versions published"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['Version', 'Status', 'Note', 'Publisher', 'Published', 'Actions'].map((column) => (
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
                          <StatusBadge tone={promptStatusTone(version.status)}>{version.status}</StatusBadge>
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
                            Rollback
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
            <h2 className="text-sm font-semibold">Template profile</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Code" value={prompt.code} />
              <DetailRow label="Owner" value={prompt.owner?.email ?? '-'} />
              <DetailRow label="Created" value={formatDateTime(prompt.created_at)} />
              <DetailRow label="Updated" value={formatDateTime(prompt.updated_at)} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Render and test</h2>
              <Button
                onClick={() => setInputsText(JSON.stringify(createInputDefaults(prompt), null, 2))}
                size="sm"
                type="button"
                variant="outline"
              >
                Defaults
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
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={renderMutation.isPending} onClick={runRender} type="button" variant="outline">
                <FileText className="size-4" />
                Render
              </Button>
              <Button disabled={!canWrite || testMutation.isPending} onClick={runTest} type="button">
                <FlaskConical className="size-4" />
                Run test
              </Button>
            </div>
            {renderResult ? (
              <div className="mt-4 rounded-md border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Rendered output</h3>
                  <span className="text-xs text-muted-foreground">
                    {renderResult.missing_variables.length === 0
                      ? 'Ready'
                      : pluralize(renderResult.missing_variables.length, 'missing variable')}
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
                  <h3 className="text-sm font-semibold">Test result</h3>
                  <StatusBadge tone={promptTestStatusTone(testResult.status)}>{testResult.status}</StatusBadge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Latency {testResult.latency_ms}ms</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {testResult.output_text ?? testResult.error_message ?? 'No runtime output.'}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Recent tests</h2>
            <div className="mt-4 grid gap-3">
              {prompt.test_records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No test records yet.</p>
              ) : (
                prompt.test_records.slice(0, 5).map((record) => (
                  <div className="rounded-md border bg-muted/25 px-3 py-2" key={record.id}>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone={promptTestStatusTone(record.status)}>{record.status}</StatusBadge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Latency {record.latency_ms}ms</div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {record.output_text ?? record.error_message ?? record.rendered_content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Agent references</h2>
            <div className="mt-4 grid gap-3">
              {prompt.agent_references.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  No agents reference this prompt yet. Agent prompt bindings will appear here once configured.
                </p>
              ) : (
                prompt.agent_references.map((reference) => (
                  <div className="rounded-md border bg-muted/25 px-3 py-2" key={reference.id}>
                    <div className="font-medium">{reference.agent_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {reference.agent_code} · {reference.prompt_type} · {formatDateTime(reference.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Activity</h2>
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
            <h2 className="text-lg font-semibold">Delete prompt?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will archive `{deleteTemplateTarget.name}` and keep its version history.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDeleteTemplateTarget(null)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={deleteTemplateMutation.isPending}
                onClick={() => deleteTemplateMutation.mutate(deleteTemplateTarget.id)}
                variant="destructive"
              >
                Delete
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
      return { ok: false, message: 'Inputs must be a JSON object.' };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Invalid JSON input.',
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
