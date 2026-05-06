import type {
  AuditFailureItem,
  HealthResponse,
  HealthStatus,
  MonitorErrorSampleItem,
  MonitorOverview,
  MonitorRunStepMetricItem,
  MonitorTrendPoint,
  MonitorWindow,
} from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BrainCircuit,
  CircleDollarSign,
  Clock3,
  Database,
  TriangleAlert,
  Wrench,
  Zap,
} from 'lucide-react';

import {
  formatDateTime,
  formatLatency,
  formatPercent,
  monitorModuleLabel,
} from '@/components/monitor/monitor-status';

export const windowLabels: Record<MonitorWindow, string> = {
  '24h': '24 小时',
  '7d': '近 7 天',
};

export const metricToneClasses = {
  blue: {
    card: 'from-blue-50/90 to-white',
    icon: 'bg-blue-50 text-blue-600 ring-blue-100',
    line: '#2f7df6',
  },
  emerald: {
    card: 'from-emerald-50/90 to-white',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    line: '#2fbf88',
  },
  cyan: {
    card: 'from-cyan-50/90 to-white',
    icon: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    line: '#29b6c8',
  },
  red: {
    card: 'from-red-50/90 to-white',
    icon: 'bg-red-50 text-red-600 ring-red-100',
    line: '#ef4444',
  },
  amber: {
    card: 'from-amber-50/90 to-white',
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    line: '#f59e0b',
  },
  violet: {
    card: 'from-violet-50/90 to-white',
    icon: 'bg-violet-50 text-violet-600 ring-violet-100',
    line: '#7c3aed',
  },
} as const;

export const severityClasses = {
  high: 'border-red-100 bg-red-50 text-red-600',
  medium: 'border-amber-100 bg-amber-50 text-amber-600',
  low: 'border-blue-100 bg-blue-50 text-blue-600',
} as const;

export const severityLabels = {
  high: '高',
  medium: '中',
  low: '低',
} as const;

export const dashboardSurfaceClass =
  'border-white/70 bg-white/[0.88] shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/[0.78]';
export const dashboardMetricSurfaceClass =
  'border-white/70 shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/[0.74]';

export type MetricTone = keyof typeof metricToneClasses;
export type IncidentSeverity = keyof typeof severityClasses;
export type HealthRowStatus = HealthStatus | 'loading';

export interface DashboardMetric {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: MetricTone;
  trend: number[];
  value: string;
}

export interface IncidentItem {
  description: string;
  id: string;
  severity: IncidentSeverity;
  source: string;
  time: string;
  title: string;
}

export interface ErrorSegment {
  color: string;
  count: number;
  label: string;
}

export function buildDashboardMetrics({
  monitorOverview,
  windowValue,
}: {
  monitorOverview: MonitorOverview | undefined;
  windowValue: MonitorWindow;
}): DashboardMetric[] {
  const summary = monitorOverview?.summary;
  const agentRankings = monitorOverview?.agent_rankings ?? [];
  const toolRankings = monitorOverview?.tool_rankings ?? [];
  const knowledgeRankings = monitorOverview?.knowledge_rankings ?? [];
  const points = monitorOverview?.latency_trend ?? [];
  const activeAgents = agentRankings.length;
  const activeConversations = summary?.active_conversations ?? 0;
  const eventsTotal = summary?.events_total ?? 0;
  const failedEvents = sumBy(points, (point) => point.failed);
  const trendTotal = sumBy(points, (point) => point.total);
  const totalToolCalls = sumBy(toolRankings, (item) => item.call_count);
  const totalKnowledgeRecalls = sumBy(knowledgeRankings, (item) => item.recall_count);

  return [
    {
      helper: '有调用记录',
      icon: BrainCircuit,
      label: '活跃智能体',
      tone: 'blue',
      trend: agentRankings.map((item) => item.run_count),
      value: summary ? formatNumber(activeAgents) : '--',
    },
    {
      helper: '当前线程',
      icon: Activity,
      label: '运行中会话',
      tone: 'emerald',
      trend: points.map((point) => point.success),
      value: summary ? formatNumber(activeConversations) : '--',
    },
    {
      helper: `${windowLabels[windowValue]}窗口`,
      icon: Zap,
      label: '窗口调用量',
      tone: 'blue',
      trend: points.map((point) => point.total),
      value: summary ? formatNumber(eventsTotal) : '--',
    },
    {
      helper: `失败率 ${trendTotal > 0 ? formatPercent((failedEvents / trendTotal) * 100) : '0.0%'}`,
      icon: TriangleAlert,
      label: '失败事件',
      tone: 'red',
      trend: points.map((point) => point.failed),
      value: summary ? formatNumber(failedEvents) : '--',
    },
    {
      helper: `P95 ${summary ? formatLatency(summary.p95_latency_ms) : '--'}`,
      icon: Clock3,
      label: '平均延迟',
      tone: 'cyan',
      trend: points.map((point) => point.average_latency_ms),
      value: summary ? formatLatency(summary.average_latency_ms) : '--',
    },
    {
      helper: '模型调用成本',
      icon: CircleDollarSign,
      label: '费用预估',
      tone: 'emerald',
      trend: monitorOverview?.model_rankings.map((item) => item.total_cost) ?? [],
      value: summary ? formatDashboardMoney(summary.total_cost) : '--',
    },
    {
      helper: '知识库召回',
      icon: Database,
      label: '检索调用量',
      tone: 'blue',
      trend: knowledgeRankings.map((item) => item.recall_count),
      value: summary ? formatNumber(totalKnowledgeRecalls) : '--',
    },
    {
      helper: '工具执行记录',
      icon: Wrench,
      label: '工具调用次数',
      tone: 'blue',
      trend: toolRankings.map((item) => item.call_count),
      value: summary ? formatNumber(totalToolCalls) : '--',
    },
  ];
}

