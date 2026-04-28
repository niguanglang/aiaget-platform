'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserListItem, UserStatus } from '@aiaget/shared-types';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createUser,
  deleteUser,
  listTenants,
  listUsers,
  updateUser,
  type ApiClientError,
} from '@/lib/api-client';

const roleOptions = [
  { code: 'tenant_admin', name: 'Tenant Admin' },
  { code: 'tenant_operator', name: 'Tenant Operator' },
  { code: 'tenant_viewer', name: 'Tenant Viewer' },
];

const userFormSchema = z.object({
  email: z.email('Enter a valid email address.'),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
  roleCodes: z.array(z.string()).min(1, 'Select at least one role.'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

function statusTone(status: UserStatus) {
  if (status === 'ACTIVE') {
    return 'healthy';
  }

  if (status === 'DISABLED') {
    return 'degraded';
  }

  return 'unavailable';
}

export function SettingsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users', keyword, status],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 20,
        keyword,
        status,
      }),
  });
  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: () =>
      listTenants({
        page: 1,
        page_size: 20,
      }),
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      status: 'ACTIVE',
      roleCodes: ['tenant_viewer'],
    },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(user);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      updateUser(id, {
        name: values.name,
        password: values.password || undefined,
        roleCodes: values.roleCodes,
        status: values.status,
      }),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(user);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
      setSelectedUser(null);
    },
  });

  const users = usersQuery.data?.items ?? [];
  const tenant = tenantsQuery.data?.items[0] ?? currentUser?.tenant;
  const metrics = useMemo(
    () => [
      { label: 'Users', value: `${usersQuery.data?.total ?? 0}`, helper: 'Tenant-scoped list' },
      {
        label: 'Active',
        value: `${users.filter((user) => user.status === 'ACTIVE').length}`,
        helper: 'Current page',
      },
      {
        label: 'Disabled',
        value: `${users.filter((user) => user.status === 'DISABLED').length}`,
        helper: 'Current page',
      },
      { label: 'Tenants', value: `${tenantsQuery.data?.total ?? 0}`, helper: 'Current context' },
    ],
    [tenantsQuery.data?.total, users, usersQuery.data?.total],
  );

  function openCreateForm() {
    setFormError(null);
    setEditingUser(null);
    setIsCreating(true);
    form.reset({
      email: '',
      name: '',
      password: '',
      status: 'ACTIVE',
      roleCodes: ['tenant_viewer'],
    });
  }

  function openEditForm(user: UserListItem) {
    setFormError(null);
    setIsCreating(false);
    setEditingUser(user);
    form.reset({
      email: user.email,
      name: user.name,
      password: '',
      status: user.status === 'DELETED' ? 'DISABLED' : user.status,
      roleCodes: user.roles.map((role) => role.code),
    });
  }

  function closeForm() {
    setFormError(null);
    setIsCreating(false);
    setEditingUser(null);
  }

  async function submitForm(values: UserFormValues) {
    setFormError(null);

    if (isCreating && !values.password) {
      setFormError('Password is required when creating a user.');
      return;
    }

    if (isCreating) {
      createMutation.mutate({
        email: values.email,
        name: values.name,
        password: values.password ?? '',
        roleCodes: values.roleCodes,
        status: values.status,
      });
      return;
    }

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        values,
      });
    }
  }

  const isFormOpen = isCreating || Boolean(editingUser);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge tone="ready">M02</StatusBadge>
            <StatusBadge tone="healthy">JWT + RBAC</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage the current tenant, users, roles, and authentication foundation. User records are
            tenant-isolated and deletes are soft deletes.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="size-4" />
          New user
        </Button>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">Tenant</div>
            <div className="mt-1 text-lg font-semibold">{tenant?.name ?? 'Loading tenant...'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tenant code</div>
            <div className="mt-1 text-lg font-semibold">{tenant?.code ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Current user</div>
            <div className="mt-1 text-lg font-semibold">{currentUser?.user.email ?? '-'}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Users</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search, filter, create, edit, soft delete, and inspect tenant users.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="w-52 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search name or email"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {usersQuery.isError ? (
          <div className="p-6 text-sm text-destructive">Failed to load users.</div>
        ) : usersQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <div className="font-medium">No users found</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a tenant user or adjust the search and status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Name', 'Email', 'Status', 'Roles', 'Last login', 'Updated', 'Actions'].map(
                    (column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = currentUser?.user.id === user.id;

                  return (
                    <tr className="border-b last:border-0" key={user.id}>
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span className="rounded-md border px-2 py-0.5 text-xs" key={role.id}>
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.last_login_at ?? 'Never'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.updated_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button onClick={() => setSelectedUser(user)} size="sm" variant="outline">
                            Details
                          </Button>
                          <Button onClick={() => openEditForm(user)} size="sm" variant="outline">
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            disabled={isCurrentUser || user.status === 'DELETED'}
                            onClick={() => setDeleteTarget(user)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">Audit Preview</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Login and operation logs are written by the backend in M02. Query pages and richer audit
            timelines land in M09.
          </p>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">User Detail</h2>
            {selectedUser ? (
              <Button onClick={() => setSelectedUser(null)} size="icon" variant="ghost">
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          {selectedUser ? (
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Name" value={selectedUser.name} />
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow label="Status" value={selectedUser.status} />
              <DetailRow label="Roles" value={selectedUser.roles.map((role) => role.name).join(', ')} />
              <DetailRow label="Last login" value={selectedUser.last_login_at ?? 'Never'} />
              <DetailRow label="Created" value={selectedUser.created_at} />
              <DetailRow label="Updated" value={selectedUser.updated_at} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Select a user to inspect tenant, roles, permissions, login activity, and operation audit summary.</p>
          )}
        </div>
      </section>

      {isFormOpen ? (
        <section className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{isCreating ? 'Create user' : 'Edit user'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Passwords are sent once and stored as hashes by the Control API.
              </p>
            </div>
            <Button onClick={closeForm} size="icon" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(submitForm)}>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!isCreating}
                type="email"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Name
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={isCreating ? 'Required' : 'Leave blank to keep current password'}
                type="password"
                {...form.register('password')}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Status
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                {...form.register('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Roles</legend>
              {roleOptions.map((role) => (
                <label className="flex items-center gap-2 text-sm" key={role.code}>
                  <input type="checkbox" value={role.code} {...form.register('roleCodes')} />
                  {role.name}
                </label>
              ))}
              {form.formState.errors.roleCodes ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.roleCodes.message}
                </span>
              ) : null}
            </fieldset>

            {formError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <Button disabled={createMutation.isPending || updateMutation.isPending} type="submit">
              {isCreating ? 'Create user' : 'Save changes'}
            </Button>
          </form>
        </section>
      ) : null}

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete user?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will soft delete `{deleteTarget.email}` and keep audit history.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

