'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ScanText,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ComponentType, type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { LoginPageBackground } from '@/components/auth/login-page-background';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, type InputProps } from '@/components/ui/input';
import { ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  tenantCode: z.string().min(1, '请输入租户编码。'),
  email: z.email('请输入有效邮箱地址。'),
  password: z.string().min(8, '密码至少需要 8 个字符。'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const bottomFeatures = [
  { icon: ShieldCheck, label: '安全可靠' },
  { icon: UserRound, label: '统一访问' },
  { icon: ScanText, label: '权限管控' },
  { icon: LockKeyhole, label: '合规审计' },
];

function LoginFormFallback() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div className="grid gap-2" key={item}>
          <div className="h-4 w-20 rounded-full bg-slate-200/70" />
          <div className="h-14 animate-pulse rounded-2xl border border-white/70 bg-white/60" />
        </div>
      ))}
      <div className="mt-2 h-12 animate-pulse rounded-2xl bg-slate-200/80" />
    </div>
  );
}

function LoginField({
  error,
  icon: Icon,
  label,
  trailing,
  ...props
}: InputProps & {
  error?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <label className="grid gap-2.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="group relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors duration-300 group-focus-within:text-primary">
          <Icon className="size-4" />
        </span>
        <Input
          {...props}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-12 w-full rounded-xl border border-slate-200/80 bg-white/72 pl-11 pr-12 text-[15px] text-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.7),0_14px_30px_rgba(148,163,184,0.08)] backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300/90 hover:bg-white/86 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-primary/12 sm:h-14 sm:rounded-2xl',
            error ? 'border-destructive/50 focus-visible:border-destructive/50 focus-visible:ring-destructive/10' : '',
          )}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">{trailing}</div>
        ) : null}
      </div>
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: '',
      email: '',
      password: '',
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
        error instanceof ApiClientError ? error.message : '登录失败，请检查控制接口服务。',
      );
    }
  }

  return (
    <motion.form
      className="grid gap-4 sm:gap-5"
      initial={false}
      onSubmit={handleSubmit(onSubmit)}
    >
      <motion.div
        className="grid gap-4 sm:gap-5"
        initial={false}
      >
        <LoginField
          autoComplete="organization"
          error={errors.tenantCode?.message}
          icon={Building2}
          label="租户编码"
          placeholder="请输入租户编码"
          {...register('tenantCode')}
        />
        <LoginField
          autoComplete="email"
          error={errors.email?.message}
          icon={Mail}
          label="邮箱"
          placeholder="请输入邮箱"
          type="email"
          {...register('email')}
        />
        <LoginField
          autoComplete="current-password"
          error={errors.password?.message}
          icon={KeyRound}
          label="密码"
          placeholder="请输入密码"
          trailing={
            <button
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="rounded-full p-1 text-slate-400 transition-colors duration-300 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          type={showPassword ? 'text' : 'password'}
          {...register('password')}
        />
      </motion.div>

      {serverError ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-2xl border border-destructive/35 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-[0_12px_24px_rgba(239,68,68,0.08)]"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="leading-6">{serverError}</span>
        </motion.div>
      ) : null}

      <motion.div
        initial={false}
      >
        <Button
          className="h-12 w-full rounded-xl bg-[linear-gradient(90deg,#3f85ff_0%,#2559f7_100%)] text-base font-medium text-white shadow-[0_18px_44px_rgba(37,99,235,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(37,99,235,0.28)] sm:rounded-2xl"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? '正在登录...' : '登录'}
        </Button>
      </motion.div>

      <motion.div
        className="pt-1 text-center"
        initial={false}
      >
        <button
          className="text-sm font-medium text-[#2b69f4]/90 transition-colors duration-300 hover:text-[#1e4fd8]"
          type="button"
        >
          忘记密码？
        </button>
      </motion.div>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="relative min-h-screen overflow-hidden bg-[#f5f8ff] text-slate-950">
        <div className="relative z-10 hidden min-h-screen items-center justify-center overflow-hidden lg:flex">
          <motion.div
            className="relative overflow-hidden"
            initial={false}
            style={{
              height: 'min(100vh, calc(100vw * 941 / 1672))',
              width: 'min(100vw, calc(100vh * 1672 / 941))',
            }}
          >
            <LoginPageBackground />

            <motion.div
              className="absolute left-[3%] top-[5.35%] flex items-center gap-3"
              initial={false}
            >
              <ShieldCheck className="size-[clamp(26px,2.2vw,40px)] text-[#3475ff]" strokeWidth={1.8} />
              <div className="text-[clamp(18px,1.42vw,24px)] font-semibold tracking-[0.02em] text-[#1b2438]">
                企业智能体平台
              </div>
            </motion.div>

            <div className="absolute left-[5.3%] top-[34%] max-w-[50%]">
              <motion.h1
                className="text-[clamp(46px,4.55vw,72px)] font-semibold leading-[1.08] text-[#14233d]"
                initial={false}
              >
                安全连接企业{' '}
                <span className="bg-[linear-gradient(180deg,#3c82ff_0%,#245cf4_100%)] bg-clip-text text-transparent">
                  AI 智能体
                </span>
              </motion.h1>
              <motion.p
                className="mt-[2.8%] text-[clamp(20px,1.75vw,25px)] leading-[1.8] text-[#55657f]"
                initial={false}
              >
                统一身份访问，保障企业数据与应用安全
              </motion.p>
            </div>

            <motion.div
              className="absolute bottom-[12%] left-[5.3%] flex items-center gap-[2.2vw] text-[#475569]"
              initial={false}
            >
              {bottomFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-center gap-[2.1vw]" key={item.label}>
                    <div className="flex items-center gap-3">
                      <Icon className="size-[clamp(22px,1.7vw,30px)] text-[#4f6389]" strokeWidth={1.8} />
                      <span className="text-[clamp(18px,1.32vw,26px)] font-medium leading-none">
                        {item.label}
                      </span>
                    </div>
                    {index < bottomFeatures.length - 1 ? (
                      <span className="h-7 w-px bg-[#d0d9eb]" />
                    ) : null}
                  </div>
                );
              })}
            </motion.div>

            <motion.section
              className="absolute right-[6.45%] top-[11.7%] w-[29.7%] min-w-[420px] max-w-[496px]"
              initial={false}
            >
              <Card className="rounded-[38px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(246,250,255,0.18))] px-[clamp(34px,3.5vw,58px)] pt-[clamp(42px,4vw,60px)] pb-[clamp(56px,5.2vw,82px)] shadow-[0_34px_90px_rgba(148,163,184,0.14)] backdrop-blur-[26px]">
                <div className="mb-11">
                  <h2 className="text-[clamp(42px,2.4vw,54px)] font-semibold tracking-[0.01em] text-[#14233d]">
                    登录控制台
                  </h2>
                </div>
                <Suspense fallback={<LoginFormFallback />}>
                  <LoginForm />
                </Suspense>
              </Card>
            </motion.section>
          </motion.div>
        </div>

        <div className="relative z-10 px-4 py-6 lg:hidden">
          <div className="mx-auto max-w-md sm:max-w-xl">
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <ShieldCheck className="size-8 text-[#3475ff] sm:size-9" strokeWidth={1.8} />
              <div className="text-lg font-semibold text-[#1b2438] sm:text-xl">企业智能体平台</div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px]">
              <div className="relative aspect-[1672/941] w-full">
                <LoginPageBackground />
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <h1 className="max-w-[11ch] text-[clamp(2rem,9vw,3.25rem)] font-semibold leading-[1.12] text-[#14233d]">
                安全连接企业 <span className="inline-block whitespace-nowrap text-[#2c66f4]">AI 智能体</span>
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-[#55657f] sm:text-base sm:leading-8">
                统一身份访问，保障企业数据与应用安全
              </p>
            </div>

            <Card className="mt-8 rounded-[26px] border border-white/74 bg-white/72 p-5 shadow-[0_24px_60px_rgba(148,163,184,0.16)] backdrop-blur-[18px] sm:rounded-[30px] sm:p-6">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-[clamp(2rem,8vw,3rem)] font-semibold text-[#14233d]">登录控制台</h2>
              </div>
              <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
              </Suspense>
            </Card>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
              {bottomFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/56 px-3.5 py-3.5 text-[#475569] shadow-[0_14px_34px_rgba(148,163,184,0.1)] backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-4"
                    key={item.label}
                  >
                    <Icon className="size-5 text-[#4f6389]" strokeWidth={1.8} />
                    <span className="text-[13px] font-medium sm:text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </AuthProvider>
  );
}
