'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CustomerAssessmentDetail, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  assessmentStatusLabel,
  customerTypeLabel,
  decisionStageLabel,
} from '@/components/customer-assessments/customer-assessment-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const customerTypes = ['UNKNOWN', 'ANXIOUS', 'TASK_DRIVEN', 'CLEAR'] as const;
const decisionStages = ['LEARNING', 'EVALUATION', 'PROCUREMENT', 'PILOT', 'DELIVERY'] as const;
const assessmentStatuses = ['DISCOVERY', 'QUALIFIED', 'NURTURING', 'WON', 'LOST', 'ARCHIVED'] as const;

const scoreSchema = z.coerce.number().int().min(1, '最低 1 分。').max(5, '最高 5 分。');

const assessmentFormSchema = z.object({
  customer_name: z.string().min(2, '客户名称至少需要 2 个字符。').max(160, '客户名称过长。'),
  customer_type: z.enum(customerTypes),
  decision_stage: z.enum(decisionStages),
  status: z.enum(assessmentStatuses),
  industry: z.string().optional(),
  contact_name: z.string().optional(),
  contact_info: z.string().optional(),
  business_goal: z.string().min(1, '请输入经营目标判断。'),
  process_maturity: z.string().min(1, '请输入流程成熟度判断。'),
  data_asset_status: z.string().min(1, '请输入知识资产状态。'),
  management_support: z.string().min(1, '请输入管理层推动情况。'),
  budget_signal: z.string().min(1, '请输入预算与采购信号。'),
  customer_type_clarity: scoreSchema,
  decision_intent: scoreSchema,
  business_goal_score: scoreSchema,
  process_maturity_score: scoreSchema,
  data_assets: scoreSchema,
  management_budget: scoreSchema,
  risk_summary: z.string().min(1, '请输入风险提示。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
});

export type CustomerAssessmentFormValues = z.infer<typeof assessmentFormSchema>;
const assessmentFormResolver = zodResolver(assessmentFormSchema) as Resolver<CustomerAssessmentFormValues>;

function formDefaults(assessment?: CustomerAssessmentDetail | null): CustomerAssessmentFormValues {
  return {
    customer_name: assessment?.customer_name ?? '',
    customer_type: assessment?.customer_type ?? 'UNKNOWN',
    decision_stage: assessment?.decision_stage ?? 'LEARNING',
    status: assessment?.status ?? 'DISCOVERY',
    industry: assessment?.industry ?? '',
    contact_name: assessment?.contact_name ?? '',
    contact_info: assessment?.contact_info ?? '',
    business_goal: assessment?.business_goal ?? '',
    process_maturity: assessment?.process_maturity ?? '',
    data_asset_status: assessment?.data_asset_status ?? '',
    management_support: assessment?.management_support ?? '',
    budget_signal: assessment?.budget_signal ?? '',
    customer_type_clarity: assessment?.six_question_scores.customer_type_clarity ?? 3,
    decision_intent: assessment?.six_question_scores.decision_intent ?? 3,
    business_goal_score: assessment?.six_question_scores.business_goal ?? 3,
    process_maturity_score: assessment?.six_question_scores.process_maturity ?? 3,
    data_assets: assessment?.six_question_scores.data_assets ?? 3,
    management_budget: assessment?.six_question_scores.management_budget ?? 3,
    risk_summary: assessment?.risk_summary ?? '',
    next_action: assessment?.next_action ?? '',
    notes: assessment?.notes ?? '',
    owner_id: assessment?.owner?.id ?? '',
  };
}

export function toCreateCustomerAssessmentInput(values: CustomerAssessmentFormValues) {
  return {
    customer_name: values.customer_name,
    customer_type: values.customer_type,
    decision_stage: values.decision_stage,
    status: values.status,
    industry: values.industry || null,
    contact_name: values.contact_name || null,
    contact_info: values.contact_info || null,
    business_goal: values.business_goal,
    process_maturity: values.process_maturity,
    data_asset_status: values.data_asset_status,
    management_support: values.management_support,
    budget_signal: values.budget_signal,
    six_question_scores: toScores(values),
    risk_summary: values.risk_summary,
    next_action: values.next_action,
    notes: values.notes || null,
    owner_id: values.owner_id || null,
  };
}

export function toUpdateCustomerAssessmentInput(values: CustomerAssessmentFormValues) {
  return {
    customer_name: values.customer_name,
    customer_type: values.customer_type,
    decision_stage: values.decision_stage,
    status: values.status,
    industry: values.industry || null,
    contact_name: values.contact_name || null,
    contact_info: values.contact_info || null,
    business_goal: values.business_goal,
    process_maturity: values.process_maturity,
    data_asset_status: values.data_asset_status,
    management_support: values.management_support,
    budget_signal: values.budget_signal,
    six_question_scores: toScores(values),
    risk_summary: values.risk_summary,
    next_action: values.next_action,
    notes: values.notes || null,
    owner_id: values.owner_id || null,
  };
}

function toScores(values: CustomerAssessmentFormValues) {
  return {
    customer_type_clarity: values.customer_type_clarity,
    decision_intent: values.decision_intent,
    business_goal: values.business_goal_score,
    process_maturity: values.process_maturity_score,
    data_assets: values.data_assets,
    management_budget: values.management_budget,
  };
}

export function CustomerAssessmentFormPanel({
  assessment,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
}: {
  assessment?: CustomerAssessmentDetail | null;
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: CustomerAssessmentFormValues) => void;
  owners: UserListItem[];
}) {
  const form = useForm<CustomerAssessmentFormValues>({
    resolver: assessmentFormResolver,
    defaultValues: formDefaults(assessment),
  });

  useEffect(() => {
    form.reset(formDefaults(assessment));
  }, [assessment, form, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑客户评估' : '新建客户评估'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              表单页维护完整客户画像、六问评分、建议打法、风险提示和下一步动作。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

  <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: CustomerAssessmentFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <Field label="行业" message={form.formState.errors.industry?.message}>
              <Input placeholder="例如：制造业、设计院、政企" {...form.register('industry')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="客户类型" message={form.formState.errors.customer_type?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('customer_type')}>
                {customerTypes.map((type) => (
                  <option key={type} value={type}>
                    {customerTypeLabel(type)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="决策阶段" message={form.formState.errors.decision_stage?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('decision_stage')}>
                {decisionStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {decisionStageLabel(stage)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="评估状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {assessmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {assessmentStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="联系人" message={form.formState.errors.contact_name?.message}>
              <Input {...form.register('contact_name')} />
            </Field>
            <Field label="联系方式" message={form.formState.errors.contact_info?.message}>
              <Input {...form.register('contact_info')} />
            </Field>
            <Field label="负责人" message={form.formState.errors.owner_id?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('owner_id')}>
                <option value="">当前用户</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">六问判断</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="经营目标" message={form.formState.errors.business_goal?.message} register={form.register('business_goal')} />
            <LongField label="流程成熟度" message={form.formState.errors.process_maturity?.message} register={form.register('process_maturity')} />
            <LongField label="知识资产" message={form.formState.errors.data_asset_status?.message} register={form.register('data_asset_status')} />
            <LongField label="管理层推动" message={form.formState.errors.management_support?.message} register={form.register('management_support')} />
            <LongField label="预算信号" message={form.formState.errors.budget_signal?.message} register={form.register('budget_signal')} />
            <LongField label="风险提示" message={form.formState.errors.risk_summary?.message} register={form.register('risk_summary')} />
          </div>
          <LongField label="下一步动作" message={form.formState.errors.next_action?.message} register={form.register('next_action')} />
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">六问评分</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ScoreField label="客户类型清晰度" message={form.formState.errors.customer_type_clarity?.message} register={form.register('customer_type_clarity')} />
            <ScoreField label="采购决策意图" message={form.formState.errors.decision_intent?.message} register={form.register('decision_intent')} />
            <ScoreField label="经营目标明确度" message={form.formState.errors.business_goal_score?.message} register={form.register('business_goal_score')} />
            <ScoreField label="流程成熟度" message={form.formState.errors.process_maturity_score?.message} register={form.register('process_maturity_score')} />
            <ScoreField label="数据/知识资产" message={form.formState.errors.data_assets?.message} register={form.register('data_assets')} />
            <ScoreField label="管理预算意识" message={form.formState.errors.management_budget?.message} register={form.register('management_budget')} />
          </div>
        </section>

        <Field label="备注" message={form.formState.errors.notes?.message}>
          <textarea className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...form.register('notes')} />
        </Field>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="-mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            {isEditing ? '保存修改' : '新建评估'}
          </Button>
        </div>
      </form>
    </section>
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
    <Field label={label} message={message}>
      <textarea
        className="min-h-32 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...register}
      />
    </Field>
  );
}

function ScoreField({
  label,
  message,
  register,
}: {
  label: string;
  message?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <Field label={label} message={message}>
      <Input max={5} min={1} type="number" {...register} />
    </Field>
  );
}

function Field({
  children,
  label,
  message,
}: {
  children: React.ReactNode;
  label: string;
  message?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}
