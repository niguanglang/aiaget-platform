'use client';

import type {
  CustomerSuccessActionDetail,
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
  customerSuccessActionPriorityLabel,
  customerSuccessActionPriorities,
  customerSuccessActionRiskLabel,
  customerSuccessActionRiskLevels,
  customerSuccessActionStatusLabel,
  customerSuccessActionStatuses,
  customerSuccessActionTypeLabel,
  customerSuccessActionTypes,
} from '@/components/customer-success-actions/customer-success-action-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '行动名称至少需要 2 个字符。').max(180, '行动名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  customer_success_plan_id: z.string().min(1, '请选择客户成功计划。'),
  action_type: z.enum(customerSuccessActionTypes),
  status: z.enum(customerSuccessActionStatuses),
  priority: z.enum(customerSuccessActionPriorities),
  risk_level: z.enum(customerSuccessActionRiskLevels),
  action_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  action_summary: z.string().min(1, '请输入行动摘要。'),
  expected_outcome: z.string().min(1, '请输入预期结果。'),
  execution_notes: z.string().min(1, '请输入执行记录。'),
  blocker_summary: z.string().min(1, '请输入阻塞风险。'),
  completion_evidence: z.string().min(1, '请输入完成证据。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  due_at: z.string().optional(),
  completed_at: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  delivery_review_id: z.string().optional(),
  delivery_asset_id: z.string().optional(),
  solution_package_id: z.string().optional(),
});

export type CustomerSuccessActionFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<CustomerSuccessActionFormValues>;

function defaults(action?: CustomerSuccessActionDetail | null): CustomerSuccessActionFormValues {
  return {
    name: action?.name ?? '',
    code: action?.code ?? '',
    customer_name: action?.customer_name ?? '',
    customer_success_plan_id: action?.linked_resources.customer_success_plan?.id ?? '',
    action_type: action?.action_type ?? 'MEETING',
    status: action?.status ?? 'IN_PROGRESS',
    priority: action?.priority ?? 'HIGH',
    risk_level: action?.risk_level ?? 'MEDIUM',
    action_score: action?.action_score ?? undefined,
    action_summary: action?.action_summary ?? '',
    expected_outcome: action?.expected_outcome ?? '',
    execution_notes: action?.execution_notes ?? '',
    blocker_summary: action?.blocker_summary ?? '',
    completion_evidence: action?.completion_evidence ?? '',
    next_action: action?.next_action ?? '',
    due_at: action?.due_at ? action.due_at.slice(0, 16) : '',
    completed_at: action?.completed_at ? action.completed_at.slice(0, 16) : '',
    tags: action?.tags.join(', ') ?? '',
    notes: action?.notes ?? '',
    owner_id: action?.owner?.id ?? '',
    delivery_review_id: action?.linked_resources.delivery_review?.id ?? '',
    delivery_asset_id: action?.linked_resources.delivery_asset?.id ?? '',
    solution_package_id: action?.linked_resources.solution_package?.id ?? '',
  };
}

export function toCreateCustomerSuccessActionInput(values: CustomerSuccessActionFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    customer_success_plan_id: values.customer_success_plan_id,
    action_type: values.action_type,
    status: values.status,
    priority: values.priority,
    risk_level: values.risk_level,
    action_score: values.action_score,
    action_summary: values.action_summary,
    expected_outcome: values.expected_outcome,
    execution_notes: values.execution_notes,
    blocker_summary: values.blocker_summary,
    completion_evidence: values.completion_evidence,
    next_action: values.next_action,
    due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
    completed_at: values.completed_at ? new Date(values.completed_at).toISOString() : null,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    delivery_review_id: values.delivery_review_id || null,
    delivery_asset_id: values.delivery_asset_id || null,
    solution_package_id: values.solution_package_id || null,
  };
}

export function toUpdateCustomerSuccessActionInput(values: CustomerSuccessActionFormValues) {
  return toCreateCustomerSuccessActionInput(values);
}

