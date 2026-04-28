'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AgentDetail, AgentListItem, AgentStatus } from '@aiaget/shared-types';
import { Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { AgentFormPanel, type AgentFormValues } from '@/components/agents/agent-form-panel';
import { agentStatusTone, formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgentCategories,
  listAgents,
  listUsers,
  updateAgent,
  type ApiClientError,
} from '@/lib/api-client';

const statusOptions: AgentStatus[] = ['DRAFT', 'TESTING', 'PENDING', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];

export function AgentsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentListItem | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentDetail | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgentListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      currentUser?.user.permissions.includes('agent.write'),
  );

  const agentsQuery = useQuery({
    queryKey: ['agents', keyword, status, categoryId, ownerId],
    queryFn: () =>
      listAgents({
        page: 1,
        page_size: 20,
        keyword,
        status,
        category_id: categoryId,
        owner_id: ownerId,
      }),
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

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: async (agent) => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      setSelectedAgent(agent);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AgentFormValues }) =>
      updateAgent(id, toUpdateInput(values)),
    onSuccess: async (agent) => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.setQueryData(['agent', agent.id], agent);
      setSelectedAgent(agent);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteTarget(null);
      setSelectedAgent(null);
    },
  });

  const agents = agentsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const metrics = useMemo(
    () => [
      { label: 'Total agents', value: `${agentsQuery.data?.total ?? 0}`, helper: 'Tenant scoped' },
      {
        label: 'Published',
        value: `${agents.filter((agent) => agent.status === 'PUBLISHED').length}`,
        helper: 'Current page',
      },
      {
        label: 'Drafts',
        value: `${agents.filter((agent) => agent.status === 'DRAFT').length}`,
        helper: 'Current page',
      },
      {
        label: 'Disabled',
        value: `${agents.filter((agent) => agent.status === 'DISABLED').length}`,
        helper: 'Current page',
      },
    ],
    [agents, agentsQuery.data?.total],
  );

  function openCreateForm() {
    setFormError(null);
    setEditingAgent(null);
    setIsCreating(true);
  }

  async function openEditForm(agent: AgentListItem) {
    setFormError(null);
    setIsCreating(false);
    setEditLoadingId(agent.id);

    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['agent', agent.id],
        queryFn: () => getAgent(agent.id),
      });

      setEditingAgent(detail);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to load agent detail.');
    } finally {
      setEditLoadingId(null);
    }
  }

  function closeForm() {
    setFormError(null);
    setIsCreating(false);
    setEditingAgent(null);
  }

  function submitForm(values: AgentFormValues) {
    setFormError(null);

    if (isCreating) {
      createMutation.mutate(toCreateInput(values));
      return;
    }

    if (editingAgent) {
      updateMutation.mutate({
        id: editingAgent.id,
        values,
      });
    }
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setCategoryId('');
    setOwnerId('');
  }

  const isFormOpen = isCreating || Boolean(editingAgent);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M03</StatusBadge>
            <StatusBadge tone="healthy">Agent CRUD</StatusBadge>
            <StatusBadge tone="planned">Versioned publish</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Agent Configuration Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage tenant agents, runtime defaults, version snapshots, publish state, and audit history.
          </p>
        </div>
        <Button disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          New agent
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">Agents</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search, filter, create, edit, delete, and open complete agent details.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {agents.length} of {agentsQuery.data?.total ?? 0}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_180px_220px_220px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search name, code, description"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setCategoryId(event.target.value)}
                value={categoryId}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
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

        {agentsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">Failed to load agents.</div>
        ) : agentsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="p-10 text-center">
            <div className="font-medium">No agents found</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an agent or adjust keyword, status, category, and owner filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Agent', 'Status', 'Category', 'Version', 'Default model', 'Owner', 'Updated', 'Actions'].map(
                    (column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr className="border-b last:border-0" key={agent.id}>
                    <td className="px-4 py-3">
                      <button
                        className="grid max-w-sm gap-1 text-left"
                        onClick={() => setSelectedAgent(agent)}
                        type="button"
                      >
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{agent.code}</span>
                        {agent.description ? (
                          <span className="line-clamp-1 text-xs text-muted-foreground">{agent.description}</span>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={agentStatusTone(agent.status)}>{agent.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-medium">v{agent.version}</td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.default_model ?? 'Unbound'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.owner?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(agent.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button asChild size="sm" title="Details" variant="outline">
                          <Link href={`/agents/${agent.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          disabled={!canWrite || editLoadingId === agent.id}
                          onClick={() => void openEditForm(agent)}
                          size="sm"
                          title="Edit"
                          variant="outline"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          disabled={!canWrite}
                          onClick={() => setDeleteTarget(agent)}
                          size="sm"
                          title="Delete"
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
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Configuration Coverage</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ['Basic profile', 'Name, code, category, owner, avatar, description'],
              ['Runtime defaults', 'Temperature, context tokens, stream and log switches'],
              ['Lifecycle', 'Draft, testing, pending, published, disabled, archived'],
              ['Bindings', 'Model, prompt, knowledge, and tool placeholders for M04-M07'],
            ].map(([label, value]) => (
              <div className="rounded-md border bg-muted/30 px-3 py-2" key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Selected Agent</h2>
            {selectedAgent ? (
              <Button onClick={() => setSelectedAgent(null)} size="icon" variant="ghost">
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          {selectedAgent ? (
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Name" value={selectedAgent.name} />
              <DetailRow label="Code" value={selectedAgent.code} />
              <DetailRow label="Status" value={selectedAgent.status} />
              <DetailRow label="Version" value={`v${selectedAgent.version}`} />
              <DetailRow label="Category" value={selectedAgent.category?.name ?? '-'} />
              <DetailRow label="Owner" value={selectedAgent.owner?.email ?? '-'} />
              <Button asChild className="mt-1" variant="outline">
                <Link href={`/agents/${selectedAgent.id}`}>Open full detail</Link>
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Select a row to inspect its summary, or open the detail route for versions, publish, rollback, and audit.
            </p>
          )}
        </div>
      </section>

      {isFormOpen ? (
        <AgentFormPanel
          agent={editingAgent}
          categories={categories}
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={isCreating ? 'create' : 'edit'}
          onClose={closeForm}
          onSubmit={submitForm}
          owners={owners}
        />
      ) : null}

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete agent?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will soft delete `{deleteTarget.name}` and keep versions plus audit history.
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

function toCreateInput(values: AgentFormValues) {
  return {
    name: values.name,
    code: values.code,
    description: nullableText(values.description),
    avatar_url: nullableText(values.avatar_url),
    category_id: nullableId(values.category_id),
    owner_id: nullableId(values.owner_id),
    temperature: values.temperature,
    max_context_tokens: values.max_context_tokens,
    enable_stream: values.enable_stream,
    enable_log: values.enable_log,
  };
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
