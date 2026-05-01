import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="w-full max-w-2xl rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 inline-flex rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          M01 控制台基础
        </div>
        <h1 className="text-3xl font-semibold tracking-normal">企业智能体平台</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          受保护的 Web 控制台框架、演示登录、导航和服务健康仪表盘已就绪。业务增删改查与 RBAC 会在后续里程碑继续完善。
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">打开仪表盘</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
