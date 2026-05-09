import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  PlatformEventDetail,
  PlatformEventListItem,
  PlatformEventRelationItem,
  PlatformEventUsageOverview,
  PlatformEventWindow,
  PlatformUsageAnomalyItem,
  PlatformUsageAnomalyOverview,
  PlatformUsageAnomalySeverity,
  PlatformUsageAnomalyType,
  PlatformUsageAlertAction,
  PlatformUsageAlertItem,
  PlatformUsageAlertNotificationChannel,
  PlatformUsageAlertNotificationItem,
  PlatformUsageAlertNotificationOverview,
  PlatformUsageAlertNotificationResult,
  PlatformUsageAlertNotificationStatus,
  PlatformUsageAlertOverview,
  PlatformUsageAlertStatus,
  PlatformUsageLedgerItem,
  PlatformUsagePeriod,
  PlatformUsageRollupItem,
  PlatformUsageTrendPoint,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordPlatformEventInput {
  tenantId: string;
  departmentId?: string | null;
  userId?: string | null;
  actorType?: string;
  resourceType: string;
  resourceId?: string | null;
  agentId?: string | null;
  teamId?: string | null;
  pluginId?: string | null;
  channelId?: string | null;
  conversationId?: string | null;
  runId?: string | null;
  taskId?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  parentTraceId?: string | null;
  eventSource: string;
  eventType: string;
  status: string;
  severity?: string;
  securityLevel?: string;
  billable?: boolean;
  summary?: string | null;
  payloadJson?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
  sourceSystem?: string | null;
  sourceId?: string | null;
  dedupeKey?: string | null;
}

export interface RecordPlatformUsageInput {
  tenantId: string;
  departmentId?: string | null;
  userId?: string | null;
  subjectType: string;
  subjectId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  metricType: string;
  unit: string;
  quantity: number | Prisma.Decimal;
  unitPrice?: number | Prisma.Decimal;
  amount?: number | Prisma.Decimal;
  currency?: string;
  billable?: boolean;
  costSource?: string | null;
  traceId?: string | null;
  requestId?: string | null;
  eventId?: string | null;
  sourceSystem?: string | null;
  sourceId?: string | null;
  occurredAt?: Date;
}

interface RecordPlatformEventRelationInput {
  tenantId: string;
  relationType: string;
  parentEventId?: string | null;
  childEventId?: string | null;
  sourceEventId?: string | null;
  targetEventId?: string | null;
  relationSource?: string | null;
  relationKey?: string | null;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  occurredAt?: Date;
}

export interface ListPlatformEventsQuery {
  page?: number;
  page_size?: number;
  window?: string;
  event_type?: string;
  resource_type?: string;
  status?: string;
  severity?: string;
  trace_id?: string;
  request_id?: string;
  source_system?: string;
  keyword?: string;
}

export interface ListPlatformUsageQuery {
  page?: number;
  page_size?: number;
  window?: string;
  subject_type?: string;
  resource_type?: string;
  metric_type?: string;
  billable?: boolean;
  trace_id?: string;
  request_id?: string;
  event_id?: string;
  source_system?: string;
  keyword?: string;
}

export interface ListPlatformUsageTrendsQuery {
  window?: string;
  period?: string;
  metric_type?: string;
  resource_type?: string;
}

export interface ListPlatformUsageAlertNotificationsQuery {
  window?: string;
  status?: string;
  alert_id?: string;
}

interface UpdatePlatformUsageAlertInput {
  action: PlatformUsageAlertAction;
  note?: string | null;
}

interface NotifyPlatformUsageAlertInput {
  channels?: PlatformUsageAlertNotificationChannel[];
  note?: string | null;
}

interface DeliverUsageAlertNotificationOptions {
  retriedFromEventId?: string | null;
  retryCount?: number;
  actorType?: string;
}

const ALERT_WEBHOOK_TIMEOUT_MS = 5000;

@Injectable()
export class PlatformEventsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordEvent(input: RecordPlatformEventInput) {
    if (input.dedupeKey) {
      const existing = await this.prisma.platformEvent.findFirst({
        where: {
          tenantId: input.tenantId,
          dedupeKey: input.dedupeKey,
        },
        orderBy: {
          occurredAt: 'desc',
        },
      });

      if (existing) {
        return existing;
      }
    }