export function buildHealthRows({
  auditError,
  auditLoaded,
  auditSuccessRate,
  controlHealth,
  monitorError,
  monitorLoaded,
  runtimeHealth,
  summaryLatency,
  trendPoints,
}: {
  auditError: boolean;
  auditLoaded: boolean;
  auditSuccessRate: number | undefined;
  controlHealth: HealthResponse | null;
  monitorError: boolean;
  monitorLoaded: boolean;
  runtimeHealth: HealthResponse | null;
  summaryLatency: number | null;
  trendPoints: MonitorTrendPoint[];
}) {
  const failedTotal = sumBy(trendPoints, (point) => point.failed);
  const eventTotal = sumBy(trendPoints, (point) => point.total);
  const monitorFailureRate = eventTotal > 0 ? formatPercent((failedTotal / eventTotal) * 100) : '0.0%';
  const auditFailureRate = auditSuccessRate === undefined ? '--' : formatPercent(100 - auditSuccessRate);

  return [
    {
      detail: controlHealth?.version ? `版本 ${controlHealth.version}` : '等待控制服务返回',
      latency: '--',
      name: '控制服务 (control-api)',
      status: controlHealth?.status ?? (monitorError ? 'unavailable' : 'loading'),
    },
    {
      detail: runtimeHealth?.version ? `版本 ${runtimeHealth.version}` : '等待运行时返回',
      latency: '--',
      name: '运行时服务 (agent-runtime)',
      status: runtimeHealth?.status ?? (monitorLoaded ? 'unavailable' : 'loading'),
    },
    {
      detail: `失败率 ${monitorFailureRate}`,
      latency: formatLatency(summaryLatency),
      name: '监控聚合',
      status: monitorError ? 'unavailable' : monitorLoaded ? 'healthy' : 'loading',
    },
    {
      detail: `失败率 ${auditFailureRate}`,
      latency: '--',
      name: '审计聚合',
      status: auditError ? 'unavailable' : auditLoaded ? 'healthy' : 'loading',
    },
  ] satisfies Array<{
    detail: string;
    latency: string;
    name: string;
    status: HealthRowStatus;
  }>;
}

export function calculateHealthScore({
  auditSuccessRate,
  controlHealth,
  errorCount,
  monitorSuccessRate,
  runtimeHealth,
}: {
  auditSuccessRate: number | undefined;
  controlHealth: HealthResponse | null;
  errorCount: number;
  monitorSuccessRate: number | undefined;
  runtimeHealth: HealthResponse | null;
}) {
  if (monitorSuccessRate === undefined && auditSuccessRate === undefined && !controlHealth && !runtimeHealth) {
    return null;
  }

  const baseRates = [monitorSuccessRate, auditSuccessRate].filter((value): value is number => value !== undefined);
  const base = baseRates.length > 0 ? baseRates.reduce((total, value) => total + value, 0) / baseRates.length : 92;
  const servicePenalty = [controlHealth?.status, runtimeHealth?.status].reduce((total, status) => {
    if (status === 'degraded') return total + 6;
    if (status === 'unavailable' || status === undefined) return total + 14;
    return total;
  }, 0);
  const incidentPenalty = Math.min(10, errorCount * 1.2);

  return Math.max(0, Math.min(100, base - servicePenalty - incidentPenalty));
}

