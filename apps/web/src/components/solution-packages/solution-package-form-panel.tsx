'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CustomerAssessmentListItem, RoleScenarioListItem, SolutionPackageDetail, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  solutionCustomerTypeLabel,
  solutionCustomerTypes,
  solutionPriorities,
  solutionPriorityLabel,
  solutionStageLabel,
  solutionStages,
  solutionStatusLabel,
  solutionStatuses,
} from '@/components/solution-packages/solution-package-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '方案包名称至少需要 2 个字符。').max(180, '方案包名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  industry: z.string().optional(),
  customer_type: z.enum(solutionCustomerTypes),
  package_stage: z.enum(solutionStages),
  status: z.enum(solutionStatuses),
  priority: z.enum(solutionPriorities),
  executive_summary: z.string().min(1, '请输入方案摘要。'),
  business_objectives: z.string().min(1, '请输入业务目标。'),
  scope_summary: z.string().min(1, '请输入落地范围。'),
  scenario_blueprint: z.string().min(1, '请输入场景蓝图。'),
  delivery_roadmap: z.string().min(1, '请输入交付路线图。'),
  acceptance_plan: z.string().min(1, '请输入验收计划。'),
  roi_summary: z.string().min(1, '请输入 ROI 摘要。'),
  risk_mitigation: z.string().min(1, '请输入风险缓释。'),
  commercial_strategy: z.string().min(1, '请输入商务推进策略。'),
  next_milestone: z.string().min(1, '请输入下一里程碑。'),
  package_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  customer_assessment_id: z.string().optional(),
  role_scenario_id: z.string().optional(),
});

export type SolutionPackageFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<SolutionPackageFormValues>;

function defaults(solutionPackage?: SolutionPackageDetail | null): SolutionPackageFormValues {
  return {
    name: solutionPackage?.name ?? '',
    code: solutionPackage?.code ?? '',
    customer_name: solutionPackage?.customer_name ?? '华中设计院',
    industry: solutionPackage?.industry ?? '设计院',
    customer_type: solutionPackage?.customer_type ?? 'TASK_DRIVEN',
    package_stage: solutionPackage?.package_stage ?? 'PILOT_DESIGN',
    status: solutionPackage?.status ?? 'DRAFT',
    priority: solutionPackage?.priority ?? 'MEDIUM',
    executive_summary:
      solutionPackage?.executive_summary ??
      '围绕客户当前最清晰的业务目标，把客户评估和岗位场景整理为可执行、可验收、可复盘的 AI 落地方案。',
    business_objectives:
      solutionPackage?.business_objectives ??
      '让历史资料稳定检索，方案产出标准化，员工可以通过统一入口调用公司知识，并保留审核与复盘记录。',
    scope_summary: solutionPackage?.scope_summary ?? '首期覆盖一个高价值岗位、一个知识库、一个 Agent 和一套交付成果验收口径。',
    scenario_blueprint:
      solutionPackage?.scenario_blueprint ??
      '客户分层 -> 六问判断 -> 岗位场景编排 -> Agent/Skill/知识库绑定 -> 交付成果输出 -> 验收复盘。',
    delivery_roadmap:
      solutionPackage?.delivery_roadmap ??
      '第 1 周完成资料盘点和权限边界；第 2 周完成场景配置和成果输出；第 3 周完成试点验收和扩展计划。',
    acceptance_plan:
      solutionPackage?.acceptance_plan ??
      '验收材料包含交付成果、引用来源、风险提示、权限审计、运行日志和业务负责人复盘结论。',
    roi_summary: solutionPackage?.roi_summary ?? '方案准备时间下降 40%，重复返工下降 30%，关键引用遗漏率低于 5%。',
    risk_mitigation: solutionPackage?.risk_mitigation ?? '先采用只读知识检索、人工审核和安全策略前置，避免高危工具直接进入生产流程。',
    commercial_strategy: solutionPackage?.commercial_strategy ?? '先用小范围试点证明交付成果，再扩展到更多岗位、知识库和渠道。',
    next_milestone: solutionPackage?.next_milestone ?? '完成客户资料清单确认，并安排方案评审会。',
    package_score: solutionPackage?.package_score ?? 85,
    tags: solutionPackage?.tags.join(', ') ?? '',
    notes: solutionPackage?.notes ?? '',
    owner_id: solutionPackage?.owner?.id ?? '',
    customer_assessment_id: solutionPackage?.linked_resources.customer_assessment?.id ?? '',
    role_scenario_id: solutionPackage?.linked_resources.role_scenario?.id ?? '',
  };
}