export function CustomerSuccessActionFormPanel({
  assets,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  plans,
  action,
  deliveryReviews,
  solutionPackages,
}: {
  assets: DeliveryAssetListItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: CustomerSuccessActionFormValues) => void;
  owners: UserListItem[];
  plans: CustomerSuccessPlanListItem[];
  action?: CustomerSuccessActionDetail | null;
  deliveryReviews: DeliveryReviewListItem[];
  solutionPackages: SolutionPackageListItem[];
}) {
  const form = useForm<CustomerSuccessActionFormValues>({
    resolver: formResolver,
    defaultValues: defaults(action),
  });

  useEffect(() => {
    form.reset(defaults(action));
  }, [form, action, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑客户成功行动' : '新建客户成功行动'}</h2>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: CustomerSuccessActionFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="行动名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="行动编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <SelectField label="行动类型" register={form.register('action_type')}>
              {customerSuccessActionTypes.map((type) => (
                <option key={type} value={type}>{customerSuccessActionTypeLabel(type)}</option>
              ))}
            </SelectField>
            <SelectField label="行动状态" register={form.register('status')}>
              {customerSuccessActionStatuses.map((status) => (
                <option key={status} value={status}>{customerSuccessActionStatusLabel(status)}</option>
              ))}
            </SelectField>
            <SelectField label="优先级" register={form.register('priority')}>
              {customerSuccessActionPriorities.map((priority) => (
                <option key={priority} value={priority}>{customerSuccessActionPriorityLabel(priority)}</option>
              ))}
            </SelectField>
            <SelectField label="风险等级" register={form.register('risk_level')}>
              {customerSuccessActionRiskLevels.map((level) => (
                <option key={level} value={level}>{customerSuccessActionRiskLabel(level)}</option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="行动评分" message={form.formState.errors.action_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('action_score')} />
            </Field>
            <Field label="截止时间" message={form.formState.errors.due_at?.message}>
              <Input type="datetime-local" {...form.register('due_at')} />
            </Field>
            <Field label="完成时间" message={form.formState.errors.completed_at?.message}>
              <Input type="datetime-local" {...form.register('completed_at')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">执行内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="行动摘要" message={form.formState.errors.action_summary?.message} register={form.register('action_summary')} />
            <LongField label="预期结果" message={form.formState.errors.expected_outcome?.message} register={form.register('expected_outcome')} />
            <LongField label="执行记录" message={form.formState.errors.execution_notes?.message} register={form.register('execution_notes')} />
            <LongField label="阻塞风险" message={form.formState.errors.blocker_summary?.message} register={form.register('blocker_summary')} />
            <LongField label="完成证据" message={form.formState.errors.completion_evidence?.message} register={form.register('completion_evidence')} />
            <LongField label="下一步动作" message={form.formState.errors.next_action?.message} register={form.register('next_action')} />
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
            <SelectField label="来源验收复盘" register={form.register('delivery_review_id')}>
              <option value="">从计划继承</option>
              {deliveryReviews.map((review) => (
                <option key={review.id} value={review.id}>{review.name} / {review.customer_name} / {review.acceptance_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联成果资产" register={form.register('delivery_asset_id')}>
              <option value="">从计划继承或不绑定</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name} / {asset.customer_name} / {asset.reuse_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联落地方案包" register={form.register('solution_package_id')}>
              <option value="">从计划自动推导</option>
              {solutionPackages.map((item) => (
                <option key={item.id} value={item.id}>{item.name} / {item.customer_name} / {item.package_score} 分</option>
              ))}
            </SelectField>
          </div>
          {form.formState.errors.customer_success_plan_id?.message ? (
            <span className="text-xs text-destructive">{form.formState.errors.customer_success_plan_id.message}</span>
          ) : null}
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：客户成功, 行动, 扩展" {...form.register('tags')} />
          </Field>
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存行动'}</Button>
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
