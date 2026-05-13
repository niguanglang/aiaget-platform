'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import Link from 'next/link';

import { ToolCenterBackground } from '@/components/tools/tool-center-background';
import {
  formatDateTime,
  formatPercent,
  toolCallStatusLabel,
  toolMethodLabel,
  toolRiskLabel,
} from '@/components/tools/tool-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { listTools } from '@/lib/api-client';

export function ToolLogsContent() {
  const [keyword, setKeyword] = useState('');
  const logsQuery = useQuery({
    queryKey: ['tool-execution-records', keyword],
    queryFn: () => listTools({ page: 1, page_size: 50, keyword }),
  });
  const tools = logsQuery.data?.items ?? [];
  const metrics = useMemo(() => {
    const callsToday = tools.reduce((sum, tool) => sum + tool.call_count_today, 0);
    const failuresToday = tools.reduce((sum, tool) => sum + tool.failure_count_today, 0);
    const failureRate = callsToday === 0 ? 0 : (failuresToday / callsToday) * 100;
    const calledTools = tools.filter((tool) => tool.last_call_at).length;

    return [
      { label: '今日调用', value: `${callsToday}`, helper: '当前筛选' },
      { label: '今日失败', value: `${failuresToday}`, helper: '当前筛选' },
      { label: '失败率', value: formatPercent(failureRate), helper: '当前筛选' },
      { label: '有调用记录工具', value: `${calledTools}`, helper: '当前筛选' },
    ];
  }, [tools]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ToolCenterBackground />
      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">执行记录</StatusBadge>
            <StatusBadge tone="healthy">工具调用</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">工具执行记录</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={logsQuery.isFetching} onClick={() => void logsQuery.refetch()} type="button" variant="outline">刷新记录</Button>
          <Button asChild type="button" variant="outline"><Link href="/tools">返回工具</Link></Button>
        </div>
      </motion.section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>
      <Card>
        <div className="border-b p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <h2 className="text-sm font-semibold">执行记录</h2>
            <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索工具名称、编码、链接" value={keyword} />
            </label>
          </div>
        </div>
        {logsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">工具执行记录加载失败。</div>
        ) : logsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载工具执行记录...</div>
        ) : tools.length === 0 ? (
          <EmptyState title="暂无执行记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['工具', '方法', '风险', '今日调用', '今日失败', '最近状态', '最近调用', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={tool.id}>
                    <td className="px-4 py-3">
                      <div className="grid max-w-md gap-1">
                        <Link className="font-medium hover:text-primary" href={`/tools/${tool.id}`}>{tool.name}</Link>
                        <span className="text-xs text-muted-foreground">{tool.code}</span>
                        <span className="line-clamp-1 break-all text-xs text-muted-foreground">{tool.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{toolMethodLabel(tool.method)}</td>
                    <td className="px-4 py-3"><StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>{toolRiskLabel(tool.risk_level)}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.call_count_today}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.failure_count_today}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.last_call_status ? toolCallStatusLabel(tool.last_call_status) : '暂无'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.last_call_at ? formatDateTime(tool.last_call_at) : '暂无'}</td>
                    <td className="px-4 py-3"><Button asChild size="sm" type="button" variant="outline"><Link href={`/tools/${tool.id}`}>查看详情</Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
