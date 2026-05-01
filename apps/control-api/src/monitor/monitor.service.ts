import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ConversationRunStepItem,
  HealthResponse,
  MonitorAgentRankingItem,
  MonitorErrorSampleItem,
  MonitorEventDetail,
  MonitorEventListItem,
  MonitorEventStatus,
  MonitorKnowledgeRankingItem,
  MonitorModelRankingItem,
  MonitorModule,
  MonitorModuleMetricItem,
  MonitorObservabilityOverview,
  MonitorOverview,
  MonitorRunStepMetricItem,
  MonitorRunStepSummary,
  MonitorRunStepType,
  MonitorTraceDetail,
  MonitorTraceMetrics,
  MonitorTracePropagation,
  MonitorTraceSummaryItem,
  MonitorToolRankingItem,
  MonitorTrendPoint,
  MonitorWindow,
  PaginatedResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { requireEnv } from '../common/env';
import { PrismaService } from '../prisma/prisma.service';
import type { ListMonitorEventsDto } from './dto/list-monitor-events.dto';

const RUNTIME_BASE_URL = requireEnv('RUNTIME_BASE_URL');

interface MonitorEventRecord extends MonitorEventListItem {
  error_message: string | null;
  request_payload: unknown;
  response_payload: unknown;
  step_payload: unknown;
}

@Injectable()
export class MonitorService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser, window: string | undefined): Promise<MonitorOverview> {
    const normalizedWindow = normalizeWindow(window);
    const since = windowStart(normalizedWindow);
    const health = await this.getHealth();
    const events = await this.loadEvents(currentUser.tenantId, since);
    const billableEvents = events.filter((event) => event.source_type !== 'conversation_step');
    const stepEvents = events.filter((event) => event.source_type === 'conversation_step');

    return {
      window: normalizedWindow,
      health,
      summary: {
        events_total: events.length,
        success_rate: ratioPercent(events.filter((event) => event.status === 'SUCCESS').length, events.length),
        average_latency_ms: average(events.map((event) => event.latency_ms).filter(isNumber)),
        p95_latency_ms: percentile(events.map((event) => event.latency_ms).filter(isNumber), 0.95) ?? 0,
        total_cost: sum(billableEvents.map((event) => event.cost_total).filter(isNumber)),
        active_conversations: await this.prisma.conversation.count({
          where: {
            tenantId: currentUser.tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
      },
      module_breakdown: buildModuleBreakdown(events),
      run_step_summary: buildRunStepSummary(stepEvents),
      run_step_breakdown: buildRunStepBreakdown(stepEvents),
      latency_trend: buildLatencyTrend(events, normalizedWindow),
      agent_rankings: await this.buildAgentRankings(currentUser.tenantId, since),
      model_rankings: await this.buildModelRankings(currentUser.tenantId, since),
      tool_rankings: await this.buildToolRankings(currentUser.tenantId, since),
      knowledge_rankings: await this.buildKnowledgeRankings(currentUser.tenantId, since),
      errors: buildErrorSamples(events),
    };
  }

  async listEvents(
    currentUser: AuthenticatedUser,
    query: ListMonitorEventsDto,
  ): Promise<PaginatedResult<MonitorEventListItem>> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim().toLowerCase();

    const events = (await this.loadEvents(currentUser.tenantId, since)).filter((event) => {
      if (query.module && event.module !== query.module) return false;
      if (query.status && event.status !== query.status) return false;
      if (query.source_type && event.source_type !== query.source_type) return false;
      if (query.step_type && event.step_type !== query.step_type) return false;
      if (!keyword) return true;

      return (
        event.trace_id.toLowerCase().includes(keyword)
        || event.title.toLowerCase().includes(keyword)
        || event.summary.toLowerCase().includes(keyword)
        || event.source_type.toLowerCase().includes(keyword)
        || (event.step_type?.toLowerCase().includes(keyword) ?? false)
      );
    });

    const paged = events.slice((page - 1) * pageSize, page * pageSize).map(stripEventDetail);

    return {
      items: paged,
      page,
      page_size: pageSize,
      total: events.length,
    };
  }

  async getEvent(currentUser: AuthenticatedUser, eventId: string): Promise<MonitorEventDetail> {
    const event = (await this.loadEvents(currentUser.tenantId, new Date(0))).find((item) => item.event_id === eventId);

    if (!event) {
      throw new NotFoundException('Monitor event not found');
    }

    return event;
  }

  async getTrace(currentUser: AuthenticatedUser, traceId: string, window: string | undefined): Promise<MonitorTraceDetail> {
    const normalizedWindow = normalizeWindow(window);
    const events = (await this.loadEvents(currentUser.tenantId, windowStart(normalizedWindow)))
      .filter((event) => event.trace_id === traceId)
      .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));

