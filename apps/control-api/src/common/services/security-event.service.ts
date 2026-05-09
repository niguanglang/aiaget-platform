import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PlatformEventsService } from '../../platform-events/platform-events.service';
import type { RequestWithContext } from '../types/request-context';

export interface SecurityDenyEventInput {
  source: 'DATA_SCOPE' | 'RESOURCE_ACL' | 'SECURITY_POLICY';
  resourceType?: string | null;
  resourceId?: string | null;
  action?: string | null;
  reason: string;
  matchedCode?: string | null;
  statusCode?: number;
  subject?: Record<string, unknown> | null;
  resource?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
}

@Injectable()
export class SecurityEventService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async recordDeny(request: RequestWithContext, input: SecurityDenyEventInput) {
    const user = request.user;
    if (!user) return;

    const path = request.originalUrl ?? request.path ?? '';
    const requestSummary = compactJson({
      trace_id: request.traceId ?? null,
      span_id: request.spanId ?? null,
      parent_span_id: request.parentSpanId ?? null,
      traceparent: request.traceparent ?? null,
      request_id: request.requestId ?? null,
      security_event: true,
      guard_source: input.source,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      action: input.action ?? null,
      matched_code: input.matchedCode ?? null,
      subject: input.subject ?? null,
      resource: input.resource ?? null,
      context: input.context ?? null,
    });

    const operationLog = await this.prisma.operationLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        module: 'security',
        action: 'deny',
        method: request.method,
        path,
        statusCode: input.statusCode ?? 403,
        requestId: request.requestId ?? 'unknown',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestSummary,
        errorMessage: input.reason,
      },
    });

    await this.prisma.securityEvent.upsert({
      where: {
        tenantId_sourceRecordType_sourceRecordId: {
          tenantId: user.tenantId,
          sourceRecordType: 'operation_log',
          sourceRecordId: operationLog.id,
        },
      },
      create: {
        tenantId: user.tenantId,
        userId: user.id,
        source: normalizeSecurityEventSource(input.source),
        title: `${securityEventSourceLabel(input.source)}拒绝`,
        reason: input.reason,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        action: input.action ?? null,
        matchedCode: input.matchedCode ?? null,
        path,
        method: request.method,
        statusCode: input.statusCode ?? 403,
        requestId: request.requestId ?? 'unknown',
        traceId: request.traceId ?? null,
        severity: securityEventSeverity(input.statusCode ?? 403, input.source),
        sourceRecordType: 'operation_log',
        sourceRecordId: operationLog.id,
        subject: toJsonOrNull(input.subject),
        resource: toJsonOrNull(input.resource),
        context: toJsonOrNull(input.context),
        requestSummary,
        matchedPolicyId: null,
        matchedPolicyCode: input.source === 'SECURITY_POLICY' ? input.matchedCode ?? null : null,
        matchedPolicyName: null,
        ip: request.ip,
        userAgent: stringHeaderValue(request.headers['user-agent']),
        errorMessage: input.reason,
        occurredAt: operationLog.createdAt,
      },
      update: {
        reason: input.reason,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        action: input.action ?? null,
        matchedCode: input.matchedCode ?? null,
        traceId: request.traceId ?? null,
        severity: securityEventSeverity(input.statusCode ?? 403, input.source),
        subject: toJsonOrNull(input.subject),
        resource: toJsonOrNull(input.resource),
        context: toJsonOrNull(input.context),
        requestSummary,
        errorMessage: input.reason,
      },
    });

    await this.platformEvents.recordEvent({
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      userId: user.id,
      actorType: 'USER',
      resourceType: input.resourceType ?? 'SECURITY',
      resourceId: input.resourceId ?? null,
      requestId: request.requestId ?? 'unknown',
      traceId: request.traceId ?? null,
      parentTraceId: request.parentSpanId ?? null,
      eventSource: 'security_center',
      eventType: input.source === 'SECURITY_POLICY' ? 'security.policy.denied' : 'security.access.denied',
      status: 'DENIED',
      severity: 'ERROR',
      securityLevel: 'CONFIDENTIAL',
      billable: false,
      summary: input.reason,
      payloadJson: requestSummary,
      occurredAt: operationLog.createdAt,
      sourceSystem: 'security_guard',
      sourceId: operationLog.id,
      dedupeKey: `security_guard:${operationLog.id}`,
    });
  }
}

function compactJson(value: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function toJsonOrNull(value: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value ? compactJson(value) : Prisma.JsonNull;
}

function normalizeSecurityEventSource(value: SecurityDenyEventInput['source']) {
  if (value === 'DATA_SCOPE' || value === 'RESOURCE_ACL' || value === 'SECURITY_POLICY') return value;
  return 'OPERATION';
}

function securityEventSourceLabel(value: SecurityDenyEventInput['source']) {
  switch (normalizeSecurityEventSource(value)) {
    case 'DATA_SCOPE':
      return '数据权限';
    case 'RESOURCE_ACL':
      return '资源授权';
    case 'SECURITY_POLICY':
      return '安全策略';
    case 'OPERATION':
      return '操作审计';
  }
}

function securityEventSeverity(statusCode: number, source: SecurityDenyEventInput['source']) {
  if (source === 'SECURITY_POLICY') return 'MEDIUM';
  if (statusCode >= 500) return 'HIGH';
  return 'LOW';
}

function stringHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? null;
}
