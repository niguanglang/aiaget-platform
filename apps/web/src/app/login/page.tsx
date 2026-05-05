'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Atom,
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  Globe,
  LockKeyhole,
  Server,
  ShieldCheck,
  UsersRound,
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
  tenantCode: z.string().min(1, '请输入企业域名。'),
  email: z.email('请输入有效邮箱地址。'),
  password: z.string().min(8, '密码至少需要 8 个字符。'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const featureCards = [
  { icon: ShieldCheck, label: '安全可信' },
  { icon: UsersRound, label: '多智能体协作' },
  { icon: BadgeCheck, label: '权限审计' },
  { icon: Server, label: '私有化部署' },
];

function LoginFormFallback() {
  return (
    <div className="grid gap-4 sm:gap-5">
      {[0, 1, 2].map((item) => (
        <div className="grid gap-2" key={item}>
          <div className="h-5 w-24 rounded-full bg-[#dbe8fb]/60" />
          <div className="h-12 rounded-lg border border-[#f6fbff]/78 bg-[#f7fbff]/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:h-14" />
        </div>
      ))}
      <div className="mt-2 h-12 rounded-lg bg-[#2563f7]/70 sm:h-14" />
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
    <label className="grid gap-2 text-sm font-medium text-[#22365f] sm:gap-2.5 sm:text-[15px] min-[900px]:!gap-[0.65cqw] min-[900px]:!text-[1.04cqw]">
      <span>{label}</span>
      <div className="group relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7b8cb1] transition-colors duration-200 group-focus-within:text-[#2f69f5]">
          <Icon className="size-[18px]" />
        </span>
        <Input
          {...props}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-12 w-full rounded-lg border border-[#cfdcf1]/88 bg-[#f8fbff]/82 pl-11 pr-12 text-[15px] text-[#16233f] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_26px_rgba(83,121,184,0.07)] backdrop-blur-sm transition-all duration-200 placeholder:text-[#8fa0bf] hover:border-[#b8caea] hover:bg-[#fbfdff]/94 focus-visible:border-[#5b8dfc] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#6a92ff]/16 sm:h-14 sm:text-[16px] min-[900px]:!h-[3.78cqw] min-[900px]:!pl-[2.86cqw] min-[900px]:!pr-[3.12cqw] min-[900px]:!text-[1.04cqw]',
            error ? 'border-[#f0b4b4] focus-visible:border-[#ec8b8b] focus-visible:ring-[#f2c0c0]/20' : '',
          )}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#5b74a1]">{trailing}</div>
        ) : null}
      </div>
      {error ? <span className="text-xs font-normal text-[#d44c4c]">{error}</span> : null}
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
      setServerError(error instanceof ApiClientError ? error.message : '登录失败，请检查控制接口服务。');
    }
  }

  return (
    <form className="grid gap-4 sm:gap-5 min-[900px]:!gap-[1.56cqw]" onSubmit={handleSubmit(onSubmit)}>
      <LoginField
        autoComplete="organization"
        error={errors.tenantCode?.message}
        icon={Globe}
        label="企业域名"
        placeholder="company.example.com"
        {...register('tenantCode')}
      />
      <LoginField
        autoComplete="email"
        error={errors.email?.message}
        icon={Building2}
        label="账号"
        placeholder="name@company.com"
        type="email"
        {...register('email')}
      />
      <LoginField
        autoComplete="current-password"
        error={errors.password?.message}
        icon={LockKeyhole}
        label="密码"
        placeholder="请输入密码"
        trailing={
          <button
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="rounded-full p-1 transition-colors duration-200 hover:text-[#2f69f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a92ff]/25"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        type={showPassword ? 'text' : 'password'}
        {...register('password')}
      />

      {serverError ? (
        <div className="flex items-start gap-2 rounded-lg border border-[#f3b7b7] bg-[#fff6f6]/92 px-4 py-3 text-sm text-[#d44747] shadow-[0_10px_24px_rgba(212,71,71,0.08)] backdrop-blur-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="leading-6">{serverError}</span>
        </div>
      ) : null}

      <Button
        className="h-12 w-full rounded-lg bg-[linear-gradient(180deg,#3f88ff_0%,#2262f4_100%)] text-base font-semibold tracking-[0] text-white shadow-[0_16px_36px_rgba(44,105,232,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(44,105,232,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] sm:h-14 sm:text-lg min-[900px]:!h-[3.9cqw] min-[900px]:!text-[1.3cqw]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? '正在登录...' : '登录平台'}
      </Button>

      <div className="flex flex-col gap-3 pt-1 text-sm font-medium min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between sm:text-[15px] min-[900px]:!gap-[0.78cqw] min-[900px]:!text-[0.98cqw]">
        <button
          className="text-[#2f69f5] transition-colors duration-200 hover:text-[#1f56e8]"
          type="button"
        >
          忘记密码？
        </button>
        <button
          className="text-[#2f69f5] transition-colors duration-200 hover:text-[#1f56e8]"
          type="button"
        >
          申请试用
        </button>
      </div>

      <div className="flex items-center gap-4 pt-2 text-[#6f7d98] sm:pt-3 min-[900px]:!gap-[1.04cqw] min-[900px]:!pt-[0.78cqw]">
        <span className="h-px flex-1 bg-[#c8d6ed]" />
        <span className="whitespace-nowrap text-[15px] font-medium min-[900px]:!text-[0.98cqw]">SSO 登录</span>
        <span className="h-px flex-1 bg-[#c8d6ed]" />
      </div>

      <Button
        className="h-12 rounded-lg border border-[#7fa8fb]/78 bg-[#f8fbff]/58 text-[15px] font-semibold text-[#2d68f5] shadow-[0_10px_24px_rgba(61,120,248,0.10),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-sm hover:border-[#5d8ff7] hover:bg-[#fbfdff]/82 sm:h-[54px] sm:text-[16px] min-[900px]:!h-[3.51cqw] min-[900px]:!text-[1.04cqw]"
        type="button"
        variant="outline"
      >
        <Building2 className="size-4" />
        使用企业 SSO 登录
      </Button>
    </form>
  );
}

