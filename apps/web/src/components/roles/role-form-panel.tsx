'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { RoleDetail } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { roleStatusLabel } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';

const roleStatuses = ['ACTIVE', 'DISABLED'] as const;

const roleFormSchema = z.object({
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  code: z
    .string()
    .regex(/^[a-z][a-z0-9_-]{1,79}$/, '请使用 2-80 位小写字母、数字、下划线或连字符。'),
  description: z.string().optional(),
  status: z.enum(roleStatuses),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormPanelProps {
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void;
  presentation?: 'drawer' | 'page';
  role?: RoleDetail | null;
}

function formDefaults(role?: RoleDetail | null): RoleFormValues {
  return {
    name: role?.name ?? '',
    code: role?.code ?? '',
    description: role?.description ?? '',
    status: role?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
  };
}

export function RoleFormPanel({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  presentation = 'drawer',
  role,
}: RoleFormPanelProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: formDefaults(role),
  });
  const isEditing = mode === 'edit';
  const isPage = presentation === 'page';

  useEffect(() => {
    form.reset(formDefaults(role));
  }, [form, mode, role]);

  return (
    <section
      className={
        isPage
          ? 'grid rounded-lg border bg-background shadow-sm'
          : 'fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l bg-background shadow-xl'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑角色' : '新建角色'}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              角色承载菜单入口、接口权限和后续资源授权边界，编码创建后不可修改。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form
        className={isPage ? 'grid gap-5 p-6' : 'grid flex-1 gap-5 overflow-y-auto p-6'}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Field label="角色名称" message={form.formState.errors.name?.message}>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="例如：知识库管理员"
            {...form.register('name')}
          />
        </Field>

        <Field label="角色编码" message={form.formState.errors.code?.message}>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none read-only:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="knowledge_admin"
            readOnly={isEditing}
            {...form.register('code')}
          />
        </Field>

        <Field label="角色描述" message={form.formState.errors.description?.message}>
          <textarea
            className="min-h-28 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('description')}
          />
        </Field>

        <Field label="角色状态" message={form.formState.errors.status?.message}>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('status')}>
            {roleStatuses.map((status) => (
              <option key={status} value={status}>
                {roleStatusLabel(status)}
              </option>
            ))}
          </select>
        </Field>

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
            {isEditing ? '保存修改' : '新建角色'}
          </Button>
        </div>
      </form>
    </section>
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