    const event = await this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        departmentId: input.departmentId ?? null,
        userId: input.userId ?? null,
        actorType: input.actorType ?? 'USER',
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        agentId: input.agentId ?? null,
        teamId: input.teamId ?? null,
        pluginId: input.pluginId ?? null,
        channelId: input.channelId ?? null,
        conversationId: input.conversationId ?? null,
        runId: input.runId ?? null,
        taskId: input.taskId ?? null,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        parentTraceId: input.parentTraceId ?? null,
        eventSource: input.eventSource,
        eventType: input.eventType,
        status: input.status,
        severity: input.severity ?? 'INFO',
        securityLevel: input.securityLevel ?? 'INTERNAL',
        billable: input.billable ?? false,
        summary: input.summary ?? null,
        payloadJson: input.payloadJson ?? Prisma.JsonNull,
        occurredAt: input.occurredAt ?? new Date(),
        sourceSystem: input.sourceSystem ?? null,
        sourceId: input.sourceId ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    });

    await this.autoLinkEvent(event).catch(() => undefined);

    return event;
  }

  async recordUsage(input: RecordPlatformUsageInput) {
    const usage = await this.prisma.platformUsageEvent.create({
      data: {
        tenantId: input.tenantId,
        departmentId: input.departmentId ?? null,
        userId: input.userId ?? null,
        subjectType: input.subjectType,
        subjectId: input.subjectId ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metricType: input.metricType,
        unit: input.unit,
        quantity: new Prisma.Decimal(input.quantity),
        unitPrice: new Prisma.Decimal(input.unitPrice ?? 0),
        amount: new Prisma.Decimal(input.amount ?? 0),
        currency: input.currency ?? 'USD',
        billable: input.billable ?? false,
        costSource: input.costSource ?? null,
        traceId: input.traceId ?? null,
        requestId: input.requestId ?? null,
        eventId: input.eventId ?? null,
        sourceSystem: input.sourceSystem ?? null,
        sourceId: input.sourceId ?? null,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });

    if (usage.eventId) {
      await this.createRelation({
        tenantId: usage.tenantId,
        relationType: 'USAGE_LINK',
        parentEventId: usage.eventId,
        childEventId: usage.eventId,
        sourceEventId: usage.eventId,
        targetEventId: usage.eventId,
        relationSource: usage.sourceSystem ?? 'platform_usage',
        relationKey: `usage:${usage.id}`,
        metadata: {
          usage_event_id: usage.id,
          metric_type: usage.metricType,
          quantity: decimalToNumber(usage.quantity),
          amount: decimalToNumber(usage.amount),
        },
        occurredAt: usage.occurredAt,
      }).catch(() => undefined);
    }

    await this.incrementUsageRollups(usage).catch(() => undefined);

    return usage;
  }

  async listEvents(
    currentUser: AuthenticatedUser,
    query: ListPlatformEventsQuery,
  ): Promise<PaginatedResult<PlatformEventListItem>> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const where = buildPlatformEventWhere(currentUser.tenantId, since, query);

    const [events, total, usageEvents] = await this.prisma.$transaction([
      this.prisma.platformEvent.findMany({
        where,
        orderBy: {
          occurredAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.platformEvent.count({ where }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          eventId: {
            not: null,
          },
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 1000,
      }),
    ]);
    const usageSummary = summarizeUsageByEventId(usageEvents);

    return {
      items: events.map((event) => mapPlatformEvent(event, usageSummary.get(event.id))),
      page,
      page_size: pageSize,
      total,
    };
  }

  async getEvent(currentUser: AuthenticatedUser, eventId: string): Promise<PlatformEventDetail> {
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Platform event not found');
    }

    const [relations, usageEvents] = await this.prisma.$transaction([
      this.prisma.platformEventRelation.findMany({
        where: {
          tenantId: currentUser.tenantId,
          OR: [
            { parentEventId: event.id },
            { childEventId: event.id },
            { sourceEventId: event.id },
            { targetEventId: event.id },
          ],
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 100,
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          eventId: event.id,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 100,
      }),
    ]);

    return {
      ...mapPlatformEvent(event, summarizeUsage(usageEvents)),
      payload_json: jsonObjectOrNull(event.payloadJson),
      relations: relations.map(mapPlatformEventRelation),
      usage_events: usageEvents.map(mapPlatformUsageEvent),
    };
  }

  async listRelations(currentUser: AuthenticatedUser, eventId: string): Promise<PlatformEventRelationItem[]> {
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: eventId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Platform event not found');
    }

    const relations = await this.prisma.platformEventRelation.findMany({
      where: {
        tenantId: currentUser.tenantId,
        OR: [
          { parentEventId: event.id },
          { childEventId: event.id },
          { sourceEventId: event.id },
          { targetEventId: event.id },
        ],
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 200,
    });

    return relations.map(mapPlatformEventRelation);
  }

  async getUsageOverview(
    currentUser: AuthenticatedUser,
    windowValue: string | undefined,
  ): Promise<PlatformEventUsageOverview> {
    const window = normalizeWindow(windowValue);
    const since = windowStart(window);
    const tenantId = currentUser.tenantId;
    const [
      events,
      usageEvents,
      relationCount,
      rollupCount,
      recentRelations,
      recentRollups,
    ] = await this.prisma.$transaction([
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 1000,
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 1000,
      }),
      this.prisma.platformEventRelation.count({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
      }),
      this.prisma.platformUsageRollup.count({
        where: {
          tenantId,
          periodStart: {
            gte: since,
          },
        },
      }),
      this.prisma.platformEventRelation.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 8,
      }),
      this.prisma.platformUsageRollup.findMany({
        where: {
          tenantId,
          periodStart: {
            gte: since,
          },
        },
        orderBy: {
          periodStart: 'desc',
        },
        take: 8,
      }),
    ]);
    const usageSummaryByEvent = new Map<string, UsageSummary>();
    for (const usage of usageEvents) {
      if (!usage.eventId) continue;
      const current = usageSummaryByEvent.get(usage.eventId) ?? { count: 0, quantity: 0, amount: 0 };
      current.count += 1;
      current.quantity += decimalToNumber(usage.quantity);
      current.amount += decimalToNumber(usage.amount);
      usageSummaryByEvent.set(usage.eventId, current);
    }

    return {
      generated_at: new Date().toISOString(),
      window,
      summary: {
        event_count: events.length,
        usage_count: usageEvents.length,
        relation_count: relationCount,
        rollup_count: rollupCount,
        trace_count: uniqueStringCount(events.map((event) => event.traceId)),
        request_count: uniqueStringCount(events.map((event) => event.requestId)),
        error_count: events.filter((event) => isErrorStatus(event.status) || event.severity === 'ERROR').length,
        total_quantity: round6(sum(usageEvents.map((usage) => decimalToNumber(usage.quantity)))),
        total_amount: round6(sum(usageEvents.map((usage) => decimalToNumber(usage.amount)))),
        total_cost: round6(sum(usageEvents.map((usage) => decimalToNumber(usage.amount)))),
      },
      event_type_rankings: buildEventTypeRankings(events),
      metric_rankings: buildMetricRankings(usageEvents),
      recent_events: events.slice(0, 10).map((event) => mapPlatformEvent(event, usageSummaryByEvent.get(event.id))),
      recent_usage: usageEvents.slice(0, 10).map(mapPlatformUsageEvent),
      recent_relations: recentRelations.map(mapPlatformEventRelation),
      recent_rollups: recentRollups.map(mapPlatformUsageRollup),
    };
  }

  async listUsageTrends(
    currentUser: AuthenticatedUser,
    query: ListPlatformUsageTrendsQuery,
  ): Promise<PlatformUsageTrendPoint[]> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const period = normalizePeriod(query.period, window);
    const where: Prisma.PlatformUsageEventWhereInput = {
      tenantId: currentUser.tenantId,
      occurredAt: {
        gte: since,
      },
      ...(query.metric_type ? { metricType: query.metric_type } : {}),
      ...(query.resource_type ? { resourceType: query.resource_type } : {}),
    };
    const usageEvents = await this.prisma.platformUsageEvent.findMany({
      where,
      orderBy: {
        occurredAt: 'asc',
      },
      take: 5000,
    });
    const buckets = new Map<string, PlatformUsageTrendPoint>();

    for (const event of usageEvents) {
      const bucket = bucketLabel(event.occurredAt, period);
      const key = `${bucket}:${event.metricType}`;
      const current = buckets.get(key) ?? {
        bucket,
        metric_type: event.metricType,
        event_count: 0,
        quantity_total: 0,
        amount_total: 0,
        cost_total: 0,
      };
      current.event_count += 1;
      current.quantity_total = round6(current.quantity_total + decimalToNumber(event.quantity));
      current.amount_total = round6(current.amount_total + decimalToNumber(event.amount));
      current.cost_total = round6(current.cost_total + decimalToNumber(event.amount));
      buckets.set(key, current);
    }

    return Array.from(buckets.values()).sort((left, right) =>
      `${left.bucket}:${left.metric_type}`.localeCompare(`${right.bucket}:${right.metric_type}`),
    );
  }

  async listUsageLedger(
    currentUser: AuthenticatedUser,
    query: ListPlatformUsageQuery,
  ): Promise<PaginatedResult<PlatformUsageLedgerItem>> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const where = buildPlatformUsageWhere(currentUser.tenantId, since, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.platformUsageEvent.findMany({
        where,
        orderBy: {
          occurredAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.platformUsageEvent.count({ where }),
    ]);

    return {
      items: items.map(mapPlatformUsageEvent),
      page,
      page_size: pageSize,
      total,
    };
  }

  async rebuildUsageRollups(
    currentUser: AuthenticatedUser,
    windowValue: string | undefined,
  ): Promise<{ rebuilt_count: number; items: PlatformUsageRollupItem[] }> {
    const window = normalizeWindow(windowValue);
    const since = windowStart(window);
    const usageEvents = await this.prisma.platformUsageEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: 10000,
    });
    const rollups = buildUsageRollupsFromEvents(usageEvents);

    await this.prisma.platformUsageRollup.deleteMany({
      where: {
        tenantId: currentUser.tenantId,
        periodStart: {
          gte: since,
        },
      },
    });

    const items = [];
    for (const rollup of rollups) {
      const item = await this.prisma.platformUsageRollup.create({
        data: rollup,
      });
      items.push(mapPlatformUsageRollup(item));
    }

    return {
      rebuilt_count: items.length,
      items: items.slice(0, 20),
    };
  }

  async detectUsageAnomalies(
    currentUser: AuthenticatedUser,
    windowValue: string | undefined,
  ): Promise<PlatformUsageAnomalyOverview> {
    const window = normalizeWindow(windowValue);
    const since = windowStart(window);
    const rollups = await this.prisma.platformUsageRollup.findMany({
      where: {
        tenantId: currentUser.tenantId,
        periodStart: {
          gte: since,
        },
      },
      orderBy: {
        periodStart: 'asc',
      },
      take: 10000,
    });
    const detectedAt = new Date();
    const items = buildUsageAnomaliesFromRollups(rollups, detectedAt);
    let detectionEventId: string | null = null;

    if (items.length > 0) {
      const highestSeverity = highestAnomalySeverity(items);
      const event = await this.recordEvent({
        tenantId: currentUser.tenantId,
        userId: currentUser.id,
        actorType: 'USER',
        resourceType: 'platform_usage_rollup',
        resourceId: window,
        eventSource: 'platform_usage_anomaly',
        eventType: 'platform.usage.anomaly.detected',
        status: highestSeverity === 'CRITICAL' || highestSeverity === 'ERROR' ? 'FAILED' : 'DEGRADED',
        severity: highestSeverity === 'CRITICAL' ? 'ERROR' : highestSeverity,
        securityLevel: 'INTERNAL',
        billable: false,
        summary: `检测到 ${items.length} 条统一用量异常信号，最高等级 ${highestSeverity}。`,
        payloadJson: buildUsageAnomalyPayload(window, highestSeverity, items),
        sourceSystem: 'platform_usage_anomaly',
        sourceId: `usage-anomaly:${currentUser.tenantId}:${window}:${detectedAt.toISOString()}`,
        occurredAt: detectedAt,
      });
      detectionEventId = event.id;
    }

    return {
      generated_at: detectedAt.toISOString(),
      window,
      summary: buildUsageAnomalySummary(items, detectionEventId),
      items,
    };
  }

  async listUsageAlerts(
    currentUser: AuthenticatedUser,
    windowValue: string | undefined,
  ): Promise<PlatformUsageAlertOverview> {
    const window = normalizeWindow(windowValue);
    const since = windowStart(window);
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        eventSource: 'platform_usage_anomaly',
        eventType: {
          in: [
            'platform.usage.anomaly.detected',
            'platform.usage.alert.acknowledged',
            'platform.usage.alert.escalated',
            'platform.usage.alert.closed',
            'platform.usage.alert.notification_sent',
          ],
        },
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: 1000,
    });
    const items = buildUsageAlertsFromEvents(events);

    return {
      generated_at: new Date().toISOString(),
      window,
      summary: buildUsageAlertSummary(items),
      items,
    };
  }

  async updateUsageAlert(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: UpdatePlatformUsageAlertInput,
  ): Promise<PlatformUsageAlertItem> {
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: alertId,
        eventSource: 'platform_usage_anomaly',
        eventType: 'platform.usage.anomaly.detected',
      },
    });

    if (!event) {
      throw new NotFoundException('Platform usage alert not found');
    }

    const payload = jsonObjectOrNull(event.payloadJson);
    const highestSeverity = normalizeAnomalySeverity(payload?.highest_severity);
    const occurredAt = new Date();
    const lifecycleEvent = await this.recordEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'platform_usage_alert',
      resourceId: event.id,
      requestId: currentUser.requestId,
      traceId: currentUser.traceId,
      eventSource: 'platform_usage_anomaly',
      eventType: usageAlertActionEventType(input.action),
      status: input.action === 'CLOSE' ? 'SUCCESS' : 'DEGRADED',
      severity: input.action === 'ESCALATE' ? 'WARN' : 'INFO',
      securityLevel: 'INTERNAL',
      billable: false,
      summary: usageAlertActionSummary(input.action, event.id),
      payloadJson: {
        alert_id: event.id,
        action: input.action,
        note: input.note ?? null,
        source_event_id: event.id,
        highest_severity: highestSeverity,
      },
      sourceSystem: 'platform_usage_anomaly',
      sourceId: `usage-alert:${event.id}:${input.action}:${occurredAt.toISOString()}`,
      occurredAt,
    });

    await this.createRelation({
      tenantId: currentUser.tenantId,
      relationType: 'ALERT_LIFECYCLE',
      parentEventId: event.id,
      childEventId: lifecycleEvent.id,
      sourceEventId: event.id,
      targetEventId: lifecycleEvent.id,
      relationSource: 'platform_usage_alert',
      relationKey: `alert:${event.id}:${input.action}:${lifecycleEvent.id}`,
      metadata: {
        alert_id: event.id,
        action: input.action,
      },
      occurredAt,
    }).catch(() => undefined);

    const lifecycleEvents = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        eventSource: 'platform_usage_anomaly',
        resourceType: 'platform_usage_alert',
        resourceId: event.id,
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    return buildUsageAlertFromEvents(event, lifecycleEvents);
  }

  async notifyUsageAlert(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: NotifyPlatformUsageAlertInput,
  ): Promise<PlatformUsageAlertNotificationResult> {
    return this.deliverUsageAlertNotification(currentUser, alertId, input, {});
  }

  async listUsageAlertNotifications(
    currentUser: AuthenticatedUser,
    query: ListPlatformUsageAlertNotificationsQuery,
  ): Promise<PlatformUsageAlertNotificationOverview> {
    const window = normalizeWindow(query.window);
    const since = windowStart(window);
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        eventSource: 'platform_usage_anomaly',
        eventType: 'platform.usage.alert.notification_sent',
        ...(query.alert_id ? { resourceId: query.alert_id } : {}),
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 300,
    });
    const items = events
      .map(mapUsageAlertNotificationEvent)
      .filter((item) => !query.status || item.status === query.status);

    return {
      generated_at: new Date().toISOString(),
      window,
      summary: buildUsageAlertNotificationSummary(items),
      items,
    };
  }

  async retryUsageAlertNotification(
    currentUser: AuthenticatedUser,
    notificationEventId: string,
  ): Promise<PlatformUsageAlertNotificationResult> {
    const notificationEvent = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: notificationEventId,
        eventSource: 'platform_usage_anomaly',
        eventType: 'platform.usage.alert.notification_sent',
      },
    });

    if (!notificationEvent) {
      throw new NotFoundException('Platform usage alert notification not found');
    }

    const notification = mapUsageAlertNotificationEvent(notificationEvent);
    if (!isRetryableNotificationStatus(notification.status)) {
      throw new BadRequestException('Only failed or partial alert notifications can be retried');
    }

    return this.deliverUsageAlertNotification(
      currentUser,
      notification.alert_id,
      {
        channels: notification.channels.length ? notification.channels : ['IN_APP', 'WEBHOOK'],
        note: `重试投递 ${notification.notification_event_id}`,
      },
      {
        retriedFromEventId: notification.notification_event_id,
        retryCount: notification.retry_count + 1,
        actorType: currentUser.id.startsWith('system-') ? 'SYSTEM' : 'USER',
      },
    );
  }

  async retryUsageAlertNotificationForTask(
    tenantId: string,
    notificationEventId: string,
    requestId: string | null,
  ): Promise<PlatformUsageAlertNotificationResult> {
    const systemUser = buildSystemUser(tenantId, requestId);

    return this.retryUsageAlertNotification(systemUser, notificationEventId);
  }

  private async deliverUsageAlertNotification(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: NotifyPlatformUsageAlertInput,
    options: DeliverUsageAlertNotificationOptions,
  ): Promise<PlatformUsageAlertNotificationResult> {
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: alertId,
        eventSource: 'platform_usage_anomaly',
        eventType: 'platform.usage.anomaly.detected',
      },
    });

    if (!event) {
      throw new NotFoundException('Platform usage alert not found');
    }

    const lifecycleEvents = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        eventSource: 'platform_usage_anomaly',
        resourceType: 'platform_usage_alert',
        resourceId: event.id,
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });
    const alert = buildUsageAlertFromEvents(event, lifecycleEvents);
    const channels = normalizeNotificationChannels(input.channels);
    const deliveredAt = new Date();
    const webhookUrl = channels.includes('WEBHOOK') ? await this.loadExternalWebhookUrl(currentUser.tenantId) : null;
    const webhookResult = webhookUrl ? await deliverUsageAlertWebhook(webhookUrl, alert, input.note ?? null) : null;
    const webhookSkipped = channels.includes('WEBHOOK') && !webhookUrl;
    const status = notificationStatus(channels, webhookResult, webhookSkipped);
    const message = notificationMessage(status, channels, webhookSkipped);
    const deliveryEvent = await this.recordEvent({
      tenantId: currentUser.tenantId,
      userId: options.actorType === 'SYSTEM' ? null : currentUser.id,
      actorType: options.actorType ?? 'USER',
      resourceType: 'platform_usage_alert',
      resourceId: event.id,
      requestId: currentUser.requestId,
      traceId: currentUser.traceId,
      eventSource: 'platform_usage_anomaly',
      eventType: 'platform.usage.alert.notification_sent',
      status: status === 'FAILED' ? 'FAILED' : status === 'SKIPPED' ? 'SKIPPED' : 'SUCCESS',
      severity: status === 'FAILED' ? 'WARN' : 'INFO',
      securityLevel: 'INTERNAL',
      billable: false,
      summary: message,
      payloadJson: {
        alert_id: event.id,
        status,
        channels,
        targets: alert.notification_targets,
        note: input.note ?? null,
        webhook_status: webhookResult?.status ?? null,
        webhook_error: webhookResult?.error ?? null,
        retry_count: options.retryCount ?? 0,
        retried_from_event_id: options.retriedFromEventId ?? null,
      },
      sourceSystem: 'platform_usage_anomaly',
      sourceId: `usage-alert-notify:${event.id}:${deliveredAt.toISOString()}`,
      occurredAt: deliveredAt,
    });

    await this.createRelation({
      tenantId: currentUser.tenantId,
      relationType: 'ALERT_NOTIFICATION',
      parentEventId: event.id,
      childEventId: deliveryEvent.id,
      sourceEventId: event.id,
      targetEventId: deliveryEvent.id,
      relationSource: 'platform_usage_alert',
      relationKey: `alert:${event.id}:notify:${deliveryEvent.id}`,
      metadata: {
        alert_id: event.id,
        status,
        channels,
        retry_count: options.retryCount ?? 0,
        retried_from_event_id: options.retriedFromEventId ?? null,
      },
      occurredAt: deliveredAt,
    }).catch(() => undefined);

    if (options.retriedFromEventId) {
      await this.createRelation({
        tenantId: currentUser.tenantId,
        relationType: 'ALERT_NOTIFICATION_RETRY',
        parentEventId: options.retriedFromEventId,
        childEventId: deliveryEvent.id,
        sourceEventId: options.retriedFromEventId,
        targetEventId: deliveryEvent.id,
        relationSource: 'platform_usage_alert',
        relationKey: `alert:${event.id}:retry:${options.retriedFromEventId}:${deliveryEvent.id}`,
        metadata: {
          alert_id: event.id,
          retry_count: options.retryCount ?? 0,
        },
        occurredAt: deliveredAt,
      }).catch(() => undefined);
    }

    return {
      alert_id: event.id,
      status,
      channels,
      targets: alert.notification_targets,
      delivery_event_id: deliveryEvent.id,
      webhook_status: webhookResult?.status ?? null,
      message,
      delivered_at: deliveredAt.toISOString(),
    };
  }

  private async loadExternalWebhookUrl(tenantId: string) {
    const setting = await this.prisma.systemSetting.findFirst({
      where: {
        tenantId,
        key: 'external_webhook_url',
        status: 'ACTIVE',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    const value = typeof setting?.value === 'string' ? setting.value.trim() : '';
    return value || null;
  }

  private async autoLinkEvent(event: PlatformEventRecord) {
    const candidates = await this.findRelationCandidates(event);
    const relationInputs = buildAutoRelationInputs(event, candidates);

    for (const relation of relationInputs) {
      await this.createRelation(relation).catch(() => undefined);
    }
  }

  private async findRelationCandidates(event: PlatformEventRecord) {
    const since = new Date(event.occurredAt.getTime() - 24 * 60 * 60 * 1000);
    const keys = buildRelationCandidateKeys(event);
    if (keys.length === 0) return [];

    return this.prisma.platformEvent.findMany({
      where: {
        tenantId: event.tenantId,
        id: {
          not: event.id,
        },
        occurredAt: {
          gte: since,
          lte: event.occurredAt,
        },
        OR: keys,
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 20,
    });
  }

  private async createRelation(input: RecordPlatformEventRelationInput) {
    const exists = await this.prisma.platformEventRelation.findFirst({
      where: {
        tenantId: input.tenantId,
        relationType: input.relationType,
        parentEventId: input.parentEventId ?? null,
        childEventId: input.childEventId ?? null,
        sourceEventId: input.sourceEventId ?? null,
        targetEventId: input.targetEventId ?? null,
        relationKey: input.relationKey ?? null,
      },
      select: {
        id: true,
      },
    });
    if (exists) return exists;

    return this.prisma.platformEventRelation.create({
      data: {
        tenantId: input.tenantId,
        relationType: input.relationType,
        parentEventId: input.parentEventId ?? null,
        childEventId: input.childEventId ?? null,
        sourceEventId: input.sourceEventId ?? null,
        targetEventId: input.targetEventId ?? null,
        relationSource: input.relationSource ?? null,
        relationKey: input.relationKey ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  }

  private async incrementUsageRollups(usage: PlatformUsageEventRecord) {
    const periods = [
      usageRollupPeriod(usage.occurredAt, 'hour'),
      usageRollupPeriod(usage.occurredAt, 'day'),
    ];

    for (const period of periods) {
      await this.upsertUsageRollup(usage, period.periodType, period.periodStart, period.periodEnd);
    }
  }

  private async upsertUsageRollup(
    usage: PlatformUsageEventRecord,
    periodType: PlatformUsagePeriod,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const identity = usageRollupIdentity(usage, periodType, periodStart);
    const existing = await this.prisma.platformUsageRollup.findFirst({
      where: identity,
    });
    const quantity = decimalToNumber(usage.quantity);
    const amount = decimalToNumber(usage.amount);
    const error = isUsageError(usage);
    const retry = isUsageRetry(usage);

    if (!existing) {
      await this.prisma.platformUsageRollup.create({
        data: {
          tenantId: usage.tenantId,
          departmentId: usage.departmentId,
          subjectType: usage.subjectType,
          subjectId: usage.subjectId,
          resourceType: usage.resourceType,
          resourceId: usage.resourceId,
          metricType: usage.metricType,
          periodType,
          periodStart,
          periodEnd,
          eventCount: 1,
          quantityTotal: new Prisma.Decimal(quantity),
          amountTotal: new Prisma.Decimal(amount),
          costTotal: new Prisma.Decimal(amount),
          errorCount: error ? 1 : 0,
          successCount: error ? 0 : 1,
          retryCount: retry ? 1 : 0,
        },
      });
      return;
    }

    await this.prisma.platformUsageRollup.update({
      where: {
        id: existing.id,
      },
      data: {
        eventCount: {
          increment: 1,
        },
        quantityTotal: {
          increment: new Prisma.Decimal(quantity),
        },
        amountTotal: {
          increment: new Prisma.Decimal(amount),
        },
        costTotal: {
          increment: new Prisma.Decimal(amount),
        },
        errorCount: {
          increment: error ? 1 : 0,
        },
        successCount: {
          increment: error ? 0 : 1,
        },
        retryCount: {
          increment: retry ? 1 : 0,
        },
        periodEnd,
      },
    });
  }
}

type PlatformEventRecord = Prisma.PlatformEventGetPayload<object>;
type PlatformUsageEventRecord = Prisma.PlatformUsageEventGetPayload<object>;
type PlatformEventRelationRecord = Prisma.PlatformEventRelationGetPayload<object>;
type PlatformUsageRollupRecord = Prisma.PlatformUsageRollupGetPayload<object>;

interface UsageSummary {
  count: number;
  quantity: number;
  amount: number;
}

interface RollupAnomalyCandidate {
  key: string;
  latest: PlatformUsageRollupRecord;
  history: PlatformUsageRollupRecord[];
}

function buildRelationCandidateKeys(event: PlatformEventRecord): Prisma.PlatformEventWhereInput[] {
  const keys: Prisma.PlatformEventWhereInput[] = [];
  if (event.traceId) keys.push({ traceId: event.traceId });
  if (event.requestId) keys.push({ requestId: event.requestId });
  if (event.runId) keys.push({ runId: event.runId });
  if (event.taskId) keys.push({ taskId: event.taskId });
  if (event.conversationId) keys.push({ conversationId: event.conversationId });
  if (event.sourceSystem && event.sourceId) {
    keys.push({
      sourceSystem: event.sourceSystem,
      sourceId: event.sourceId,
    });
  }

  return keys;
}

function buildAutoRelationInputs(
  event: PlatformEventRecord,
  candidates: PlatformEventRecord[],
): RecordPlatformEventRelationInput[] {
  const relations = new Map<string, RecordPlatformEventRelationInput>();
  const add = (
    relationType: string,
    parent: PlatformEventRecord,
    child: PlatformEventRecord,
    relationKey: string,
    metadata: Prisma.InputJsonObject,
  ) => {
    if (parent.id === child.id) return;
    const key = `${relationType}:${parent.id}:${child.id}:${relationKey}`;
    if (relations.has(key)) return;
    relations.set(key, {
      tenantId: event.tenantId,
      relationType,
      parentEventId: parent.id,
      childEventId: child.id,
      sourceEventId: parent.id,
      targetEventId: child.id,
      relationSource: 'platform_event_auto_link',
      relationKey,
      metadata,
      occurredAt: event.occurredAt,
    });
  };

  for (const candidate of candidates) {
    const parent = candidate.occurredAt <= event.occurredAt ? candidate : event;
    const child = parent.id === event.id ? candidate : event;

    if (event.traceId && candidate.traceId === event.traceId) {
      add('TRACE_PARENT', parent, child, `trace:${event.traceId}`, {
        trace_id: event.traceId,
        parent_trace_id: event.parentTraceId,
      });
    }
    if (event.requestId && candidate.requestId === event.requestId) {
      add('REQUEST', parent, child, `request:${event.requestId}`, {
        request_id: event.requestId,
      });
    }
    if (event.runId && candidate.runId === event.runId) {
      add('SOURCE_LINK', parent, child, `run:${event.runId}`, {
        run_id: event.runId,
      });
    }
    if (event.taskId && candidate.taskId === event.taskId) {
      add('SOURCE_LINK', parent, child, `task:${event.taskId}`, {
        task_id: event.taskId,
      });
    }
    if (event.conversationId && candidate.conversationId === event.conversationId) {
      add('SOURCE_LINK', parent, child, `conversation:${event.conversationId}`, {
        conversation_id: event.conversationId,
      });
    }
    if (
      event.sourceSystem
      && event.sourceId
      && candidate.sourceSystem === event.sourceSystem
      && candidate.sourceId === event.sourceId
    ) {
      add('SOURCE_LINK', parent, child, `source:${event.sourceSystem}:${event.sourceId}`, {
        source_system: event.sourceSystem,
        source_id: event.sourceId,
      });
    }
  }

  return Array.from(relations.values()).slice(0, 24);
}

function buildUsageRollupsFromEvents(events: PlatformUsageEventRecord[]): Prisma.PlatformUsageRollupCreateManyInput[] {
  const grouped = new Map<string, Prisma.PlatformUsageRollupCreateManyInput>();

  for (const event of events) {
    const periods = [
      usageRollupPeriod(event.occurredAt, 'hour'),
      usageRollupPeriod(event.occurredAt, 'day'),
    ];

    for (const period of periods) {
      const key = [
        event.tenantId,
        event.departmentId ?? '',
        event.subjectType,
        event.subjectId ?? '',
        event.resourceType,
        event.resourceId ?? '',
        event.metricType,
        period.periodType,
        period.periodStart.toISOString(),
      ].join(':');
      const quantity = decimalToNumber(event.quantity);
      const amount = decimalToNumber(event.amount);
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          tenantId: event.tenantId,
          departmentId: event.departmentId,
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metricType: event.metricType,
          periodType: period.periodType,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          eventCount: 1,
          quantityTotal: new Prisma.Decimal(quantity),
          amountTotal: new Prisma.Decimal(amount),
          costTotal: new Prisma.Decimal(amount),
          errorCount: isUsageError(event) ? 1 : 0,
          successCount: isUsageError(event) ? 0 : 1,
          retryCount: isUsageRetry(event) ? 1 : 0,
        });
        continue;
      }

      existing.eventCount = (existing.eventCount ?? 0) + 1;
      existing.quantityTotal = new Prisma.Decimal(decimalInputToNumber(existing.quantityTotal)).add(quantity);
      existing.amountTotal = new Prisma.Decimal(decimalInputToNumber(existing.amountTotal)).add(amount);
      existing.costTotal = new Prisma.Decimal(decimalInputToNumber(existing.costTotal)).add(amount);
      existing.errorCount = (existing.errorCount ?? 0) + (isUsageError(event) ? 1 : 0);
      existing.successCount = (existing.successCount ?? 0) + (isUsageError(event) ? 0 : 1);
      existing.retryCount = (existing.retryCount ?? 0) + (isUsageRetry(event) ? 1 : 0);
    }
  }

  return Array.from(grouped.values());
}

function buildUsageAnomaliesFromRollups(
  rollups: PlatformUsageRollupRecord[],
  detectedAt: Date,
): PlatformUsageAnomalyItem[] {
  const candidates = groupRollupsForAnomalyDetection(rollups);
  const anomalies: PlatformUsageAnomalyItem[] = [];

  for (const candidate of candidates) {
    const latest = candidate.latest;
    const history = candidate.history;
    const eventCount = latest.eventCount;
    const costTotal = decimalToNumber(latest.costTotal);
    const errorRate = eventCount > 0 ? latest.errorCount / eventCount : 0;
    const retryRate = eventCount > 0 ? latest.retryCount / eventCount : 0;
    const baselineEvents = average(history.map((item) => item.eventCount));
    const baselineCost = average(history.map((item) => decimalToNumber(item.costTotal)));
    const baselineErrorRate = average(history.map((item) => item.eventCount > 0 ? item.errorCount / item.eventCount : 0));
    const baselineRetryRate = average(history.map((item) => item.eventCount > 0 ? item.retryCount / item.eventCount : 0));

    if (eventCount >= 10 && baselineEvents >= 3) {
      const ratio = safeRatio(eventCount, baselineEvents);
      if (ratio >= 3) {
        anomalies.push(buildUsageAnomalyItem({
          candidate,
          anomalyType: 'EVENT_SPIKE',
          currentValue: eventCount,
          baselineValue: baselineEvents,
          ratio,
          threshold: 3,
          severity: ratio >= 6 ? 'ERROR' : 'WARN',
          detectedAt,
        }));
      }
    }

    if (costTotal >= 1 && baselineCost >= 0.1) {
      const ratio = safeRatio(costTotal, baselineCost);
      if (ratio >= 3) {
        anomalies.push(buildUsageAnomalyItem({
          candidate,
          anomalyType: 'COST_SPIKE',
          currentValue: costTotal,
          baselineValue: baselineCost,
          ratio,
          threshold: 3,
          severity: ratio >= 6 || costTotal >= 100 ? 'CRITICAL' : 'ERROR',
          detectedAt,
        }));
      }
    }

    if (eventCount >= 5 && errorRate >= 0.2 && errorRate >= Math.max(0.2, baselineErrorRate * 2)) {
      anomalies.push(buildUsageAnomalyItem({
        candidate,
        anomalyType: 'ERROR_RATE',
        currentValue: errorRate,
        baselineValue: baselineErrorRate,
        ratio: safeRatio(errorRate, baselineErrorRate),
        threshold: 0.2,
        severity: errorRate >= 0.5 ? 'CRITICAL' : 'ERROR',
        detectedAt,
      }));
    }

    if (eventCount >= 5 && retryRate >= 0.3 && retryRate >= Math.max(0.3, baselineRetryRate * 2)) {
      anomalies.push(buildUsageAnomalyItem({
        candidate,
        anomalyType: 'RETRY_RATE',
        currentValue: retryRate,
        baselineValue: baselineRetryRate,
        ratio: safeRatio(retryRate, baselineRetryRate),
        threshold: 0.3,
        severity: retryRate >= 0.6 ? 'ERROR' : 'WARN',
        detectedAt,
      }));
    }

    if (eventCount >= 5 && latest.successCount === 0 && latest.errorCount > 0) {
      anomalies.push(buildUsageAnomalyItem({
        candidate,
        anomalyType: 'NO_SUCCESS',
        currentValue: latest.successCount,
        baselineValue: average(history.map((item) => item.successCount)),
        ratio: 0,
        threshold: 1,
        severity: 'CRITICAL',
        detectedAt,
      }));
    }
  }

  return anomalies
    .sort((left, right) => anomalySeverityWeight(right.severity) - anomalySeverityWeight(left.severity) || right.current_value - left.current_value)
    .slice(0, 30);
}

function groupRollupsForAnomalyDetection(rollups: PlatformUsageRollupRecord[]): RollupAnomalyCandidate[] {
  const grouped = new Map<string, PlatformUsageRollupRecord[]>();

  for (const rollup of rollups) {
    const key = [
      rollup.periodType,
      rollup.subjectType,
      rollup.subjectId ?? '',
      rollup.resourceType,
      rollup.resourceId ?? '',
      rollup.metricType,
    ].join(':');
    const items = grouped.get(key) ?? [];
    items.push(rollup);
    grouped.set(key, items);
  }

  const candidates: RollupAnomalyCandidate[] = [];
  for (const [key, items] of grouped.entries()) {
    const sorted = items.sort((left, right) => left.periodStart.getTime() - right.periodStart.getTime());
    const latest = sorted.at(-1);
    if (!latest) continue;
    const history = sorted.slice(0, -1).slice(-12);
    if (history.length < 2) continue;
    candidates.push({
      key,
      latest,
      history,
    });
  }

  return candidates;
}

function buildUsageAnomalyItem({
  anomalyType,
  baselineValue,
  candidate,
  currentValue,
  detectedAt,
  ratio,
  severity,
  threshold,
}: {
  anomalyType: PlatformUsageAnomalyType;
  baselineValue: number;
  candidate: RollupAnomalyCandidate;
  currentValue: number;
  detectedAt: Date;
  ratio: number;
  severity: PlatformUsageAnomalySeverity;
  threshold: number;
}): PlatformUsageAnomalyItem {
  const latest = candidate.latest;
  const roundedCurrent = round6(currentValue);
  const roundedBaseline = round6(baselineValue);
  const roundedRatio = round6(ratio);

  return {
    id: `${anomalyType}:${latest.id}`,
    anomaly_type: anomalyType,
    severity,
    metric_type: latest.metricType,
    resource_type: latest.resourceType,
    resource_id: latest.resourceId,
    period_type: latest.periodType,
    period_start: latest.periodStart.toISOString(),
    period_end: latest.periodEnd.toISOString(),
    current_value: roundedCurrent,
    baseline_value: roundedBaseline,
    ratio: roundedRatio,
    threshold,
    event_count: latest.eventCount,
    error_count: latest.errorCount,
    retry_count: latest.retryCount,
    message: buildUsageAnomalyMessage(anomalyType, latest, roundedCurrent, roundedBaseline, roundedRatio),
    detected_at: detectedAt.toISOString(),
  };
}

function buildUsageAnomalyMessage(
  anomalyType: PlatformUsageAnomalyType,
  rollup: PlatformUsageRollupRecord,
  currentValue: number,
  baselineValue: number,
  ratio: number,
) {
  const metric = `${rollup.metricType} / ${rollup.resourceType}${rollup.resourceId ? ` / ${rollup.resourceId}` : ''}`;
  if (anomalyType === 'COST_SPIKE') {
    return `${metric} 成本出现突增，当前 ${currentValue}，历史基线 ${baselineValue}，约 ${ratio} 倍。`;
  }
  if (anomalyType === 'EVENT_SPIKE') {
    return `${metric} 调用量出现突增，当前 ${currentValue} 次，历史基线 ${baselineValue} 次，约 ${ratio} 倍。`;
  }
  if (anomalyType === 'ERROR_RATE') {
    return `${metric} 错误率偏高，当前 ${formatRatioPercent(currentValue)}，历史基线 ${formatRatioPercent(baselineValue)}。`;
  }
  if (anomalyType === 'RETRY_RATE') {
    return `${metric} 重试率偏高，当前 ${formatRatioPercent(currentValue)}，历史基线 ${formatRatioPercent(baselineValue)}。`;
  }
  return `${metric} 当前周期没有成功记录，请检查调用链路或下游服务。`;
}

function buildUsageAnomalySummary(items: PlatformUsageAnomalyItem[], detectionEventId: string | null): PlatformUsageAnomalyOverview['summary'] {
  return {
    anomaly_count: items.length,
    critical_count: items.filter((item) => item.severity === 'CRITICAL').length,
    error_count: items.filter((item) => item.severity === 'ERROR').length,
    warning_count: items.filter((item) => item.severity === 'WARN').length,
    info_count: items.filter((item) => item.severity === 'INFO').length,
    highest_severity: items.length ? highestAnomalySeverity(items) : null,
    detection_event_id: detectionEventId,
  };
}

function buildUsageAnomalyPayload(
  window: PlatformEventWindow,
  highestSeverity: PlatformUsageAnomalySeverity,
  items: PlatformUsageAnomalyItem[],
): Prisma.InputJsonObject {
  return {
    window,
    anomaly_count: items.length,
    highest_severity: highestSeverity,
    items: items.slice(0, 20).map((item) => ({
      id: item.id,
      anomaly_type: item.anomaly_type,
      severity: item.severity,
      metric_type: item.metric_type,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      period_type: item.period_type,
      period_start: item.period_start,
      period_end: item.period_end,
      current_value: item.current_value,
      baseline_value: item.baseline_value,
      ratio: item.ratio,
      threshold: item.threshold,
      event_count: item.event_count,
      error_count: item.error_count,
      retry_count: item.retry_count,
      message: item.message,
      detected_at: item.detected_at,
    })),
  };
}

function buildUsageAlertsFromEvents(events: PlatformEventRecord[]): PlatformUsageAlertItem[] {
  const detectionEvents = events.filter((event) => event.eventType === 'platform.usage.anomaly.detected');
  const lifecycleEvents = events.filter((event) => event.resourceType === 'platform_usage_alert' && event.resourceId);

  return detectionEvents
    .map((event) => buildUsageAlertFromEvents(
      event,
      lifecycleEvents.filter((item) => item.resourceId === event.id),
    ))
    .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at));
}

function buildUsageAlertFromEvents(
  event: PlatformEventRecord,
  lifecycleEvents: PlatformEventRecord[],
): PlatformUsageAlertItem {
  const payload = jsonObjectOrNull(event.payloadJson);
  const highestSeverity = normalizeAnomalySeverity(payload?.highest_severity);
  const anomalyCount = typeof payload?.anomaly_count === 'number' ? payload.anomaly_count : 0;
  const lifecycleActionEvents = lifecycleEvents.filter(isUsageAlertLifecycleEvent);
  const latestLifecycle = lifecycleActionEvents.at(-1) ?? null;
  const acknowledged = lifecycleActionEvents.find((item) => item.eventType === 'platform.usage.alert.acknowledged') ?? null;
  const escalated = findLastPlatformEvent(lifecycleActionEvents, 'platform.usage.alert.escalated');
  const closed = findLastPlatformEvent(lifecycleActionEvents, 'platform.usage.alert.closed');
  const latestPayload = latestLifecycle ? jsonObjectOrNull(latestLifecycle.payloadJson) : null;
  const status = usageAlertStatusFromLifecycle(lifecycleActionEvents);
  const updatedAt = latestLifecycle?.occurredAt ?? event.occurredAt;

  return {
    alert_id: event.id,
    source_event_id: event.id,
    status,
    severity: highestSeverity,
    title: usageAlertTitle(highestSeverity, anomalyCount),
    summary: event.summary ?? `检测到 ${anomalyCount} 条统一用量异常信号。`,
    anomaly_count: anomalyCount,
    highest_severity: highestSeverity,
    assignee_id: acknowledged?.userId ?? escalated?.userId ?? null,
    notification_targets: usageAlertNotificationTargets(highestSeverity, status),
    created_at: event.occurredAt.toISOString(),
    updated_at: updatedAt.toISOString(),
    acknowledged_at: acknowledged?.occurredAt.toISOString() ?? null,
    escalated_at: escalated?.occurredAt.toISOString() ?? null,
    closed_at: closed?.occurredAt.toISOString() ?? null,
    last_action: latestLifecycle ? usageAlertActionFromEventType(latestLifecycle.eventType) : null,
    last_note: typeof latestPayload?.note === 'string' ? latestPayload.note : null,
  };
}

function isUsageAlertLifecycleEvent(event: PlatformEventRecord) {
  return [
    'platform.usage.alert.acknowledged',
    'platform.usage.alert.escalated',
    'platform.usage.alert.closed',
  ].includes(event.eventType);
}

function buildUsageAlertSummary(items: PlatformUsageAlertItem[]): PlatformUsageAlertOverview['summary'] {
  return {
    total_count: items.length,
    open_count: items.filter((item) => item.status === 'OPEN').length,
    acknowledged_count: items.filter((item) => item.status === 'ACKNOWLEDGED').length,
    escalated_count: items.filter((item) => item.status === 'ESCALATED').length,
    closed_count: items.filter((item) => item.status === 'CLOSED').length,
    critical_count: items.filter((item) => item.severity === 'CRITICAL').length,
    error_count: items.filter((item) => item.severity === 'ERROR').length,
  };
}

function mapUsageAlertNotificationEvent(event: PlatformEventRecord): PlatformUsageAlertNotificationItem {
  const payload = jsonObjectOrNull(event.payloadJson);
  const status = normalizeNotificationStatus(payload?.status);
  const channels = normalizeNotificationChannels(Array.isArray(payload?.channels) ? payload.channels : undefined);
  const targets = Array.isArray(payload?.targets)
    ? payload.targets.filter((target): target is string => typeof target === 'string')
    : [];
  const retryCount = typeof payload?.retry_count === 'number' ? payload.retry_count : 0;
  const webhookStatus = typeof payload?.webhook_status === 'number' ? payload.webhook_status : null;
  const webhookError = typeof payload?.webhook_error === 'string' ? payload.webhook_error : null;
  const retriedFromEventId = typeof payload?.retried_from_event_id === 'string' ? payload.retried_from_event_id : null;
  const alertId = typeof payload?.alert_id === 'string' ? payload.alert_id : event.resourceId ?? event.id;

  return {
    notification_event_id: event.id,
    alert_id: alertId,
    status,
    channels,
    targets,
    webhook_status: webhookStatus,
    webhook_error: webhookError,
    message: event.summary ?? notificationMessage(status, channels, channels.includes('WEBHOOK') && webhookStatus === null),
    retry_count: retryCount,
    retried_from_event_id: retriedFromEventId,
    delivered_at: event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
    summary: event.summary,
  };
}

function buildUsageAlertNotificationSummary(
  items: PlatformUsageAlertNotificationItem[],
): PlatformUsageAlertNotificationOverview['summary'] {
  const retryableItems = items.filter((item) => isRetryableNotificationStatus(item.status));
  const latestFailed = items
    .filter((item) => item.status === 'FAILED')
    .map((item) => item.delivered_at)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

  return {
    total_count: items.length,
    sent_count: items.filter((item) => item.status === 'SENT').length,
    partial_count: items.filter((item) => item.status === 'PARTIAL').length,
    skipped_count: items.filter((item) => item.status === 'SKIPPED').length,
    failed_count: items.filter((item) => item.status === 'FAILED').length,
    retryable_count: retryableItems.length,
    retried_count: items.filter((item) => item.retry_count > 0 || item.retried_from_event_id).length,
    latest_failed_at: latestFailed ?? null,
  };
}

function normalizeNotificationStatus(value: unknown): PlatformUsageAlertNotificationStatus {
  if (value === 'SENT' || value === 'PARTIAL' || value === 'SKIPPED' || value === 'FAILED') return value;
  return 'FAILED';
}

function isRetryableNotificationStatus(status: PlatformUsageAlertNotificationStatus) {
  return status === 'FAILED' || status === 'PARTIAL';
}

function findLastPlatformEvent(events: PlatformEventRecord[], eventType: string) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index]?.eventType === eventType) return events[index] ?? null;
  }
  return null;
}

