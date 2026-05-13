'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { ResourceAclCheckResult } from '@aiaget/shared-types';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ResourceAclBackground } from '@/components/resource-acls/resource-acl-background';
import {
  defaultResourceAclDraft,
  ResourceAclCheckResultPanel,
  ResourceAclFeedback,
  ResourceAclOptionSelector,
  ResourceAclPageHeader,
  type ResourceAclDraft,
  validateResourceAclDraft,
} from '@/components/resource-acls/resource-acl-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { checkResourceAcl, listResourceAclOptions, type ApiClientError } from '@/lib/api-client';

export function ResourceAclCheckContent() {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<ResourceAclDraft>({
    ...defaultResourceAclDraft,
    resource_type: (searchParams.get('resource_type') as ResourceAclDraft['resource_type'] | null) ?? 'AGENT',
    resource_id: searchParams.get('resource_id') ?? '',
    subject_type: (searchParams.get('subject_type') as ResourceAclDraft['subject_type'] | null) ?? 'ROLE',
    subject_id: searchParams.get('subject_id') ?? '',
    permission_code: searchParams.get('permission_code') ?? 'agent:agent:view',
  });
  const [optionKeyword, setOptionKeyword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<ResourceAclCheckResult | null>(null);

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

  const checkMutation = useMutation({
    mutationFn: checkResourceAcl,
    onSuccess: (nextResult) => {
      setResult(nextResult);
      setFormError(null);
    },
    onError: (error: ApiClientError) => {
      setResult(null);
      setFormError(error.message);
    },
  });

  function patchDraft(patch: Partial<ResourceAclDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setFormError(null);
    setResult(null);
  }

  function runCheck() {
    const validationError = validateResourceAclDraft(draft);
    if (validationError) {
      setFormError(validationError);
      setResult(null);
      return;
    }

    checkMutation.mutate({
      resource_type: draft.resource_type,
      resource_id: draft.resource_id,
      subject_type: draft.subject_type,
      subject_id: draft.subject_id,
      permission_code: draft.permission_code,
    });
  }

  return (
    <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:px-6">
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
        eyebrow="权限校验"
        title="资源访问权限校验"
      />

      <ResourceAclFeedback error={formError} />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_0.85fr]">
        <ResourceAclOptionSelector
          draft={draft}
          loading={optionsQuery.isLoading}
          mode="check"
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
        <Card className="grid content-start gap-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">检查结果</h2>
            <p className="mt-1 text-sm text-muted-foreground">权限校验不会创建或修改任何授权规则。</p>
          </div>
          <Button disabled={checkMutation.isPending} onClick={runCheck} type="button">
            <Search className="size-4" />
            运行检查
          </Button>
          <ResourceAclCheckResultPanel result={result} />
        </Card>
      </section>
    </main>
  );
}
