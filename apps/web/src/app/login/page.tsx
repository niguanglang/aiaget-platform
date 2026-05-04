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
    <div className="grid gap-5">
      {[0, 1, 2].map((item) => (
        <div className="grid gap-2" key={item}>
          <div className="h-5 w-24 rounded-full bg-white/45" />
          <div className="h-[58px] rounded-[14px] border border-white/70 bg-white/60" />
        </div>
      ))}
      <div className="mt-2 h-[54px] rounded-[16px] bg-[#2563f7]/70" />
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
    <label className="grid gap-2.5 text-[16px] font-medium text-[#1f2e4d]">
      <span>{label}</span>
      <div className="group relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7a88a6] transition-colors duration-200 group-focus-within:text-[#2f69f5]">
          <Icon className="size-[18px]" />
        </span>
        <Input
          {...props}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-[58px] w-full rounded-[14px] border border-[#d8e1ef] bg-white/88 pl-11 pr-12 text-[16px] text-[#16233f] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm transition-all duration-200 placeholder:text-[#97a3bb] hover:border-[#bfd0f1] hover:bg-white/96 focus-visible:border-[#5b8dfc] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#6a92ff]/15',
            error ? 'border-[#f0b4b4] focus-visible:border-[#ec8b8b] focus-visible:ring-[#f2c0c0]/20' : '',
          )}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#58709d]">{trailing}</div>
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
    <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
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
        <div className="flex items-start gap-2 rounded-[14px] border border-[#f3b7b7] bg-[#fff6f6] px-4 py-3 text-sm text-[#d44747] shadow-[0_10px_24px_rgba(212,71,71,0.08)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="leading-6">{serverError}</span>
        </div>
      ) : null}

      <Button
        className="h-[66px] w-full rounded-[16px] bg-[linear-gradient(180deg,#3783ff_0%,#225ef5_100%)] text-[20px] font-semibold tracking-[0] text-white shadow-[0_18px_40px_rgba(37,99,235,0.26)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(37,99,235,0.3)]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? '正在登录...' : '登录平台'}
      </Button>

      <div className="flex items-center justify-between pt-1 text-[15px] font-medium">
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

      <div className="flex items-center gap-4 pt-3 text-[#6f7d98]">
        <span className="h-px flex-1 bg-[#cfd8ea]" />
        <span className="whitespace-nowrap text-[15px] font-medium">SSO 登录</span>
        <span className="h-px flex-1 bg-[#cfd8ea]" />
      </div>

      <Button
        className="h-[58px] rounded-[14px] border border-[#3d78f8] bg-white/58 text-[16px] font-semibold text-[#2d68f5] shadow-[0_8px_20px_rgba(61,120,248,0.08)] hover:bg-[#f6faff]"
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

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-[54px] items-center justify-center bg-[linear-gradient(180deg,#377efe_0%,#205bf5_100%)] shadow-[0_8px_18px_rgba(45,104,245,0.22)]"
        style={{
          clipPath: 'polygon(50% 0%, 92% 24%, 92% 76%, 50% 100%, 8% 76%, 8% 24%)',
        }}
      >
        <Atom className="size-8 text-white" strokeWidth={1.9} />
      </div>
      <div className="text-[clamp(18px,1.5vw,24px)] font-semibold tracking-[0] text-[#0f1f43]">
        企业 <span className="text-[#2f69f5]">AI</span> Agent 平台
      </div>
    </div>
  );
}

