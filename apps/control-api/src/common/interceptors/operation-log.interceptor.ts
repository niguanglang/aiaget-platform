import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { catchError, Observable, tap, throwError } from 'rxjs';
import type { Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import type { RequestWithContext } from '../types/request-context';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE_KEYS = new Set(['password', 'accessToken', 'refreshToken', 'token', 'secret']);
const REQUEST_CONTEXT_KEYS = [
  'apiKeyId',
  'apiKeyPrefix',
  'externalAgentId',
  'externalChannelId',
  'externalConversationId',
  'externalRunId',
  'externalTraceId',
] as const;

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        void this.writeOperationLog(request, response.statusCode);
      }),
      catchError((error) => {
        const statusCode = typeof error?.status === 'number' ? error.status : 500;

        void this.writeOperationLog(request, statusCode, error instanceof Error ? error.message : 'error');

        return throwError(() => error);
      }),
    );
  }

  private async writeOperationLog(request: RequestWithContext, statusCode: number, errorMessage?: string) {
    if (!WRITE_METHODS.has(request.method) || !request.user) {
      return;
    }

    const [module = 'unknown'] = request.path.replace(/^\/api\/v1\//, '').split('/');

    await this.prisma.operationLog.create({
      data: {
        tenantId: request.user.tenantId,
        userId: request.user.id,
        module,
        action: this.actionFromMethod(request.method),
        method: request.method,
        path: request.originalUrl,
        statusCode,
        requestId: request.requestId ?? 'unknown',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestSummary: buildRequestSummary(request),
        errorMessage,
      },
    });
  }

  private actionFromMethod(method: string) {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PATCH':
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return method.toLowerCase();
    }
  }
}

function buildRequestSummary(request: RequestWithContext): Prisma.InputJsonObject {
  return {
    ...(sanitizePayload(request.body) ?? {}),
    ...buildExternalContextSummary(request),
    trace_id: request.traceId ?? null,
    span_id: request.spanId ?? null,
    parent_span_id: request.parentSpanId ?? null,
    traceparent: request.traceparent ?? null,
    request_id: request.requestId ?? null,
  };
}

function buildExternalContextSummary(request: RequestWithContext): Prisma.InputJsonObject {
  const rawRequest = request as RequestWithContext & Partial<Record<(typeof REQUEST_CONTEXT_KEYS)[number], unknown>>;
  const output: Record<string, Prisma.InputJsonValue> = {};

  for (const key of REQUEST_CONTEXT_KEYS) {
    const value = rawRequest[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      output[toSnakeCase(key)] = value.trim();
    }
  }

  return output as Prisma.InputJsonObject;
}

function sanitizePayload(value: unknown): Prisma.InputJsonObject | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[REDACTED]' : toJsonValue(entryValue),
    ]),
  ) as Prisma.InputJsonObject;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as Prisma.InputJsonValue;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
