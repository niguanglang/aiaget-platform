'use client';

import {
  hasPermission,
  type CustomerAssessmentDecisionStage,
  type CustomerAssessmentListItem,
  type CustomerAssessmentStatus,
  type CustomerAssessmentType,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerAssessmentBackground } from '@/components/customer-assessments/customer-assessment-background';
import {
  assessmentStatusLabel,
  assessmentStatusTone,
  customerTypeLabel,
  decisionStageLabel,
  formatDateTime,
  readinessLabel,
  readinessTone,
} from '@/components/customer-assessments/customer-assessment-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteCustomerAssessment, listCustomerAssessments, listUsers, type ApiClientError } from '@/lib/api-client';

const customerTypes: CustomerAssessmentType[] = ['UNKNOWN', 'ANXIOUS', 'TASK_DRIVEN', 'CLEAR'];
const decisionStages: CustomerAssessmentDecisionStage[] = ['LEARNING', 'EVALUATION', 'PROCUREMENT', 'PILOT', 'DELIVERY'];
const assessmentStatuses: CustomerAssessmentStatus[] = ['DISCOVERY', 'QUALIFIED', 'NURTURING', 'WON', 'LOST', 'ARCHIVED'];
const pageSize = 20;

export function CustomerAssessmentsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [decisionStage, setDecisionStage] = useState('');
  const [status, setStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<CustomerAssessmentListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:assessment:manage'),
  );

  const assessmentsQuery = useQuery({
    queryKey: ['customer-assessments', page, keyword, customerType, decisionStage, status, ownerId],
    queryFn: () =>
      listCustomerAssessments({
        page,
        page_size: pageSize,
        keyword,
        customer_type: customerType,
        decision_stage: decisionStage,
        status,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['customer-assessment-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const assessments = assessmentsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const total = assessmentsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '客户评估', value: `${total}`, helper: '租户范围' },
      { label: '高准备度', value: `${assessments.filter((item) => item.readiness_score >= 80).length}`, helper: '当前页' },
      { label: '任务型', value: `${assessments.filter((item) => item.customer_type === 'TASK_DRIVEN').length}`, helper: '当前页' },
      { label: '已确认', value: `${assessments.filter((item) => item.status === 'QUALIFIED').length}`, helper: '当前页' },
    ],
    [assessments, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerAssessment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-assessments'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setKeyword('');
    setCustomerType('');
    setDecisionStage('');
    setStatus('');
    setOwnerId('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerAssessmentBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">客户分层评估</StatusBadge>
            <StatusBadge tone="healthy">六问判断</StatusBadge>
            <StatusBadge tone="planned">轻量售前资格</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">客户分层评估</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            列表页只展示客户识别、类型、阶段、状态、准备度和建议预览。完整六问、策略、风险和下一步动作在详情页查看。
          </p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/customer-assessments/create">
              <Plus className="size-4" />
              新建评估
            </Link>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" disabled>
            <Plus className="size-4" />
            新建评估
          </Button>
        )}
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">评估清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">用于筛选客户分层、准备度和责任人，避免在列表堆叠完整评估内容。</p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {assessments.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_140px_180px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索客户、行业、目标、风险"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setCustomerType, event.target.value)} value={customerType}>
                <option value="">全部类型</option>
                {customerTypes.map((option) => (
                  <option key={option} value={option}>
                    {customerTypeLabel(option)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setDecisionStage, event.target.value)} value={decisionStage}>
                <option value="">全部阶段</option>
                {decisionStages.map((option) => (
                  <option key={option} value={option}>
                    {decisionStageLabel(option)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {assessmentStatuses.map((option) => (
                  <option key={option} value={option}>
                    {assessmentStatusLabel(option)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {assessmentsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">客户评估加载失败。</div>
        ) : assessmentsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载客户评估...</div>
        ) : assessments.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/customer-assessments/create">
                    <Plus className="size-4" />
                    新建评估
                  </Link>
                </Button>
              ) : null
            }
            description="先新增一个客户评估，再进入详情页沉淀完整六问判断。"
            title="暂无客户评估"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['客户', '类型', '阶段', '状态', '准备度', '目标预览', '建议预览', '负责人', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={assessment.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-56 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/customer-assessments/${assessment.id}`}>
                          {assessment.customer_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{assessment.industry ?? '未填写行业'}</span>
                        <span className="text-xs text-muted-foreground">{assessment.contact_name ?? '暂无联系人'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{customerTypeLabel(assessment.customer_type)}</td>
                    <td className="px-4 py-3">{decisionStageLabel(assessment.decision_stage)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={assessmentStatusTone(assessment.status)}>{assessmentStatusLabel(assessment.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid gap-1">
                        <StatusBadge tone={readinessTone(assessment.readiness_score)}>{assessment.readiness_score}</StatusBadge>
                        <span className="text-xs text-muted-foreground">{readinessLabel(assessment.readiness_score)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2 max-w-56 text-muted-foreground">{assessment.business_goal_preview}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2 max-w-64 text-muted-foreground">{assessment.recommended_strategy_preview}</span>
                    </td>
                    <td className="px-4 py-3">{assessment.owner?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(assessment.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/customer-assessments/${assessment.id}`}>
                            <Eye className="size-3.5" />
                            查看
                          </Link>
                        </Button>
                        <Button asChild disabled={!canWrite} size="sm" variant="outline">
                          <Link href={`/customer-assessments/${assessment.id}/edit`}>
                            <Edit className="size-3.5" />
                            编辑
                          </Link>
                        </Button>
                        <Button disabled={!canWrite} onClick={() => setDeleteTarget(assessment)} size="sm" variant="outline">
                          <Trash2 className="size-3.5" />
                          归档
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            第 {page} / {pageCount} 页
          </span>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} variant="outline">
              上一页
            </Button>
            <Button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} variant="outline">
              下一页
            </Button>
          </div>
        </div>
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 shadow-lg">
            <h2 className="text-base font-semibold">确认归档客户评估</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              归档后该评估不会出现在默认清单中。当前对象：{deleteTarget.customer_name}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">
                取消
              </Button>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
                确认归档
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
