'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  defaultResourceAclDraft,
  parseResourceAclConditions,
  ResourceAclFeedback,
  ResourceAclOptionSelector,
  ResourceAclPageHeader,
  ResourceAclPermissionNotice,
  ResourceAclRuleFields,
  type ResourceAclDraft,
  useCanManageResourceAcl,
  validateResourceAclDraft,
} from '@/components/resource-acls/resource-acl-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createResourceAcl, listResourceAclOptions, type ApiClientError } from '@/lib/api-client';

export function ResourceAclCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canWrite = useCanManageResourceAcl();
  const [draft, setDraft] = useState<ResourceAclDraft>({
    ...defaultResourceAclDraft,
    permission_code: 'agent:agent:view',
  });
  const [optionKeyword, setOptionKeyword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ['resource-acl-options', draft.resource_type, draft.subject_type, optionKeyword],
    queryFn: () =>
      listResourceAclOptions({
        resource_type: draft.resource_type,
        subject_type: draft.subject_type,
        keyword: optionKeyword,
      }),
  });

  const resources = useMemo(() => optionsQuery.data?.resources ?? [], [optionsQuery.data?.resources]);
  const subjects = useMemo(() => optionsQuery.data?.subjects ?? [], [optionsQuery.data?.subjects]);
  const permissions = useMemo(() => optionsQuery.data?.permissions ?? [], [optionsQuery.data?.permissions]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      resource_id: current.resource_id || resources[0]?.id || '',
      subject_id: current.subject_id || subjects[0]?.id || '',
      permission_code: permissions.includes(current.permission_code) ? current.permission_code : permissions[0] ?? '',
    }));
  }, [permissions, resources, subjects]);

  const createMutation = useMutation({
    mutationFn: createResourceAcl,
    onSuccess: async (acl) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['resource-acls'] }),
        queryClient.invalidateQueries({ queryKey: ['resource-acl-overview'] }),
      ]);
      queryClient.setQueryData(['resource-acl', acl.id], acl);
      router.push('/resource-acls');
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function patchDraft(patch: Partial<ResourceAclDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setFormError(null);
  }

  function submit() {
    const validationError = validateResourceAclDraft(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const conditions = parseResourceAclConditions(draft.conditions_text);
    if (conditions instanceof Error) {
      setFormError(conditions.message);
      return;
    }

    createMutation.mutate({
      resource_type: draft.resource_type,
      resource_id: draft.resource_id,
      subject_type: draft.subject_type,
      subject_id: draft.subject_id,
      permission_code: draft.permission_code,
      effect: draft.effect,
      status: draft.status,
      conditions,
    });
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <ResourceAclPageHeader
        actions={
          <Button asChild type="button" variant="outline">
            <Link href="/resource-acls">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
        }
        eyebrow="新增页"
        title="新建资源授权"
      />

      <ResourceAclPermissionNotice canWrite={canWrite} />
      <ResourceAclFeedback error={formError} />

      {!canWrite ? (
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">
          当前账号没有新建资源授权权限。
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[0.95fr_0.85fr]">
          <ResourceAclOptionSelector
            draft={draft}
            loading={optionsQuery.isLoading}
            mode="create"
            onDraftPatch={patchDraft}
            onKeywordChange={setOptionKeyword}
            onResourceTypeChange={(resourceType) =>
              setDraft((current) => ({
                ...current,
                resource_type: resourceType,
                resource_id: '',
                permission_code: '',
              }))
            }
            onSubjectTypeChange={(subjectType) =>
              setDraft((current) => ({
                ...current,
                subject_type: subjectType,
                subject_id: '',
              }))
            }
            optionKeyword={optionKeyword}
            permissions={permissions}
            resources={resources}
            subjects={subjects}
          />
          <Card className="grid gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4">
	            <div>
	              <h2 className="text-sm font-semibold">授权规则</h2>
	            </div>
            <ResourceAclRuleFields draft={draft} onDraftPatch={patchDraft} />
            <Button disabled={createMutation.isPending} onClick={submit} type="button">
              <Save className="size-4" />
              保存授权
            </Button>
          </Card>
        </section>
      )}
    </main>
  );
}
