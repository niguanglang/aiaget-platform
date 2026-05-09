'use client';

import type {
  AgentListItem,
  DeliveryAssetDetail,
  DeliveryReviewListItem,
  KnowledgeBaseListItem,
  SkillListItem,
  SolutionPackageListItem,
  UserListItem,
} from '@aiaget/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  deliveryAssetStatusLabel,
  deliveryAssetStatuses,
  deliveryAssetTypeLabel,
  deliveryAssetTypes,
  deliveryAssetVisibilityLabel,
  deliveryAssetVisibilities,
} from '@/components/delivery-assets/delivery-asset-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, '资产名称至少需要 2 个字符。').max(180, '资产名称过长。'),
  code: z.string().regex(/^[a-z][a-z0-9_-]{2,99}$/, '编码需以小写字母开头，仅支持小写字母、数字、下划线和短横线。'),
  customer_name: z.string().min(1, '请输入客户名称。').max(160, '客户名称过长。'),
  asset_type: z.enum(deliveryAssetTypes),
  status: z.enum(deliveryAssetStatuses),
  visibility: z.enum(deliveryAssetVisibilities),
  reuse_score: z.coerce.number().int().min(0, '最低 0 分。').max(100, '最高 100 分。').optional(),
  summary: z.string().min(1, '请输入资产摘要。'),
  business_value: z.string().min(1, '请输入业务价值。'),
  reuse_guidance: z.string().min(1, '请输入复用指引。'),
  source_context: z.string().min(1, '请输入来源上下文。'),
  risk_notes: z.string().min(1, '请输入风险说明。'),
  next_action: z.string().min(1, '请输入下一步动作。'),
  tags: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().optional(),
  delivery_review_id: z.string().min(1, '请选择来源验收复盘。'),
  solution_package_id: z.string().optional(),
  skill_id: z.string().optional(),
  agent_id: z.string().optional(),
  knowledge_id: z.string().optional(),
});

export type DeliveryAssetFormValues = z.infer<typeof formSchema>;
const formResolver = zodResolver(formSchema) as Resolver<DeliveryAssetFormValues>;

function defaults(asset?: DeliveryAssetDetail | null): DeliveryAssetFormValues {
  return {
    name: asset?.name ?? '',
    code: asset?.code ?? '',
    customer_name: asset?.customer_name ?? '华中设计院',
    asset_type: asset?.asset_type ?? 'SOLUTION_TEMPLATE',
    status: asset?.status ?? 'PUBLISHED',
    visibility: asset?.visibility ?? 'TENANT',
    reuse_score: asset?.reuse_score ?? 92,
    summary: asset?.summary ?? '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类任务型客户试点复用。',
    business_value: asset?.business_value ?? '降低方案准备时间，减少验收返工，并统一引用来源、风险说明和验收口径。',
    reuse_guidance: asset?.reuse_guidance ?? '适用于任务型客户的售前方案试点，可复制到投标资料问答、项目复盘助手和客户成功运营场景。',
    source_context: asset?.source_context ?? '来源于华中设计院试点验收复盘，客户确认样板成果可进入扩展阶段。',
    risk_notes: asset?.risk_notes ?? '复用前需要确认客户资料权限、行业术语、知识库密级和输出审核责任。',
    next_action: asset?.next_action ?? '把资产同步到 Skill Hub，并标记为售前方案交付推荐资产。',
    tags: asset?.tags.join(', ') ?? '',
    notes: asset?.notes ?? '',
    owner_id: asset?.owner?.id ?? '',
    delivery_review_id: asset?.linked_resources.delivery_review?.id ?? '',
    solution_package_id: asset?.linked_resources.solution_package?.id ?? '',
    skill_id: asset?.linked_resources.skill?.id ?? '',
    agent_id: asset?.linked_resources.agent?.id ?? '',
    knowledge_id: asset?.linked_resources.knowledge_base?.id ?? '',
  };
}

export function toCreateDeliveryAssetInput(values: DeliveryAssetFormValues) {
  return {
    name: values.name,
    code: values.code,
    customer_name: values.customer_name,
    asset_type: values.asset_type,
    status: values.status,
    visibility: values.visibility,
    reuse_score: values.reuse_score,
    summary: values.summary,
    business_value: values.business_value,
    reuse_guidance: values.reuse_guidance,
    source_context: values.source_context,
    risk_notes: values.risk_notes,
    next_action: values.next_action,
    tags: splitTags(values.tags),
    notes: values.notes || null,
    owner_id: values.owner_id || null,
    delivery_review_id: values.delivery_review_id,
    solution_package_id: values.solution_package_id || null,
    skill_id: values.skill_id || null,
    agent_id: values.agent_id || null,
    knowledge_id: values.knowledge_id || null,
  };
}