export function toCreateSolutionPackageInput(values: SolutionPackageFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    industry: values.industry || null,
    customer_type: values.customer_type,
    package_stage: values.package_stage,
    status: values.status,
    priority: values.priority,
    executive_summary: values.executive_summary,
    business_objectives: values.business_objectives,
    scope_summary: values.scope_summary,
    scenario_blueprint: values.scenario_blueprint,
    delivery_roadmap: values.delivery_roadmap,
    acceptance_plan: values.acceptance_plan,
    roi_summary: values.roi_summary,
    risk_mitigation: values.risk_mitigation,
    commercial_strategy: values.commercial_strategy,
    next_milestone: values.next_milestone,
    package_score: values.package_score,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    customer_assessment_id: values.customer_assessment_id || null,
    role_scenario_id: values.role_scenario_id || null,
  };
}

export function toUpdateSolutionPackageInput(values: SolutionPackageFormValues) {
  return toCreateSolutionPackageInput(values);
}

export function SolutionPackageFormPanel({
  assessments,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  roleScenarios,
  solutionPackage,
}: {
  assessments: CustomerAssessmentListItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: SolutionPackageFormValues) => void;
  owners: UserListItem[];
  roleScenarios: RoleScenarioListItem[];
  solutionPackage?: SolutionPackageDetail | null;
}) {
  const form = useForm<SolutionPackageFormValues>({
    resolver: formResolver,
    defaultValues: defaults(solutionPackage),
  });

  useEffect(() => {
    form.reset(defaults(solutionPackage));
  }, [form, solutionPackage, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑落地方案' : '新建落地方案'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              独立表单维护完整交付路线图、验收计划、ROI、风险缓释和关联资源。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: SolutionPackageFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="方案包名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="方案包编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <Field label="客户行业" message={form.formState.errors.industry?.message}>
              <Input {...form.register('industry')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="客户类型" message={form.formState.errors.customer_type?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('customer_type')}>
                {solutionCustomerTypes.map((type) => (
                  <option key={type} value={type}>{solutionCustomerTypeLabel(type)}</option>
                ))}
              </select>
            </Field>
            <Field label="方案阶段" message={form.formState.errors.package_stage?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('package_stage')}>
                {solutionStages.map((stage) => (
                  <option key={stage} value={stage}>{solutionStageLabel(stage)}</option>
                ))}
              </select>
            </Field>
            <Field label="状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {solutionStatuses.map((status) => (
                  <option key={status} value={status}>{solutionStatusLabel(status)}</option>
                ))}
              </select>
            </Field>
            <Field label="优先级" message={form.formState.errors.priority?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('priority')}>
                {solutionPriorities.map((priority) => (
                  <option key={priority} value={priority}>{solutionPriorityLabel(priority)}</option>
                ))}
              </select>
            </Field>
            <Field label="方案评分" message={form.formState.errors.package_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('package_score')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">方案内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="方案摘要" message={form.formState.errors.executive_summary?.message} register={form.register('executive_summary')} />
            <LongField label="业务目标" message={form.formState.errors.business_objectives?.message} register={form.register('business_objectives')} />
            <LongField label="落地范围" message={form.formState.errors.scope_summary?.message} register={form.register('scope_summary')} />
            <LongField label="场景蓝图" message={form.formState.errors.scenario_blueprint?.message} register={form.register('scenario_blueprint')} />
            <LongField label="交付路线图" message={form.formState.errors.delivery_roadmap?.message} register={form.register('delivery_roadmap')} />
            <LongField label="验收计划" message={form.formState.errors.acceptance_plan?.message} register={form.register('acceptance_plan')} />
            <LongField label="ROI 摘要" message={form.formState.errors.roi_summary?.message} register={form.register('roi_summary')} />
            <LongField label="风险缓释" message={form.formState.errors.risk_mitigation?.message} register={form.register('risk_mitigation')} />
            <LongField label="商务推进" message={form.formState.errors.commercial_strategy?.message} register={form.register('commercial_strategy')} />
            <LongField label="下一里程碑" message={form.formState.errors.next_milestone?.message} register={form.register('next_milestone')} />
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">关联资源</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="负责人" register={form.register('owner_id')}>
              <option value="">当前用户</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
              ))}
            </SelectField>
            <SelectField label="客户评估" register={form.register('customer_assessment_id')}>
              <option value="">不绑定客户评估</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.customer_name} / {solutionCustomerTypeLabel(assessment.customer_type)} / {assessment.readiness_score} 分
                </option>
              ))}
            </SelectField>
            <SelectField label="岗位场景" register={form.register('role_scenario_id')}>
              <option value="">不绑定岗位场景</option>
              {roleScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} / {scenario.role_name} / {scenario.impact_score} 分
                </option>
              ))}
            </SelectField>
          </div>
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：设计院, 试点, 方案验收" {...form.register('tags')} />
          </Field>
          <LongField label="内部备注" message={form.formState.errors.notes?.message} register={form.register('notes')} rows={3} />
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存方案包'}</Button>
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
