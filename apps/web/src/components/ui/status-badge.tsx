import type { HealthStatus } from '@aiaget/shared-types';

import { cn } from '@/lib/utils';

type StatusTone = HealthStatus | 'planned' | 'ready' | 'mock' | 'loading' | 'muted';

const toneClasses: Record<StatusTone, string> = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  degraded: 'border-amber-200 bg-amber-50 text-amber-700',
  unavailable: 'border-red-200 bg-red-50 text-red-700',
  planned: 'border-slate-200 bg-slate-50 text-slate-700',
  mock: 'border-blue-200 bg-blue-50 text-blue-700',
  loading: 'border-slate-200 bg-slate-50 text-slate-500',
  muted: 'border-slate-200 bg-slate-50 text-slate-500',
};

export function StatusBadge({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
