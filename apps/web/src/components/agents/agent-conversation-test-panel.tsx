'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AgentDetail, ConversationDetail, ConversationStreamEvent } from '@aiaget/shared-types';
import { ArrowUpRight, Plus, Send, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
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
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ApiClientError,
  createConversation,
  getConversation,
  streamConversationMessage,
} from '@/lib/api-client';

const STORAGE_KEY_PREFIX = 'aiaget:agent-test-conversation:';

export function AgentConversationTestPanel({
  agent,
  canWrite,
}: {
  agent: AgentDetail;
  canWrite: boolean;
}) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    setConversationId(readStoredConversationId(agent.id));
    setDraft('');
    setError(null);
    setIsStreaming(false);
  }, [agent.id]);

  const conversationQuery = useQuery({
    enabled: Boolean(conversationId),
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId ?? ''),
    retry: false,
  });

  useEffect(() => {
    if (!(conversationQuery.error instanceof ApiClientError)) {
      return;
    }

    if (conversationQuery.error.status !== 404 || !conversationId) {
      return;
    }

    clearStoredConversationId(agent.id);
    setConversationId(null);
  }, [agent.id, conversationId, conversationQuery.error]);

  const conversation = conversationQuery.data ?? null;
  const latestRun = conversation?.runs[0] ?? null;
  const assistantMessages = conversation?.messages.filter((message) => message.role === 'ASSISTANT') ?? [];
  const references = assistantMessages.flatMap((message) => message.references);
  const toolCalls = assistantMessages.flatMap((message) => message.tool_calls);
  const latestToolCall = toolCalls[0] ?? null;

  const summary = useMemo(() => {
    if (!conversation) {
      return [];
    }

    return [
      { label: '消息', value: `${conversation.message_count}`, helper: '当前测试线程' },
      { label: '运行', value: `${conversation.runs.length}`, helper: '已记录' },
      {
        label: '最近状态',
        value: latestRun ? conversationRunStatusLabel(latestRun.status) : '暂无',
        helper: latestRun?.request_model ?? '等待首次运行',
      },
    ];
  }, [conversation, latestRun]);

  const createMutation = useMutation({
    mutationFn: (message: string) =>
      createConversation({
        agent_id: agent.id,
        message,
        title: `测试 · ${agent.name}`,
      }),
    onSuccess: async (nextConversation) => {
      queryClient.setQueryData(['conversation', nextConversation.id], nextConversation);
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setConversationId(nextConversation.id);
      writeStoredConversationId(agent.id, nextConversation.id);
      setDraft('');
      setError(null);
    },
    onError: (nextError: ApiClientError) => setError(nextError.message),
  });

  function startConversation() {
    const message = draft.trim();
    if (!message) {
      setError('请输入要测试的消息。');
      return;
    }

    createMutation.mutate(message);
  }

  async function continueConversation() {
    const message = draft.trim();
    if (!message) {
      setError('请输入要继续发送的消息。');
      return;
    }

    if (!conversationId || !conversation) {
      startConversation();
      return;
    }

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
      id: 'temp-agent-test-assistant',
      role: 'ASSISTANT' as const,
      content: '',
      references: [],
      tool_calls: [],
      created_at: new Date().toISOString(),
      created_by: null,
    };

    queryClient.setQueryData<ConversationDetail | undefined>(['conversation', conversationId], (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        message_count: current.message_count + 2,
        messages: [...current.messages, temporaryUserMessage, temporaryAssistantMessage],
      };
    });

    setDraft('');
    setError(null);
    setIsStreaming(true);

    try {
      await streamConversationMessage(conversationId, { message }, {
        onEvent: (event) => handleStreamEvent(conversationId, event),
      });
    } catch (streamError) {
      setError(streamError instanceof ApiClientError ? streamError.message : '测试消息发送失败。');
      setIsStreaming(false);
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    }
  }

  function handleStreamEvent(activeConversationId: string, event: ConversationStreamEvent) {
    if (event.type === 'start') {
      return;
    }

    if (event.type === 'delta') {
      queryClient.setQueryData<ConversationDetail | undefined>(['conversation', activeConversationId], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          messages: current.messages.map((message) =>
            message.id === 'temp-agent-test-assistant'
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
      setError(event.message);
      setIsStreaming(false);
      void queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
      return;
    }

    queryClient.setQueryData(['conversation', activeConversationId], event.conversation);
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setIsStreaming(false);
  }

  function resetConversation() {
    clearStoredConversationId(agent.id);
    setConversationId(null);
    setDraft('');
    setError(null);
    setIsStreaming(false);
  }

  return (
    <Card className="self-start grid gap-4 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-muted-foreground" />
            会话测试
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            直接用当前智能体发起调试线程。优先走当前智能体绑定模型的真实执行链；如果没有可执行模型配置，则回退到确定性运行时。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {conversation ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/conversations/${conversation.id}`}>
                <ArrowUpRight className="size-4" />
                打开完整会话
              </Link>
            </Button>
          ) : null}
          <Button
            disabled={createMutation.isPending || isStreaming}
            onClick={resetConversation}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="size-4" />
            新建线程
          </Button>
        </div>
      </div>

      {conversationQuery.isLoading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          正在加载测试线程...
        </div>
      ) : null}

      {conversationQuery.isError && !conversation ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          测试线程加载失败，请重新创建一个新线程。
        </div>
      ) : null}

      {conversation ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={conversationStatusTone(conversation.status)}>
              {conversationStatusLabel(conversation.status)}
            </StatusBadge>
            {latestRun ? (
              <StatusBadge tone={conversationStatusTone(latestRun.status)}>
                {conversationRunStatusLabel(latestRun.status)}
              </StatusBadge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {conversation.title} · 最近更新 {formatDateTime(conversation.updated_at)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {summary.map((item) => (
              <div className="rounded-lg border border-border/70 bg-muted/15 px-3 py-3" key={item.label}>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-lg font-semibold">{item.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className="grid max-h-[320px] gap-3 overflow-auto pr-1">
            {conversation.messages.map((message) => (
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3" key={message.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {conversationMessageRoleLabel(message.role)}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              </div>
            ))}
          </div>

          {latestRun ? (
            <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">最近一次运行</div>
                <div className="text-xs text-muted-foreground">
                  延迟 {formatLatency(latestRun.latency_ms)} · 输入 {latestRun.prompt_tokens} · 输出 {latestRun.completion_tokens}
                </div>
              </div>
              {latestRun.cost_total ? (
                <div className="text-xs text-muted-foreground">总成本 {latestRun.cost_total.toFixed(6)}</div>
              ) : null}
              <div className="grid gap-2">
                {latestRun.steps.map((step) => (
                  <div className="rounded-md border bg-background/90 px-3 py-2" key={step.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{step.title}</span>
                      <span className="text-xs text-muted-foreground">{step.status}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        step.request_model ? `模型 ${step.request_model}` : null,
                        step.tool_name ? `工具 ${step.tool_name}` : null,
                        step.retrieval_mode ? `检索 ${step.retrieval_mode}` : null,
                        step.latency_ms !== undefined && step.latency_ms !== null ? `延迟 ${formatLatency(step.latency_ms)}` : null,
                        step.item_count !== undefined && step.item_count !== null ? `数量 ${step.item_count}` : null,
                        step.cost_total ? `成本 ${step.cost_total.toFixed(6)}` : null,
                      ].filter(Boolean).map((item) => (
                        <span className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {latestToolCall ? (
            <div className="rounded-lg border border-border/70 bg-muted/15 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldAlert className="size-4 text-muted-foreground" />
                工具调用摘要
              </div>
              <div className="mt-3 rounded-md border bg-background/90 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{latestToolCall.tool_name}</span>
                  <StatusBadge tone={conversationStatusTone(latestToolCall.status)}>
                    {conversationToolCallStatusLabel(latestToolCall.status)}
                  </StatusBadge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {latestToolCall.tool_code} ·{' '}
                  {latestToolCall.response_status ? `HTTP ${latestToolCall.response_status}` : '无响应码'} ·{' '}
                  {formatLatency(latestToolCall.latency_ms)}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {latestToolCall.output_preview ?? latestToolCall.error_message ?? '无附加输出。'}
                </p>
              </div>
              {latestToolCall.status === 'APPROVAL_REQUIRED' ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  当前线程触发了待审批工具调用，请在审批中心完成批准或拒绝。
                </div>
              ) : null}
              {latestToolCall.approval_request_id ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/approvals?requestId=${latestToolCall.approval_request_id}`}>
                      打开审批请求
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {references.length > 0 ? (
            <div className="rounded-lg border border-border/70 bg-muted/15 p-3">
              <div className="text-sm font-medium">引用线索</div>
              <div className="mt-3 grid gap-2">
                {references.slice(0, 3).map((reference) => (
                  <div className="rounded-md border bg-background/90 px-3 py-2" key={reference.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{reference.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {reference.score ? `分数 ${reference.score.toFixed(2)}` : '已注入'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{reference.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-6"
          description="发送一条真实消息，立即创建当前智能体的测试线程，并保留运行轨迹供后续排查。"
          title="还没有测试线程"
        />
      )}

      <textarea
        className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={!canWrite || createMutation.isPending || isStreaming || conversation?.status === 'ARCHIVED'}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={conversation ? '继续输入测试消息...' : '输入第一条测试消息...'}
        value={draft}
      />

      {createMutation.isPending ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          正在创建测试线程并生成首轮回复...
        </div>
      ) : null}

      {isStreaming ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          助手正在流式生成测试回复...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button
        disabled={!canWrite || createMutation.isPending || isStreaming || conversation?.status === 'ARCHIVED'}
        onClick={() => void continueConversation()}
        type="button"
      >
        <Send className="size-4" />
        {conversation ? '继续测试' : '开始测试'}
      </Button>
    </Card>
  );
}

function readStoredConversationId(agentId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${agentId}`);
}

function writeStoredConversationId(agentId: string, conversationId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${agentId}`, conversationId);
}

function clearStoredConversationId(agentId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${agentId}`);
}
