'use client';

import { hasPermission, type ConversationDetail } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { conversationRunStatusLabel } from '@/components/conversations/conversation-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ApiClientError,
  createConversationFeedback,
  deleteConversation,
  getConversation,
} from '@/lib/api-client';

import { ConversationConfirmDialog } from './conversation-confirm-dialog';
import { ConversationDetailHeader } from './conversation-detail-header';
import { ConversationFeedbackCard } from './conversation-feedback-card';
import { ConversationMessageStreamCard } from './conversation-message-stream-card';
import { ConversationReferenceToolsCard } from './conversation-reference-tools-card';
import { ConversationRunTraceCard } from './conversation-run-trace-card';
import { useConversationStream } from './use-conversation-stream';

export function ConversationDetailContent({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConversationDetail | null>(null);

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
  const {
    isStreaming,
    replyError,
    sendReplyStream,
    setReplyError,
  } = useConversationStream({
    conversation,
    conversationId,
    currentUser,
    queryClient,
  });

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

    setReplyText('');
    void sendReplyStream(trimmed);
  }

  if (conversationQuery.isLoading) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载会话详情...</div>
        </Card>
      </main>
    );
  }

  if (conversationQuery.isError || !conversation) {
    return (
      <main className="grid gap-4 px-4 py-6 lg:px-6">
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
    <main className="grid gap-6 px-4 py-6 lg:px-6">

      <ConversationDetailHeader
        canWrite={canWrite}
        conversation={conversation}
        latestRun={latestRun}
        onArchive={() => setDeleteTarget(conversation)}
      />

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

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ConversationMessageStreamCard
          canWrite={canWrite}
          conversation={conversation}
          error={replyError}
          isStreaming={isStreaming}
          onChangeReply={setReplyText}
          onSend={sendReply}
          pending={isStreaming}
          replyText={replyText}
        />
        <ConversationRunTraceCard runs={conversation.runs} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConversationFeedbackCard
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
        <ConversationReferenceToolsCard conversation={conversation} />
      </section>

      {deleteTarget ? (
        <ConversationConfirmDialog
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

function StatTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
