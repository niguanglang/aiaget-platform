'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerAssessmentBackground } from '@/components/customer-assessments/customer-assessment-background';
import {
  CustomerAssessmentFormPanel,
  toCreateCustomerAssessmentInput,
  type CustomerAssessmentFormValues,
} from '@/components/customer-assessments/customer-assessment-form-panel';
import { Button } from '@/components/ui/button';
import { createCustomerAssessment, listUsers, type ApiClientError } from '@/lib/api-client';

export function CustomerAssessmentCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:assessment:manage'),
  );

  const ownersQuery = useQuery({
    queryKey: ['customer-assessment-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createCustomerAssessment,
    onSuccess: async (assessment) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-assessments'] });
      queryClient.setQueryData(['customer-assessment', assessment.id], assessment);
      router.push(`/customer-assessments/${assessment.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: CustomerAssessmentFormValues) {
    setFormError(null);
    createMutation.mutate(toCreateCustomerAssessmentInput(values));
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <CustomerAssessmentBackground />

      <section>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href="/customer-assessments">
            <ArrowLeft className="size-4" />
            客户分层评估
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">新建客户评估</h1>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">当前账号没有新建客户评估权限。</div>
      ) : (
        <CustomerAssessmentFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/customer-assessments')}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
