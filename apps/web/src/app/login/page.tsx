'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LockKeyhole } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';

const loginSchema = z.object({
  tenantCode: z.string().min(1, 'Tenant code is required.'),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: 'default',
      email: 'oss-admin-7f4c2a@local.invalid',
      password: 'AIAgetDev!9sK4pQ7m',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      await login(values);
      const requestedNext = searchParams.get('next');
      const nextPath =
        requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
          ? requestedNext
          : '/dashboard';

      router.replace(nextPath);
    } catch (error) {
      setServerError(
        error instanceof ApiClientError ? error.message : 'Login failed. Check the Control API.',
      );
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="grid gap-2 text-sm font-medium">
        Tenant code
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          {...register('tenantCode')}
        />
        {errors.tenantCode ? (
          <span className="text-xs text-destructive">{errors.tenantCode.message}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          type="email"
          {...register('email')}
        />
        {errors.email ? <span className="text-xs text-destructive">{errors.email.message}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          type="password"
          {...register('password')}
        />
        {errors.password ? (
          <span className="text-xs text-destructive">{errors.password.message}</span>
        ) : null}
      </label>

      {serverError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {serverError}
        </div>
      ) : null}

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="grid min-h-screen bg-muted/30 lg:grid-cols-[1fr_460px]">
        <section className="hidden border-r bg-background px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium">
              <LockKeyhole className="size-4 text-primary" />
              Enterprise Agent Platform
            </div>
            <h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight">
              Tenant-aware authentication for enterprise agents.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              M02 uses real JWT login, refresh token rotation, tenant context, RBAC permissions, and
              audit logging through the Control Plane.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {['JWT', 'RBAC', 'Audit'].map((item) => (
              <div className="rounded-lg border p-4" key={item}>
                <div className="font-medium">{item}</div>
                <div className="mt-2 text-xs text-muted-foreground">M02 foundation</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-6">
              <div className="text-sm font-medium text-primary">Control Plane login</div>
              <h2 className="mt-2 text-2xl font-semibold">Sign in to console</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Development seed credentials: tenant `default`, admin `oss-admin-7f4c2a@local.invalid`, password
                `AIAgetDev!9sK4pQ7m`.
              </p>
            </div>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading form...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </main>
    </AuthProvider>
  );
}

