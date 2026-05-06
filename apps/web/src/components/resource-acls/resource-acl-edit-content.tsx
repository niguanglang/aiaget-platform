'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ResourceAclBackground } from '@/components/resource-acls/resource-acl-background';
import {
  draftFromResourceAcl,
  parseResourceAclConditions,
  PermissionSelect,
  ResourceAclFeedback,
  ResourceAclImmutableRuleSummary,
  ResourceAclPageHeader,
  ResourceAclPermissionNotice,
  ResourceAclRuleFields,
  type ResourceAclDraft,
  useCanManageResourceAcl,
  validateResourceAclDraft,
} from '@/components/resource-acls/resource-acl-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getResourceAcl, listResourceAclOptions, updateResourceAcl, type ApiClientError } from '@/lib/api-client';

export function ResourceAclEditContent({ resourceAclId }: { resourceAclId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canWrite = useCanManageResourceAcl();
  const [draft, setDraft] = useState<ResourceAclDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const aclQuery = useQuery({
    queryKey: ['resource-acl', resourceAclId],
    queryFn: () => getResourceAcl(resourceAclId),
  });
  const acl = aclQuery.data ?? null;

  const optionsQuery = useQuery({
    enabled: Boolean(acl),
    queryKey: ['resource-acl-options', acl?.resource_type, acl?.subject_type, 'edit'],
    queryFn: () =>
      listResourceAclOptions({
        resource_type: acl?.resource_type,
        subject_type: acl?.subject_type,
      }),
  });
  const permissions = useMemo(() => optionsQuery.data?.permissions ?? [], [optionsQuery.data?.permissions]);

  useEffect(() => {
    if (!acl) return;
    setDraft(draftFromResourceAcl(acl));
  }, [acl]);

  const updateMutation = useMutation({
    mutationFn: ({ values }: { values: ResourceAclDraft }) => {
      const conditions = parseResourceAclConditions(values.conditions_text);
      if (conditions instanceof Error) throw conditions;

      return updateResourceAcl(resourceAclId, {
        permission_code: values.permission_code,
        effect: values.effect,
        status: values.status,
        conditions,
      });
    },
    onSuccess: async (updatedAcl) => {
      queryClient.setQueryData(['resource-acl', updatedAcl.id], updatedAcl);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['resource-acls'] }),
        queryClient.invalidateQueries({ queryKey: ['resource-acl-overview'] }),
      ]);
      router.push('/resource-acls');
    },
    onError: (error: ApiClientError | Error) => setFormError(error.message),
  });

  function patchDraft(patch: Partial<ResourceAclDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setFormError(null);
  }

  function submit() {
    if (!draft) return;
    const validationError = validateResourceAclDraft(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    updateMutation.mutate({ values: draft });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <ResourceAclBackground />

      <ResourceAclPageHeader
        actions={
          <Button asChild type="button" variant="outline">
            <Link href="/resource-acls">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
        }
        description="编辑已有资源授权规则。资源与主体由创建时确定，编辑页只开放后端支持更新的字段。"
        eyebrow="编辑页"
        title="编辑资源授权"
      />

      <ResourceAclPermissionNotice canWrite={canWrite} />
      <ResourceAclFeedback error={formError} />

      {aclQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载资源授权...</Card>
      ) : !acl || !draft ? (
        <Card className="p-6 text-sm text-muted-foreground">未找到资源授权规则。</Card>
      ) : (
        <section className="grid gap-4">
          <ResourceAclImmutableRuleSummary acl={acl} />
          <Card className="grid gap-4 p-4">
            <div>
              <h2 className="text-sm font-semibold">可编辑字段</h2>
              <p className="mt-1 text-sm text-muted-foreground">资源类型、资源 ID、主体类型和主体 ID 不会提交到更新接口。</p>
            </div>
            <PermissionSelect
              disabled={!canWrite}
              onChange={(permissionCode) => patchDraft({ permission_code: permissionCode })}
              permissions={permissions}
              value={draft.permission_code}
            />
            <ResourceAclRuleFields disabled={!canWrite} draft={draft} onDraftPatch={patchDraft} />
            <Button disabled={!canWrite || updateMutation.isPending} onClick={submit} type="button">
              <Save className="size-4" />
              保存修改
            </Button>
          </Card>
        </section>
      )}
    </main>
  );
}
