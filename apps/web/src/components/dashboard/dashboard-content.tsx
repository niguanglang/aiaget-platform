'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ServiceHealthCard } from '@/components/dashboard/service-health-card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getControlHealth, getRuntimeHealth } from '@/lib/api-client';

const dashboardMetrics = [
  { label: 'Agents', value: '0', helper: 'M03 configuration data' },
  { label: 'Model calls', value: '0', helper: 'M04/M09 call logs' },
  { label: 'Knowledge documents', value: '0', helper: 'M06 document metadata' },
  { label: 'Tool calls', value: '0', helper: 'M07 execution logs' },
];

export function DashboardContent() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const controlHealthQuery = useQuery({
    queryKey: ['health', 'control-api'],
    queryFn: getControlHealth,
  });

  const runtimeHealthQuery = useQuery({
    queryKey: ['health', 'agent-runtime'],
    queryFn: getRuntimeHealth,
  });

  const isLoading =
    controlHealthQuery.isLoading ||
    runtimeHealthQuery.isLoading ||
    controlHealthQuery.isFetching ||
    runtimeHealthQuery.isFetching;

  const error = useMemo(() => {
    const messages: string[] = [];

    if (controlHealthQuery.isError) {
      messages.push('Control API health check failed. Start the Control API on port 3001.');
    }

    if (runtimeHealthQuery.isError) {
      messages.push('Runtime proxy health check failed.');
    }

    return messages.length > 0 ? messages.join(' ') : null;
  }, [controlHealthQuery.isError, runtimeHealthQuery.isError]);

  async function refreshHealth() {
    await Promise.all([controlHealthQuery.refetch(), runtimeHealthQuery.refetch()]);
    setLastUpdated(new Date().toLocaleString());
  }

  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [isLoading]);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge tone="ready">M01</StatusBadge>
            <StatusBadge tone="mock">Preview metrics</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Service health is connected through the Control Plane. Operational metrics are preview
            placeholders until their milestone data sources are implemented.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated ?? 'not loaded'}
        </div>
      </section>

      {error ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <ServiceHealthCard
          description="Control Plane API for auth, tenant config, metadata, audit, and run records."
          health={controlHealthQuery.data ?? null}
          isLoading={isLoading}
          onRefresh={refreshHealth}
          title="Control API"
        />
        <ServiceHealthCard
          description="Agent Runtime health is read through the Control API proxy to preserve frontend boundaries."
          health={runtimeHealthQuery.data ?? null}
          isLoading={isLoading}
          onRefresh={refreshHealth}
          title="Agent Runtime"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Run Status Trend</h2>
            <StatusBadge tone="planned">M09 source</StatusBadge>
          </div>
          <div className="mt-6 flex h-52 items-end gap-2">
            {[32, 48, 36, 72, 56, 84, 64, 92, 78, 68, 88, 74].map((height, index) => (
              <div className="flex flex-1 items-end" key={index}>
                <div
                  className="w-full rounded-t-md bg-primary/20"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <StatusBadge tone="planned">Audit pending</StatusBadge>
          </div>
          <div className="mt-10 rounded-lg border border-dashed p-8 text-center">
            <div className="text-sm font-medium">No activity yet</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              M02 and M09 will populate login logs, operation logs, run traces, and security events.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
