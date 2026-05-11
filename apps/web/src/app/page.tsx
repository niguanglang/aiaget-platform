import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="w-full max-w-3xl rounded-lg border bg-background/95 p-8 shadow-sm backdrop-blur">
        <div className="mb-6 flex flex-wrap gap-2">
          {['平台控制台', '权限闭环', '运行监控', '开放接口'].map((item) => (
            <span className="inline-flex rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground" key={item}>
              {item}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-normal">企业智能体平台</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          面向企业私有化和多租户运营的 Agent 管理控制台，统一管理智能体、知识库、工具、模型、审批、安全审计、成本额度和开放接口。
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