    if (events.length === 0) {
      throw new NotFoundException('Monitor trace not found');
    }

    return buildTraceDetail(traceId, events);
  }

  async getObservabilityOverview(
    currentUser: AuthenticatedUser,
    window: string | undefined,
  ): Promise<MonitorObservabilityOverview> {
    const normalizedWindow = normalizeWindow(window);
    const events = await this.loadEvents(currentUser.tenantId, windowStart(normalizedWindow));

    return buildObservabilityOverview(events, normalizedWindow);
  }

  private async getHealth(): Promise<MonitorOverview['health']> {
    const runtime = await this.fetchRuntimeHealth();

    return {
      control_api: {
        service: 'control-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      },
      runtime,
    };
  }

  private async fetchRuntimeHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(new URL('/runtime/health', RUNTIME_BASE_URL), {
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        return unavailableHealth('agent-runtime');
      }

      const health = (await response.json()) as HealthResponse;
      return {
        service: health.service ?? 'agent-runtime',
        status: health.status ?? 'unavailable',
        timestamp: health.timestamp ?? new Date().toISOString(),
        version: health.version ?? 'unknown',
      };
    } catch {
      return unavailableHealth('agent-runtime');
    }
  }

  private async loadEvents(tenantId: string, since: Date): Promise<MonitorEventRecord[]> {
    const [operationLogs, modelCallLogs, toolCallLogs, recallLogs, conversationRuns] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      }),
      this.prisma.modelCallLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          provider: true,
          modelConfig: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      }),
      this.prisma.toolCallLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          tool: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      }),
      this.prisma.knowledgeRecallLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          knowledge: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      }),
      this.prisma.conversationRun.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          agent: true,
          conversation: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 200,
      }),
    ]);

    const conversationEvents = conversationRuns.flatMap((run) => [
      mapConversationRun(run),
      ...mapConversationRunSteps(run),
    ]);

    return [
      ...operationLogs.map((log) => mapOperationLog(log)),
      ...modelCallLogs.map((log) => mapModelCallLog(log)),
      ...toolCallLogs.map((log) => mapToolCallLog(log)),
      ...recallLogs.map((log) => mapRecallLog(log)),
      ...conversationEvents,
    ].sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at));
  }

  private async buildAgentRankings(tenantId: string, since: Date): Promise<MonitorAgentRankingItem[]> {
    const runs = await this.prisma.conversationRun.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: since,
        },
      },
      include: {
        agent: true,
      },
    });

    const grouped = groupBy(runs, (run) => run.agentId);
    return Array.from(grouped.values())
      .map((items) => {
        const first = items[0];
        if (!first) return null;
        return {
          agent_id: first.agentId,
          agent_name: first.agent.name,
          agent_code: first.agent.code,
          run_count: items.length,
          success_rate: ratioPercent(items.filter((item) => item.status === 'SUCCESS').length, items.length),
          average_latency_ms: average(items.map((item) => item.latencyMs)),
        };
      })
      .filter((item): item is MonitorAgentRankingItem => Boolean(item))
      .sort((left, right) => right.run_count - left.run_count)
      .slice(0, 6);
  }

  private async buildModelRankings(tenantId: string, since: Date): Promise<MonitorModelRankingItem[]> {
    const logs = await this.prisma.modelCallLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: since,
        },
      },
      include: {
        provider: true,
        modelConfig: true,
      },
    });

    const grouped = groupBy(logs, (log) => `${log.providerId}:${log.modelConfigId ?? log.requestModel}`);
    return Array.from(grouped.values())
      .map((items) => {
        const first = items[0];
        if (!first) return null;
        return {
          provider_id: first.providerId,
          provider_name: first.provider.name,
          model_config_id: first.modelConfigId,
          model_name: first.modelConfig?.name ?? first.requestModel,
          call_count: items.length,
          success_rate: ratioPercent(items.filter((item) => item.status === 'SUCCESS').length, items.length),
          average_latency_ms: average(items.map((item) => item.latencyMs)),
          total_cost: sum(items.map((item) => Number(item.totalCost))),
        };
      })
      .filter((item): item is MonitorModelRankingItem => Boolean(item))
      .sort((left, right) => right.call_count - left.call_count)
      .slice(0, 6);
  }

  private async buildToolRankings(tenantId: string, since: Date): Promise<MonitorToolRankingItem[]> {
    const logs = await this.prisma.toolCallLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: since,
        },
      },
      include: {
        tool: true,
      },
    });

    const grouped = groupBy(logs, (log) => log.toolId);
    return Array.from(grouped.values())
      .map((items) => {
        const first = items[0];
        if (!first) return null;
        return {
          tool_id: first.toolId,
          tool_name: first.tool.name,
          tool_code: first.tool.code,
          call_count: items.length,
          failure_count: items.filter((item) => item.status !== 'SUCCESS').length,
          average_latency_ms: average(items.map((item) => item.latencyMs)),
        };
      })
      .filter((item): item is MonitorToolRankingItem => Boolean(item))
      .sort((left, right) => right.call_count - left.call_count)
      .slice(0, 6);
  }

  private async buildKnowledgeRankings(tenantId: string, since: Date): Promise<MonitorKnowledgeRankingItem[]> {
    const logs = await this.prisma.knowledgeRecallLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: since,
        },
      },
      include: {
        knowledge: true,
      },
    });

    const grouped = groupBy(logs, (log) => log.knowledgeId);
    return Array.from(grouped.values())
      .map((items) => {
        const first = items[0];
        if (!first) return null;
        return {
          knowledge_id: first.knowledgeId,
          knowledge_name: first.knowledge.name,
          knowledge_code: first.knowledge.code,
          recall_count: items.length,
          success_rate: ratioPercent(items.filter((item) => item.status === 'SUCCESS').length, items.length),
          average_latency_ms: average(items.map((item) => item.latencyMs)),
        };
      })
      .filter((item): item is MonitorKnowledgeRankingItem => Boolean(item))
      .sort((left, right) => right.recall_count - left.recall_count)
      .slice(0, 6);
  }
}

