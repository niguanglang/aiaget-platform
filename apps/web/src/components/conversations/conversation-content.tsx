'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type ConversationListItem, type ConversationStatus } from '@aiaget/shared-types';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  conversationRunStatusLabel,
  conversationStatusLabel,
  conversationStatusTone,
  formatDateTime,
} from '@/components/conversations/conversation-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteConversation, listAgents, listConversations, type ApiClientError } from '@/lib/api-client';

const conversationStatuses: ConversationStatus[] = ['ACTIVE', 'ARCHIVED'];

export function ConversationContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ConversationListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'conversation:chat:manage'),
  );

  const conversationsQuery = useQuery({
    queryKey: ['conversations', keyword, status, agentId],
    queryFn: () =>
      listConversations({
        page: 1,
        page_size: 20,
        keyword,
        status,
        agent_id: agentId,
      }),
  });

  const agentsQuery = useQuery({
    queryKey: ['conversation-agents'],
    queryFn: () =>
      listAgents({
        page: 1,
        page_size: 100,
        status: 'PUBLISHED',
      }),
  });

  const conversations = conversationsQuery.data?.items ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const total = conversationsQuery.data?.total ?? 0;

  const metrics = useMemo(() => {
    const messageCount = conversations.reduce((sum, item) => sum + item.message_count, 0);
    const activeCount = conversations.filter((item) => item.status === 'ACTIVE').length;
    const failedRuns = conversations.filter((item) => item.last_run_status === 'FAILED').length;
    const feedbackCount = conversations.reduce((sum, item) => sum + item.feedback_count, 0);

    return [
      { label: '会话', value: `${total}`, helper: '租户范围' },
      { label: '消息', value: `${messageCount}`, helper: '当前页' },
      { label: '进行中', value: `${activeCount}`, helper: '当前页' },
      { label: '反馈', value: `${feedbackCount}`, helper: `失败运行 ${failedRuns}` },
    ];
  }, [conversations, total]);

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setAgentId('');
  }

  return (
    <main className="grid gap-6 px-4 py-6 lg:px-6">

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">会话中心</StatusBadge>
            <StatusBadge tone="healthy">真实会话</StatusBadge>
            <StatusBadge tone="planned">运行证据</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">会话中心</h1>
        </div>
        {canWrite && agents.length > 0 ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/conversations/create">
              <Plus className="size-4" />
              新建会话
            </Link>
          </Button>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">会话线程</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  标题、智能体、消息数量、最近运行、反馈数量和更新时间。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {conversations.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_220px_160px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索标题、智能体、消息预览"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setAgentId(event.target.value)}
                value={agentId}
              >
                <option value="">全部智能体</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {conversationStatuses.map((conversationStatus) => (
                  <option key={conversationStatus} value={conversationStatus}>
                    {conversationStatusLabel(conversationStatus)}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {conversationsQuery.isError || agentsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">会话列表加载失败。</div>
        ) : conversationsQuery.isLoading || agentsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载会话...</div>
        ) : agents.length === 0 ? (
          <EmptyState description="当前没有可用的已发布智能体，无法创建会话。" title="暂无可用智能体" />
        ) : conversations.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/conversations/create">
                    <Plus className="size-4" />
                    新建会话
                  </Link>
                </Button>
              ) : null
            }
            title="暂无会话"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['会话', '智能体', '用户', '状态', '消息', '反馈', '最近运行', '最后消息时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={conversation.id}>
                    <td className="px-4 py-3">
                      <div className="grid max-w-md gap-1">
                        <Link className="font-medium hover:text-primary" href={`/conversations/${conversation.id}`}>
                          {conversation.title}
                        </Link>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {conversation.last_message_preview ?? '暂无消息预览。'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{conversation.agent_name}</div>
                      <div className="text-xs text-muted-foreground">{conversation.agent_code}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{conversation.user?.email ?? '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={conversationStatusTone(conversation.status)}>{conversationStatusLabel(conversation.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{conversation.message_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{conversation.feedback_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {conversation.last_run_status ? conversationRunStatusLabel(conversation.last_run_status) : '暂无'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(conversation.last_message_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/conversations/${conversation.id}`}>
                            <Eye className="size-4" />
                            查看
                          </Link>
                        </Button>
                        <Button disabled={!canWrite} onClick={() => setDeleteTarget(conversation)} size="sm" variant="outline">
                          <Trash2 className="size-4" />
                          归档
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

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会归档会话 ${deleteTarget.title}，但保留消息、运行记录和反馈。`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="归档会话？"
        />
      ) : null}
    </main>
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
            确认归档
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
