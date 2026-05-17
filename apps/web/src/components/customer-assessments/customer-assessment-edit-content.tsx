'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  CustomerAssessmentFormPanel,
  toUpdateCustomerAssessmentInput,
  type CustomerAssessmentFormValues,
} from '@/components/customer-assessments/customer-assessment-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCustomerAssessment, listUsers, updateCustomerAssessment, type ApiClientError } from '@/lib/api-client';

export function CustomerAssessmentEditContent({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:assessment:manage'),
  );

  const assessmentQuery = useQuery({
    queryKey: ['customer-assessment', assessmentId],
    queryFn: () => getCustomerAssessment(assessmentId),
  });
  const ownersQuery = useQuery({
    queryKey: ['customer-assessment-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CustomerAssessmentFormValues) =>
      updateCustomerAssessment(assessmentId, toUpdateCustomerAssessmentInput(values)),
    onSuccess: async (assessment) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-assessments'] });
      queryClient.setQueryData(['customer-assessment', assessment.id], assessment);
      router.push(`/customer-assessments/${assessment.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: CustomerAssessmentFormValues) {
    setFormError(null);
    updateMutation.mutate(values);
  }

  return (
    <main className="grid gap-6 px-4 py-6 lg:px-6">

      <section>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href={`/customer-assessments/${assessmentId}`}>
            <ArrowLeft className="size-4" />
            客户评估详情
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">编辑客户评估</h1>
      </section>

      {assessmentQuery.isLoading ? (
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载客户评估...</div>
        </Card>
      ) : assessmentQuery.isError || !assessmentQuery.data ? (
        <Card className="p-6">
          <div className="text-sm text-destructive">客户评估加载失败。</div>
        </Card>
      ) : !canWrite ? (
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">当前账号没有编辑客户评估权限。</div>
        </Card>
      ) : (
        <CustomerAssessmentFormPanel
          assessment={assessmentQuery.data}
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/customer-assessments/${assessmentId}`)}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