function usageAlertStatusFromLifecycle(events: PlatformEventRecord[]): PlatformUsageAlertStatus {
  const latest = events.at(-1);
  if (!latest) return 'OPEN';
  if (latest.eventType === 'platform.usage.alert.closed') return 'CLOSED';
  if (latest.eventType === 'platform.usage.alert.escalated') return 'ESCALATED';
  if (latest.eventType === 'platform.usage.alert.acknowledged') return 'ACKNOWLEDGED';
  return 'OPEN';
}

function usageAlertActionEventType(action: PlatformUsageAlertAction) {
  if (action === 'ACKNOWLEDGE') return 'platform.usage.alert.acknowledged';
  if (action === 'ESCALATE') return 'platform.usage.alert.escalated';
  return 'platform.usage.alert.closed';
}

function usageAlertActionFromEventType(eventType: string): PlatformUsageAlertAction | null {
  if (eventType === 'platform.usage.alert.acknowledged') return 'ACKNOWLEDGE';
  if (eventType === 'platform.usage.alert.escalated') return 'ESCALATE';
  if (eventType === 'platform.usage.alert.closed') return 'CLOSE';
  return null;
}

function usageAlertActionSummary(action: PlatformUsageAlertAction, alertId: string) {
  if (action === 'ACKNOWLEDGE') return `用量告警 ${alertId} 已确认。`;
  if (action === 'ESCALATE') return `用量告警 ${alertId} 已升级处理。`;
  return `用量告警 ${alertId} 已关闭。`;
}

