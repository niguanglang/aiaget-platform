'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  PromptStatus,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PromptType,
  RenderPromptResult,
  TestPromptResult,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Copy, Edit, Eye, FileText, FlaskConical, Plus, Search, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PromptCenterBackground } from '@/components/prompts/prompt-center-background';
import { PromptFormPanel, type PromptFormValues } from '@/components/prompts/prompt-form-panel';
import { formatDateTime, pluralize, promptStatusTone, promptTestStatusTone } from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  copyPromptTemplate,
  createPromptTemplate,
  deletePromptTemplate,
  getPromptTemplate,
  listPromptTemplates,
  listUsers,
  publishPromptTemplate,
  renderPromptTemplate,
  testPromptTemplate,
  updatePromptTemplate,
  type ApiClientError,
} from '@/lib/api-client';

const promptTypes: PromptType[] = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'];
const promptStatuses: PromptStatus[] = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];

export function PromptsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplateDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromptTemplateListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [inputsText, setInputsText] = useState('{\n  "audience": "support team",\n  "goal": "summarize the customer request"\n}');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<RenderPromptResult | null>(null);
  const [testResult, setTestResult] = useState<TestPromptResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      currentUser?.user.permissions.includes('prompt.write'),
  );

  const promptsQuery = useQuery({
    queryKey: ['prompt-templates', keyword, type, status, ownerId],
    queryFn: () =>
      listPromptTemplates({
        page: 1,
        page_size: 20,
        keyword,
        type,
        status,
        owner_id: ownerId,
      }),
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

  const prompts = promptsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const activePromptId = selectedPromptId ?? prompts[0]?.id ?? null;

  const selectedPromptQuery = useQuery({
    enabled: Boolean(activePromptId),
    queryKey: ['prompt-template', activePromptId],
    queryFn: () => getPromptTemplate(activePromptId ?? ''),
  });

  const metrics = useMemo(
    () => [
      { label: 'Templates', value: `${promptsQuery.data?.total ?? 0}`, helper: 'Tenant scoped' },
      {
        label: 'Published',
        value: `${prompts.filter((prompt) => prompt.status === 'PUBLISHED').length}`,
        helper: 'Current page',
      },
      {
        label: 'Drafts',
        value: `${prompts.filter((prompt) => prompt.status === 'DRAFT').length}`,
        helper: 'Current page',
      },
      {
        label: 'Tests',
        value: `${prompts.reduce((sum, prompt) => sum + prompt.test_count, 0)}`,
        helper: 'Current page',
      },
    ],
    [prompts, promptsQuery.data?.total],
  );

  useEffect(() => {
    setRenderError(null);
    setRenderResult(null);
    setTestResult(null);
  }, [activePromptId]);

  const createMutation = useMutation({
    mutationFn: createPromptTemplate,
    onSuccess: async (prompt) => {
      await applyPromptResult(prompt);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PromptFormValues }) =>
      updatePromptTemplate(id, toUpdateInput(values)),
    onSuccess: async (prompt) => {
      await applyPromptResult(prompt);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const copyMutation = useMutation({
    mutationFn: copyPromptTemplate,
    onSuccess: async (prompt) => {
      await applyPromptResult(prompt);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      publishPromptTemplate(id, {
        change_note: 'Published from Prompt Center list',
      }),
    onSuccess: async (prompt) => {
      await applyPromptResult(prompt);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromptTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      if (deleteTarget?.id === selectedPromptId) {
        setSelectedPromptId(null);
      }
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const renderMutation = useMutation({
    mutationFn: ({ id, inputs }: { id: string; inputs: Record<string, unknown> }) =>
      renderPromptTemplate(id, { inputs }),
    onSuccess: (result) => {
      setRenderResult(result);
      setRenderError(null);
    },
    onError: (error: ApiClientError) => setRenderError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: ({ id, inputs }: { id: string; inputs: Record<string, unknown> }) =>
      testPromptTemplate(id, { inputs }),
    onSuccess: async (result) => {
      setTestResult(result);
      setRenderResult({
        rendered_content: result.rendered_content,
        missing_variables: result.missing_variables,
      });
      if (activePromptId) {
        await queryClient.invalidateQueries({ queryKey: ['prompt-template', activePromptId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setRenderError(null);
    },
    onError: (error: ApiClientError) => setRenderError(error.message),
  });

  async function applyPromptResult(prompt: PromptTemplateDetail) {
    queryClient.setQueryData(['prompt-template', prompt.id], prompt);
    await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
    setSelectedPromptId(prompt.id);
  }

  function openCreateForm() {
    setFormError(null);
    setEditingPrompt(null);
    setFormMode('create');
  }

  async function openEditForm(prompt: PromptTemplateListItem) {
    setFormError(null);
    setEditLoadingId(prompt.id);

    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['prompt-template', prompt.id],
        queryFn: () => getPromptTemplate(prompt.id),
      });

      setEditingPrompt(detail);
      setFormMode('edit');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to load prompt detail.');
    } finally {
      setEditLoadingId(null);
    }
  }

  function closeForm() {
    setFormError(null);
    setFormMode(null);
    setEditingPrompt(null);
  }

  function submitForm(values: PromptFormValues) {
    setFormError(null);

    if (formMode === 'create') {
      createMutation.mutate(toCreateInput(values));
      return;
    }

    if (editingPrompt) {
      updateMutation.mutate({
        id: editingPrompt.id,
        values,
      });
    }
  }

  function clearFilters() {
    setKeyword('');
    setType('');
    setStatus('');
    setOwnerId('');
  }

  function runRender() {
    if (!activePromptId) return;

    const parsed = parseJsonObject(inputsText);
    if (!parsed.ok) {
      setRenderError(parsed.message);
      return;
    }

    renderMutation.mutate({ id: activePromptId, inputs: parsed.value });
  }

  function runTest() {
    if (!activePromptId) return;

    const parsed = parseJsonObject(inputsText);
    if (!parsed.ok) {
      setRenderError(parsed.message);
      return;
    }

    testMutation.mutate({ id: activePromptId, inputs: parsed.value });
  }

  const selectedPrompt = selectedPromptQuery.data ?? null;
  const isFormOpen = Boolean(formMode);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PromptCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M05</StatusBadge>
            <StatusBadge tone="healthy">Prompt CRUD</StatusBadge>
            <StatusBadge tone="planned">Versioned publish</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Prompt Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage tenant prompt templates, variables, immutable versions, rollback, render checks,
            test records, and agent references.
          </p>
        </div>
        <Button disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          New prompt
        </Button>
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
                  <h2 className="text-sm font-semibold">Templates</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search, filter, create, copy, publish, archive, and open prompt templates.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {prompts.length} of {promptsQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_160px_190px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Search prompt, code, content"
                    value={keyword}
                  />
                </label>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setType(event.target.value)}
                  value={type}
                >
                  <option value="">All types</option>
                  {promptTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="">All statuses</option>
                  {promptStatuses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setOwnerId(event.target.value)}
                  value={ownerId}
                >
                  <option value="">All owners</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                <Button onClick={clearFilters} type="button" variant="outline">
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {promptsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">Failed to load prompt templates.</div>
          ) : promptsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading prompt templates...</div>
          ) : prompts.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={openCreateForm}>
                  <Plus className="size-4" />
                  New prompt
                </Button>
              }
              description="Create a prompt template, define variables, render it with test inputs, and publish an immutable version."
              title="No prompt templates found"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['Template', 'Type', 'Status', 'Version', 'Variables', 'Tests', 'Updated', 'Actions'].map(
                      (column) => (
                        <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={prompt.id}
                      transition={{ delay: index * 0.025, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="grid max-w-md gap-1 text-left"
                          onClick={() => setSelectedPromptId(prompt.id)}
                          type="button"
                        >
                          <span className="font-medium">{prompt.name}</span>
                          <span className="text-xs text-muted-foreground">{prompt.code}</span>
                          <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {prompt.content_preview}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={promptStatusTone(prompt.status)}>{prompt.status}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">v{prompt.version}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.variable_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.test_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(prompt.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" title="Open detail" variant="outline">
                            <Link href={`/prompts/${prompt.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            disabled={!canWrite || editLoadingId === prompt.id}
                            onClick={() => void openEditForm(prompt)}
                            size="sm"
                            title="Edit"
                            variant="outline"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            disabled={!canWrite || copyMutation.isPending}
                            onClick={() => copyMutation.mutate(prompt.id)}
                            size="sm"
                            title="Copy"
                            variant="outline"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            disabled={!canWrite || publishMutation.isPending || prompt.status === 'ARCHIVED'}
                            onClick={() => publishMutation.mutate(prompt.id)}
                            size="sm"
                            title="Publish"
                            variant="outline"
                          >
                            <Send className="size-4" />
                          </Button>
                          <Button
                            disabled={!canWrite}
                            onClick={() => setDeleteTarget(prompt)}
                            size="sm"
                            title="Delete"
                            variant="outline"
                          >
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

        <PromptSummaryPanel
          canWrite={canWrite}
          inputsText={inputsText}
          loading={selectedPromptQuery.isLoading}
          onChangeInputs={setInputsText}
          onLoadDefaults={() => {
            if (!selectedPrompt) return;
            setInputsText(JSON.stringify(createInputDefaults(selectedPrompt), null, 2));
          }}
          onRender={runRender}
          onTest={runTest}
          prompt={selectedPrompt}
          renderError={renderError}
          renderPending={renderMutation.isPending}
          renderResult={renderResult}
          testPending={testMutation.isPending}
          testResult={testResult}
        />
      </section>

      {isFormOpen ? (
        <PromptFormPanel
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={formMode ?? 'create'}
          onClose={closeForm}
          onSubmit={submitForm}
          owners={owners}
          prompt={editingPrompt}
        />
      ) : null}

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete prompt?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will archive `{deleteTarget.name}` and keep its version history.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
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

function PromptSummaryPanel({
  canWrite,
  inputsText,
  loading,
  onChangeInputs,
  onLoadDefaults,
  onRender,
  onTest,
  prompt,
  renderError,
  renderPending,
  renderResult,
  testPending,
  testResult,
}: {
  canWrite: boolean;
  inputsText: string;
  loading: boolean;
  onChangeInputs: (value: string) => void;
  onLoadDefaults: () => void;
  onRender: () => void;
  onTest: () => void;
  prompt: PromptTemplateDetail | null;
  renderError: string | null;
  renderPending: boolean;
  renderResult: RenderPromptResult | null;
  testPending: boolean;
  testResult: TestPromptResult | null;
}) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">Loading selected prompt...</div>
      </Card>
    );
  }

  if (!prompt) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4" />
          Selected prompt
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Select a row to inspect variables, render the template, or open the full detail route.
        </p>
      </Card>
    );
  }

  return (
    <Card className="grid gap-5 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={promptStatusTone(prompt.status)}>{prompt.status}</StatusBadge>
              <StatusBadge tone="planned">{prompt.type}</StatusBadge>
              <StatusBadge tone="ready">v{prompt.version}</StatusBadge>
            </div>
            <h2 className="mt-3 break-words text-base font-semibold">{prompt.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{prompt.code}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/prompts/${prompt.id}`}>
              <Eye className="size-4" />
              Detail
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{prompt.description ?? 'No description.'}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <SummaryTile label="Variables" value={`${prompt.variable_count}`} />
        <SummaryTile label="Tests" value={`${prompt.test_count}`} />
        <SummaryTile label="Agents" value={`${prompt.agent_reference_count}`} />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Render inputs</h3>
          <Button onClick={onLoadDefaults} size="sm" type="button" variant="outline">
            Load defaults
          </Button>
        </div>
        <textarea
          className="mt-3 min-h-40 w-full resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => onChangeInputs(event.target.value)}
          spellCheck={false}
          value={inputsText}
        />
        {renderError ? (
          <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {renderError}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={renderPending} onClick={onRender} type="button" variant="outline">
            <FileText className="size-4" />
            Render
          </Button>
          <Button disabled={!canWrite || testPending} onClick={onTest} type="button">
            <FlaskConical className="size-4" />
            Run test
          </Button>
        </div>
      </div>

      {renderResult ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Rendered output</h3>
            <span className="text-xs text-muted-foreground">
              {renderResult.missing_variables.length === 0
                ? 'All required variables resolved'
                : pluralize(renderResult.missing_variables.length, 'missing variable')}
            </span>
          </div>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs leading-5">
            {renderResult.rendered_content}
          </pre>
        </div>
      ) : null}

      {testResult ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Latest test</h3>
            <StatusBadge tone={promptTestStatusTone(testResult.status)}>{testResult.status}</StatusBadge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Latency {testResult.latency_ms}ms</div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {testResult.output_text ?? testResult.error_message ?? 'No runtime output.'}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function toCreateInput(values: PromptFormValues) {
  return {
    name: values.name,
    code: values.code,
    type: values.type,
    content: values.content,
    description: nullableText(values.description),
    owner_id: nullableId(values.owner_id),
  };
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

function coerceVariableDefault(value: string | null, type: PromptTemplateDetail['variables'][number]['variable_type']) {
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
