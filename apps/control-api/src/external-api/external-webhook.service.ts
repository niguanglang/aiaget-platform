import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import type {
  ExternalAgentChatResponse,
  ExternalAgentRunCompletedWebhookPayload,
  ExternalWebhookEventType,
  ListWebhookDeliveriesResult,
  RetryWebhookDeliveryResult,
  WebhookDeliveryDetail,
  WebhookDeliveryListItem,
  WebhookDeliveryStatus,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { decryptSecret } from '../models/model-secrets';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ExternalApiPrincipal } from './external-api-key.service';

const RUN_COMPLETED_EVENT: ExternalWebhookEventType = 'agent.run.completed';
const WEBHOOK_TIMEOUT_MS = 5000;
const RESPONSE_BODY_LIMIT = 1200;
const DELIVERY_LIST_LIMIT = 30;

@Injectable()
export class ExternalWebhookService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async notifyRunCompleted(principal: ExternalApiPrincipal, result: ExternalAgentChatResponse) {
    if (!principal.key.webhookEnabled || !principal.key.webhookUrl || !isEventEnabled(principal.key.webhookEvents, RUN_COMPLETED_EVENT)) {
      return;
    }

    await this.deliver({
      principal,
      apiKeyId: principal.key.id,
      apiKeyPrefix: principal.key.keyPrefix,
      targetUrl: principal.key.webhookUrl,
      secretEncrypted: principal.key.webhookSecretEncrypted,
      payload: buildPayload(principal, result),
      parentDeliveryId: null,
      retryCount: 0,
      action: 'deliver',
    });
  }

  async listDeliveries(currentUser: AuthenticatedUser, apiKeyId?: string): Promise<ListWebhookDeliveriesResult> {
    const where: Prisma.WebhookDeliveryWhereInput = {
      tenantId: currentUser.tenantId,
      ...(apiKeyId ? { apiKeyId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where,
        include: { apiKey: true },
        orderBy: { createdAt: 'desc' },
        take: DELIVERY_LIST_LIMIT,
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return {
      items: items.map(mapDeliveryListItem),
      total,
    };
  }

  async getDeliveryDetail(currentUser: AuthenticatedUser, deliveryId: string): Promise<WebhookDeliveryDetail> {
    const delivery = await this.findTenantDelivery(currentUser, deliveryId);
    return mapDeliveryDetail(delivery);
  }

  async retryDelivery(currentUser: AuthenticatedUser, deliveryId: string): Promise<RetryWebhookDeliveryResult> {
    const delivery = await this.findTenantDelivery(currentUser, deliveryId);
    if (delivery.status !== 'FAILED') {
      throw new BadRequestException('Only failed webhook deliveries can be retried');
    }
    if (!delivery.apiKey.webhookEnabled || !delivery.apiKey.webhookUrl) {
      throw new BadRequestException('Webhook configuration is unavailable');
    }

    const retry = await this.deliver({
      principal: {
        key: delivery.apiKey,
        user: currentUser,
      },
      apiKeyId: delivery.apiKeyId,
      apiKeyPrefix: delivery.apiKey.keyPrefix,
      targetUrl: delivery.apiKey.webhookUrl,
      secretEncrypted: delivery.apiKey.webhookSecretEncrypted,
      payload: parsePayload(delivery.payload),
      parentDeliveryId: delivery.id,
      retryCount: delivery.retryCount + 1,
      action: 'retry',
    });

    return { item: retry };
  }

  private async findTenantDelivery(currentUser: AuthenticatedUser, deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        deliveryId,
      },
      include: {
        apiKey: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found');
    }

    return delivery;
  }

  private async deliver(input: {
    principal: ExternalApiPrincipal;
    apiKeyId: string;
    apiKeyPrefix: string;
    targetUrl: string;
    secretEncrypted: string | null;
    payload: ExternalAgentRunCompletedWebhookPayload;
    parentDeliveryId: string | null;
    retryCount: number;
    action: 'deliver' | 'retry';
  }): Promise<WebhookDeliveryDetail> {
    const deliveryId = `evt_${randomUUID().replaceAll('-', '')}`;
    const createdAt = new Date();
    const payload = {
      ...input.payload,
      id: deliveryId,
      created_at: createdAt.toISOString(),
    };
    const body = JSON.stringify(payload);
    const headers = buildHeaders(input.secretEncrypted, deliveryId, createdAt, body);

    const record = await this.prisma.webhookDelivery.create({
      data: {
        tenantId: input.principal.user.tenantId,
        apiKeyId: input.apiKeyId,
        event: payload.event,
        deliveryId,
        parentDeliveryId: input.parentDeliveryId,
        targetUrl: input.targetUrl,
        payload: payload as unknown as Prisma.InputJsonValue,
        requestHeaders: headers as Prisma.InputJsonValue,
        status: 'PENDING',
        retryCount: input.retryCount,
      },
      include: {
        apiKey: true,
      },
    });

    const startedAt = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let status: WebhookDeliveryStatus = 'FAILED';
    let errorMessage: string | null = null;

    try {
      const response = await fetch(input.targetUrl, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      responseStatus = response.status;
      responseBody = await safeResponseText(response);
      status = response.ok ? 'SUCCESS' : 'FAILED';
      errorMessage = response.ok ? null : responseBody ?? `Webhook returned HTTP ${response.status}`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Webhook delivery failed';
    }

    const finishedAt = new Date();
    const latencyMs = Date.now() - startedAt;
    const updated = await this.prisma.webhookDelivery.update({
      where: { id: record.id },
      data: {
        status,
        responseStatus,
        responseBody,
        latencyMs,
        errorMessage,
        deliveredAt: finishedAt,
      },
      include: {
        apiKey: true,
      },
    });

    await this.prisma.$transaction([
      this.prisma.apiKey.update({
        where: { id: input.apiKeyId },
        data: {
          webhookLastStatus: status,
          webhookLastError: errorMessage,
          webhookLastSentAt: finishedAt,
        },
      }),
      this.prisma.operationLog.create({
        data: {
          tenantId: input.principal.user.tenantId,
          userId: input.principal.user.id,
          module: 'external_webhook',
          action: input.action,
          method: 'POST',
          path: redactUrl(input.targetUrl),
          statusCode: status === 'SUCCESS' ? 200 : 502,
          requestId: deliveryId,
          requestSummary: {
            webhook_event: payload.event,
            webhook_delivery_id: deliveryId,
            webhook_parent_delivery_id: input.parentDeliveryId,
            webhook_retry_count: input.retryCount,
            webhook_response_status: responseStatus,
            webhook_latency_ms: latencyMs,
            api_key_id: input.apiKeyId,
            api_key_prefix: input.apiKeyPrefix,
            agent_id: payload.agent_id,
            conversation_id: payload.conversation_id,
            run_id: payload.run_id,
            trace_id: payload.trace_id,
          } as Prisma.InputJsonObject,
          errorMessage,
        },
      }),
    ]);

    await this.platformEvents.recordUsage({
      tenantId: input.principal.user.tenantId,
      departmentId: input.principal.user.departmentId ?? null,
      userId: input.principal.user.id,
      subjectType: 'API_KEY',
      subjectId: input.apiKeyId,
      resourceType: 'WEBHOOK',
      resourceId: input.apiKeyId,
      metricType: 'webhook_deliveries',
      unit: 'delivery',
      quantity: 1,
      amount: 0,
      currency: 'USD',
      billable: true,
      costSource: 'external_webhook',
      traceId: payload.trace_id ?? input.principal.user.traceId ?? null,
      requestId: input.principal.user.requestId ?? null,
      sourceSystem: 'external_webhook',
      sourceId: deliveryId,
      occurredAt: finishedAt,
    });

    return mapDeliveryDetail(updated);
  }
}

function buildPayload(principal: ExternalApiPrincipal, result: ExternalAgentChatResponse): ExternalAgentRunCompletedWebhookPayload {
  return {
    id: `evt_${randomUUID().replaceAll('-', '')}`,
    event: RUN_COMPLETED_EVENT,
    created_at: new Date().toISOString(),
    tenant_id: principal.user.tenantId,
    api_key_id: principal.key.id,
    api_key_prefix: principal.key.keyPrefix,
    agent_id: result.agent_id,
    conversation_id: result.conversation_id,
    run_id: result.run_id,
    trace_id: result.trace_id,
    status: result.status,
    result,
  };
}

function buildHeaders(secretEncrypted: string | null, deliveryId: string, createdAt: Date, body: string) {
  const timestamp = Math.floor(createdAt.getTime() / 1000).toString();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'AIAGET-Webhooks/1.0',
    'x-aiaget-event': RUN_COMPLETED_EVENT,
    'x-aiaget-delivery-id': deliveryId,
    'x-aiaget-timestamp': timestamp,
  };
  const secret = safeDecrypt(secretEncrypted);
  if (secret) {
    headers['x-aiaget-signature'] = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
  }
  return headers;
}

function mapDeliveryListItem(delivery: Prisma.WebhookDeliveryGetPayload<{ include: { apiKey: true } }>): WebhookDeliveryListItem {
  return {
    id: delivery.id,
    delivery_id: delivery.deliveryId,
    parent_delivery_id: delivery.parentDeliveryId,
    api_key_id: delivery.apiKeyId,
    api_key_name: delivery.apiKey.name,
    api_key_prefix: delivery.apiKey.keyPrefix,
    event: delivery.event as ExternalWebhookEventType,
    target_url: delivery.targetUrl,
    status: delivery.status as WebhookDeliveryStatus,
    response_status: delivery.responseStatus,
    latency_ms: delivery.latencyMs,
    retry_count: delivery.retryCount,
    error_message: delivery.errorMessage,
    delivered_at: delivery.deliveredAt?.toISOString() ?? null,
    created_at: delivery.createdAt.toISOString(),
  };
}

function mapDeliveryDetail(delivery: Prisma.WebhookDeliveryGetPayload<{ include: { apiKey: true } }>): WebhookDeliveryDetail {
  return {
    ...mapDeliveryListItem(delivery),
    payload: parsePayload(delivery.payload),
    request_headers: maskHeaders(parseHeaders(delivery.requestHeaders)),
    response_body: delivery.responseBody,
    updated_at: delivery.updatedAt.toISOString(),
  };
}

function parsePayload(value: Prisma.JsonValue): ExternalAgentRunCompletedWebhookPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Webhook payload is invalid');
  }
  return value as unknown as ExternalAgentRunCompletedWebhookPayload;
}

function parseHeaders(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, typeof entry === 'string' ? entry : JSON.stringify(entry)]),
  );
}

function maskHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, key.toLowerCase() === 'x-aiaget-signature' ? 'sha256=***' : value]),
  );
}

function isEventEnabled(value: Prisma.JsonValue | null, event: ExternalWebhookEventType) {
  if (!Array.isArray(value)) return true;
  return value.some((item) => item === event);
}

function safeDecrypt(value: string | null) {
  if (!value) return null;
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

async function safeResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, RESPONSE_BODY_LIMIT);
  } catch {
    return null;
  }
}

function redactUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return 'webhook://invalid-url';
  }
}