function usageAlertTitle(severity: PlatformUsageAnomalySeverity, anomalyCount: number) {
  return `${severity} 用量异常告警 · ${anomalyCount} 条信号`;
}

function usageAlertNotificationTargets(severity: PlatformUsageAnomalySeverity, status: PlatformUsageAlertStatus) {
  if (status === 'CLOSED') return [];
  if (severity === 'CRITICAL') return ['租户管理员', '安全管理员', '成本负责人'];
  if (severity === 'ERROR') return ['租户管理员', '成本负责人'];
  return ['成本负责人'];
}

function normalizeNotificationChannels(channels: PlatformUsageAlertNotificationChannel[] | undefined) {
  const allowed: PlatformUsageAlertNotificationChannel[] = ['IN_APP', 'WEBHOOK'];
  const requested = channels?.length ? channels : allowed;
  const normalized = requested.filter((channel): channel is PlatformUsageAlertNotificationChannel =>
    allowed.includes(channel),
  );

  return Array.from(new Set(normalized));
}

async function deliverUsageAlertWebhook(
  webhookUrl: string,
  alert: PlatformUsageAlertItem,
  note: string | null,
): Promise<{ status: number | null; ok: boolean; error: string | null }> {
  const body = JSON.stringify({
    event: 'platform.usage.alert.notification',
    alert_id: alert.alert_id,
    status: alert.status,
    severity: alert.severity,
    title: alert.title,
    summary: alert.summary,
    anomaly_count: alert.anomaly_count,
    notification_targets: alert.notification_targets,
    note,
    created_at: new Date().toISOString(),
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'AIAGET-Alerts/1.0',
      },
      body,
      signal: AbortSignal.timeout(ALERT_WEBHOOK_TIMEOUT_MS),
    });
    const text = await safeAlertResponseText(response);

    return {
      status: response.status,
      ok: response.ok,
      error: response.ok ? null : text ?? `Webhook returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : 'Webhook notification failed',
    };
  }
}

async function safeAlertResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 1200);
  } catch {
    return null;
  }
}

function notificationStatus(
  channels: PlatformUsageAlertNotificationChannel[],
  webhookResult: { ok: boolean } | null,
  webhookSkipped: boolean,
): PlatformUsageAlertNotificationStatus {
  if (channels.length === 0) return 'SKIPPED';

  const inAppSent = channels.includes('IN_APP');
  const webhookRequested = channels.includes('WEBHOOK');

  if (!webhookRequested) return inAppSent ? 'SENT' : 'SKIPPED';
  if (webhookResult?.ok) return 'SENT';
  if (webhookSkipped) return inAppSent ? 'PARTIAL' : 'SKIPPED';

  return inAppSent ? 'PARTIAL' : 'FAILED';
}

function notificationMessage(
  status: PlatformUsageAlertNotificationStatus,
  channels: PlatformUsageAlertNotificationChannel[],
  webhookSkipped: boolean,
) {
  if (status === 'SENT') return '告警通知已投递。';
  if (status === 'PARTIAL') {
    return webhookSkipped ? '站内通知已记录，外部 Webhook 未配置。' : '站内通知已记录，外部 Webhook 投递失败。';
  }
  if (status === 'SKIPPED') return '告警通知已跳过，未配置可用投递渠道。';

  return channels.includes('WEBHOOK') ? '外部 Webhook 告警通知投递失败。' : '告警通知投递失败。';
}

function normalizeAnomalySeverity(value: unknown): PlatformUsageAnomalySeverity {
  if (value === 'CRITICAL' || value === 'ERROR' || value === 'WARN' || value === 'INFO') return value;
  return 'INFO';
}

function highestAnomalySeverity(items: PlatformUsageAnomalyItem[]): PlatformUsageAnomalySeverity {
  return items.reduce<PlatformUsageAnomalySeverity>((highest, item) => (
    anomalySeverityWeight(item.severity) > anomalySeverityWeight(highest) ? item.severity : highest
  ), 'INFO');
}

function anomalySeverityWeight(severity: PlatformUsageAnomalySeverity) {
  const weights: Record<PlatformUsageAnomalySeverity, number> = {
    INFO: 0,
    WARN: 1,
    ERROR: 2,
    CRITICAL: 3,
  };
  return weights[severity];
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

function safeRatio(current: number, baseline: number) {
  if (baseline <= 0) return current > 0 ? current : 0;
  return current / baseline;
}

function formatRatioPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function usageRollupIdentity(
  usage: PlatformUsageEventRecord,
  periodType: PlatformUsagePeriod,
  periodStart: Date,
): Prisma.PlatformUsageRollupWhereInput {
  return {
    tenantId: usage.tenantId,
    departmentId: usage.departmentId,
    subjectType: usage.subjectType,
    subjectId: usage.subjectId,
    resourceType: usage.resourceType,
    resourceId: usage.resourceId,
    metricType: usage.metricType,
    periodType,
    periodStart,
  };
}

function usageRollupPeriod(date: Date, periodType: PlatformUsagePeriod) {
  const periodStart = new Date(date);
  if (periodType === 'hour') {
    periodStart.setMinutes(0, 0, 0);
    return {
      periodType,
      periodStart,
      periodEnd: new Date(periodStart.getTime() + 60 * 60 * 1000),
    };
  }

  periodStart.setHours(0, 0, 0, 0);
  return {
    periodType,
    periodStart,
    periodEnd: new Date(periodStart.getTime() + 24 * 60 * 60 * 1000),
  };
}

function isUsageError(usage: PlatformUsageEventRecord) {
  return usage.metricType.toLowerCase().includes('failed') || usage.metricType.toLowerCase().includes('error');
}

function isUsageRetry(usage: PlatformUsageEventRecord) {
  return usage.metricType.toLowerCase().includes('retry') || usage.sourceSystem?.toLowerCase().includes('retry') === true;
}

function buildPlatformEventWhere(
  tenantId: string,
  windowSince: Date,
  filters: ListPlatformEventsQuery,
): Prisma.PlatformEventWhereInput {
  const keyword = filters.keyword?.trim();

  return {
    tenantId,
    occurredAt: {
      gte: windowSince,
    },
    ...(filters.event_type ? { eventType: filters.event_type } : {}),
    ...(filters.resource_type ? { resourceType: filters.resource_type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.trace_id ? { traceId: filters.trace_id } : {}),
    ...(filters.request_id ? { requestId: filters.request_id } : {}),
    ...(filters.source_system ? { sourceSystem: filters.source_system } : {}),
    ...(keyword
      ? {
          OR: [
            { eventType: { contains: keyword, mode: 'insensitive' } },
            { summary: { contains: keyword, mode: 'insensitive' } },
            { resourceType: { contains: keyword, mode: 'insensitive' } },
            { resourceId: { contains: keyword, mode: 'insensitive' } },
            { sourceSystem: { contains: keyword, mode: 'insensitive' } },
            { sourceId: { contains: keyword, mode: 'insensitive' } },
            { traceId: { contains: keyword, mode: 'insensitive' } },
            { requestId: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function buildPlatformUsageWhere(
  tenantId: string,
  windowSince: Date,
  filters: ListPlatformUsageQuery,
): Prisma.PlatformUsageEventWhereInput {
  const keyword = filters.keyword?.trim();

  return {
    tenantId,
    occurredAt: {
      gte: windowSince,
    },
    ...(filters.subject_type ? { subjectType: filters.subject_type } : {}),
    ...(filters.resource_type ? { resourceType: filters.resource_type } : {}),
    ...(filters.metric_type ? { metricType: filters.metric_type } : {}),
    ...(filters.billable === undefined ? {} : { billable: filters.billable }),
    ...(filters.trace_id ? { traceId: filters.trace_id } : {}),
    ...(filters.request_id ? { requestId: filters.request_id } : {}),
    ...(filters.event_id ? { eventId: filters.event_id } : {}),
    ...(filters.source_system ? { sourceSystem: filters.source_system } : {}),
    ...(keyword
      ? {
          OR: [
            { subjectType: { contains: keyword, mode: 'insensitive' } },
            { subjectId: { contains: keyword, mode: 'insensitive' } },
            { resourceType: { contains: keyword, mode: 'insensitive' } },
            { resourceId: { contains: keyword, mode: 'insensitive' } },
            { metricType: { contains: keyword, mode: 'insensitive' } },
            { sourceSystem: { contains: keyword, mode: 'insensitive' } },
            { sourceId: { contains: keyword, mode: 'insensitive' } },
            { traceId: { contains: keyword, mode: 'insensitive' } },
            { requestId: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function mapPlatformEvent(event: PlatformEventRecord, usage?: UsageSummary): PlatformEventListItem {
  return {
    id: event.id,
    tenant_id: event.tenantId,
    department_id: event.departmentId,
    user_id: event.userId,
    actor_type: event.actorType,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    agent_id: event.agentId,
    team_id: event.teamId,
    plugin_id: event.pluginId,
    channel_id: event.channelId,
    conversation_id: event.conversationId,
    run_id: event.runId,
    task_id: event.taskId,
    request_id: event.requestId,
    trace_id: event.traceId,
    parent_trace_id: event.parentTraceId,
    event_source: event.eventSource,
    event_type: event.eventType,
    status: event.status,
    severity: event.severity,
    security_level: event.securityLevel,
    billable: event.billable,
    summary: event.summary,
    occurred_at: event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
    updated_at: event.updatedAt.toISOString(),
    source_system: event.sourceSystem,
    source_id: event.sourceId,
    dedupe_key: event.dedupeKey,
    linked_usage_count: usage?.count ?? 0,
    linked_quantity_total: round6(usage?.quantity ?? 0),
    linked_amount_total: round6(usage?.amount ?? 0),
  };
}

function mapPlatformUsageEvent(event: PlatformUsageEventRecord): PlatformUsageLedgerItem {
  return {
    id: event.id,
    tenant_id: event.tenantId,
    department_id: event.departmentId,
    user_id: event.userId,
    subject_type: event.subjectType,
    subject_id: event.subjectId,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metric_type: event.metricType,
    unit: event.unit,
    quantity: decimalToNumber(event.quantity),
    unit_price: decimalToNumber(event.unitPrice),
    amount: decimalToNumber(event.amount),
    currency: event.currency,
    billable: event.billable,
    cost_source: event.costSource,
    trace_id: event.traceId,
    request_id: event.requestId,
    event_id: event.eventId,
    source_system: event.sourceSystem,
    source_id: event.sourceId,
    occurred_at: event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
  };
}

function mapPlatformEventRelation(relation: PlatformEventRelationRecord): PlatformEventRelationItem {
  return {
    id: relation.id,
    tenant_id: relation.tenantId,
    relation_type: relation.relationType,
    parent_event_id: relation.parentEventId,
    child_event_id: relation.childEventId,
    source_event_id: relation.sourceEventId,
    target_event_id: relation.targetEventId,
    relation_source: relation.relationSource,
    relation_key: relation.relationKey,
    metadata: jsonObjectOrNull(relation.metadata),
    occurred_at: relation.occurredAt.toISOString(),
    created_at: relation.createdAt.toISOString(),
  };
}

function mapPlatformUsageRollup(rollup: PlatformUsageRollupRecord): PlatformUsageRollupItem {
  return {
    id: rollup.id,
    tenant_id: rollup.tenantId,
    department_id: rollup.departmentId,
    subject_type: rollup.subjectType,
    subject_id: rollup.subjectId,
    resource_type: rollup.resourceType,
    resource_id: rollup.resourceId,
    metric_type: rollup.metricType,
    period_type: rollup.periodType,
    period_start: rollup.periodStart.toISOString(),
    period_end: rollup.periodEnd.toISOString(),
    event_count: rollup.eventCount,
    quantity_total: decimalToNumber(rollup.quantityTotal),
    amount_total: decimalToNumber(rollup.amountTotal),
    cost_total: decimalToNumber(rollup.costTotal),
    error_count: rollup.errorCount,
    success_count: rollup.successCount,
    retry_count: rollup.retryCount,
    created_at: rollup.createdAt.toISOString(),
    updated_at: rollup.updatedAt.toISOString(),
  };
}

function summarizeUsage(events: PlatformUsageEventRecord[]): UsageSummary {
  return {
    count: events.length,
    quantity: sum(events.map((event) => decimalToNumber(event.quantity))),
    amount: sum(events.map((event) => decimalToNumber(event.amount))),
  };
}

function summarizeUsageByEventId(events: PlatformUsageEventRecord[]) {
  const grouped = new Map<string, UsageSummary>();
  for (const event of events) {
    if (!event.eventId) continue;
    const current = grouped.get(event.eventId) ?? { count: 0, quantity: 0, amount: 0 };
    current.count += 1;
    current.quantity += decimalToNumber(event.quantity);
    current.amount += decimalToNumber(event.amount);
    grouped.set(event.eventId, current);
  }
  return grouped;
}

function buildEventTypeRankings(events: PlatformEventRecord[]) {
  const grouped = new Map<string, { event_type: string; event_count: number; last_occurred_at: string }>();

  for (const event of events) {
    const current = grouped.get(event.eventType) ?? {
      event_type: event.eventType,
      event_count: 0,
      last_occurred_at: event.occurredAt.toISOString(),
    };
    current.event_count += 1;
    if (Date.parse(current.last_occurred_at) < event.occurredAt.getTime()) {
      current.last_occurred_at = event.occurredAt.toISOString();
    }
    grouped.set(event.eventType, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.event_count - left.event_count)
    .slice(0, 10);
}

function buildMetricRankings(events: PlatformUsageEventRecord[]) {
  const grouped = new Map<
    string,
    { metric_type: string; event_count: number; quantity_total: number; amount_total: number; cost_total: number }
  >();

  for (const event of events) {
    const current = grouped.get(event.metricType) ?? {
      metric_type: event.metricType,
      event_count: 0,
      quantity_total: 0,
      amount_total: 0,
      cost_total: 0,
    };
    current.event_count += 1;
    current.quantity_total = round6(current.quantity_total + decimalToNumber(event.quantity));
    current.amount_total = round6(current.amount_total + decimalToNumber(event.amount));
    current.cost_total = round6(current.cost_total + decimalToNumber(event.amount));
    grouped.set(event.metricType, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.amount_total - left.amount_total || right.quantity_total - left.quantity_total)
    .slice(0, 10);
}

function buildSystemUser(tenantId: string, requestId: string | null): AuthenticatedUser {
  return {
    id: 'system-platform-usage-alert-task',
    tenantId,
    email: 'system@aiaget.local',
    roles: ['system'],
    permissions: ['monitor:log:view'],
    requestId: requestId ?? undefined,
  };
}

function normalizeWindow(value: string | undefined): PlatformEventWindow {
  if (value === '7d' || value === '30d') return value;
  return '24h';
}

function windowStart(window: PlatformEventWindow) {
  const now = new Date();
  if (window === '30d') {
    now.setDate(now.getDate() - 30);
    return now;
  }
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function normalizePeriod(value: string | undefined, window: PlatformEventWindow): PlatformUsagePeriod {
  if (value === 'hour' || value === 'day') return value;
  return window === '24h' ? 'hour' : 'day';
}

function bucketLabel(date: Date, period: PlatformUsagePeriod) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  if (period === 'day') return `${year}-${month}-${day}`;
  const hour = `${date.getHours()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:00`;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function decimalInputToNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueStringCount(values: Array<string | null | undefined>) {
  return new Set(values.filter((value): value is string => Boolean(value))).size;
}

function round6(value: number) {
  return Number(value.toFixed(6));
}

function isErrorStatus(status: string) {
  return ['FAILED', 'ERROR', 'REJECTED', 'DENIED', 'CANCELLED'].includes(status);
}

function jsonObjectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}
