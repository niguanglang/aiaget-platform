'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KnowledgeSourceType } from '@aiaget/shared-types';
import Link from 'next/link';

import {
  KnowledgeDocumentFormPanel,
  type KnowledgeDocumentFormValues,
} from '@/components/knowledge/knowledge-document-form-panel';
import {
  KnowledgeWorkspaceHeader,
  PageMessage,
  RefreshButton,
  useKnowledgeWritePermission,
} from '@/components/knowledge/knowledge-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getKnowledgeBase, uploadKnowledgeDocument, type ApiClientError } from '@/lib/api-client';

export function KnowledgeUploadContent({ knowledgeId }: { knowledgeId: string }) {
  const queryClient = useQueryClient();
  const canWrite = useKnowledgeWritePermission();
  const baseQuery = useQuery({
    queryKey: ['knowledge-base', knowledgeId],
    queryFn: () => getKnowledgeBase(knowledgeId),
  });
  const base = baseQuery.data ?? null;

  const uploadMutation = useMutation({
    mutationFn: (values: KnowledgeDocumentFormValues) =>
      uploadKnowledgeDocument(knowledgeId, {
        title: values.title,
        source_type: values.source_type,
        content: values.content,
        file_name: nullableText(values.file_name),
        mime_type: mimeTypeForSource(values.source_type),
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(['knowledge-base', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
    },
  });

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <KnowledgeWorkspaceHeader
	        actions={<RefreshButton loading={baseQuery.isFetching} onClick={() => void baseQuery.refetch()} />}
	        base={base}
	        eyebrow="上传文档"
	        title={base ? `${base.name} / 上传文档` : '上传文档'}
	      />

      {!canWrite ? <PageMessage tone="error" value="当前账号没有上传文档权限。" /> : null}
      {uploadMutation.isError ? <PageMessage tone="error" value={(uploadMutation.error as ApiClientError).message} /> : null}
	      {uploadMutation.isSuccess ? <PageMessage tone="success" value="文档已提交处理。" /> : null}

      <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <KnowledgeDocumentFormPanel
          error={uploadMutation.isError ? (uploadMutation.error as ApiClientError).message : null}
          isPending={uploadMutation.isPending}
          onClose={() => undefined}
          presentation="page"
          onSubmit={(values) => {
            if (!canWrite) return;
            uploadMutation.mutate(values);
          }}
        />
      </Card>

	      <div className="flex flex-wrap gap-2">
	        <Button asChild variant="outline">
	          <Link href={`/knowledge/${knowledgeId}/documents`}>文档管理</Link>
	        </Button>
	      </div>
    </main>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mimeTypeForSource(sourceType: KnowledgeSourceType) {
  if (sourceType === 'MARKDOWN') return 'text/markdown';
  if (sourceType === 'HTML') return 'text/html';
  return 'text/plain';
}
