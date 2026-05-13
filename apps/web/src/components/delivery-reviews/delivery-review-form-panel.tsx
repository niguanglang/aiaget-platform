'use client';

import type { DeliveryReviewDetail, SolutionPackageListItem, UserListItem } from '@aiaget/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  deliveryReviewResultLabel,
  deliveryReviewResults,
  deliveryReviewSatisfactionLabel,
  deliveryReviewSatisfactionLevels,
  deliveryReviewStageLabel,
  deliveryReviewStages,
  deliveryReviewStatusLabel,
  deliveryReviewStatuses,
} from '@/components/delivery-reviews/delivery-review-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '复盘名称至少需要 2 个字符。').max(180, '复盘名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  review_stage: z.enum(deliveryReviewStages),
  result: z.enum(deliveryReviewResults),
  status: z.enum(deliveryReviewStatuses),
  satisfaction_level: z.enum(deliveryReviewSatisfactionLevels),
  acceptance_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  delivered_scope: z.string().min(1, '请输入已交付范围。'),
  acceptance_summary: z.string().min(1, '请输入验收结论。'),
  issue_summary: z.string().min(1, '请输入问题复盘。'),
  improvement_actions: z.string().min(1, '请输入改进行动。'),
  expansion_plan: z.string().min(1, '请输入扩展计划。'),
  reusable_assets: z.string().min(1, '请输入可复用资产。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  reviewed_at: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  solution_package_id: z.string().min(1, '请选择关联落地方案包。'),
});

export type DeliveryReviewFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<DeliveryReviewFormValues>;

function defaults(review?: DeliveryReviewDetail | null): DeliveryReviewFormValues {
  return {
    name: review?.name ?? '',
    code: review?.code ?? '',
    customer_name: review?.customer_name ?? '',
    review_stage: review?.review_stage ?? 'PILOT_ACCEPTANCE',
    result: review?.result ?? 'PASSED',
    status: review?.status ?? 'COMPLETED',
    satisfaction_level: review?.satisfaction_level ?? 'HIGH',
    acceptance_score: review?.acceptance_score ?? undefined,
    delivered_scope: review?.delivered_scope ?? '',
    acceptance_summary: review?.acceptance_summary ?? '',
    issue_summary: review?.issue_summary ?? '',
    improvement_actions: review?.improvement_actions ?? '',
    expansion_plan: review?.expansion_plan ?? '',
    reusable_assets: review?.reusable_assets ?? '',
    next_action: review?.next_action ?? '',
    reviewed_at: review?.reviewed_at ? review.reviewed_at.slice(0, 16) : '',
    tags: review?.tags.join(', ') ?? '',
    notes: review?.notes ?? '',
    owner_id: review?.owner?.id ?? '',
    solution_package_id: review?.linked_resources.solution_package?.id ?? '',
  };
}

export function toCreateDeliveryReviewInput(values: DeliveryReviewFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    review_stage: values.review_stage,
    result: values.result,
    status: values.status,
    satisfaction_level: values.satisfaction_level,
    acceptance_score: values.acceptance_score,
    delivered_scope: values.delivered_scope,
    acceptance_summary: values.acceptance_summary,
    issue_summary: values.issue_summary,
    improvement_actions: values.improvement_actions,
    expansion_plan: values.expansion_plan,
    reusable_assets: values.reusable_assets,
    next_action: values.next_action,
    reviewed_at: values.reviewed_at ? new Date(values.reviewed_at).toISOString() : null,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    solution_package_id: values.solution_package_id,
  };
}

export function toUpdateDeliveryReviewInput(values: DeliveryReviewFormValues) {
  return toCreateDeliveryReviewInput(values);
}

export function DeliveryReviewFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  review,
  solutionPackages,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: DeliveryReviewFormValues) => void;
  owners: UserListItem[];
  review?: DeliveryReviewDetail | null;
  solutionPackages: SolutionPackageListItem[];
}) {
  const form = useForm<DeliveryReviewFormValues>({
    resolver: formResolver,
    defaultValues: defaults(review),
  });

  useEffect(() => {
    form.reset(defaults(review));
  }, [form, review, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑验收复盘' : '新建验收复盘'}</h2>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: DeliveryReviewFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="复盘名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="复盘编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <Field label="复盘时间" message={form.formState.errors.reviewed_at?.message}>
              <Input type="datetime-local" {...form.register('reviewed_at')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <SelectField label="复盘阶段" register={form.register('review_stage')}>
              {deliveryReviewStages.map((stage) => (
                <option key={stage} value={stage}>{deliveryReviewStageLabel(stage)}</option>
              ))}
            </SelectField>
            <SelectField label="验收结果" register={form.register('result')}>
              {deliveryReviewResults.map((result) => (
                <option key={result} value={result}>{deliveryReviewResultLabel(result)}</option>
              ))}
            </SelectField>
            <SelectField label="复盘状态" register={form.register('status')}>
              {deliveryReviewStatuses.map((status) => (
                <option key={status} value={status}>{deliveryReviewStatusLabel(status)}</option>
              ))}
            </SelectField>
            <SelectField label="满意度" register={form.register('satisfaction_level')}>
              {deliveryReviewSatisfactionLevels.map((level) => (
                <option key={level} value={level}>{deliveryReviewSatisfactionLabel(level)}</option>
              ))}
            </SelectField>
            <Field label="验收评分" message={form.formState.errors.acceptance_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('acceptance_score')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">复盘内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="已交付范围" message={form.formState.errors.delivered_scope?.message} register={form.register('delivered_scope')} />
            <LongField label="验收结论" message={form.formState.errors.acceptance_summary?.message} register={form.register('acceptance_summary')} />
            <LongField label="问题复盘" message={form.formState.errors.issue_summary?.message} register={form.register('issue_summary')} />
            <LongField label="改进行动" message={form.formState.errors.improvement_actions?.message} register={form.register('improvement_actions')} />
            <LongField label="扩展计划" message={form.formState.errors.expansion_plan?.message} register={form.register('expansion_plan')} />
            <LongField label="可复用资产" message={form.formState.errors.reusable_assets?.message} register={form.register('reusable_assets')} />
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
            <SelectField label="关联落地方案包" register={form.register('solution_package_id')}>
              <option value="">请选择方案包</option>
              {solutionPackages.map((item) => (
                <option key={item.id} value={item.id}>{item.name} / {item.customer_name} / {item.package_score} 分</option>
              ))}
            </SelectField>
          </div>
          {form.formState.errors.solution_package_id?.message ? (
            <span className="text-xs text-destructive">{form.formState.errors.solution_package_id.message}</span>
          ) : null}
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：验收, 复盘, 试点" {...form.register('tags')} />
          </Field>
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存复盘'}</Button>
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

function LongField({
  label,
  message,
  register,
  rows = 5,
}: {
  label: string;
  message?: string;
  register: UseFormRegisterReturn;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <textarea className="min-h-28 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" rows={rows} {...register} />
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
      <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...register}>{children}</select>
    </label>
  );
}

function splitTags(value?: string) {
  if (!value) return [];

  return Array.from(new Set(value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}
