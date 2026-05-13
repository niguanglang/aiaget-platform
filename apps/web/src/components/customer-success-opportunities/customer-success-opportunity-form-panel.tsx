'use client';

import type {
  CustomerSuccessActionListItem,
  CustomerSuccessOpportunityDetail,
  CustomerSuccessPlanListItem,
  DeliveryAssetListItem,
  DeliveryReviewListItem,
  SolutionPackageListItem,
  UserListItem,
} from '@aiaget/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  customerSuccessOpportunityConfidenceLabel,
  customerSuccessOpportunityConfidenceLevels,
  customerSuccessOpportunityPriorities,
  customerSuccessOpportunityPriorityLabel,
  customerSuccessOpportunityRiskLabel,
  customerSuccessOpportunityRiskLevels,
  customerSuccessOpportunityStageLabel,
  customerSuccessOpportunityStages,
  customerSuccessOpportunityStatusLabel,
  customerSuccessOpportunityStatuses,
  customerSuccessOpportunityTypeLabel,
  customerSuccessOpportunityTypes,
} from '@/components/customer-success-opportunities/customer-success-opportunity-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '机会名称至少需要 2 个字符。').max(180, '机会名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  customer_success_plan_id: z.string().min(1, '请选择客户成功计划。'),
  customer_success_action_id: z.string().optional(),
  opportunity_type: z.enum(customerSuccessOpportunityTypes),
  stage: z.enum(customerSuccessOpportunityStages),
  status: z.enum(customerSuccessOpportunityStatuses),
  priority: z.enum(customerSuccessOpportunityPriorities),
  confidence_level: z.enum(customerSuccessOpportunityConfidenceLevels),
  risk_level: z.enum(customerSuccessOpportunityRiskLevels),
  opportunity_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  estimated_amount: z.coerce.number().min(0, '预计金额不能为负数。').optional(),
  probability: z.coerce.number().int().min(0, '最低 0%。').max(100, '最高 100%。').optional(),
  expected_close_at: z.string().optional(),
  closed_at: z.string().optional(),
  opportunity_summary: z.string().min(1, '请输入机会摘要。'),
  customer_value: z.string().min(1, '请输入客户价值。'),
  commercial_strategy: z.string().min(1, '请输入商务策略。'),
  decision_path: z.string().min(1, '请输入决策路径。'),
  risk_summary: z.string().min(1, '请输入风险摘要。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  loss_reason: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  delivery_review_id: z.string().optional(),
  delivery_asset_id: z.string().optional(),
  solution_package_id: z.string().optional(),
});

export type CustomerSuccessOpportunityFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<CustomerSuccessOpportunityFormValues>;

function defaults(opportunity?: CustomerSuccessOpportunityDetail | null): CustomerSuccessOpportunityFormValues {
  return {
    name: opportunity?.name ?? '',
    code: opportunity?.code ?? '',
    customer_name: opportunity?.customer_name ?? '',
    customer_success_plan_id: opportunity?.linked_resources.customer_success_plan?.id ?? '',
    customer_success_action_id: opportunity?.linked_resources.customer_success_action?.id ?? '',
    opportunity_type: opportunity?.opportunity_type ?? 'EXPANSION',
    stage: opportunity?.stage ?? 'PROPOSAL',
    status: opportunity?.status ?? 'OPEN',
    priority: opportunity?.priority ?? 'HIGH',
    confidence_level: opportunity?.confidence_level ?? 'HIGH',
    risk_level: opportunity?.risk_level ?? 'MEDIUM',
    opportunity_score: opportunity?.opportunity_score ?? undefined,
    estimated_amount: opportunity?.estimated_amount ?? undefined,
    probability: opportunity?.probability ?? undefined,
    expected_close_at: opportunity?.expected_close_at ? opportunity.expected_close_at.slice(0, 16) : '',
    closed_at: opportunity?.closed_at ? opportunity.closed_at.slice(0, 16) : '',
    opportunity_summary: opportunity?.opportunity_summary ?? '',
    customer_value: opportunity?.customer_value ?? '',
    commercial_strategy: opportunity?.commercial_strategy ?? '',
    decision_path: opportunity?.decision_path ?? '',
    risk_summary: opportunity?.risk_summary ?? '',
    next_action: opportunity?.next_action ?? '',
    loss_reason: opportunity?.loss_reason ?? '',
    tags: opportunity?.tags.join(', ') ?? '',
    notes: opportunity?.notes ?? '',
    owner_id: opportunity?.owner?.id ?? '',
    delivery_review_id: opportunity?.linked_resources.delivery_review?.id ?? '',
    delivery_asset_id: opportunity?.linked_resources.delivery_asset?.id ?? '',
    solution_package_id: opportunity?.linked_resources.solution_package?.id ?? '',
  };
}

