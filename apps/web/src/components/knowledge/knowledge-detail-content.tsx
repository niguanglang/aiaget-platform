'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KnowledgeBaseDetail } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Database, Edit, FileText, FileUp, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import { formatDateTime } from '@/components/knowledge/knowledge-status';
import {
  ConfirmDialog,
  KnowledgeWorkspaceHeader,
  PageMessage,
  RefreshButton,
  SummaryTile,
  useKnowledgeWritePermission,
} from '@/components/knowledge/knowledge-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { getKnowledgeBase, deleteKnowledgeBase, type ApiClientError } from '@/lib/api-client';

export function KnowledgeDetailContent({ knowledgeId }: { knowledgeId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const canWrite = useKnowledgeWritePermission();
  const [deleteBaseTarget, setDeleteBaseTarget] = useState<KnowledgeBaseDetail | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const baseQuery = useQuery({
    queryKey: ['knowledge-base', knowledgeId],
    queryFn: () => getKnowledgeBase(knowledgeId),
  });
  const base = baseQuery.data ?? null;

  const metrics = useMemo(() => {
    if (!base) return [];

	    return [
	      { label: '文档', value: `${base.document_count}`, helper: '文档' },
	      { label: '切片', value: `${base.segment_count}`, helper: '切片' },
	      { label: '召回日志', value: `${base.recall_count}`, helper: '日志' },
	      { label: '智能体', value: `${base.agent_reference_count}`, helper: '引用' },
	    ];
  }, [base]);

  const deleteBaseMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      setDeleteBaseTarget(null);
      router.push('/knowledge');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  if (baseQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载知识库...</div>
        </Card>
      </main>
    );
  }

  if (baseQuery.isError || !base) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-destructive">知识库加载失败。</div>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/knowledge">返回知识库</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />

      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <KnowledgeWorkspaceHeader
          actions={
            <>
              <RefreshButton loading={baseQuery.isFetching} onClick={() => void baseQuery.refetch()} />
              <Button asChild variant="outline">
                <Link href={`/knowledge/${knowledgeId}/edit`}>
                  <Edit className="size-4" />
                  编辑
                </Link>
              </Button>
              <Button disabled={!canWrite} onClick={() => setDeleteBaseTarget(base)} type="button" variant="destructive">
                <Trash2 className="size-4" />
                删除
              </Button>
            </>
	          }
	          base={base}
	          eyebrow="知识库详情"
	          title={base.name}
	        />
      </motion.div>

      {actionError ? <PageMessage tone="error" value={actionError} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="grid gap-4 p-5">
          <h2 className="text-sm font-semibold">基础信息</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryTile label="编码" value={base.code} />
            <SummaryTile label="负责人" value={base.owner?.name ?? '-'} />
            <SummaryTile label="失败任务" value={`${base.failed_task_count}`} />
            <SummaryTile label="更新时间" value={formatDateTime(base.updated_at)} />
          </div>
        </Card>

        <Card className="grid gap-4 p-5">
          <h2 className="text-sm font-semibold">操作入口</h2>
	          <div className="grid gap-3 md:grid-cols-3">
	            <OperationEntry
	              href={`/knowledge/${knowledgeId}/documents`}
	              icon={FileText}
	              title="文档管理"
	            />
	            <OperationEntry
	              href={`/knowledge/${knowledgeId}/upload`}
	              icon={FileUp}
	              title="上传文档"
	            />
	            <OperationEntry
	              href={`/knowledge/${knowledgeId}/retrieval`}
	              icon={Search}
	              title="检索测试"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AgentReferencesCard base={base} />
        <Card className="grid gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4" />
            索引概览
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryTile label="文档数" value={`${base.document_count}`} />
            <SummaryTile label="切片数" value={`${base.segment_count}`} />
            <SummaryTile label="召回日志" value={`${base.recall_count}`} />
            <SummaryTile label="最近更新" value={formatDateTime(base.updated_at)} />
          </div>
        </Card>
      </section>

      {deleteBaseTarget ? (
	        <ConfirmDialog
	          body={`这会归档 ${deleteBaseTarget.name}，并保留审计记录。`}
	          confirmLabel="删除"
          pending={deleteBaseMutation.isPending}
          title="删除知识库？"
          onCancel={() => setDeleteBaseTarget(null)}
          onConfirm={() => deleteBaseMutation.mutate(deleteBaseTarget.id)}
        />
      ) : null}
    </main>
  );
}

function OperationEntry({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: typeof FileText;
  title: string;
}) {
  return (
    <Button asChild className="h-auto justify-start p-0" variant="outline">
      <Link className="grid gap-2 p-4 text-left" href={href}>
	        <span className="flex items-center gap-2 text-sm font-semibold">
	          <Icon className="size-4 text-primary" />
	          {title}
	        </span>
	      </Link>
    </Button>
  );
}

function AgentReferencesCard({ base }: { base: KnowledgeBaseDetail }) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">智能体引用</h2>
      {base.agent_references.length === 0 ? (
	        <EmptyState className="py-4" title="暂无引用" />
      ) : (
        <div className="grid gap-3">
          {base.agent_references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · 权重 {reference.weight} · 召回前 {reference.recall_top_k}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
