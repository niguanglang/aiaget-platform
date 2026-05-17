'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { DepartmentTreeItem, RoleListItem, UserListItem } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { defaultRoleCodes } from '@/components/users/user-ia-shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const userFormSchema = z.object({
  email: z.email('请输入有效邮箱地址。'),
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
  department_id: z.string().optional(),
  roleCodes: z.array(z.string()).min(1, '至少选择一个角色。'),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export function userFormDefaults(user?: UserListItem | null, defaultRoleCodes: string[] = ['tenant_viewer']): UserFormValues {
  return {
    department_id: user?.department_id ?? '',
    email: user?.email ?? '',
    name: user?.name ?? '',
    password: '',
    roleCodes: user?.roles.map((role) => role.code) ?? defaultRoleCodes,
    status: user?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
  };
}

export function UserFormPanel({
  canManage,
  departments,
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  presentation = 'drawer',
  roles,
  user,
}: {
  canManage: boolean;
  departments: DepartmentTreeItem[];
  error?: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  presentation?: 'drawer' | 'page';
  roles: RoleListItem[];
  user?: UserListItem | null;
}) {
  const isCreating = mode === 'create';
  const isPage = presentation === 'page';
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: userFormDefaults(user),
  });

  useEffect(() => {
    form.reset(userFormDefaults(user, defaultRoleCodes(roles)));
  }, [form, roles, user]);

  return (
    <section
      className={
        isPage
          ? 'grid rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-sm'
          : 'fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l bg-background shadow-xl'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isCreating ? '新建用户' : '编辑用户'}</h2>
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
        <Field label="邮箱" message={form.formState.errors.email?.message}>
          <Input disabled={!isCreating || !canManage} type="email" {...form.register('email')} />
        </Field>
        <Field label="名称" message={form.formState.errors.name?.message}>
          <Input disabled={!canManage} {...form.register('name')} />
        </Field>
        <Field label="密码">
          <Input
            aria-label={isCreating ? '初始密码' : '新密码'}
            disabled={!canManage}
            type="password"
            {...form.register('password')}
          />
        </Field>
        <Field label="状态" message={form.formState.errors.status?.message}>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted"
            disabled={!canManage}
            {...form.register('status')}
          >
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
        </Field>
        <Field label="所属部门" message={form.formState.errors.department_id?.message}>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted"
            disabled={!canManage}
            {...form.register('department_id')}
          >
            <option value="">未归属</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {'　'.repeat(Math.max(0, department.level - 1))}
                {department.name}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">角色</legend>
          {roles.map((role) => (
            <label className="flex items-center gap-2 text-sm" key={role.id}>
              <input disabled={!canManage} type="checkbox" value={role.code} {...form.register('roleCodes')} />
              {role.name}
              <span className="text-xs text-muted-foreground">{role.permission_count} 个权限</span>
            </label>
          ))}
          {form.formState.errors.roleCodes ? (
            <span className="text-xs text-destructive">{form.formState.errors.roleCodes.message}</span>
          ) : null}
        </fieldset>

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
          <Button disabled={!canManage || isPending} type="submit">
            {isCreating ? '新建用户' : '保存修改'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}
