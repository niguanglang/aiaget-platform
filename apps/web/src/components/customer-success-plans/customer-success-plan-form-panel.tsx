'use client';

import type {
  CustomerSuccessPlanDetail,
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
  customerSuccessPlanHealthLabel,
  customerSuccessPlanHealthLevels,
  customerSuccessPlanPriorityLabel,
  customerSuccessPlanPriorities,
  customerSuccessPlanStageLabel,
  customerSuccessPlanStages,
  customerSuccessPlanStatusLabel,
  customerSuccessPlanStatuses,
} from '@/components/customer-success-plans/customer-success-plan-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '计划名称至少需要 2 个字符。').max(180, '计划名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  plan_stage: z.enum(customerSuccessPlanStages),
  status: z.enum(customerSuccessPlanStatuses),
  priority: z.enum(customerSuccessPlanPriorities),
  health_level: z.enum(customerSuccessPlanHealthLevels),
  success_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  expansion_scope: z.string().min(1, '请输入扩展范围。'),
  success_objectives: z.string().min(1, '请输入成功目标。'),
  stakeholder_plan: z.string().min(1, '请输入干系人计划。'),
  asset_reuse_plan: z.string().min(1, '请输入资产复用计划。'),
  renewal_plan: z.string().min(1, '请输入续约计划。'),
  risk_summary: z.string().min(1, '请输入风险摘要。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  due_at: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  delivery_review_id: z.string().min(1, '请选择来源验收复盘。'),
  delivery_asset_id: z.string().optional(),
  solution_package_id: z.string().optional(),
});

export type CustomerSuccessPlanFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<CustomerSuccessPlanFormValues>;

function defaults(plan?: CustomerSuccessPlanDetail | null): CustomerSuccessPlanFormValues {
  return {
    name: plan?.name ?? '',
    code: plan?.code ?? '',
    customer_name: plan?.customer_name ?? '',
    plan_stage: plan?.plan_stage ?? 'EXPANSION_DESIGN',
    status: plan?.status ?? 'ACTIVE',
    priority: plan?.priority ?? 'HIGH',
    health_level: plan?.health_level ?? 'HIGH',
    success_score: plan?.success_score ?? undefined,
    expansion_scope: plan?.expansion_scope ?? '',
    success_objectives: plan?.success_objectives ?? '',
    stakeholder_plan: plan?.stakeholder_plan ?? '',
    asset_reuse_plan: plan?.asset_reuse_plan ?? '',
    renewal_plan: plan?.renewal_plan ?? '',
    risk_summary: plan?.risk_summary ?? '',
    next_action: plan?.next_action ?? '',
    due_at: plan?.due_at ? plan.due_at.slice(0, 16) : '',
    tags: plan?.tags.join(', ') ?? '',
    notes: plan?.notes ?? '',
    owner_id: plan?.owner?.id ?? '',
    delivery_review_id: plan?.linked_resources.delivery_review?.id ?? '',
    delivery_asset_id: plan?.linked_resources.delivery_asset?.id ?? '',
    solution_package_id: plan?.linked_resources.solution_package?.id ?? '',
  };
}

export function toCreateCustomerSuccessPlanInput(values: CustomerSuccessPlanFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    plan_stage: values.plan_stage,
    status: values.status,
    priority: values.priority,
    health_level: values.health_level,
    success_score: values.success_score,
    expansion_scope: values.expansion_scope,
    success_objectives: values.success_objectives,
    stakeholder_plan: values.stakeholder_plan,
    asset_reuse_plan: values.asset_reuse_plan,
    renewal_plan: values.renewal_plan,
    risk_summary: values.risk_summary,
    next_action: values.next_action,
    due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    delivery_review_id: values.delivery_review_id,
    delivery_asset_id: values.delivery_asset_id || null,
    solution_package_id: values.solution_package_id || null,
  };
}

