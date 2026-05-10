import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuditEventDetail,
  AuditEventListItem,
  AuditEventStatus,
  AuditFailureItem,
  AuditModuleRankingItem,
  AuditOverview,
  AuditUserRankingItem,
  AuditWindow,
  PaginatedResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { ListAuditEventsDto } from './dto/list-audit-events.dto';

interface AuditEventRecord extends AuditEventDetail {}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser, window: string | undefined): Promise<AuditOverview> {
    const normalizedWindow = normalizeWindow(window);
    const since = windowStart(normalizedWindow);
    const events = await this.loadEvents(currentUser.tenantId, since);

    return {
      window: normalizedWindow,
      summary: {
        login_total: events.filter((event) => event.source_type === 'login').length,
        operation_total: events.filter((event) => event.source_type === 'operation').length,
        approval_audit_total: events.filter((event) => event.source_type === 'approval_audit').length,
        billing_event_total: events.filter((event) => event.source_type === 'billing').length,
        security_event_total: events.filter((event) => event.status !== 'SUCCESS').length,
        config_change_total: events.filter((event) => isConfigChange(event)).length,
        success_rate: ratioPercent(events.filter((event) => event.status === 'SUCCESS').length, events.length),
      },
      user_rankings: buildUserRankings(events),
      module_rankings: buildModuleRankings(events),
      failures: buildFailures(events),
    };
  }

  async listEvents(
    currentUser: AuthenticatedUser,
    query: ListAuditEventsDto,
  ): Promise<PaginatedResult<AuditEventListItem>> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim().toLowerCase();

    const events = (await this.loadEvents(currentUser.tenantId, since)).filter((event) => {
      if (query.source_type && event.source_type !== query.source_type) return false;
      if (query.status && event.status !== query.status) return false;
      if (!keyword) return true;

      return auditEventMatchesKeyword(event, keyword);
    });

    const paged = events.slice((page - 1) * pageSize, page * pageSize).map(stripAuditDetail);

    return {
      items: paged,
      page,
      page_size: pageSize,
      total: events.length,
    };
  }

  async getEvent(currentUser: AuthenticatedUser, eventId: string): Promise<AuditEventDetail> {
    const event = (await this.loadEvents(currentUser.tenantId, new Date(0))).find((item) => item.event_id === eventId);

    if (!event) {
      throw new NotFoundException('Audit event not found');
    }

    return event;
  }

  private async loadEvents(tenantId: string, since: Date): Promise<AuditEventRecord[]> {
    const [loginLogs, operationLogs, approvalAuditEvents, billingEvents] = await this.prisma.$transaction([
      this.prisma.loginLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 300,
      }),
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 300,
      }),
      this.prisma.approvalAuditEvent.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
        include: {
          actor: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 300,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
          OR: [
            {
              eventSource: 'billing',
            },
            {
              sourceSystem: 'billing',
            },
          ],
        },
        include: {
          user: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 300,
      }),
    ]);

    return [
      ...loginLogs.map((log) => mapLoginLog(log)),
      ...operationLogs.map((log) => mapOperationLog(log)),
      ...approvalAuditEvents.map((event) => mapApprovalAuditEvent(event)),
      ...billingEvents.map((event) => mapBillingPlatformEvent(event)),
    ].sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at));
  }
}

function normalizeWindow(window: string | undefined): AuditWindow {
  return window === '7d' ? '7d' : '24h';
}