function DesktopLoginLayout() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-[#f6f8fd] lg:block">
      <div
        className="relative mx-auto h-screen w-[min(100vw,calc(100vh*1.5))] overflow-hidden"
        style={{ maxWidth: '1536px', maxHeight: '1024px' }}
      >
        <LoginPageBackground />

        <div className="absolute left-[3.1%] top-[4.4%]">
          <BrandMark />
        </div>

        <div className="absolute left-[7.1%] top-[19.5%] max-w-[52%]">
          <h1 className="whitespace-nowrap text-[clamp(50px,4.25vw,66px)] font-semibold leading-[1.08] tracking-[0] text-[#13264c]">
            让企业智能体安全协同
          </h1>
          <p className="mt-5 text-[clamp(22px,1.6vw,28px)] font-medium leading-[1.55] tracking-[0] text-[#5e6f8f]">
            统一身份认证 · 工作流编排 · 数据权限治理
          </p>
        </div>

        <div className="absolute bottom-[7.6%] left-[7.4%]">
          <div className="flex items-center gap-[14px]">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              const cardWidths = ['w-[144px]', 'w-[180px]', 'w-[160px]', 'w-[154px]'];

              return (
                <div
                  className={cn(
                    'flex h-[122px] flex-col items-center justify-center rounded-[10px] border border-white/68 bg-white/72 shadow-[0_12px_30px_rgba(129,153,193,0.14)] backdrop-blur-[16px]',
                    cardWidths[index],
                  )}
                  key={item.label}
                >
                  <Icon className="size-10 text-[#2f69f5]" strokeWidth={1.9} />
                  <span className="mt-3 text-[17px] font-semibold tracking-[0] text-[#1b2946]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-[8.4%] right-[5.1%] top-[8.6%] w-[32.4%] min-w-[496px] max-w-[498px]">
          <Card className="relative h-full overflow-hidden rounded-[40px] border-[1.5px] border-white/66 bg-[linear-gradient(180deg,rgba(255,255,255,0.36)_0%,rgba(247,250,255,0.24)_100%)] px-[clamp(34px,3.3vw,56px)] py-[clamp(60px,4.7vw,68px)] shadow-[0_28px_86px_rgba(125,146,183,0.18)] backdrop-blur-[26px]">
            <div className="absolute inset-[8px] rounded-[34px] border border-white/30" />
            <div className="relative">
              <div className="mb-11">
                <h2 className="text-[clamp(38px,2.4vw,50px)] font-semibold leading-[1.1] tracking-[0] text-[#13264c]">
                  欢迎登录
                </h2>
                <p className="mt-3 text-[clamp(18px,1.2vw,22px)] font-medium leading-[1.35] tracking-[0] text-[#667895]">
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
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8fd] px-4 py-6 lg:hidden">
      <LoginPageBackground />

      <div className="relative mx-auto flex max-w-md flex-col">
        <div className="mb-8">
          <BrandMark />
        </div>

        <div className="mb-6">
          <h1 className="max-w-[12ch] text-[clamp(2.25rem,9vw,3.5rem)] font-semibold leading-[1.08] tracking-[0] text-[#13264c]">
            让企业智能体安全协同
          </h1>
          <p className="mt-4 text-[15px] font-medium leading-7 tracking-[0] text-[#5e6f8f]">
            统一身份认证 · 工作流编排 · 数据权限治理
          </p>
        </div>

        <Card className="relative overflow-hidden rounded-[30px] border border-white/66 bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(247,250,255,0.26)_100%)] px-5 py-6 shadow-[0_22px_60px_rgba(125,146,183,0.16)] backdrop-blur-[20px]">
          <div className="absolute inset-[6px] rounded-[26px] border border-white/35" />
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-[clamp(1.8rem,8vw,2.75rem)] font-semibold leading-[1.1] tracking-[0] text-[#13264c]">
                欢迎登录
              </h2>
              <p className="mt-2 text-sm font-medium text-[#667895]">进入企业智能体控制台</p>
            </div>
            <LoginFormBoundary />
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {featureCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="flex min-h-[104px] flex-col items-center justify-center rounded-[16px] border border-white/68 bg-white/72 px-3 py-3 text-center shadow-[0_12px_28px_rgba(129,153,193,0.12)] backdrop-blur-[14px]"
                key={item.label}
              >
                <Icon className="size-8 text-[#2f69f5]" strokeWidth={1.9} />
                <span className="mt-2 text-[14px] font-semibold text-[#1b2946]">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="relative min-h-screen overflow-hidden text-[#13264c]">
        <DesktopLoginLayout />
        <MobileLoginLayout />
      </main>
    </AuthProvider>
  );
}
