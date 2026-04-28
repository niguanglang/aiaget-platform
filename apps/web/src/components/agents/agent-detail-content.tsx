'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AgentDetail } from '@aiaget/shared-types';
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Edit,
  GitBranch,
  Power,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { AgentFormPanel, type AgentFormValues } from '@/components/agents/agent-form-panel';
import { agentStatusTone, formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  archiveAgent,
  createAgentVersion,
  deleteAgent,
  disableAgent,
  getAgent,
  listAgentCategories,
  listUsers,
  publishAgent,
  rollbackAgent,
  updateAgent,
  type ApiClientError,
} from '@/lib/api-client';

export function AgentDetailContent({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgentDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [versionNote, setVersionNote] = useState('');

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      currentUser?.user.permissions.includes('agent.write'),
  );

  const agentQuery = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  });
  const categoriesQuery = useQuery({
    queryKey: ['agent-categories'],
    queryFn: listAgentCategories,
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-owners'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AgentFormValues }) =>
      updateAgent(id, toUpdateInput(values)),
    onSuccess: async (agent) => {
      applyAgentResult(agent);
      setIsEditing(false);
      setFormError(null);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const createVersionMutation = useMutation({
    mutationFn: (id: string) =>
      createAgentVersion(id, {
        change_note: versionNote.trim() || null,
      }),
    onSuccess: (agent) => {
      applyAgentResult(agent);
      setVersionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: publishAgent,
    onSuccess: (agent) => {
      applyAgentResult(agent);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => rollbackAgent(id, { version }),
    onSuccess: (agent) => {
      applyAgentResult(agent);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: disableAgent,
    onSuccess: (agent) => {
      applyAgentResult(agent);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAgent,
    onSuccess: (agent) => {
      applyAgentResult(agent);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteTarget(null);
      router.push('/agents');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function applyAgentResult(agent: AgentDetail) {
    queryClient.setQueryData(['agent', agent.id], agent);
    void queryClient.invalidateQueries({ queryKey: ['agents'] });
  }

  function submitForm(values: AgentFormValues) {
    setFormError(null);
    updateMutation.mutate({
      id: agentId,
      values,
    });
  }

  const agent = agentQuery.data;
  const categories = categoriesQuery.data ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const isActionPending =
    createVersionMutation.isPending ||
    publishMutation.isPending ||
    rollbackMutation.isPending ||
    disableMutation.isPending ||
    archiveMutation.isPending;

  if (agentQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          Loading agent detail...
        </div>
      </main>
    );
  }

  if (agentQuery.isError || !agent) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline">
          <Link href="/agents">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
          Failed to load agent detail.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/agents">
              <ArrowLeft className="size-4" />
              Agents
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={agentStatusTone(agent.status)}>{agent.status}</StatusBadge>
            <StatusBadge tone="ready">v{agent.version}</StatusBadge>
            <StatusBadge tone="planned">{agent.category?.name ?? 'Uncategorized'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{agent.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {agent.description ?? 'No description.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite} onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="size-4" />
            Edit
          </Button>
          <Button
            disabled={!canWrite || isActionPending}
            onClick={() => createVersionMutation.mutate(agent.id)}
            variant="outline"
          >
            <GitBranch className="size-4" />
            Create version
          </Button>
          <Button
            disabled={!canWrite || isActionPending || agent.versions.length === 0}
            onClick={() => publishMutation.mutate(agent.id)}
          >
            <Send className="size-4" />
            Publish
          </Button>
          <Button
            disabled={!canWrite || isActionPending || agent.status === 'DISABLED' || agent.status === 'ARCHIVED'}
            onClick={() => disableMutation.mutate(agent.id)}
            variant="outline"
          >
            <Power className="size-4" />
            Disable
          </Button>
          <Button
            disabled={!canWrite || isActionPending || agent.status === 'ARCHIVED'}
            onClick={() => archiveMutation.mutate(agent.id)}
            variant="outline"
          >
            <Archive className="size-4" />
            Archive
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteTarget(agent)} variant="destructive">
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

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Basic Information</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="Code" value={agent.code} />
            <DetailRow label="Owner" value={agent.owner ? `${agent.owner.name} (${agent.owner.email})` : '-'} />
            <DetailRow label="Category" value={agent.category?.name ?? '-'} />
            <DetailRow label="Created" value={formatDateTime(agent.created_at)} />
            <DetailRow label="Updated" value={formatDateTime(agent.updated_at)} />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Runtime Configuration</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="Temperature" value={agent.temperature.toFixed(2)} />
            <DetailRow label="Max context tokens" value={`${agent.max_context_tokens}`} />
            <DetailRow label="Stream responses" value={agent.enable_stream ? 'Enabled' : 'Disabled'} />
            <DetailRow label="Run logs" value={agent.enable_log ? 'Enabled' : 'Disabled'} />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Publish Readiness</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <ReadinessRow active={agent.versions.length > 0} label="Version snapshot" />
            <ReadinessRow active={Boolean(agent.owner)} label="Owner assigned" />
            <ReadinessRow active={agent.status !== 'ARCHIVED'} label="Lifecycle available" />
            <ReadinessRow active={agent.enable_log} label="Audit logging" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-sm font-semibold">Resource Bindings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Binding rows are reserved in M03 and become selectable as Model, Prompt, Knowledge, and Tool centers land.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BindingCard count={agent.bindings.models.length} label="Models" milestone="M04" />
          <BindingCard count={agent.bindings.prompts.length} label="Prompts" milestone="M05" />
          <BindingCard count={agent.bindings.knowledge.length} label="Knowledge" milestone="M06" />
          <BindingCard count={agent.bindings.tools.length} label="Tools" milestone="M07" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border bg-background">
          <div className="border-b p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Versions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Snapshots capture current profile and runtime fields before publish.
                </p>
              </div>
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border px-3 text-sm md:w-80">
                <GitBranch className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setVersionNote(event.target.value)}
                  placeholder="Change note"
                  value={versionNote}
                />
              </label>
            </div>
          </div>
          {agent.versions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No versions have been created.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['Version', 'Status', 'Change note', 'Created by', 'Published', 'Actions'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agent.versions.map((version) => (
                    <tr className="border-b last:border-0" key={version.id}>
                      <td className="px-4 py-3 font-medium">v{version.version}</td>
                      <td className="px-4 py-3">{version.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{version.change_note ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{version.created_by?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(version.published_at)}</td>
                      <td className="px-4 py-3">
                        <Button
                          disabled={!canWrite || rollbackMutation.isPending}
                          onClick={() => rollbackMutation.mutate({ id: agent.id, version: version.version })}
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
        </div>

        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Conversation Test</h2>
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-muted-foreground" />
              Runtime chat placeholder
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              M08 connects this panel to runtime conversations, SSE events, run traces, citations, and feedback.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-sm font-semibold">Audit Timeline</h2>
        {agent.audit_logs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No agent audit records yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {agent.audit_logs.map((auditLog) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={auditLog.id}>
                <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
                  <div className="font-medium">{auditLog.action}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(auditLog.created_at)}</div>
                </div>
                <p className="mt-1 text-muted-foreground">{auditLog.message}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  Operator: {auditLog.operator?.email ?? 'system'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isEditing ? (
        <AgentFormPanel
          agent={agent}
          categories={categories}
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => {
            setFormError(null);
            setIsEditing(false);
          }}
          onSubmit={submitForm}
          owners={owners}
        />
      ) : null}

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete agent?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will soft delete `{deleteTarget.name}` and return to the list.
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

function toUpdateInput(values: AgentFormValues) {
  return {
    name: values.name,
    description: nullableText(values.description),
    avatar_url: nullableText(values.avatar_url),
    category_id: nullableId(values.category_id),
    owner_id: nullableId(values.owner_id),
    status: values.status,
    temperature: values.temperature,
    max_context_tokens: values.max_context_tokens,
    enable_stream: values.enable_stream,
    enable_log: values.enable_log,
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function nullableId(value?: string) {
  return value || null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function ReadinessRow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
      <span>{label}</span>
      <StatusBadge tone={active ? 'healthy' : 'degraded'}>{active ? 'Ready' : 'Missing'}</StatusBadge>
    </div>
  );
}

function BindingCard({ count, label, milestone }: { count: number; label: string; milestone: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{label}</div>
        <StatusBadge tone="planned">{milestone}</StatusBadge>
      </div>
      <div className="mt-3 text-2xl font-semibold">{count}</div>
      <div className="mt-1 text-xs text-muted-foreground">Bindings configured</div>
    </div>
  );
}