export function toCreateCustomerSuccessOpportunityInput(values: CustomerSuccessOpportunityFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    customer_success_plan_id: values.customer_success_plan_id,
    customer_success_action_id: values.customer_success_action_id || null,
    opportunity_type: values.opportunity_type,
    stage: values.stage,
    status: values.status,
    priority: values.priority,
    confidence_level: values.confidence_level,
    risk_level: values.risk_level,
    opportunity_score: values.opportunity_score,
    estimated_amount: values.estimated_amount,
    probability: values.probability,
    expected_close_at: values.expected_close_at ? new Date(values.expected_close_at).toISOString() : null,
    closed_at: values.closed_at ? new Date(values.closed_at).toISOString() : null,
    opportunity_summary: values.opportunity_summary,
    customer_value: values.customer_value,
    commercial_strategy: values.commercial_strategy,
    decision_path: values.decision_path,
    risk_summary: values.risk_summary,
    next_action: values.next_action,
    loss_reason: values.loss_reason || null,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    delivery_review_id: values.delivery_review_id || null,
    delivery_asset_id: values.delivery_asset_id || null,
    solution_package_id: values.solution_package_id || null,
  };
}

export function toUpdateCustomerSuccessOpportunityInput(values: CustomerSuccessOpportunityFormValues) {
  return toCreateCustomerSuccessOpportunityInput(values);
}

