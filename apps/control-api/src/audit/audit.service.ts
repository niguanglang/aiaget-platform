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

      return (
        event.user_email.toLowerCase().includes(keyword)
        || event.title.toLowerCase().includes(keyword)
        || event.summary.toLowerCase().includes(keyword)
        || (event.request_id?.toLowerCase().includes(keyword) ?? false)
      );
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
    const [loginLogs, operationLogs] = await this.prisma.$transaction([
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
    ]);

    return [
      ...loginLogs.map((log) => mapLoginLog(log)),
      ...operationLogs.map((log) => mapOperationLog(log)),
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

function operationStatus(statusCode: number): AuditEventStatus {
  if (statusCode >= 500) return 'FAILED';
  if (statusCode >= 400) return 'DEGRADED';
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