export function toUpdateDeliveryAssetInput(values: DeliveryAssetFormValues) {
  return toCreateDeliveryAssetInput(values);
}

export function DeliveryAssetFormPanel({
  agents,
  asset,
  deliveryReviews,
  error,
  isPending,
  knowledgeBases,
  mode,
  onClose,
  onSubmit,
  owners,
  skills,
  solutionPackages,
}: {
  agents: AgentListItem[];
  asset?: DeliveryAssetDetail | null;
  deliveryReviews: DeliveryReviewListItem[];
  error?: string | null;
  isPending: boolean;
  knowledgeBases: KnowledgeBaseListItem[];
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: DeliveryAssetFormValues) => void;
  owners: UserListItem[];
  skills: SkillListItem[];
  solutionPackages: SolutionPackageListItem[];
}) {
  const form = useForm<DeliveryAssetFormValues>({
    resolver: formResolver,
    defaultValues: defaults(asset),
  });

  useEffect(() => {
    form.reset(defaults(asset));
  }, [form, asset, mode]);

  const isEditing = mode === 'edit';

  return (
    <section className="grid rounded-lg border bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑成果资产' : '新建成果资产'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              独立表单维护资产类型、复用评分、业务价值、复用指引、来源上下文、风险说明和关联资源。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-6 p-6" onSubmit={form.handleSubmit(onSubmit as (values: DeliveryAssetFormValues) => void)}>
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">基础信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="资产名称" message={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="资产编码" message={form.formState.errors.code?.message}>
              <Input disabled={isEditing} {...form.register('code')} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="客户名称" message={form.formState.errors.customer_name?.message}>
              <Input {...form.register('customer_name')} />
            </Field>
            <SelectField label="资产类型" register={form.register('asset_type')}>
              {deliveryAssetTypes.map((type) => (
                <option key={type} value={type}>{deliveryAssetTypeLabel(type)}</option>
              ))}
            </SelectField>
            <SelectField label="资产状态" register={form.register('status')}>
              {deliveryAssetStatuses.map((status) => (
                <option key={status} value={status}>{deliveryAssetStatusLabel(status)}</option>
              ))}
            </SelectField>
            <SelectField label="可见范围" register={form.register('visibility')}>
              {deliveryAssetVisibilities.map((visibility) => (
                <option key={visibility} value={visibility}>{deliveryAssetVisibilityLabel(visibility)}</option>
              ))}
            </SelectField>
          </div>
          <Field label="复用评分" message={form.formState.errors.reuse_score?.message}>
            <Input max={100} min={0} type="number" {...form.register('reuse_score')} />
          </Field>
        </section>

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">资产内容</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            <LongField label="资产摘要" message={form.formState.errors.summary?.message} register={form.register('summary')} />
            <LongField label="业务价值" message={form.formState.errors.business_value?.message} register={form.register('business_value')} />
            <LongField label="复用指引" message={form.formState.errors.reuse_guidance?.message} register={form.register('reuse_guidance')} />
            <LongField label="来源上下文" message={form.formState.errors.source_context?.message} register={form.register('source_context')} />
            <LongField label="风险说明" message={form.formState.errors.risk_notes?.message} register={form.register('risk_notes')} />
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
            <SelectField label="关联落地方案包" register={form.register('solution_package_id')}>
              <option value="">从复盘自动推导</option>
              {solutionPackages.map((item) => (
                <option key={item.id} value={item.id}>{item.name} / {item.customer_name} / {item.package_score} 分</option>
              ))}
            </SelectField>
            <SelectField label="关联 Skill" register={form.register('skill_id')}>
              <option value="">不绑定 Skill</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name} / {skill.category}</option>
              ))}
            </SelectField>
            <SelectField label="关联 Agent" register={form.register('agent_id')}>
              <option value="">不绑定 Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name} / {agent.status}</option>
              ))}
            </SelectField>
            <SelectField label="关联知识库" register={form.register('knowledge_id')}>
              <option value="">不绑定知识库</option>
              {knowledgeBases.map((knowledge) => (
                <option key={knowledge.id} value={knowledge.id}>{knowledge.name} / {knowledge.status}</option>
              ))}
            </SelectField>
          </div>
          {form.formState.errors.delivery_review_id?.message ? (
            <span className="text-xs text-destructive">{form.formState.errors.delivery_review_id.message}</span>
          ) : null}
          <Field label="标签" message={form.formState.errors.tags?.message}>
            <Input placeholder="用逗号分隔，例如：成果资产, 售前, 验收" {...form.register('tags')} />
          </Field>
        </section>

        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">取消</Button>
          <Button disabled={isPending} type="submit">{isPending ? '保存中...' : '保存资产'}</Button>
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
