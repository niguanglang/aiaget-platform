'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { SkillCategory, SkillDetail, SkillStatus, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import { skillCategoryLabel, skillStatusLabel } from '@/components/skills/skill-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const skillCategories = ['GENERAL', 'SALES', 'DESIGN', 'OPERATIONS', 'TRAINING', 'REVIEW'] as const satisfies readonly SkillCategory[];
const skillStatuses = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'] as const satisfies readonly SkillStatus[];

const skillFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。').max(160, '名称过长。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{2,99}$/, '请使用 3-100 位小写字母、数字、下划线或连字符。'),
  category: z.enum(skillCategories),
  status: z.enum(skillStatuses),
  description: z.string().optional(),
  trigger_scenario: z.string().min(1, '请输入触发场景。'),
  input_requirements: z.string().min(1, '请输入输入要求。'),
  execution_steps: z.string().min(1, '请输入执行步骤。'),
  output_format: z.string().min(1, '请输入输出结构。'),
  quality_criteria: z.string().min(1, '请输入质量标准。'),
  boundary_rules: z.string().min(1, '请输入边界规则。'),
  tagsText: z.string().optional(),
  owner_id: z.string().optional(),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;

function formDefaults(skill?: SkillDetail | null): SkillFormValues {
  return {
    name: skill?.name ?? '',
    code: skill?.code ?? '',
    category: skill?.category ?? 'GENERAL',
    status: skill?.status ?? 'DRAFT',
    description: skill?.description ?? '',
    trigger_scenario: skill?.trigger_scenario ?? '当用户请求完成一项可复用业务任务时触发。',
    input_requirements: skill?.input_requirements ?? '说明必填输入、可选上下文和数据来源。',
    execution_steps: skill?.execution_steps ?? '1. 识别目标\n2. 校验输入\n3. 执行步骤\n4. 汇总结果',
    output_format: skill?.output_format ?? '输出结构、字段说明和交付格式。',
    quality_criteria: skill?.quality_criteria ?? '准确性、完整性、可追溯性和可复用性标准。',
    boundary_rules: skill?.boundary_rules ?? '不可处理的范围、升级条件和合规边界。',
    tagsText: skill?.tags.join(', ') ?? '',
    owner_id: skill?.owner?.id ?? '',
  };
}

export function toCreateSkillInput(values: SkillFormValues) {
  return {
    name: values.name,
    code: values.code,
    category: values.category,
    description: values.description || null,
    trigger_scenario: values.trigger_scenario,
    input_requirements: values.input_requirements,
    execution_steps: values.execution_steps,
    output_format: values.output_format,
    quality_criteria: values.quality_criteria,
    boundary_rules: values.boundary_rules,
    tags: parseTags(values.tagsText),
    owner_id: values.owner_id || null,
  };
}

export function toUpdateSkillInput(values: SkillFormValues) {
  return {
    name: values.name,
    category: values.category,
    status: values.status,
    description: values.description || null,
    trigger_scenario: values.trigger_scenario,
    input_requirements: values.input_requirements,
    execution_steps: values.execution_steps,
    output_format: values.output_format,
    quality_criteria: values.quality_criteria,
    boundary_rules: values.boundary_rules,
    tags: parseTags(values.tagsText),
    owner_id: values.owner_id || null,
  };
}

function parseTags(value?: string) {
  return (value ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function SkillFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  owners,
  skill,
}: {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: SkillFormValues) => void;
  owners: UserListItem[];
  skill?: SkillDetail | null;
}) {
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: formDefaults(skill),
  });

  useEffect(() => {
    form.reset(formDefaults(skill));
  }, [form, mode, skill]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background shadow-sm">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑 Skill' : '新建 Skill'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              表单维护完整 SOP 字段，发布版本和 Agent 引用请在详情页处理。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-5 p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label="编码" message={form.formState.errors.code?.message}>
            <Input readOnly={isEditing} {...form.register('code')} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="分类" message={form.formState.errors.category?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('category')}>
              {skillCategories.map((category) => (
                <option key={category} value={category}>
                  {skillCategoryLabel(category)}
                </option>
              ))}
            </select>
          </Field>
          {isEditing ? (
            <Field label="状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('status')}>
                {skillStatuses.map((status) => (
                  <option key={status} value={status}>
                    {skillStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
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

        <Field label="描述" message={form.formState.errors.description?.message}>
          <textarea className="min-h-20 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...form.register('description')} />
        </Field>

        <Field label="标签" message={form.formState.errors.tagsText?.message}>
          <Input placeholder="用英文逗号分隔，例如：客服, 质检, 标准流程" {...form.register('tagsText')} />
        </Field>

        <div className="grid gap-4 xl:grid-cols-2">
          <LongField label="触发场景" message={form.formState.errors.trigger_scenario?.message} register={form.register('trigger_scenario')} />
          <LongField label="输入要求" message={form.formState.errors.input_requirements?.message} register={form.register('input_requirements')} />
          <LongField label="执行步骤" message={form.formState.errors.execution_steps?.message} register={form.register('execution_steps')} />
          <LongField label="输出结构" message={form.formState.errors.output_format?.message} register={form.register('output_format')} />
          <LongField label="质量标准" message={form.formState.errors.quality_criteria?.message} register={form.register('quality_criteria')} />
          <LongField label="边界规则" message={form.formState.errors.boundary_rules?.message} register={form.register('boundary_rules')} />
        </div>

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
            {isEditing ? '保存修改' : '新建 Skill'}
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
        className="min-h-40 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...register}
      />
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
