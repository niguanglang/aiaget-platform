'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type {
  AgentListItem,
  KnowledgeBaseListItem,
  PromptTemplateListItem,
  RoleScenarioDetail,
  SkillListItem,
  ToolListItem,
  UserListItem,
} from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  scenarioPriorities,
  scenarioPriorityLabel,
  scenarioStatuses,
  scenarioStatusLabel,
  scenarioTypeLabel,
  scenarioTypes,
} from '@/components/role-scenarios/role-scenario-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '场景包名称至少需要 2 个字符。').max(160, '场景包名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  role_name: z.string().min(1, '请输入目标岗位。').max(120, '目标岗位过长。'),
  department_name: z.string().min(1, '请输入适用部门。').max(120, '适用部门过长。'),
  scenario_type: z.enum(scenarioTypes),
  status: z.enum(scenarioStatuses),
  priority: z.enum(scenarioPriorities),
  pain_point: z.string().min(1, '请输入业务痛点。'),
  business_goal: z.string().min(1, '请输入业务目标。'),
  workflow_summary: z.string().min(1, '请输入流程编排。'),
  expected_outcome: z.string().min(1, '请输入预期成果。'),
  sample_deliverable: z.string().min(1, '请输入样板成果。'),
  acceptance_criteria: z.string().min(1, '请输入验收标准。'),
  roi_metric: z.string().min(1, '请输入 ROI 指标。'),
  impact_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  agent_id: z.string().optional(),
  skill_id: z.string().optional(),
  knowledge_id: z.string().optional(),
  tool_id: z.string().optional(),
  prompt_id: z.string().optional(),
});

export type RoleScenarioFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<RoleScenarioFormValues>;

function defaults(scenario?: RoleScenarioDetail | null): RoleScenarioFormValues {
  return {
    name: scenario?.name ?? '',
    code: scenario?.code ?? '',
    role_name: scenario?.role_name ?? '售前顾问',
    department_name: scenario?.department_name ?? '解决方案部',
    scenario_type: scenario?.scenario_type ?? 'SALES',
    status: scenario?.status ?? 'DRAFT',
    priority: scenario?.priority ?? 'MEDIUM',
    pain_point: scenario?.pain_point ?? '岗位资料分散、流程动作难复用，AI 产出和业务验收之间缺少稳定连接。',
    business_goal: scenario?.business_goal ?? '把岗位工作目标、业务流程、平台资产和验收口径整理成可演示、可复用的 AI 场景包。',
    workflow_summary: scenario?.workflow_summary ?? '识别岗位痛点 -> 绑定 Agent/Skill/知识库/工具/提示词 -> 生成样板成果 -> 按验收标准试点。',
    expected_outcome: scenario?.expected_outcome ?? '形成可复用场景包，降低重复配置和交付返工。',
    sample_deliverable: scenario?.sample_deliverable ?? '一份包含岗位画像、流程步骤、关联资产、样板成果和验收标准的交付说明。',
    acceptance_criteria: scenario?.acceptance_criteria ?? '场景包关联资产完整，输出格式稳定，业务负责人能按验收标准判断是否可试点。',
    roi_metric: scenario?.roi_metric ?? '交付准备时间下降、返工次数下降、验收通过率提升。',
    impact_score: scenario?.impact_score ?? 80,
    tags: scenario?.tags.join(', ') ?? '',
    notes: scenario?.notes ?? '',
    owner_id: scenario?.owner?.id ?? '',
    agent_id: scenario?.linked_resources.agent?.id ?? '',
    skill_id: scenario?.linked_resources.skill?.id ?? '',
    knowledge_id: scenario?.linked_resources.knowledge?.id ?? '',
    tool_id: scenario?.linked_resources.tool?.id ?? '',
    prompt_id: scenario?.linked_resources.prompt?.id ?? '',
  };
}

export function toCreateRoleScenarioInput(values: RoleScenarioFormValues) {
  return {
    name: values.name,
    code: values.code,
    role_name: values.role_name,
    department_name: values.department_name,
    scenario_type: values.scenario_type,
    status: values.status,
    priority: values.priority,
    pain_point: values.pain_point,
    business_goal: values.business_goal,
    workflow_summary: values.workflow_summary,
    expected_outcome: values.expected_outcome,
    sample_deliverable: values.sample_deliverable,
    acceptance_criteria: values.acceptance_criteria,
    roi_metric: values.roi_metric,
    impact_score: values.impact_score,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    agent_id: values.agent_id || null,
    skill_id: values.skill_id || null,
    knowledge_id: values.knowledge_id || null,
    tool_id: values.tool_id || null,
    prompt_id: values.prompt_id || null,
  };
}

export function toUpdateRoleScenarioInput(values: RoleScenarioFormValues) {
  return toCreateRoleScenarioInput(values);
}