function normalizeWindow(window: string | undefined): MonitorWindow {
  return window === '7d' ? '7d' : '24h';
}

function windowStart(window: MonitorWindow) {
  const now = new Date();
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function unavailableHealth(service: string): HealthResponse {
  return {
    service,
    status: 'unavailable',
    timestamp: new Date().toISOString(),
    version: 'unknown',
  };
}

function stripEventDetail(event: MonitorEventRecord): MonitorEventListItem {
  return {
    event_id: event.event_id,
    trace_id: event.trace_id,
    module: event.module,
    source_type: event.source_type,
    status: event.status,
    title: event.title,
    summary: event.summary,
    latency_ms: event.latency_ms,
    token_total: event.token_total,
    cost_total: event.cost_total,
    step_type: event.step_type,
    occurred_at: event.occurred_at,
  };
}

function mapOperationLog(log: Prisma.OperationLogGetPayload<object>): MonitorEventRecord {
  const status = log.statusCode >= 500 ? 'FAILED' : log.statusCode >= 400 ? 'DEGRADED' : 'SUCCESS';
  const module = normalizeModule(log.module);
  const requestSummary = normalizeJsonObject(log.requestSummary);
  return {
    event_id: `operation:${log.id}`,
    trace_id: extractTraceId(log.requestSummary) ?? log.requestId,
    module,
    source_type: 'operation',
    status,
    title: `${module} ${log.action}`,
    summary: `${log.method} ${log.path}`,
    latency_ms: null,
    token_total: null,
    cost_total: null,
    step_type: null,
    occurred_at: log.createdAt.toISOString(),
    error_message: log.errorMessage,
    request_payload: log.requestSummary,
    response_payload: null,
    step_payload: {
      method: log.method,
      path: log.path,
      status_code: log.statusCode,
      user_agent: log.userAgent,
      span_id: stringValue(requestSummary?.span_id) ?? null,
      parent_span_id: stringValue(requestSummary?.parent_span_id) ?? null,
    },
  };
}

function mapModelCallLog(
  log: Prisma.ModelCallLogGetPayload<{
    include: {
      provider: true;
      modelConfig: true;
    };
  }>,
): MonitorEventRecord {
  return {
    event_id: `model:${log.id}`,
    trace_id: log.traceId,
    module: 'model',
    source_type: 'model_call',
    status: log.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    title: `${log.provider.name} / ${log.modelConfig?.name ?? log.requestModel}`,
    summary: `${log.requestModel} · ${log.totalTokens} tokens`,
    latency_ms: log.latencyMs,
    token_total: log.totalTokens,
    cost_total: Number(log.totalCost),
    step_type: null,
    occurred_at: log.createdAt.toISOString(),
    error_message: log.errorMessage,
    request_payload: log.requestSummary,
    response_payload: log.responseSummary,
    step_payload: null,
  };
}

function mapToolCallLog(
  log: Prisma.ToolCallLogGetPayload<{
    include: {
      tool: true;
    };
  }>,
): MonitorEventRecord {
  const status: MonitorEventStatus =
    log.status === 'SUCCESS'
      ? 'SUCCESS'
      : log.status === 'APPROVAL_REQUIRED' || log.status === 'REJECTED'
        ? 'DEGRADED'
        : 'FAILED';

  return {
    event_id: `tool:${log.id}`,
    trace_id: extractTraceId(log.requestHeaders) ?? `tool:${log.id}`,
    module: 'tool',
    source_type: 'tool_call',
    status,
    title: log.tool.name,
    summary: `${log.requestMethod} ${log.requestUrl}`,
    latency_ms: log.latencyMs,
    token_total: null,
    cost_total: null,
    step_type: null,
    occurred_at: log.createdAt.toISOString(),
    error_message: log.errorMessage,
    request_payload: {
      headers: log.requestHeaders,
      body: log.requestBody,
    },
    response_payload: {
      status: log.responseStatus,
      headers: log.responseHeaders,
      body: log.responseBody,
    },
    step_payload: {
      trigger_source: log.triggerSource,
    },
  };
}

function mapRecallLog(
  log: Prisma.KnowledgeRecallLogGetPayload<{
    include: {
      knowledge: true;
    };
  }>,
): MonitorEventRecord {
  return {
    event_id: `knowledge:${log.id}`,
    trace_id: extractTraceId(log.results) ?? `recall:${log.id}`,
    module: 'knowledge',
    source_type: 'knowledge_recall',
    status: log.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    title: log.knowledge.name,
    summary: `${log.mode} · ${log.resultCount} 条结果`,
    latency_ms: log.latencyMs,
    token_total: null,
    cost_total: null,
    step_type: null,
    occurred_at: log.createdAt.toISOString(),
    error_message: log.errorMessage,
    request_payload: {
      query: log.query,
      mode: log.mode,
      top_k: log.topK,
    },
    response_payload: log.results,
    step_payload: null,
  };
}

function mapConversationRun(
  run: Prisma.ConversationRunGetPayload<{
    include: {
      agent: true;
      conversation: true;
    };
  }>,
): MonitorEventRecord {
  const traceId = extractRunTraceId(run);
  return {
    event_id: `conversation:${run.id}`,
    trace_id: traceId,
    module: 'conversation',
    source_type: 'conversation_run',
    status: run.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    title: run.conversation.title,
    summary: `${run.agent.name} · ${run.totalTokens} tokens`,
    latency_ms: run.latencyMs,
    token_total: run.totalTokens,
    cost_total: null,
    step_type: null,
    occurred_at: run.createdAt.toISOString(),
    error_message: run.errorMessage,
    request_payload: {
      request_model: run.requestModel,
      prompt_tokens: run.promptTokens,
      completion_tokens: run.completionTokens,
      trace_id: traceId,
    },
    response_payload: null,
    step_payload: run.steps,
  };
}

function mapConversationRunSteps(
  run: Prisma.ConversationRunGetPayload<{
    include: {
      agent: true;
      conversation: true;
    };
  }>,
): MonitorEventRecord[] {
  const runTraceId = extractRunTraceId(run);
  return parseConversationRunSteps(run.steps).map((step, index) => {
    const stepType = normalizeStepType(step);
    const status = stepStatusToMonitorStatus(step.status);
    const occurredAt = run.endedAt ?? run.startedAt ?? run.createdAt;
    const tokenTotal = step.total_tokens ?? sumNullable([step.prompt_tokens, step.completion_tokens]);

    return {
      event_id: `conversation-step:${run.id}:${step.id}:${index}`,
      trace_id: step.trace_id ?? runTraceId,
      module: stepTypeToModule(stepType),
      source_type: 'conversation_step',
      status,
      title: `${step.title} · ${run.agent.name}`,
      summary: step.summary,
      latency_ms: step.latency_ms ?? null,
      token_total: tokenTotal,
      cost_total: step.cost_total ?? null,
      step_type: stepType,
      occurred_at: occurredAt.toISOString(),
      error_message: status === 'FAILED' ? step.summary : null,
      request_payload: {
        run_id: run.id,
        conversation_id: run.conversationId,
        agent_id: run.agentId,
        trace_id: step.trace_id ?? runTraceId,
        span_id: step.span_id ?? null,
        parent_span_id: step.parent_span_id ?? null,
        request_model: step.request_model ?? run.requestModel,
        step_id: step.id,
        step_type: stepType,
      },
      response_payload: {
        step_status: step.status,
        response_status: step.response_status ?? null,
        item_count: step.item_count ?? null,
        prompt_tokens: step.prompt_tokens ?? null,
        completion_tokens: step.completion_tokens ?? null,
        total_tokens: tokenTotal,
        cost_total: step.cost_total ?? null,
      },
      step_payload: step,
    };
  });
}

function normalizeModule(module: string): MonitorModule {
  const allowed: MonitorModule[] = ['agent', 'prompt', 'model', 'knowledge', 'tool', 'conversation', 'user', 'tenant', 'auth', 'system'];
  return allowed.includes(module as MonitorModule) ? (module as MonitorModule) : 'system';
}

function parseConversationRunSteps(value: Prisma.JsonValue | null): ConversationRunStepItem[] {
  return Array.isArray(value) ? (value as unknown as ConversationRunStepItem[]) : [];
}

function extractRunTraceId(run: Prisma.ConversationRunGetPayload<object>) {
  return parseConversationRunSteps(run.steps).find((step) => step.trace_id)?.trace_id ?? `run:${run.id}`;
}

function extractTraceId(value: Prisma.JsonValue | null): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const traceId = extractTraceId(item as Prisma.JsonValue);
      if (traceId) return traceId;
    }
    return null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directTraceId = stringValue(record.trace_id ?? record.traceId ?? record['x-trace-id']);
  if (directTraceId && /^[0-9a-f]{32}$/.test(directTraceId)) {
    return directTraceId;
  }

  const traceparent = stringValue(record.traceparent);
  const traceparentMatch = traceparent?.match(/^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i);
  const traceparentTraceId = traceparentMatch?.[1];
  if (traceparentTraceId) {
    return traceparentTraceId.toLowerCase();
  }

  for (const entry of Object.values(record)) {
    if (entry && typeof entry === 'object') {
      const traceId = extractTraceId(entry as Prisma.JsonValue);
      if (traceId) return traceId;
    }
  }

  return null;
}