function LoginFormBoundary() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex size-11 shrink-0 items-center justify-center bg-[linear-gradient(180deg,#3f86ff_0%,#235ff1_100%)] shadow-[0_10px_24px_rgba(61,112,221,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] sm:size-12 min-[900px]:size-[3.52cqw]"
        style={{
          clipPath: 'polygon(50% 0%, 92% 24%, 92% 76%, 50% 100%, 8% 76%, 8% 24%)',
        }}
      >
        <Atom className="size-6 text-white sm:size-7 min-[900px]:size-[2.08cqw]" strokeWidth={1.9} />
      </div>
      <div className="text-base font-semibold tracking-[0] text-[#0f1f43] sm:text-lg min-[900px]:text-[1.56cqw]">
        企业 <span className="text-[#2f69f5]">AI</span> Agent 平台
      </div>
    </div>
  );
}

function FeatureCardGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 min-[900px]:max-w-none min-[900px]:gap-[0.91cqw]">
      {featureCards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            className="flex min-h-[84px] flex-col items-center justify-center rounded-lg border border-[#f4f9ff]/74 bg-[#f5faff]/54 px-3 py-3 text-center shadow-[0_14px_34px_rgba(95,128,181,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[16px] sm:min-h-[96px] min-[900px]:min-h-[7.94cqw] min-[900px]:px-[0.78cqw] min-[900px]:py-[0.78cqw]"
            key={item.label}
          >
            <Icon className="size-7 text-[#346ef2] sm:size-8 min-[900px]:size-[2.6cqw]" strokeWidth={1.9} />
            <span className="mt-2 text-[13px] font-semibold tracking-[0] text-[#20345a] sm:text-sm min-[900px]:mt-[0.78cqw] min-[900px]:text-[1.11cqw]">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DesktopLoginLayout() {
  return (
    <div className="relative hidden min-h-dvh overflow-hidden bg-[#d4e2f7] min-[900px]:block">
      <div className="absolute left-1/2 top-1/2 h-[1024px] w-[1536px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="h-[1024px] w-[1536px] origin-center overflow-hidden [container-type:inline-size]"
          style={{ transform: 'scale(max(calc(100vw / 1536px), calc(100dvh / 1024px)))' }}
        >
          <LoginPageBackground />

          <div className="absolute left-[3.4%] top-[4.35%]">
            <BrandMark />
          </div>

          <div className="absolute left-[7.1%] top-[19.4%] max-w-[52%]">
            <h1 className="whitespace-nowrap text-[4.3cqw] font-semibold leading-[1.08] tracking-[0] text-[#13284f] drop-shadow-[0_1px_0_rgba(255,255,255,0.58)]">
              让企业智能体安全协同
            </h1>
            <p className="mt-[1.3cqw] text-[1.72cqw] font-medium leading-[1.55] tracking-[0] text-[#536b92] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
              统一身份认证 · 工作流编排 · 数据权限治理
            </p>
          </div>

          <div className="absolute bottom-[7.4%] left-[7.25%] w-[45%]">
            <FeatureCardGrid />
          </div>

          <Card className="absolute bottom-[8.2%] right-[5.1%] top-[8.55%] w-[32.42%] overflow-hidden rounded-lg border border-[#f7fbff]/74 bg-[linear-gradient(145deg,rgba(249,252,255,0.72)_0%,rgba(232,241,255,0.48)_58%,rgba(219,234,255,0.38)_100%)] px-[3.6cqw] py-[3.55cqw] shadow-[0_28px_82px_rgba(77,110,169,0.22),0_2px_12px_rgba(255,255,255,0.42)_inset] backdrop-blur-[28px]">
            <div className="pointer-events-none absolute inset-2 rounded-md border border-[#ffffff]/48" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_100%)]" />
            <div className="relative">
              <div className="mb-[2.08cqw]">
                <h2 className="text-[3.25cqw] font-semibold leading-[1.1] tracking-[0] text-[#13284f]">
                  欢迎登录
                </h2>
                <p className="mt-[0.78cqw] text-[1.43cqw] font-medium leading-[1.35] text-[#5e7398]">
                  进入企业智能体控制台
                </p>
              </div>
              <LoginFormBoundary />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MobileLoginLayout() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#d4e2f7] min-[900px]:hidden">
      <LoginPageBackground
        className="opacity-95"
        imageClassName="scale-110 bg-[position:58%_center] sm:scale-105 md:bg-center lg:scale-100"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1536px] flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-[clamp(1rem,3.5dvh,2rem)] xl:px-12">
        <header className="shrink-0">
          <BrandMark />
        </header>

        <section className="grid flex-1 items-center gap-6 py-6 sm:gap-8 sm:py-8">
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
            <div>
              <h1 className="max-w-[12ch] text-[clamp(2rem,9vw,3.75rem)] font-semibold leading-[1.08] tracking-[0] text-[#13284f] drop-shadow-[0_1px_0_rgba(255,255,255,0.58)] sm:max-w-none">
                让企业智能体安全协同
              </h1>
              <p className="mt-3 max-w-[42rem] text-sm font-medium leading-7 tracking-[0] text-[#536b92] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)] sm:mt-4 sm:text-base">
                统一身份认证 · 工作流编排 · 数据权限治理
              </p>
            </div>

            <div className="hidden min-[900px]:block">
              <FeatureCardGrid />
            </div>
          </div>

          <Card className="relative mx-auto w-full max-w-[32rem] overflow-hidden rounded-lg border border-[#f7fbff]/74 bg-[linear-gradient(145deg,rgba(249,252,255,0.72)_0%,rgba(232,241,255,0.48)_58%,rgba(219,234,255,0.38)_100%)] p-4 shadow-[0_28px_82px_rgba(77,110,169,0.22),0_2px_12px_rgba(255,255,255,0.42)_inset] backdrop-blur-[28px] sm:p-6 md:p-8">
            <div className="pointer-events-none absolute inset-[6px] rounded-md border border-[#ffffff]/48 sm:inset-2" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_100%)]" />
            <div className="relative">
              <div className="mb-5 sm:mb-7">
                <h2 className="text-[clamp(1.75rem,7vw,2.65rem)] font-semibold leading-[1.1] tracking-[0] text-[#13284f]">
                  欢迎登录
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5e7398] sm:text-base">
                  进入企业智能体控制台
                </p>
              </div>
              <LoginFormBoundary />
            </div>
          </Card>

          <div className="min-[900px]:hidden">
            <FeatureCardGrid />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="relative min-h-dvh text-[#13264c]">
        <DesktopLoginLayout />
        <MobileLoginLayout />
      </main>
    </AuthProvider>
  );
}
