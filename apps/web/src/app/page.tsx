import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="w-full max-w-2xl rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 inline-flex rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          M01 Console Foundation
        </div>
        <h1 className="text-3xl font-semibold tracking-normal">Enterprise Agent Platform</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The protected Web Console shell, demo login, navigation, and service health dashboard are
          ready. Business CRUD and RBAC are implemented in later milestones.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
