'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type ConversationDetail,
  type ConversationRunItem,
  type ConversationStreamEvent,
} from '@aiaget/shared-types';
import { ArrowLeft, MessageSquareText, Send, ShieldAlert, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ConversationCenterBackground } from '@/components/conversations/conversation-center-background';
import {
  conversationMessageRoleLabel,
  conversationRunStatusLabel,
  conversationStatusLabel,
  conversationStatusTone,
  conversationToolCallStatusLabel,
  formatDateTime,
  formatLatency,
} from '@/components/conversations/conversation-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ApiClientError,
  createConversationFeedback,
  deleteConversation,
  getConversation,
  streamConversationMessage,
} from '@/lib/api-client';

export function ConversationDetailContent({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConversationDetail | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'conversation:chat:manage'),
  );

  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  const conversation = conversationQuery.data ?? null;
  const latestRun = conversation?.runs[0] ?? null;

  const metrics = useMemo(() => {
    if (!conversation) return [];

    return [
      { label: '消息', value: `${conversation.message_count}`, helper: '当前线程' },
      { label: '运行', value: `${conversation.runs.length}`, helper: '最近记录' },
      { label: '反馈', value: `${conversation.feedback.length}`, helper: '当前线程' },
      { label: '最近状态', value: latestRun ? conversationRunStatusLabel(latestRun.status) : '暂无', helper: '最近一次运行' },
    ];
  }, [conversation, latestRun]);

  const feedbackMutation = useMutation({
    mutationFn: () =>
      createConversationFeedback(conversationId, {
        run_id: latestRun?.id ?? null,
        rating: feedbackRating,
        comment: feedbackText.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      setFeedbackText('');
      setFeedbackError(null);
    },
    onError: (error: ApiClientError) => setFeedbackError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push('/conversations');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function sendReply() {
    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError('请输入消息内容。');
      return;
    }

    void sendReplyStream(trimmed);
  }

  async function sendReplyStream(message: string) {
    if (!conversation) return;

    const temporaryUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'USER' as const,
      content: message,
      references: [],
      tool_calls: [],
      created_at: new Date().toISOString(),
      created_by: currentUser?.user
        ? {
            id: currentUser.user.id,
            name: currentUser.user.name,
            email: currentUser.user.email,
          }
        : null,
    };
    const temporaryAssistantMessage = {
      id: 'temp-assistant-stream',
      role: 'ASSISTANT' as const,
      content: '',
      references: [],
      tool_calls: [],
      created_at: new Date().toISOString(),
      created_by: null,
    };

    queryClient.setQueryData<ConversationDetail | undefined>(['conversation', conversationId], (current) => {
      if (!current) return current;

      return {
        ...current,
        message_count: current.message_count + 2,
        messages: [...current.messages, temporaryUserMessage, temporaryAssistantMessage],
      };
    });

    setReplyText('');
    setReplyError(null);
    setIsStreaming(true);

    try {
      await streamConversationMessage(conversationId, { message }, {
        onEvent: (event) => handleStreamEvent(event),
      });
    } catch (error) {
      setReplyError(error instanceof ApiClientError ? error.message : '流式回复失败。');
      setIsStreaming(false);
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    }
  }

  function handleStreamEvent(event: ConversationStreamEvent) {
    if (event.type === 'start') {
      return;
    }

    if (event.type === 'delta') {
      queryClient.setQueryData<ConversationDetail | undefined>(['conversation', conversationId], (current) => {
        if (!current) return current;

        return {
          ...current,
          messages: current.messages.map((message) =>
            message.id === 'temp-assistant-stream'
              ? {
                  ...message,
                  content: `${message.content}${event.delta}`,
                }
              : message,
          ),
        };
      });
      return;
    }

    if (event.type === 'error') {
      setReplyError(event.message);
      setIsStreaming(false);
      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      return;
    }

    queryClient.setQueryData(['conversation', conversationId], event.conversation);
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setIsStreaming(false);
  }

  if (conversationQuery.isLoading) {
    return (
      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <ConversationCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载会话详情...</div>
        </Card>
      </main>
    );
  }

  if (conversationQuery.isError || !conversation) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <ConversationCenterBackground />
        <Button asChild className="w-fit" variant="outline">
          <Link href="/conversations">
            <ArrowLeft className="size-4" />
            返回会话中心
          </Link>
        </Button>
        <Card className="p-6">
          <div className="text-sm text-destructive">会话详情加载失败。</div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ConversationCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/conversations">
              <ArrowLeft className="size-4" />
              会话中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={conversationStatusTone(conversation.status)}>{conversationStatusLabel(conversation.status)}</StatusBadge>
            {latestRun ? (
              <StatusBadge tone={conversationStatusTone(latestRun.status)}>{conversationRunStatusLabel(latestRun.status)}</StatusBadge>
            ) : null}
          </div>
          <h1 className="break-words text-2xl font-semibold">{conversation.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {conversation.agent_name} · {conversation.user?.email ?? '-'}
          </p>
        </div>
        <Button disabled={!canWrite} onClick={() => setDeleteTarget(conversation)} variant="destructive">
          <Trash2 className="size-4" />
          归档会话
        </Button>
      </section>

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

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <MessageStreamCard
          canWrite={canWrite}
          conversation={conversation}
          error={replyError}
          isStreaming={isStreaming}
          onChangeReply={setReplyText}
          onSend={sendReply}
          pending={isStreaming}
          replyText={replyText}
        />
        <RunTraceCard runs={conversation.runs} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <FeedbackCard
          canWrite={canWrite}
          conversation={conversation}
          error={feedbackError}
          feedbackRating={feedbackRating}
          feedbackText={feedbackText}
          onChangeRating={setFeedbackRating}
          onChangeText={setFeedbackText}
          onSubmit={() => feedbackMutation.mutate()}
          pending={feedbackMutation.isPending}
        />
        <ReferenceAndToolsCard conversation={conversation} />
      </section>

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

function MessageStreamCard({
  canWrite,
  conversation,
  error,
  isStreaming,
  onChangeReply,
  onSend,
  pending,
  replyText,
}: {
  canWrite: boolean;
  conversation: ConversationDetail;
  error: string | null;
  isStreaming: boolean;
  onChangeReply: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  replyText: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquareText className="size-4" />
        消息流
      </div>

      <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
        {conversation.messages.map((message) => (
          <div className="rounded-md border bg-muted/20 px-3 py-3" key={message.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{conversationMessageRoleLabel(message.role)}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          </div>
        ))}
      </div>

      <textarea
        className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={!canWrite || conversation.status === 'ARCHIVED'}
        onChange={(event) => onChangeReply(event.target.value)}
        placeholder="继续输入消息..."
        value={replyText}
      />
      {isStreaming ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          助手正在流式生成回复...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button disabled={!canWrite || pending || conversation.status === 'ARCHIVED'} onClick={onSend} type="button">
        <Send className="size-4" />
        继续会话
      </Button>
    </Card>
  );
}

function RunTraceCard({ runs }: { runs: ConversationRunItem[] }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">运行轨迹</h2>
      {runs.length === 0 ? (
        <EmptyState description="发送消息后会在这里看到最近运行轨迹。" title="暂无运行记录" />
      ) : (
        <div className="grid max-h-[620px] gap-4 overflow-auto pr-1">
          {runs.map((run) => (
            <div className="rounded-md border bg-muted/20 p-3" key={run.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={conversationStatusTone(run.status)}>{conversationRunStatusLabel(run.status)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{run.request_model ?? '未返回模型标识'}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(run.created_at)}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>延迟 {formatLatency(run.latency_ms)}</span>
                <span>输入 {run.prompt_tokens}</span>
                <span>输出 {run.completion_tokens}</span>
              </div>
              {run.cost_total ? (
                <div className="mt-1 text-xs text-muted-foreground">总成本 {run.cost_total.toFixed(6)}</div>
              ) : null}
              {run.error_message ? <p className="mt-2 text-xs text-destructive">{run.error_message}</p> : null}
              <div className="mt-3 grid gap-2">
                {run.steps.map((step) => (
                  <div className="rounded-md border bg-background px-3 py-2" key={step.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{step.title}</span>
                      <span className="text-xs text-muted-foreground">{step.status}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.summary}</p>
                    <StepMetaRow step={step} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StepMetaRow({ step }: { step: ConversationRunItem['steps'][number] }) {
  const items = [
    step.request_model ? `模型 ${step.request_model}` : null,
    step.tool_name ? `工具 ${step.tool_name}` : null,
    step.retrieval_mode ? `检索 ${step.retrieval_mode}` : null,
    step.response_status ? `HTTP ${step.response_status}` : null,
    step.item_count !== undefined && step.item_count !== null ? `数量 ${step.item_count}` : null,
    step.latency_ms !== undefined && step.latency_ms !== null ? `延迟 ${formatLatency(step.latency_ms)}` : null,
    step.prompt_tokens !== undefined && step.prompt_tokens !== null ? `输入 ${step.prompt_tokens}` : null,
    step.completion_tokens !== undefined && step.completion_tokens !== null ? `输出 ${step.completion_tokens}` : null,
    step.cost_total ? `成本 ${step.cost_total.toFixed(6)}` : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function FeedbackCard({
  canWrite,
  conversation,
  error,
  feedbackRating,
  feedbackText,
  onChangeRating,
  onChangeText,
  onSubmit,
  pending,
}: {
  canWrite: boolean;
  conversation: ConversationDetail;
  error: string | null;
  feedbackRating: number;
  feedbackText: string;
  onChangeRating: (value: number) => void;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">反馈</h2>
      <div className="grid gap-3">
        <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChangeRating(Number(event.target.value))} value={feedbackRating}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} 分
            </option>
          ))}
        </select>
        <textarea
          className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangeText(event.target.value)}
          placeholder="记录本轮会话质量、结果准确性或后续建议..."
          value={feedbackText}
        />
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <Button disabled={!canWrite || pending} onClick={onSubmit} type="button">
          提交反馈
        </Button>
      </div>
      <div className="grid gap-3">
        {conversation.feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无反馈记录。</p>
        ) : (
          conversation.feedback.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.rating} 分</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.comment ?? '无附加说明。'}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ReferenceAndToolsCard({ conversation }: { conversation: ConversationDetail }) {
  const assistantMessages = conversation.messages.filter((message) => message.role === 'ASSISTANT');
  const references = assistantMessages.flatMap((message) => message.references);
  const toolCalls = assistantMessages.flatMap((message) => message.tool_calls);

  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">引用与工具调用</h2>

      <div className="grid gap-3">
        <div className="text-sm font-medium">引用</div>
        {references.length === 0 ? (
          <p className="text-sm text-muted-foreground">当前会话暂无引用线索。</p>
        ) : (
          references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.title}</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{reference.snippet}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="size-4" />
          工具调用摘要
        </div>
        {toolCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">当前会话暂无工具调用。</p>
        ) : (
          toolCalls.map((toolCall, index) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${toolCall.tool_code}-${index}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{toolCall.tool_name}</span>
                <StatusBadge tone={conversationStatusTone(toolCall.status)}>{conversationToolCallStatusLabel(toolCall.status)}</StatusBadge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {toolCall.tool_code} · {toolCall.response_status ? `HTTP ${toolCall.response_status}` : '无状态'} · {formatLatency(toolCall.latency_ms)}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {toolCall.output_preview ?? toolCall.error_message ?? '无附加输出。'}
              </p>
              {toolCall.approval_request_id ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/approvals?requestId=${toolCall.approval_request_id}`}>打开审批请求</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
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
