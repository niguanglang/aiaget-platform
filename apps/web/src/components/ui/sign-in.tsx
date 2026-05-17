'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { GlowCard } from '@/components/ui/spotlight-card';
import { ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: ReactNode;
  description?: ReactNode;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  accountError?: string;
  accountInputProps?: ComponentProps<'input'>;
  onSignIn?: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  passwordError?: string;
  passwordInputProps?: ComponentProps<'input'>;
  rememberInputProps?: ComponentProps<'input'>;
  testimonials?: Testimonial[];
}

const loginSchema = z.object({
  account: z.string().trim().min(1, '请输入账号。'),
  password: z.string().min(8, '密码至少需要 8 个字符。'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GlassInputWrapper = ({ children, hasError }: { children: ReactNode; hasError?: boolean }) => (
  <div
    className={cn(
      'rounded-2xl border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-colors focus-within:border-cyan-300/55 focus-within:bg-cyan-300/[0.07]',
      hasError ? 'border-red-400/70 bg-red-500/10' : '',
    )}
  >
    {children}
  </div>
);

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      fill="#FFC107"
    />
    <path
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      fill="#FF3D00"
    />
    <path
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      fill="#4CAF50"
    />
    <path
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.138-2.65-.389-3.917z"
      fill="#1976D2"
    />
  </svg>
);

export function SignInPage({
  accountError,
  accountInputProps,
  description = '欢迎回来，开始今天的智能运营。',
  errorMessage,
  isSubmitting = false,
  onCreateAccount,
  onGoogleSignIn,
  onResetPassword,
  onSignIn,
  passwordError,
  passwordInputProps,
  rememberInputProps,
  title = <span className="font-light tracking-tighter text-foreground">企业AIAgent平台</span>,
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = onSignIn;

  return (
    <div className="login-sign-in login-sign-in-shell relative isolate h-[100dvh] w-[100dvw] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(112,96,255,0.22),transparent_34%),radial-gradient(circle_at_78%_76%,rgba(20,184,166,0.14),transparent_30%),linear-gradient(120deg,rgba(7,10,18,0.94),rgba(7,10,18,0.76)_46%,rgba(7,10,18,0.94))]" />
        <DottedSurface className="absolute inset-0 opacity-100 mix-blend-screen" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent" />
      </div>

      <main className="relative z-10 grid h-full overflow-y-auto px-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] md:items-center md:gap-10 md:px-12 lg:px-20">
        <section className="hidden h-full max-w-3xl items-center md:flex">
          <GlowCard
            className="w-full max-w-[620px] -translate-y-8 px-10 py-10 lg:px-12 lg:py-12"
            customSize
            glowColor="blue"
          >
            <div className="animate-element animate-delay-100 flex items-center gap-3 text-sm font-medium tracking-[0.24em] text-cyan-200/85">
              <span className="h-px w-12 bg-cyan-200/55" />
              企业级智能体运营入口
            </div>
            <h1 className="animate-element animate-delay-200 mt-5 max-w-[11ch] text-5xl font-semibold leading-[1.04] tracking-[0] text-white lg:text-6xl">
              企业AIAgent平台
            </h1>
            <p className="animate-element animate-delay-300 mt-5 max-w-[520px] text-lg leading-8 text-slate-300">
              欢迎回来。进入统一、安全、可观测的智能运营中枢。
            </p>
          </GlowCard>
        </section>

        <section className="flex min-h-full items-center justify-center py-6 md:min-h-0 md:justify-end md:py-0">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/12 bg-slate-950/62 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="animate-element animate-delay-100 text-3xl font-semibold leading-tight md:text-4xl">
                  {title}
                </h2>
                <p className="animate-element animate-delay-200 mt-3 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="login-email">
                    账号
                  </label>
                  <GlassInputWrapper hasError={Boolean(accountError)}>
                    <input
                      {...accountInputProps}
                      autoComplete="username"
                      className="w-full rounded-2xl bg-transparent p-4 text-sm text-foreground outline-none placeholder:text-slate-500"
                      id="login-email"
                      name="account"
                      placeholder="请输入账号"
                      type="text"
                    />
                  </GlassInputWrapper>
                  {accountError ? <p className="mt-2 text-xs text-red-200">{accountError}</p> : null}
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="login-password">
                    密码
                  </label>
                  <GlassInputWrapper hasError={Boolean(passwordError)}>
                    <div className="relative">
                      <input
                        {...passwordInputProps}
                        autoComplete="current-password"
                        className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-foreground outline-none placeholder:text-slate-500"
                        id="login-password"
                        name="password"
                        placeholder="请输入密码"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        className="absolute inset-y-0 right-3 flex items-center"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>
                  {passwordError ? <p className="mt-2 text-xs text-red-200">{passwordError}</p> : null}
                </div>

                <div className="animate-element animate-delay-500 flex items-center justify-between gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input {...rememberInputProps} className="custom-checkbox" name="rememberMe" type="checkbox" />
                    <span className="text-foreground/90">保持登录</span>
                  </label>
                  {onResetPassword ? (
                    <button
                      className="text-cyan-300 transition-colors hover:text-cyan-200 hover:underline"
                      onClick={onResetPassword}
                      type="button"
                    >
                      重置密码
                    </button>
                  ) : null}
                </div>

                {errorMessage ? (
                  <div className="animate-element flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
                    <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-[linear-gradient(135deg,#7c6cff,#27d3ee)] py-4 font-medium text-white shadow-[0_18px_45px_rgba(39,211,238,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? '正在登录...' : '登录'}
                </button>
              </form>

              {onGoogleSignIn ? (
                <button
                  className="animate-element animate-delay-800 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 py-4 transition-colors hover:bg-white/[0.06]"
                  onClick={onGoogleSignIn}
                  type="button"
                >
                  <GoogleIcon />
                  使用 Google 登录
                </button>
              ) : null}

              {onCreateAccount ? (
                <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
                  还没有账号？{' '}
                  <button
                    className="text-cyan-300 transition-colors hover:text-cyan-200 hover:underline"
                    onClick={onCreateAccount}
                    type="button"
                  >
                    创建账号
                  </button>
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

function SignInLoginPanel() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit: submitForm,
    register,
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      account: '',
      password: '',
      rememberMe: true,
    },
    resolver: zodResolver(loginSchema),
  });

  const handleSubmit = submitForm(async (values) => {
    setServerError(null);

    try {
      await login({
        tenantCode: 'default',
        email: normalizeLoginAccount(values.account),
        password: values.password,
      });

      const requestedNext = searchParams.get('next');
      const nextPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/dashboard';
      router.replace(nextPath);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : '登录失败，请检查账号或控制接口服务。';
      setServerError(message);
      setError('password', { message });
    }
  });

  return (
    <SignInPage
      accountError={errors.account?.message}
      accountInputProps={register('account')}
      description="欢迎回来，开始今天的工作。"
      errorMessage={serverError}
      isSubmitting={isSubmitting}
      onSignIn={handleSubmit}
      passwordError={errors.password?.message}
      passwordInputProps={register('password')}
      rememberInputProps={register('rememberMe')}
      title={<span className="font-light tracking-tighter text-foreground">企业AIAgent平台</span>}
    />
  );
}

function normalizeLoginAccount(account: string) {
  const normalizedAccount = account.trim().toLowerCase();

  if (normalizedAccount === 'admin') {
    return 'oss-admin-7f4c2a@local.invalid';
  }

  return normalizedAccount;
}

export default function SignInLogin() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="login-sign-in h-[100dvh] w-[100dvw] bg-background" />}>
        <SignInLoginPanel />
      </Suspense>
    </AuthProvider>
  );
}