function normalizeStepType(step: ConversationRunStepItem): MonitorRunStepType {
  if (step.id === 'model' || step.request_model) return 'model';
  if (step.type === 'prompt' || step.type === 'tool' || step.type === 'knowledge') return step.type;
  return 'response';
}

function stepTypeToModule(stepType: MonitorRunStepType): MonitorModule {
  if (stepType === 'model') return 'model';
  if (stepType === 'tool') return 'tool';
  if (stepType === 'knowledge') return 'knowledge';
  if (stepType === 'prompt') return 'prompt';
  return 'conversation';
}

function stepStatusToMonitorStatus(status: ConversationRunStepItem['status']): MonitorEventStatus {
  if (status === 'done') return 'SUCCESS';
  if (status === 'skipped') return 'DEGRADED';
  return 'FAILED';
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 0;
  return Number(((success / total) * 100).toFixed(1));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * target) - 1));
  return sorted[index];
}

function sum(values: number[]) {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(6));
}

function sumNullable(values: Array<number | null | undefined>) {
  const numbers = values.filter(isNumber);
  return numbers.length > 0 ? sum(numbers) : null;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : null;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const output = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, [...(output.get(key) ?? []), item]);
  }
  return output;
}

function buildModuleBreakdown(events: MonitorEventRecord[]): MonitorModuleMetricItem[] {
  const grouped = groupBy(events, (event) => event.module);
  return Array.from(grouped.entries()).map(([module, items]) => ({
    module: module as MonitorModule,
    event_count: items.length,
    error_count: items.filter((item) => item.status !== 'SUCCESS').length,
    average_latency_ms: average(items.map((item) => item.latency_ms).filter(isNumber)) || null,
  }));
}