export function CustomerSuccessOpportunityFormPanel({
  actions,
  assets,
  deliveryReviews,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  opportunities,
  owners,
  plans,
  solutionPackages,
}: {
  actions: CustomerSuccessActionListItem[];
  assets: DeliveryAssetListItem[];
  deliveryReviews: DeliveryReviewListItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: CustomerSuccessOpportunityFormValues) => void;
  opportunities?: CustomerSuccessOpportunityDetail | null;
  owners: UserListItem[];
  plans: CustomerSuccessPlanListItem[];
  solutionPackages: SolutionPackageListItem[];
}) {
  const form = useForm<CustomerSuccessOpportunityFormValues>({
    resolver: formResolver,
    defaultValues: defaults(opportunities),
  });

  useEffect(() => {
    form.reset(defaults(opportunities));
  }, [form, opportunities, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑续约机会' : '新建续约机会'}</h2>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: CustomerSuccessOpportunityFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="机会名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="机会编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <SelectField label="机会类型" register={form.register('opportunity_type')}>
              {customerSuccessOpportunityTypes.map((type) => (
                <option key={type} value={type}>{customerSuccessOpportunityTypeLabel(type)}</option>
              ))}
            </SelectField>
            <SelectField label="机会阶段" register={form.register('stage')}>
              {customerSuccessOpportunityStages.map((stage) => (
                <option key={stage} value={stage}>{customerSuccessOpportunityStageLabel(stage)}</option>
              ))}
            </SelectField>
            <SelectField label="机会状态" register={form.register('status')}>
              {customerSuccessOpportunityStatuses.map((status) => (
                <option key={status} value={status}>{customerSuccessOpportunityStatusLabel(status)}</option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <SelectField label="优先级" register={form.register('priority')}>
              {customerSuccessOpportunityPriorities.map((priority) => (
                <option key={priority} value={priority}>{customerSuccessOpportunityPriorityLabel(priority)}</option>
              ))}
            </SelectField>
            <SelectField label="信心等级" register={form.register('confidence_level')}>
              {customerSuccessOpportunityConfidenceLevels.map((level) => (
                <option key={level} value={level}>{customerSuccessOpportunityConfidenceLabel(level)}</option>
              ))}
            </SelectField>
            <SelectField label="风险等级" register={form.register('risk_level')}>
              {customerSuccessOpportunityRiskLevels.map((level) => (
                <option key={level} value={level}>{customerSuccessOpportunityRiskLabel(level)}</option>
              ))}
            </SelectField>
            <Field label="机会评分" message={form.formState.errors.opportunity_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('opportunity_score')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">商务预测</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="预计金额" message={form.formState.errors.estimated_amount?.message}>
              <Input min={0} step={1000} type="number" {...form.register('estimated_amount')} />
            </Field>
            <Field label="成交概率" message={form.formState.errors.probability?.message}>
              <Input max={100} min={0} type="number" {...form.register('probability')} />
            </Field>
            <Field label="预计关闭时间" message={form.formState.errors.expected_close_at?.message}>
              <Input type="datetime-local" {...form.register('expected_close_at')} />
            </Field>
            <Field label="实际关闭时间" message={form.formState.errors.closed_at?.message}>
              <Input type="datetime-local" {...form.register('closed_at')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">机会内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="机会摘要" message={form.formState.errors.opportunity_summary?.message} register={form.register('opportunity_summary')} />
            <LongField label="客户价值" message={form.formState.errors.customer_value?.message} register={form.register('customer_value')} />
            <LongField label="商务策略" message={form.formState.errors.commercial_strategy?.message} register={form.register('commercial_strategy')} />
            <LongField label="决策路径" message={form.formState.errors.decision_path?.message} register={form.register('decision_path')} />
            <LongField label="风险摘要" message={form.formState.errors.risk_summary?.message} register={form.register('risk_summary')} />
            <LongField label="下一步动作" message={form.formState.errors.next_action?.message} register={form.register('next_action')} />
            <LongField label="输单原因" message={form.formState.errors.loss_reason?.message} register={form.register('loss_reason')} />
            <LongField label="内部备注" message={form.formState.errors.notes?.message} register={form.register('notes')} />
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">关联资源</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="负责人" register={form.register('owner_id')}>
              <option value="">当前用户</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
              ))}
            </SelectField>
            <SelectField label="客户成功计划" register={form.register('customer_success_plan_id')}>
              <option value="">请选择客户成功计划</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} / {plan.customer_name} / {plan.success_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="成功行动" register={form.register('customer_success_action_id')}>
              <option value="">不绑定行动</option>
              {actions.map((action) => (
                <option key={action.id} value={action.id}>{action.name} / {action.customer_name} / {action.action_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="来源验收复盘" register={form.register('delivery_review_id')}>
              <option value="">从计划或行动继承</option>
              {deliveryReviews.map((review) => (
                <option key={review.id} value={review.id}>{review.name} / {review.customer_name} / {review.acceptance_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联成果资产" register={form.register('delivery_asset_id')}>
              <option value="">从计划或行动继承</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name} / {asset.customer_name} / {asset.reuse_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联落地方案包" register={form.register('solution_package_id')}>
              <option value="">从计划或行动推导</option>
              {solutionPackages.map((item) => (
                <option key={item.id} value={item.id}>{item.name} / {item.customer_name} / {item.package_score} 分</option>
              ))}
            </SelectField>
          </div>
          {form.formState.errors.customer_success_plan_id?.message ? (
            <span className="text-xs text-destructive">{form.formState.errors.customer_success_plan_id.message}</span>
          ) : null}
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：续约, 扩展, 客户成功" {...form.register('tags')} />
          </Field>
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存机会'}</Button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

function SelectField({
  children,
  label,
  register,
}: {
  children: React.ReactNode;
  label: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-primary" {...register}>
        {children}
      </select>
    </label>
  );
}

function LongField({
  label,
  message,
  register,
}: {
  label: string;
  message?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        {...register}
      />
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

function splitTags(value?: string) {
  return Array.from(new Set((value ?? '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)));
}