export function toUpdateCustomerSuccessPlanInput(values: CustomerSuccessPlanFormValues) {
  return toCreateCustomerSuccessPlanInput(values);
}

export function CustomerSuccessPlanFormPanel({
  assets,
  deliveryReviews,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  plan,
  solutionPackages,
}: {
  assets: DeliveryAssetListItem[];
  deliveryReviews: DeliveryReviewListItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: CustomerSuccessPlanFormValues) => void;
  owners: UserListItem[];
  plan?: CustomerSuccessPlanDetail | null;
  solutionPackages: SolutionPackageListItem[];
}) {
  const form = useForm<CustomerSuccessPlanFormValues>({
    resolver: formResolver,
    defaultValues: defaults(plan),
  });

  useEffect(() => {
    form.reset(defaults(plan));
  }, [form, plan, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑客户成功计划' : '新建客户成功计划'}</h2>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: CustomerSuccessPlanFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="计划名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="计划编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <SelectField label="计划阶段" register={form.register('plan_stage')}>
              {customerSuccessPlanStages.map((stage) => (
                <option key={stage} value={stage}>{customerSuccessPlanStageLabel(stage)}</option>
              ))}
            </SelectField>
            <SelectField label="计划状态" register={form.register('status')}>
              {customerSuccessPlanStatuses.map((status) => (
                <option key={status} value={status}>{customerSuccessPlanStatusLabel(status)}</option>
              ))}
            </SelectField>
            <SelectField label="优先级" register={form.register('priority')}>
              {customerSuccessPlanPriorities.map((priority) => (
                <option key={priority} value={priority}>{customerSuccessPlanPriorityLabel(priority)}</option>
              ))}
            </SelectField>
            <SelectField label="健康度" register={form.register('health_level')}>
              {customerSuccessPlanHealthLevels.map((level) => (
                <option key={level} value={level}>{customerSuccessPlanHealthLabel(level)}</option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户成功评分" message={form.formState.errors.success_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('success_score')} />
            </Field>
            <Field label="关键节点时间" message={form.formState.errors.due_at?.message}>
              <Input type="datetime-local" {...form.register('due_at')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">计划内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="扩展范围" message={form.formState.errors.expansion_scope?.message} register={form.register('expansion_scope')} />
            <LongField label="成功目标" message={form.formState.errors.success_objectives?.message} register={form.register('success_objectives')} />
            <LongField label="干系人计划" message={form.formState.errors.stakeholder_plan?.message} register={form.register('stakeholder_plan')} />
            <LongField label="资产复用计划" message={form.formState.errors.asset_reuse_plan?.message} register={form.register('asset_reuse_plan')} />
            <LongField label="续约计划" message={form.formState.errors.renewal_plan?.message} register={form.register('renewal_plan')} />
            <LongField label="风险摘要" message={form.formState.errors.risk_summary?.message} register={form.register('risk_summary')} />
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
            <SelectField label="来源验收复盘" register={form.register('delivery_review_id')}>
              <option value="">请选择验收复盘</option>
              {deliveryReviews.map((review) => (
                <option key={review.id} value={review.id}>{review.name} / {review.customer_name} / {review.acceptance_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联成果资产" register={form.register('delivery_asset_id')}>
              <option value="">不绑定成果资产</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name} / {asset.customer_name} / {asset.reuse_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联落地方案包" register={form.register('solution_package_id')}>
              <option value="">从复盘或资产自动推导</option>
              {solutionPackages.map((item) => (
                <option key={item.id} value={item.id}>{item.name} / {item.customer_name} / {item.package_score} 分</option>
              ))}
            </SelectField>
          </div>
          {form.formState.errors.delivery_review_id?.message ? (
            <span className="text-xs text-destructive">{form.formState.errors.delivery_review_id.message}</span>
          ) : null}
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：客户成功, 扩展, 续约" {...form.register('tags')} />
          </Field>
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存计划'}</Button>
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