export function RoleScenarioFormPanel({
  agents,
  error,
  isPending,
  knowledgeBases,
  mode,
  onClose,
  onSubmit,
  owners,
  prompts,
  scenario,
  skills,
  tools,
}: {
  agents: AgentListItem[];
  error?: string | null;
  isPending: boolean;
  knowledgeBases: KnowledgeBaseListItem[];
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: RoleScenarioFormValues) => void;
  owners: UserListItem[];
  prompts: PromptTemplateListItem[];
  scenario?: RoleScenarioDetail | null;
  skills: SkillListItem[];
  tools: ToolListItem[];
}) {
  const form = useForm<RoleScenarioFormValues>({
    resolver: formResolver,
    defaultValues: defaults(scenario),
  });

  useEffect(() => {
    form.reset(defaults(scenario));
  }, [form, scenario, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑岗位场景' : '新建岗位场景'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              独立表单维护完整流程、样板成果、验收标准和平台资产绑定，列表页只展示摘要。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: RoleScenarioFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="场景包名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="场景包编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="目标岗位" message={form.formState.errors.role_name?.message}>
              <Input {...form.register('role_name')} />
            </Field>
            <Field label="适用部门" message={form.formState.errors.department_name?.message}>
              <Input {...form.register('department_name')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="场景类型" message={form.formState.errors.scenario_type?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('scenario_type')}>
                {scenarioTypes.map((type) => (
                  <option key={type} value={type}>{scenarioTypeLabel(type)}</option>
                ))}
              </select>
            </Field>
            <Field label="状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {scenarioStatuses.map((status) => (
                  <option key={status} value={status}>{scenarioStatusLabel(status)}</option>
                ))}
              </select>
            </Field>
            <Field label="优先级" message={form.formState.errors.priority?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('priority')}>
                {scenarioPriorities.map((priority) => (
                  <option key={priority} value={priority}>{scenarioPriorityLabel(priority)}</option>
                ))}
              </select>
            </Field>
            <Field label="价值评分" message={form.formState.errors.impact_score?.message}>
              <Input max={100} min={0} type="number" {...form.register('impact_score')} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">落地内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="业务痛点" message={form.formState.errors.pain_point?.message} register={form.register('pain_point')} />
            <LongField label="业务目标" message={form.formState.errors.business_goal?.message} register={form.register('business_goal')} />
            <LongField label="流程编排" message={form.formState.errors.workflow_summary?.message} register={form.register('workflow_summary')} />
            <LongField label="预期成果" message={form.formState.errors.expected_outcome?.message} register={form.register('expected_outcome')} />
            <LongField label="样板成果" message={form.formState.errors.sample_deliverable?.message} register={form.register('sample_deliverable')} />
            <LongField label="验收标准" message={form.formState.errors.acceptance_criteria?.message} register={form.register('acceptance_criteria')} />
          </div>
          <LongField label="ROI 指标" message={form.formState.errors.roi_metric?.message} register={form.register('roi_metric')} />
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">关联资产</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField label="负责人" register={form.register('owner_id')}>
              <option value="">当前用户</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
              ))}
            </SelectField>
            <SelectField label="Agent" register={form.register('agent_id')}>
              <option value="">暂不绑定</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name} ({agent.code})</option>
              ))}
            </SelectField>
            <SelectField label="Skill" register={form.register('skill_id')}>
              <option value="">暂不绑定</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name} ({skill.code})</option>
              ))}
            </SelectField>
            <SelectField label="知识库" register={form.register('knowledge_id')}>
              <option value="">暂不绑定</option>
              {knowledgeBases.map((base) => (
                <option key={base.id} value={base.id}>{base.name} ({base.code})</option>
              ))}
            </SelectField>
            <SelectField label="工具" register={form.register('tool_id')}>
              <option value="">暂不绑定</option>
              {tools.map((tool) => (
                <option key={tool.id} value={tool.id}>{tool.name} ({tool.code})</option>
              ))}
            </SelectField>
            <SelectField label="提示词" register={form.register('prompt_id')}>
              <option value="">暂不绑定</option>
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>{prompt.name} ({prompt.code})</option>
              ))}
            </SelectField>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">补充信息</h3>
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：售前, 方案, 样板成果" {...form.register('tags')} />
          </Field>
          <LongField label="备注" message={form.formState.errors.notes?.message} register={form.register('notes')} />
        </section>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
          <Button onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存'}</Button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

function SelectField({ children, label, register }: { children: React.ReactNode; label: string; register: UseFormRegisterReturn }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...register}>{children}</select>
    </label>
  );
}

function LongField({ label, message, register }: { label: string; message?: string; register: UseFormRegisterReturn }) {
  return (
    <Field label={label} message={message}>
      <textarea className="min-h-28 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" {...register} />
    </Field>
  );
}

function splitTags(value?: string) {
  return Array.from(new Set((value ?? '').split(/[，,]/).map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}
