import type { ModelProviderDetail } from '@aiaget/shared-types';
import { Activity } from 'lucide-react';

import {
  formatDateTime,
  formatMoney,
  modelCallStatusLabel,
  modelProviderStatusLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export function ModelCostLogCard({ provider }: { provider: ModelProviderDetail }) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">成本规则与调用日志</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            成本规则由模型价格生成，调用日志用于审计、成本核算和问题追踪。
          </p>
        </div>
        <StatusBadge tone="planned">最近 {provider.call_logs.length} 条</StatusBadge>
      </div>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">成本规则</h3>
        {provider.cost_rules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无独立成本规则，当前按模型配置中的输入/输出价格估算。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['币种', '输入价格', '输出价格', '单位', '状态', '生效时间'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provider.cost_rules.map((rule) => (
                  <tr className="border-b last:border-0" key={rule.id}>
                    <td className="px-3 py-2">{rule.currency}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(rule.input_price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(rule.output_price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{rule.unit}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={modelStatusTone(rule.status)}>{modelProviderStatusLabel(rule.status)}</StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(rule.effective_from)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 border-t pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">调用日志</h3>
          <Activity className="size-4 text-muted-foreground" />
        </div>
        {provider.call_logs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无调用日志。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['时间', '模型', '状态', 'Tokens', '耗时', '成本', 'Trace', '错误'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provider.call_logs.map((log) => (
                  <tr className="border-b last:border-0" key={log.id}>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2">{log.request_model}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={modelStatusTone(log.status)}>{modelCallStatusLabel(log.status)}</StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {log.total_tokens} <span className="text-xs">({log.prompt_tokens}/{log.completion_tokens})</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{log.latency_ms} ms</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMoney(log.total_cost)}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-muted-foreground" title={log.trace_id}>
                      {log.trace_id}
                    </td>
                    <td className="max-w-56 truncate px-3 py-2 text-destructive" title={log.error_message ?? undefined}>
                      {log.error_message ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Card>
  );
}