export function mapAuditFailureToIncident(item: AuditFailureItem): IncidentItem {
  return {
    description: item.error_message,
    id: item.event_id,
    severity: item.source_type === 'login' ? 'high' : 'medium',
    source: item.source_type === 'login' ? '登录审计' : '操作审计',
    time: item.occurred_at,
    title: item.title,
  };
}

export function mapMonitorErrorToIncident(item: MonitorErrorSampleItem): IncidentItem {
  return {
    description: item.error_message,
    id: item.event_id,
    severity: item.module === 'model' ? 'high' : item.module === 'tool' ? 'medium' : 'low',
    source: monitorModuleLabel(item.module),
    time: item.occurred_at,
    title: item.title,
  };
}

export function buildErrorSegments(errors: MonitorErrorSampleItem[], auditFailures: AuditFailureItem[]) {
  const segmentMap = new Map<string, ErrorSegment>([
    ['模型调用失败', { color: '#ef4444', count: 0, label: '模型调用失败' }],
    ['工具调用失败', { color: '#f59e0b', count: 0, label: '工具调用失败' }],
    ['知识库/检索错误', { color: '#2f7df6', count: 0, label: '知识库/检索错误' }],
    ['审计/认证失败', { color: '#14b8a6', count: 0, label: '审计/认证失败' }],
    ['其他错误', { color: '#94a3b8', count: 0, label: '其他错误' }],
  ]);

  for (const error of errors) {
    if (error.module === 'model') {
      incrementSegment(segmentMap, '模型调用失败');
    } else if (error.module === 'tool') {
      incrementSegment(segmentMap, '工具调用失败');
    } else if (error.module === 'knowledge') {
      incrementSegment(segmentMap, '知识库/检索错误');
    } else {
      incrementSegment(segmentMap, '其他错误');
    }
  }

  for (const failure of auditFailures) {
    if (failure.source_type === 'login') {
      incrementSegment(segmentMap, '审计/认证失败');
    } else {
      incrementSegment(segmentMap, '其他错误');
    }
  }

  return [...segmentMap.values()].filter((segment) => segment.count > 0);
}

function incrementSegment(segmentMap: Map<string, ErrorSegment>, label: string) {
  const segment = segmentMap.get(label);

  if (segment) {
    segment.count += 1;
  }
}

export function buildDonutGradient(segments: ErrorSegment[]) {
  const total = sumBy(segments, (segment) => segment.count);

  if (total === 0) {
    return 'conic-gradient(#e2e8f0 0 100%)';
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const end = cursor + (segment.count / total) * 100;
    cursor = end;

    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export function buildPolylinePoints(values: number[], width: number, height: number, padding = 0) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (values.length === 1 ? innerWidth / 2 : (innerWidth / (values.length - 1)) * index);
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function buildChartPolyline(
  values: number[],
  max: number,
  width: number,
  height: number,
  padding: { bottom: number; left: number; right: number; top: number },
) {
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  return values
    .map((value, index) => {
      const x = padding.left + (values.length === 1 ? plotWidth / 2 : (plotWidth / (values.length - 1)) * index);
      const y = padding.top + plotHeight - (value / max) * plotHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function sumBy<TItem>(items: TItem[], getValue: (item: TItem) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function formatDashboardMoney(value: number) {
  return `¥${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}`;
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}

export function buildMonitorStepHref(windowValue: MonitorWindow, stepType?: MonitorRunStepMetricItem['step_type']) {
  const params = new URLSearchParams({
    source_type: 'conversation_step',
    window: windowValue,
  });

  if (stepType) {
    params.set('step_type', stepType);
  }

  return `/monitor?${params.toString()}`;
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return formatDateTime(value);
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours} 小时前`;

  return `${Math.round(diffHours / 24)} 天前`;
}