function buildRunStepSummary(stepEvents: MonitorEventRecord[]): MonitorRunStepSummary {
  return {
    steps_total: stepEvents.length,
    failed_steps: stepEvents.filter((event) => event.status === 'FAILED').length,
    average_latency_ms: average(stepEvents.map((event) => event.latency_ms).filter(isNumber)),
    total_tokens: Math.round(sum(stepEvents.map((event) => event.token_total).filter(isNumber))),
    total_cost: sum(stepEvents.map((event) => event.cost_total).filter(isNumber)),
    tool_steps: stepEvents.filter((event) => event.step_type === 'tool').length,
    knowledge_steps: stepEvents.filter((event) => event.step_type === 'knowledge').length,
    model_steps: stepEvents.filter((event) => event.step_type === 'model').length,
  };
}

function buildRunStepBreakdown(stepEvents: MonitorEventRecord[]): MonitorRunStepMetricItem[] {
  const grouped = groupBy(
    stepEvents.filter((event) => event.step_type),
    (event) => event.step_type ?? 'response',
  );
  const order: MonitorRunStepType[] = ['prompt', 'tool', 'knowledge', 'model', 'response'];

  return Array.from(grouped.entries())
    .map(([stepType, items]) => ({
      step_type: stepType as MonitorRunStepType,
      step_count: items.length,
      failed_count: items.filter((item) => item.status === 'FAILED').length,
      average_latency_ms: average(items.map((item) => item.latency_ms).filter(isNumber)),
      p95_latency_ms: percentile(items.map((item) => item.latency_ms).filter(isNumber), 0.95) ?? null,
      total_tokens: Math.round(sum(items.map((item) => item.token_total).filter(isNumber))),
      total_cost: sum(items.map((item) => item.cost_total).filter(isNumber)),
    }))
    .sort((left, right) => order.indexOf(left.step_type) - order.indexOf(right.step_type));
}

