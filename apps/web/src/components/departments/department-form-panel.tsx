'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { DepartmentDetail, DepartmentTreeItem, UserListItem } from '@aiaget/shared-types';
import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { departmentStatusLabel } from '@/components/departments/department-status';
import { Button } from '@/components/ui/button';

const departmentStatuses = ['ACTIVE', 'DISABLED'] as const;

const departmentFormSchema = z.object({
  parent_id: z.string().optional(),
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{1,99}$/, '请使用 2-100 位小写字母、数字、下划线或连字符。'),
  description: z.string().optional(),
  leader_user_id: z.string().optional(),
  sort_order: z.number().int('请使用整数。').min(0, '最小值为 0。').max(10000, '最大值为 10000。'),
  status: z.enum(departmentStatuses),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormPanelProps {
  department?: DepartmentDetail | null;
  departmentTree: DepartmentTreeItem[];
  error?: string | null;
  isPending: boolean;
  leaders: UserListItem[];
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => void;
  parent?: DepartmentTreeItem | null;
  presentation?: 'drawer' | 'page';
}

function formDefaults(department?: DepartmentDetail | null, parent?: DepartmentTreeItem | null): DepartmentFormValues {
  return {
    parent_id: department?.parent_id ?? parent?.id ?? '',
    name: department?.name ?? '',
    code: department?.code ?? '',
    description: department?.description ?? '',
    leader_user_id: department?.leader?.id ?? '',
    sort_order: department?.sort_order ?? 0,
    status: department?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
  };
}

export function DepartmentFormPanel({
  department,
  departmentTree,
  error,
  isPending,
  leaders,
  mode,
  onClose,
  onSubmit,
  parent,
  presentation = 'drawer',
}: DepartmentFormPanelProps) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: formDefaults(department, parent),
  });
  const parentOptions = useMemo(() => flattenParentOptions(departmentTree, department?.id), [departmentTree, department?.id]);
  const isEditing = mode === 'edit';
  const isPage = presentation === 'page';

  useEffect(() => {
    form.reset(formDefaults(department, parent));
  }, [department, form, mode, parent]);

  return (
    <section
      className={
        isPage
          ? 'grid rounded-lg border bg-background shadow-sm'
          : 'fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l bg-background shadow-xl'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑部门' : '新建部门'}</h2>
          </div>
          {isPage ? (
            <Button onClick={onClose} type="button" variant="outline">
              <ArrowLeft className="size-4" />
              返回
            </Button>
          ) : (
            <Button onClick={onClose} size="icon" type="button" variant="ghost">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <form
        className={isPage ? 'grid gap-5 p-6' : 'grid flex-1 gap-5 overflow-y-auto p-6'}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="部门名称" message={form.formState.errors.name?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="例如：AI 平台部"
              {...form.register('name')}
            />
          </Field>

          <Field label="部门编码" message={form.formState.errors.code?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none read-only:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="ai_platform"
              readOnly={isEditing}
              {...form.register('code')}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="上级部门" message={form.formState.errors.parent_id?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('parent_id')}>
              <option value="">根部门</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="负责人" message={form.formState.errors.leader_user_id?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('leader_user_id')}>
              <option value="">暂不指定</option>
              {leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name}（{leader.email}）
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="部门描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-28 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="描述部门职责、可访问资源范围或审批边界"
            {...form.register('description')}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="排序号" message={form.formState.errors.sort_order?.message}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min="0"
              step="1"
              type="number"
              {...form.register('sort_order', { valueAsNumber: true })}
            />
          </Field>

          <Field label="状态" message={form.formState.errors.status?.message}>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('status')}>
              {departmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {departmentStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div
          className={
            isPage
              ? '-mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4'
              : 'sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4'
          }
        >
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            {isEditing ? '保存修改' : '新建部门'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function flattenParentOptions(items: DepartmentTreeItem[], excludeId?: string | null) {
  const output: Array<{ id: string; label: string }> = [];

  function visit(nodes: DepartmentTreeItem[], level: number) {
    for (const node of nodes) {
      if (node.id !== excludeId && level < 6) {
        output.push({
          id: node.id,
          label: `${'　'.repeat(Math.max(0, level - 1))}${node.name}`,
        });
      }
      visit(node.children, level + 1);
    }
  }

  visit(items, 1);

  return output;
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