function windowStart(window: AuditWindow) {
  const now = new Date();
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function stripAuditDetail(event: AuditEventRecord): AuditEventListItem {
  return {
    event_id: event.event_id,
    source_type: event.source_type,
    status: event.status,
    user_email: event.user_email,
    module: event.module,
    action: event.action,
    title: event.title,
    summary: event.summary,
    request_id: event.request_id,
    occurred_at: event.occurred_at,
  };
}

function auditEventMatchesKeyword(event: AuditEventRecord, keyword: string) {
  return [
    event.user_email,
    event.module,
    event.action,
    event.title,
    event.summary,
    event.request_id,
    event.path,
    stringifySearchValue(event.request_summary),
    event.error_message,
  ].some((value) => value?.toLowerCase().includes(keyword));
}

function stringifySearchValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapLoginLog(
  log: Prisma.LoginLogGetPayload<{
    include: {
      user: true;
    };
  }>,
): AuditEventRecord {
  return {
    event_id: `login:${log.id}`,
    source_type: 'login',
    status: log.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    user_email: log.email,
    module: 'auth',
    action: 'login',
    title: log.status === 'SUCCESS' ? '登录成功' : '登录失败',
    summary: log.errorMessage ?? `来自 ${log.ip ?? '未知 IP'} 的登录尝试`,
    request_id: null,
    occurred_at: log.createdAt.toISOString(),
    ip: log.ip,
    user_agent: log.userAgent,
    path: '/auth/login',
    method: 'POST',
    status_code: log.status === 'SUCCESS' ? 200 : 401,
    request_summary: {
      email: log.email,
      tenant_id: log.tenantId,
    },
    error_message: log.errorMessage,
  };
}

function mapOperationLog(
  log: Prisma.OperationLogGetPayload<{
    include: {
      user: true;
    };
  }>,
): AuditEventRecord {
  return {
    event_id: `operation:${log.id}`,
    source_type: 'operation',
    status: operationStatus(log.statusCode),
    user_email: log.user?.email ?? '系统',
    module: log.module,
    action: log.action,
    title: `${log.module} ${log.action}`,
    summary: `${log.method} ${log.path}`,
    request_id: log.requestId,
    occurred_at: log.createdAt.toISOString(),
    ip: log.ip,
    user_agent: log.userAgent,
    path: log.path,
    method: log.method,
    status_code: log.statusCode,
    request_summary: log.requestSummary,
    error_message: log.errorMessage,
  };
}

function mapApprovalAuditEvent(
  event: Prisma.ApprovalAuditEventGetPayload<{
    include: {
      actor: true;
    };
  }>,
): AuditEventRecord {
  return {
    event_id: `approval_audit:${event.id}`,
    source_type: 'approval_audit',
    status: approvalAuditStatus(event.eventStatus),
    user_email: event.actor?.email ?? '系统',
    module: 'approvals',
    action: event.eventType.toLowerCase(),
    title: event.title,
    summary: event.note ?? `${event.sourceType} / ${event.sourceId}`,
    request_id: event.traceId ?? event.requestId,
    occurred_at: event.occurredAt.toISOString(),
    ip: null,
    user_agent: null,
    path: `/tool-approvals/audit-events/${event.id}`,
    method: 'GET',
    status_code: event.eventStatus === 'FAILED' ? 500 : 200,
    request_summary: {
      source_type: event.sourceType,
      source_id: event.sourceId,
      event_type: event.eventType,
      event_status: event.eventStatus,
      request_id: event.requestId,
      trace_id: event.traceId,
      metadata: event.metadata,
    },
    error_message: event.eventStatus === 'FAILED' ? event.note ?? event.title : null,
  };
}

function mapBillingPlatformEvent(
  event: Prisma.PlatformEventGetPayload<{
    include: {
      user: true;
    };
  }>,
): AuditEventRecord {
  return {
    event_id: `platform_event:${event.id}`,
    source_type: 'billing',
    status: platformEventAuditStatus(event.status),
    user_email: event.user?.email ?? '系统',
    module: 'billing',
    action: event.eventType,
    title: event.summary ?? event.eventType,
    summary: buildBillingEventSummary(event),
    request_id: event.traceId ?? event.requestId,
    occurred_at: event.occurredAt.toISOString(),
    ip: null,
    user_agent: null,
    path: `/monitor/platform-usage/events/${event.id}`,
    method: 'GET',
    status_code: event.status === 'FAILED' ? 500 : 200,
    request_summary: {
      event_source: event.eventSource,
      event_type: event.eventType,
      status: event.status,
      severity: event.severity,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      source_system: event.sourceSystem,
      source_id: event.sourceId,
      request_id: event.requestId,
      trace_id: event.traceId,
      payload: event.payloadJson,
    },
    error_message: event.status === 'FAILED' ? event.summary ?? event.eventType : null,
  };
}

function platformEventAuditStatus(status: string): AuditEventStatus {
  if (status === 'FAILED' || status === 'ERROR') return 'FAILED';
  if (status === 'DEGRADED' || status === 'WARNING' || status === 'WARN' || status === 'PARTIAL') return 'DEGRADED';
  return 'SUCCESS';
}

function buildBillingEventSummary(
  event: Prisma.PlatformEventGetPayload<{
    include: {
      user: true;
    };
  }>,
) {
  const payload = isRecord(event.payloadJson) ? event.payloadJson : {};
  const adjustmentNo = stringValue(payload.adjustment_no);
  const opportunityName = stringValue(payload.opportunity_name);
  const customerName = stringValue(payload.customer_name);
  const parts = [event.summary ?? event.eventType, adjustmentNo, opportunityName, customerName].filter(Boolean);

  if (parts.length > 0) return parts.join(' / ');
  return `${event.resourceType} / ${event.resourceId ?? event.sourceId ?? event.id}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function operationStatus(statusCode: number): AuditEventStatus {
  if (statusCode >= 500) return 'FAILED';
  if (statusCode >= 400) return 'DEGRADED';
  return 'SUCCESS';
}

function approvalAuditStatus(status: string): AuditEventStatus {
  if (status === 'FAILED') return 'FAILED';
  if (status === 'WARNING') return 'DEGRADED';
  return 'SUCCESS';
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 0;
  return Number(((success / total) * 100).toFixed(1));
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const output = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, [...(output.get(key) ?? []), item]);
  }
  return output;
}

function buildUserRankings(events: AuditEventRecord[]): AuditUserRankingItem[] {
  const grouped = groupBy(events, (event) => event.user_email);
  return Array.from(grouped.entries())
    .map(([userEmail, items]) => ({
      user_email: userEmail,
      event_count: items.length,
      failure_count: items.filter((item) => item.status !== 'SUCCESS').length,
    }))
    .sort((left, right) => right.event_count - left.event_count)
    .slice(0, 6);
}

function buildModuleRankings(events: AuditEventRecord[]): AuditModuleRankingItem[] {
  const grouped = groupBy(events, (event) => event.module ?? 'unknown');
  return Array.from(grouped.entries())
    .map(([module, items]) => ({
      module,
      event_count: items.length,
      failure_count: items.filter((item) => item.status !== 'SUCCESS').length,
    }))
    .sort((left, right) => right.event_count - left.event_count)
    .slice(0, 6);
}

function buildFailures(events: AuditEventRecord[]): AuditFailureItem[] {
  return events
    .filter((event) => event.status !== 'SUCCESS')
    .slice(0, 8)
    .map((event) => ({
      event_id: event.event_id,
      source_type: event.source_type,
      title: event.title,
      error_message: event.error_message ?? event.summary,
      occurred_at: event.occurred_at,
    }));
}

function isConfigChange(event: AuditEventRecord) {
  if (event.source_type !== 'operation') return false;
  return ['agents', 'model-providers', 'models', 'prompt-templates', 'knowledge-bases', 'tools', 'users', 'tenants'].some((prefix) =>
    event.path?.includes(prefix),
  );
}