function buildLatencyTrend(events: MonitorEventRecord[], window: MonitorWindow): MonitorTrendPoint[] {
  const buckets = new Map<string, MonitorEventRecord[]>();

  for (const event of events) {
    const date = new Date(event.occurred_at);
    const bucket = window === '7d'
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${String(date.getHours()).padStart(2, '0')}:00`;
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), event]);
  }

  return Array.from(buckets.entries()).map(([bucket, items]) => ({
    bucket,
    total: items.length,
    success: items.filter((item) => item.status === 'SUCCESS').length,
    failed: items.filter((item) => item.status !== 'SUCCESS').length,
    average_latency_ms: average(items.map((item) => item.latency_ms).filter(isNumber)),
  }));
}

function buildErrorSamples(events: MonitorEventRecord[]): MonitorErrorSampleItem[] {
  return events
    .filter((event) => event.error_message)
    .slice(0, 8)
    .map((event) => ({
      event_id: event.event_id,
      trace_id: event.trace_id,
      module: event.module,
      title: event.title,
      error_message: event.error_message ?? '未知错误',
      occurred_at: event.occurred_at,
    }));
}

function buildTraceDetail(traceId: string, events: MonitorEventRecord[]): MonitorTraceDetail {
  const sortedEvents = [...events].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));

  return {
    trace_id: traceId,
    root_event: sortedEvents[0] ? stripEventDetail(sortedEvents[0]) : null,
    events: sortedEvents,
    timeline: buildTraceTimeline(sortedEvents),
    metrics: buildTraceMetrics(sortedEvents),
    propagation: buildTracePropagation(traceId, sortedEvents),
    errors: buildErrorSamples(sortedEvents),
  };
}

function buildTraceTimeline(events: MonitorEventRecord[]) {
  return events.map((event) => {
    const payload = normalizeJsonObject(event.step_payload);

    return {
      event_id: event.event_id,
      trace_id: event.trace_id,
      module: event.module,
      source_type: event.source_type,
      status: event.status,
      title: event.title,
      summary: event.summary,
      step_type: event.step_type,
      started_at: event.occurred_at,
      duration_ms: event.latency_ms,
      span_id: stringValue(payload?.span_id) ?? null,
      parent_span_id: stringValue(payload?.parent_span_id) ?? null,
    };
  });
}

function buildTraceMetrics(events: MonitorEventRecord[]): MonitorTraceMetrics {
  const latencies = events.map((event) => event.latency_ms).filter(isNumber);

  return {
    event_count: events.length,
    success_count: events.filter((event) => event.status === 'SUCCESS').length,
    failed_count: events.filter((event) => event.status === 'FAILED').length,
    degraded_count: events.filter((event) => event.status === 'DEGRADED').length,
    total_latency_ms: Math.round(sum(latencies)),
    average_latency_ms: average(latencies),
    p95_latency_ms: percentile(latencies, 0.95) ?? null,
    total_tokens: Math.round(sum(events.map((event) => event.token_total).filter(isNumber))),
    total_cost: sum(events.map((event) => event.cost_total).filter(isNumber)),
    module_count: new Set(events.map((event) => event.module)).size,
  };
}

function buildTracePropagation(traceId: string, events: MonitorEventRecord[]): MonitorTracePropagation {
  const timeline = buildTraceTimeline(events);
  const spanIds = timeline.map((item) => item.span_id).filter((value): value is string => Boolean(value));
  const spanSet = new Set(spanIds);
  const parentIds = timeline.map((item) => item.parent_span_id).filter((value): value is string => Boolean(value));
  const orphanSpanCount = parentIds.filter((parentId) => !spanSet.has(parentId)).length;
  const missingSpanCount = timeline.filter((item) => !item.span_id).length;
  const rootSpanCount = timeline.filter((item) => item.span_id && !item.parent_span_id).length;
  const hasTraceId = /^[0-9a-f]{32}$/i.test(traceId);
  const hasSpanLinks = spanIds.length > 0 && parentIds.length > 0;
  const penalties = orphanSpanCount + missingSpanCount + (hasTraceId ? 0 : 1);
  const qualityScore = timeline.length === 0
    ? 0
    : Math.max(0, Math.round(((timeline.length - penalties) / timeline.length) * 100));

  return {
    has_trace_id: hasTraceId,
    has_span_links: hasSpanLinks,
    span_count: spanIds.length,
    root_span_count: rootSpanCount,
    orphan_span_count: orphanSpanCount,
    missing_span_count: missingSpanCount,
    quality_score: qualityScore,
  };
}

function buildObservabilityOverview(events: MonitorEventRecord[], window: MonitorWindow): MonitorObservabilityOverview {
  const traceGroups = groupBy(events, (event) => event.trace_id);
  const traceSummaries = Array.from(traceGroups.values()).map(buildTraceSummary).sort(sortTraceSummaryDesc);
  const validTraceEvents = events.filter((event) => /^[0-9a-f]{32}$/i.test(event.trace_id));
  const orphanEvents = events.filter((event) => !/^[0-9a-f]{32}$/i.test(event.trace_id));
  const errorTraceSummaries = traceSummaries.filter((summary) => summary.failed_count > 0);
  const slowTraceSummaries = traceSummaries.filter((summary) => summary.p95_latency_ms !== null && summary.p95_latency_ms >= 1500);

  return {
    generated_at: new Date().toISOString(),
    window,
    trace_coverage: ratioPercent(validTraceEvents.length, events.length),
    linked_trace_count: traceSummaries.length,
    orphan_event_count: orphanEvents.length,
    error_trace_count: errorTraceSummaries.length,
    slow_trace_count: slowTraceSummaries.length,
    top_error_modules: buildTopErrorModules(events),
    slow_traces: slowTraceSummaries.sort((left, right) => right.total_latency_ms - left.total_latency_ms).slice(0, 6),
    recent_error_traces: errorTraceSummaries.slice(0, 6),
  };
}

function buildTraceSummary(events: MonitorEventRecord[]): MonitorTraceSummaryItem {
  const sorted = [...events].sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at));
  const first = sorted[0] ?? events[0];
  const latencies = events.map((event) => event.latency_ms).filter(isNumber);

  return {
    trace_id: first?.trace_id ?? 'unknown',
    title: first?.title ?? '未知链路',
    module: first?.module ?? 'system',
    event_count: events.length,
    failed_count: events.filter((event) => event.status !== 'SUCCESS').length,
    total_latency_ms: Math.round(sum(latencies)),
    p95_latency_ms: percentile(latencies, 0.95) ?? null,
    occurred_at: first?.occurred_at ?? new Date(0).toISOString(),
  };
}

function buildTopErrorModules(events: MonitorEventRecord[]) {
  const failedEvents = events.filter((event) => event.status !== 'SUCCESS');
  const grouped = groupBy(failedEvents, (event) => event.module);

  return Array.from(grouped.entries())
    .map(([module, items]) => ({
      module: module as MonitorModule,
      error_count: items.length,
      trace_count: new Set(items.map((item) => item.trace_id)).size,
      latest_error_at: items.map((item) => item.occurred_at).sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? new Date(0).toISOString(),
    }))
    .sort((left, right) => right.error_count - left.error_count)
    .slice(0, 6);
}

function sortTraceSummaryDesc(left: MonitorTraceSummaryItem, right: MonitorTraceSummaryItem) {
  return Date.parse(right.occurred_at) - Date.parse(left.occurred_at);
}

function normalizeJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
