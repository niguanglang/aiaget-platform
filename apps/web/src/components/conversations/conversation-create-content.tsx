'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ConversationFormPanel, type ConversationFormValues } from '@/components/conversations/conversation-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createConversation, listAgents, type ApiClientError } from '@/lib/api-client';

export function ConversationCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'conversation:chat:manage'),
  );

  const agentsQuery = useQuery({
    queryKey: ['conversation-agents'],
    queryFn: () =>
      listAgents({
        page: 1,
        page_size: 100,
        status: 'PUBLISHED',
      }),
  });

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData(['conversation', conversation.id], conversation);
      router.push(`/conversations/${conversation.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const agents = agentsQuery.data?.items ?? [];

  function submitConversation(values: ConversationFormValues) {
    setFormError(null);
    createMutation.mutate({
      agent_id: values.agent_id,
      title: nullableText(values.title),
      message: values.message,
    });
  }

  return (
    <main className="grid gap-6 px-4 py-6 lg:px-6">

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/conversations">
              <ArrowLeft className="size-4" />
              会话中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新建</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可发起' : '只读权限'}</StatusBadge>
            <StatusBadge tone={agents.length > 0 ? 'healthy' : 'degraded'}>
              {agents.length > 0 ? '已有已发布智能体' : '无可用智能体'}
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建会话</h1>
        </div>
      </section>

      {agentsQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载智能体...</div>
      ) : agentsQuery.isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">智能体加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建会话权限。
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前没有已发布智能体，请先发布 Agent 后再创建会话。
        </div>
      ) : (
        <ConversationFormPanel
          agents={agents}
          error={formError}
          isPending={createMutation.isPending}
          onClose={() => router.push('/conversations')}
          onSubmit={submitConversation}
          presentation="page"
        />
      )}
    </main>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
