import type { HealthResponse } from '@aiaget/shared-types';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export function ServiceHealthCard({
  description,
  health,
  isLoading,
  onRefresh,
  title,
}: {
  description: string;
  health: HealthResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  title: string;
}) {
  const status = isLoading ? 'loading' : (health?.status ?? 'unavailable');
  const isHealthy = health?.status === 'healthy';

  return (
    <section className="rounded-lg border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-amber-600" />
            )}
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <StatusBadge tone={status}>{isLoading ? 'loading' : (health?.status ?? 'unavailable')}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{health?.service ?? 'unknown'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Version</span>
          <span className="font-medium">{health?.version ?? 'unknown'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Timestamp</span>
          <span className="font-medium">{health?.timestamp ?? 'not loaded'}</span>
        </div>
      </div>

      <Button className="mt-5" disabled={isLoading} onClick={onRefresh} size="sm" variant="outline">
        <RefreshCw className="size-4" />
        Refresh
      </Button>
    </section>
  );
}

