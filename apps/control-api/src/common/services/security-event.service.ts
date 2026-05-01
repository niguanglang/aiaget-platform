import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
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
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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

    await this.prisma.operationLog.create({
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
  }
}

function compactJson(value: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}
