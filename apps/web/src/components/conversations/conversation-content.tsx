'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type ConversationDetail,
  type ConversationListItem,
  type ConversationStatus,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowRight, Eye, MessageSquareText, Plus, Search, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ConversationCenterBackground } from '@/components/conversations/conversation-center-background';
import { ConversationFormPanel, type ConversationFormValues } from '@/components/conversations/conversation-form-panel';
import {
  conversationMessageRoleLabel,
  conversationRunStatusLabel,
  conversationStatusLabel,
  conversationStatusTone,
  formatDateTime,
} from '@/components/conversations/conversation-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listAgents,
  listConversations,
  sendConversationMessage,
  type ApiClientError,
} from '@/lib/api-client';

const conversationStatuses: ConversationStatus[] = ['ACTIVE', 'ARCHIVED'];

export function ConversationContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConversationListItem | ConversationDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
  const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;

  const selectedConversationQuery = useQuery({
    enabled: Boolean(activeConversationId),
    queryKey: ['conversation', activeConversationId],
    queryFn: () => getConversation(activeConversationId ?? ''),
  });

  const selectedConversation = selectedConversationQuery.data ?? null;

  useEffect(() => {
    setReplyError(null);
  }, [activeConversationId]);

  const metrics = useMemo(() => {
    const messageCount = conversations.reduce((sum, item) => sum + item.message_count, 0);
    const activeCount = conversations.filter((item) => item.status === 'ACTIVE').length;
    const failedRuns = conversations.filter((item) => item.last_run_status === 'FAILED').length;
    const feedbackCount = conversations.reduce((sum, item) => sum + item.feedback_count, 0);

    return [
      { label: '会话', value: `${conversationsQuery.data?.total ?? 0}`, helper: '租户范围' },
      { label: '消息', value: `${messageCount}`, helper: '当前页' },
      { label: '进行中', value: `${activeCount}`, helper: '当前页' },
      { label: '反馈', value: `${feedbackCount}`, helper: `失败运行 ${failedRuns}` },
    ];
  }, [conversations, conversationsQuery.data?.total]);

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData(['conversation', conversation.id], conversation);
      setSelectedConversationId(conversation.id);
      setIsCreating(false);
      setFormError(null);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => sendConversationMessage(id, { message }),
    onSuccess: async (conversation) => {
      queryClient.setQueryData(['conversation', conversation.id], conversation);
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setReplyText('');
      setReplyError(null);
    },
    onError: (error: ApiClientError) => setReplyError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (deleteTarget?.id === selectedConversationId) {
        setSelectedConversationId(null);
      }
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function submitConversation(values: ConversationFormValues) {
    setFormError(null);
    createMutation.mutate({
      agent_id: values.agent_id,
      title: nullableText(values.title),
      message: values.message,
    });
  }

  function sendReply() {
    if (!activeConversationId) return;
    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError('请输入消息内容。');
      return;
    }

    sendMutation.mutate({ id: activeConversationId, message: trimmed });
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setAgentId('');
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ConversationCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M17</StatusBadge>
            <StatusBadge tone="healthy">真实会话</StatusBadge>
            <StatusBadge tone="healthy">真实模型</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">会话中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            浏览租户会话线程，继续与智能体对话，并查看真实模型运行轨迹、工具调用摘要和反馈。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite || agents.length === 0} onClick={() => setIsCreating(true)}>
          <Plus className="size-4" />
          新建会话
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">会话线程</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    搜索、筛选、继续会话，并进入完整运行详情。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {conversations.length} / {conversationsQuery.data?.total ?? 0}
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
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setAgentId(event.target.value)} value={agentId}>
                  <option value="">全部智能体</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
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

          {conversationsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">会话列表加载失败。</div>
          ) : conversationsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载会话...</div>
          ) : agents.length === 0 ? (
            <EmptyState description="当前没有可用的已发布智能体，无法创建会话。" title="暂无可用智能体" />
          ) : conversations.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={() => setIsCreating(true)}>
                  <Plus className="size-4" />
                  新建会话
                </Button>
              }
              description="选择一个智能体并发送首条消息，即可创建会话线程。"
              title="暂无会话"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['会话', '智能体', '用户', '状态', '消息', '最近运行', '最后消息时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={conversation.id}
                      transition={{ delay: index * 0.025, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <button className="grid max-w-sm gap-1 text-left" onClick={() => setSelectedConversationId(conversation.id)} type="button">
                          <span className="font-medium">{conversation.title}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {conversation.last_message_preview ?? '暂无消息预览。'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{conversation.agent_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{conversation.user?.email ?? '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={conversationStatusTone(conversation.status)}>{conversationStatusLabel(conversation.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{conversation.message_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {conversation.last_run_status ? conversationRunStatusLabel(conversation.last_run_status) : '暂无'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(conversation.last_message_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" title="打开详情" variant="outline">
                            <Link href={`/conversations/${conversation.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button disabled={!canWrite} onClick={() => setSelectedConversationId(conversation.id)} size="sm" title="继续会话" variant="outline">
                            <ArrowRight className="size-4" />
                          </Button>
                          <Button disabled={!canWrite} onClick={() => setDeleteTarget(conversation)} size="sm" title="归档" variant="outline">
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

        <ConversationQuickPanel
          canWrite={canWrite}
          conversation={selectedConversation}
          error={replyError}
          loading={selectedConversationQuery.isLoading}
          onChangeReply={setReplyText}
          onSend={sendReply}
          pending={sendMutation.isPending}
          replyText={replyText}
        />
      </section>

      {isCreating ? (
        <ConversationFormPanel
          agents={agents}
          error={formError}
          isPending={createMutation.isPending}
          onClose={() => {
            setFormError(null);
            setIsCreating(false);
          }}
          onSubmit={submitConversation}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会归档会话 ${deleteTarget.title}，但保留消息、运行记录和反馈。`}
          pending={deleteMutation.isPending}
          title="归档会话？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function ConversationQuickPanel({
  canWrite,
  conversation,
  error,
  loading,
  onChangeReply,
  onSend,
  pending,
  replyText,
}: {
  canWrite: boolean;
  conversation: ConversationDetail | null;
  error: string | null;
  loading: boolean;
  onChangeReply: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  replyText: string;
}) {
  if (loading) {
    return (
      <Card className="min-w-0 p-5">
        <div className="text-sm text-muted-foreground">正在加载选中会话...</div>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="min-w-0 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquareText className="size-4" />
          选中的会话
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          选择一条会话后，可继续发送消息并查看最近回复摘要。
        </p>
      </Card>
    );
  }

  const latestMessages = conversation.messages.slice(-4);
  const latestRun = conversation.runs[0] ?? null;

  return (
    <Card className="grid min-w-0 gap-5 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={conversationStatusTone(conversation.status)}>{conversationStatusLabel(conversation.status)}</StatusBadge>
          {latestRun ? (
            <StatusBadge tone={conversationStatusTone(latestRun.status)}>{conversationRunStatusLabel(latestRun.status)}</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-3 text-base font-semibold">{conversation.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{conversation.agent_name}</p>
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-semibold">最近消息</h3>
        {latestMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无消息。</p>
        ) : (
          latestMessages.map((message) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={message.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{conversationMessageRoleLabel(message.role)}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
              </div>
              <p className="mt-2 text-sm leading-6">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-3">
        <textarea
          className="min-h-32 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangeReply(event.target.value)}
          placeholder="继续输入消息..."
          value={replyText}
        />
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <Button disabled={!canWrite || pending || conversation.status === 'ARCHIVED'} onClick={onSend} type="button">
          <Send className="size-4" />
          继续会话
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={`/conversations/${conversation.id}`}>
            <Eye className="size-4" />
            打开完整详情
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ConfirmDialog({
  body,
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} variant="destructive">
            归档
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
