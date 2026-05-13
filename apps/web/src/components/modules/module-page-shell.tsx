import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ModuleSpec } from '@/config/modules';

const statusLabels: Record<ModuleSpec['status'], string> = {
  ready: '已接入',
  planned: '规划中',
  mock: '预览',
};

export function ModulePageShell({ moduleSpec }: { moduleSpec: ModuleSpec }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge tone={moduleSpec.status}>{statusLabels[moduleSpec.status]}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{moduleSpec.title}</h1>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleSpec.metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold">数据列表</h2>
            <div className="flex flex-wrap gap-2">
              {moduleSpec.filters.map((filter) => (
                <span
                  className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
                  key={filter}
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {moduleSpec.columns.map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={moduleSpec.columns.length}>
                  <div className="font-medium text-foreground">{moduleSpec.emptyTitle}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">信息分组</h2>
          <div className="mt-4 grid gap-2">
            {moduleSpec.detailSections.map((section) => (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm" key={section}>
                {section}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
