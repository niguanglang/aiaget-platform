import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  ConversationDetail,
  ConversationRunItem,
  ConversationStreamEvent,
  ExternalAgentChatResponse,
  ExternalAgentStreamEvent,
} from '@aiaget/shared-types';

import { ConversationsService } from '../conversations/conversations.service';
import { ExternalApiKeyService, type ExternalApiPrincipal } from './external-api-key.service';
import type { ExternalAgentChatDto } from './dto/external-agent-chat.dto';
import { ExternalChannelRolloutGateService } from './external-channel-rollout-gate.service';
import { ExternalWebhookService } from './external-webhook.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ExternalApiService {
  constructor(
    @Inject(ConversationsService) private readonly conversationsService: ConversationsService,
    @Inject(ExternalApiKeyService) private readonly externalApiKeys: ExternalApiKeyService,
    @Inject(ExternalChannelRolloutGateService) private readonly rolloutGate: ExternalChannelRolloutGateService,
    @Inject(ExternalWebhookService) private readonly webhooks: ExternalWebhookService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BillingService) private readonly billingService: BillingService,
  ) {}

  async chat(principal: ExternalApiPrincipal, agentId: string, dto: ExternalAgentChatDto): Promise<ExternalAgentChatResponse> {
    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('agent_chat', principal, agentId, idempotencyKey));
    if (cached) return cached;

    await this.reserveExternalApiCall(principal);
    const result = await this.performChat(principal, agentId, dto);

    await this.recordExternalInvocation(principal, agentId, result, {
      eventType: 'external.agent.chat.completed',
      idempotencyKey,
      scope: 'agent_chat',
      streaming: false,
      conversationContinuation: false,
    });

    return withIdempotency(result, idempotencyKey, false);
  }

  private async performChat(principal: ExternalApiPrincipal, agentId: string, dto: ExternalAgentChatDto): Promise<ExternalAgentChatResponse> {
    const conversation = await this.conversationsService.create(principal.user, {
      agent_id: agentId,
      message: dto.message,
      title: dto.title,
    });

    const result = mapExternalResponse(conversation);
    void this.webhooks.notifyRunCompleted(principal, result);

    return result;
  }

  async channelChat(
    principal: ExternalApiPrincipal,
    channelId: string,
    agentId: string,
    dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    await this.rolloutGate.evaluateForApiPrincipal(principal, channelId, {
      source: 'external_channel_chat',
      stableKey: channelStableKey(principal, dto),
      streaming: false,
      conversationContinuation: false,
    });

    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('channel_chat', principal, channelId, idempotencyKey));
    if (cached) return withChannel(cached, channelId);

    await this.reserveExternalApiCall(principal);
    const result = await this.performChat(principal, agentId, dto);

    await this.recordChannelInvocation(principal, channelId, result, {
      eventType: 'channel.external.chat.completed',
      idempotencyKey,
      scope: 'channel_chat',
      streaming: false,
      conversationContinuation: false,
    });

    return withIdempotency(withChannel(result, channelId), idempotencyKey, false);
  }

  async continueChat(
    principal: ExternalApiPrincipal,
    conversationId: string,
    dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('agent_conversation', principal, conversationId, idempotencyKey));
    if (cached) return cached;

    await this.reserveExternalApiCall(principal);
    const result = await this.performContinueChat(principal, conversationId, dto);

    await this.recordExternalInvocation(principal, result.agent_id, result, {
      eventType: 'external.agent.conversation.completed',
      idempotencyKey,
      scope: 'agent_conversation',
      streaming: false,
      conversationContinuation: true,
    });

    return withIdempotency(result, idempotencyKey, false);
  }

  private async performContinueChat(
    principal: ExternalApiPrincipal,
    conversationId: string,
    dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const conversation = await this.conversationsService.sendMessage(principal.user, conversationId, {
      message: dto.message,
    });

    const result = mapExternalResponse(conversation);
    void this.webhooks.notifyRunCompleted(principal, result);

    return result;
  }

  async channelContinueChat(
    principal: ExternalApiPrincipal,
    channelId: string,
    conversationId: string,
    dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    await this.rolloutGate.evaluateForApiPrincipal(principal, channelId, {
      source: 'external_channel_conversation',
      stableKey: conversationId,
      conversationId,
      streaming: false,
      conversationContinuation: true,
    });

    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('channel_conversation', principal, conversationId, idempotencyKey));
    if (cached) return withChannel(cached, channelId);

    await this.reserveExternalApiCall(principal);
    const result = await this.performContinueChat(principal, conversationId, dto);

    await this.recordChannelInvocation(principal, channelId, result, {
      eventType: 'channel.external.conversation.completed',
      idempotencyKey,
      scope: 'channel_conversation',
      streaming: false,
      conversationContinuation: true,
    });

    return withIdempotency(withChannel(result, channelId), idempotencyKey, false);
  }

  async streamChat(
    principal: ExternalApiPrincipal,
    agentId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('agent_stream', principal, agentId, idempotencyKey));
    if (cached) {
      emit('done', { type: 'done', result: cached });

      return cached;
    }

    await this.reserveExternalApiCall(principal);
    const result = await this.performStreamChat(principal, agentId, dto, emit);

    await this.recordExternalInvocation(principal, agentId, result, {
      eventType: 'external.agent.stream.completed',
      idempotencyKey,
      scope: 'agent_stream',
      streaming: true,
      conversationContinuation: false,
    });

    return withIdempotency(result, idempotencyKey, false);
  }

  private async performStreamChat(
    principal: ExternalApiPrincipal,
    agentId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    let finalConversation: ConversationDetail | null = null;

    const conversation = await this.conversationsService.streamCreate(principal.user, {
      agent_id: agentId,
      message: dto.message,
      title: dto.title,
    }, (eventName, payload) => {
      if (isConversationStreamEvent(payload)) {
        if (payload.type === 'done') {
          finalConversation = payload.conversation;
          emit(eventName, {
            type: 'done',
            result: mapExternalResponse(payload.conversation),
          });
          return;
        }
        emit(eventName, payload as ExternalAgentStreamEvent);
      }
    });

    const result = mapExternalResponse(finalConversation ?? conversation);
    void this.webhooks.notifyRunCompleted(principal, result);

    return result;
  }

  async streamChannelChat(
    principal: ExternalApiPrincipal,
    channelId: string,
    agentId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    await this.rolloutGate.evaluateForApiPrincipal(principal, channelId, {
      source: 'external_channel_stream',
      stableKey: channelStableKey(principal, dto),
      streaming: true,
      conversationContinuation: false,
    });

    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('channel_stream', principal, channelId, idempotencyKey));
    if (cached) {
      const response = withChannel(cached, channelId);
      emit('done', { type: 'done', result: response });

      return response;
    }

    await this.reserveExternalApiCall(principal);
    let finalResult: ExternalAgentChatResponse | null = null;
    const result = await this.performStreamChat(principal, agentId, dto, (eventName, payload) => {
      if (payload.type === 'done') {
        finalResult = withChannel(payload.result, channelId);
        emit(eventName, {
          ...payload,
          result: finalResult,
        });
        return;
      }

      emit(eventName, payload);
    });
    const response = finalResult ?? withChannel(result, channelId);

    await this.recordChannelInvocation(principal, channelId, response, {
      eventType: 'channel.external.stream.completed',
      idempotencyKey,
      scope: 'channel_stream',
      streaming: true,
      conversationContinuation: false,
    });

    return withIdempotency(response, idempotencyKey, false);
  }

  async streamContinueChat(
    principal: ExternalApiPrincipal,
    conversationId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('agent_conversation_stream', principal, conversationId, idempotencyKey));
    if (cached) {
      emit('done', { type: 'done', result: cached });

      return cached;
    }

    await this.reserveExternalApiCall(principal);
    const result = await this.performStreamContinueChat(principal, conversationId, dto, emit);

    await this.recordExternalInvocation(principal, result.agent_id, result, {
      eventType: 'external.agent.conversation.stream.completed',
      idempotencyKey,
      scope: 'agent_conversation_stream',
      streaming: true,
      conversationContinuation: true,
    });

    return withIdempotency(result, idempotencyKey, false);
  }

  private async performStreamContinueChat(
    principal: ExternalApiPrincipal,
    conversationId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    let finalConversation: ConversationDetail | null = null;

    const conversation = await this.conversationsService.streamMessage(principal.user, conversationId, {
      message: dto.message,
    }, (eventName, payload) => {
      if (isConversationStreamEvent(payload)) {
        if (payload.type === 'done') {
          finalConversation = payload.conversation;
          emit(eventName, {
            type: 'done',
            result: mapExternalResponse(payload.conversation),
          });
          return;
        }
        emit(eventName, payload as ExternalAgentStreamEvent);
      }
    });

    const result = mapExternalResponse(finalConversation ?? conversation);
    void this.webhooks.notifyRunCompleted(principal, result);

    return result;
  }

  async streamChannelContinueChat(
    principal: ExternalApiPrincipal,
    channelId: string,
    conversationId: string,
    dto: ExternalAgentChatDto,
    emit: (eventName: string, payload: ExternalAgentStreamEvent) => void,
  ): Promise<ExternalAgentChatResponse> {
    await this.rolloutGate.evaluateForApiPrincipal(principal, channelId, {
      source: 'external_channel_conversation_stream',
      stableKey: conversationId,
      conversationId,
      streaming: true,
      conversationContinuation: true,
    });

    const idempotencyKey = normalizeIdempotencyKey(dto.idempotency_key);
    const cached = await this.findIdempotentResult(principal, buildIdempotencyDedupeKey('channel_conversation_stream', principal, conversationId, idempotencyKey));
    if (cached) {
      const response = withChannel(cached, channelId);
      emit('done', { type: 'done', result: response });

      return response;
    }

    await this.reserveExternalApiCall(principal);
    let finalResult: ExternalAgentChatResponse | null = null;
    const result = await this.performStreamContinueChat(principal, conversationId, dto, (eventName, payload) => {
      if (payload.type === 'done') {
        finalResult = withChannel(payload.result, channelId);
        emit(eventName, {
          ...payload,
          result: finalResult,
        });
        return;
      }

      emit(eventName, payload);
    });
    const response = finalResult ?? withChannel(result, channelId);

    await this.recordChannelInvocation(principal, channelId, response, {
      eventType: 'channel.external.conversation.stream.completed',
      idempotencyKey,
      scope: 'channel_conversation_stream',
      streaming: true,
      conversationContinuation: true,
    });

    return withIdempotency(response, idempotencyKey, false);
  }

  private async recordChannelInvocation(
    principal: ExternalApiPrincipal,
    channelId: string,
    result: ExternalAgentChatResponse,
    options: {
      eventType: string;
      idempotencyKey: string | null;
      scope: string;
      streaming: boolean;
      conversationContinuation: boolean;
    },
  ) {
    const resultPayload = withIdempotency(withChannel(result, channelId), options.idempotencyKey, false);
    const event = await this.platformEvents.recordEvent({
      tenantId: principal.user.tenantId,
      departmentId: principal.user.departmentId ?? null,
      userId: principal.user.id,
      actorType: 'API_KEY',
      resourceType: 'CHANNEL',
      resourceId: channelId,
      agentId: result.agent_id,
      channelId,
      conversationId: result.conversation_id,
      runId: result.run_id,
      requestId: principal.user.requestId ?? null,
      traceId: result.trace_id ?? principal.user.traceId ?? null,
      eventSource: 'EXTERNAL_API',
      eventType: options.eventType,
      status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
      billable: true,
      summary: `渠道外部调用完成：${result.agent_name}`,
      payloadJson: {
        api_key_id: principal.key.id,
        api_key_prefix: principal.key.keyPrefix,
        idempotency_key: options.idempotencyKey,
        idempotency_scope: options.scope,
        streaming: options.streaming,
        conversation_continuation: options.conversationContinuation,
        message_id: result.message_id,
        status: result.status,
        usage: result.usage,
        result: resultPayload as unknown as Prisma.InputJsonValue,
      },
      sourceSystem: 'external_channel_api',
      sourceId: channelId,
      dedupeKey: buildIdempotencyDedupeKey(options.scope, principal, channelId, options.idempotencyKey),
    });

    await this.platformEvents.recordUsage({
      tenantId: principal.user.tenantId,
      departmentId: principal.user.departmentId ?? null,
      userId: principal.user.id,
      subjectType: 'API_KEY',
      subjectId: principal.key.id,
      resourceType: 'CHANNEL',
      resourceId: channelId,
      metricType: 'channel_external_requests',
      unit: 'request',
      quantity: 1,
      billable: true,
      costSource: result.status === 'FAILED' ? 'FAILED' : 'EXTERNAL_CHANNEL',
      traceId: result.trace_id ?? principal.user.traceId ?? null,
      requestId: principal.user.requestId ?? null,
      eventId: event.id,
      sourceSystem: 'external_channel_api',
      sourceId: result.run_id ?? result.conversation_id,
    });

    if (result.usage?.total_tokens) {
      await this.platformEvents.recordUsage({
        tenantId: principal.user.tenantId,
        departmentId: principal.user.departmentId ?? null,
        userId: principal.user.id,
        subjectType: 'API_KEY',
        subjectId: principal.key.id,
        resourceType: 'CHANNEL',
        resourceId: channelId,
        metricType: 'channel_external_tokens',
        unit: 'token',
        quantity: result.usage.total_tokens,
        amount: result.usage.cost_total ?? 0,
        billable: false,
        costSource: 'EXTERNAL_CHANNEL',
        traceId: result.trace_id ?? principal.user.traceId ?? null,
        requestId: principal.user.requestId ?? null,
        eventId: event.id,
        sourceSystem: 'external_channel_api',
        sourceId: result.run_id ?? result.conversation_id,
      });
    }
  }

  private async recordExternalInvocation(
    principal: ExternalApiPrincipal,
    agentId: string,
    result: ExternalAgentChatResponse,
    options: {
      eventType: string;
      idempotencyKey: string | null;
      scope: string;
      streaming: boolean;
      conversationContinuation: boolean;
    },
  ) {
    const resultPayload = withIdempotency(result, options.idempotencyKey, false);
    const event = await this.platformEvents.recordEvent({
      tenantId: principal.user.tenantId,
      departmentId: principal.user.departmentId ?? null,
      userId: principal.user.id,
      actorType: 'API_KEY',
      resourceType: 'AGENT',
      resourceId: agentId,
      agentId,
      conversationId: result.conversation_id,
      runId: result.run_id,
      requestId: principal.user.requestId ?? null,
      traceId: result.trace_id ?? principal.user.traceId ?? null,
      eventSource: 'EXTERNAL_API',
      eventType: options.eventType,
      status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
      billable: true,
      summary: `外部调用完成：${result.agent_name}`,
      payloadJson: {
        api_key_id: principal.key.id,
        api_key_prefix: principal.key.keyPrefix,
        idempotency_key: options.idempotencyKey,
        idempotency_scope: options.scope,
        streaming: options.streaming,
        conversation_continuation: options.conversationContinuation,
        message_id: result.message_id,
        status: result.status,
        usage: result.usage,
        result: resultPayload as unknown as Prisma.InputJsonValue,
      },
      sourceSystem: 'external_api',
      sourceId: result.run_id ?? result.conversation_id,
      dedupeKey: buildIdempotencyDedupeKey(options.scope, principal, agentId, options.idempotencyKey),
    });

    await this.platformEvents.recordUsage({
      tenantId: principal.user.tenantId,
      departmentId: principal.user.departmentId ?? null,
      userId: principal.user.id,
      subjectType: 'API_KEY',
      subjectId: principal.key.id,
      resourceType: 'AGENT',
      resourceId: agentId,
      metricType: 'external_agent_requests',
      unit: 'request',
      quantity: 1,
      billable: true,
      costSource: result.status === 'FAILED' ? 'FAILED' : 'EXTERNAL_API',
      traceId: result.trace_id ?? principal.user.traceId ?? null,
      requestId: principal.user.requestId ?? null,
      eventId: event.id,
      sourceSystem: 'external_api',
      sourceId: result.run_id ?? result.conversation_id,
    });
  }

  private async reserveExternalApiCall(principal: ExternalApiPrincipal) {
    const result = await this.billingService.enforceQuota(principal.user, {
      subject_type: 'API_KEY',
      subject_id: principal.key.id,
      metric_type: 'API_CALL',
      period: 'MONTH',
      usage_delta: 1,
    });

    if (!result.allow || result.block) {
      const status = result.action === 'BLOCK' ? HttpStatus.FORBIDDEN : HttpStatus.TOO_MANY_REQUESTS;
      throw new HttpException(result.reason || 'Billing quota exceeded', status);
    }

    await this.externalApiKeys.markUsed(principal.key.id);
  }

  private async findIdempotentResult(principal: ExternalApiPrincipal, dedupeKey: string | null): Promise<ExternalAgentChatResponse | null> {
    if (!dedupeKey) return null;

    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: principal.user.tenantId,
        dedupeKey,
        status: 'SUCCESS',
      },
      orderBy: { occurredAt: 'desc' },
    });
    const result = readExternalResult(event?.payloadJson);

    return result ? withIdempotency(result, result.idempotency_key ?? null, true) : null;
  }
}

function mapExternalResponse(conversation: ConversationDetail): ExternalAgentChatResponse {
  const assistantMessage = [...conversation.messages].reverse().find((message) => message.role === 'ASSISTANT') ?? null;
  const latestRun = conversation.runs[0] ?? null;

  if (!assistantMessage) {
    throw new BadRequestException('External chat completed without assistant message');
  }

  return {
    conversation_id: conversation.id,
    agent_id: conversation.agent_id,
    agent_name: conversation.agent_name,
    agent_code: conversation.agent_code,
    message_id: assistantMessage.id,
    run_id: latestRun?.id ?? null,
    trace_id: latestRun?.trace_id ?? null,
    status: latestRun?.status ?? null,
    answer: assistantMessage.content,
    references: assistantMessage.references,
    tool_calls: assistantMessage.tool_calls,
    usage: latestRun ? mapUsage(latestRun) : null,
    created_at: assistantMessage.created_at ?? latestRun?.created_at ?? null,
  };
}

function mapUsage(run: ConversationRunItem): ExternalAgentChatResponse['usage'] {
  return {
    prompt_tokens: run.prompt_tokens,
    completion_tokens: run.completion_tokens,
    total_tokens: run.total_tokens,
    latency_ms: run.latency_ms,
    cost_total: run.cost_total ?? null,
  };
}

function withChannel(result: ExternalAgentChatResponse, channelId: string): ExternalAgentChatResponse {
  return {
    ...result,
    channel_id: channelId,
  };
}

function withIdempotency(result: ExternalAgentChatResponse, idempotencyKey: string | null, replayed: boolean): ExternalAgentChatResponse {
  return {
    ...result,
    idempotency_key: idempotencyKey,
    idempotency_replayed: replayed,
  };
}

function normalizeIdempotencyKey(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.slice(0, 180) : null;
}

function buildIdempotencyDedupeKey(scope: string, principal: ExternalApiPrincipal, resourceId: string, idempotencyKey: string | null) {
  if (!idempotencyKey) return null;

  return ['external-idempotency', scope, principal.key.id, principal.user.tenantId, resourceId, idempotencyKey].join(':').slice(0, 180);
}

function readExternalResult(payload: Prisma.JsonValue | null | undefined): ExternalAgentChatResponse | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const result = (payload as Record<string, unknown>).result;

  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  if (typeof (result as Record<string, unknown>).conversation_id !== 'string') return null;
  if (typeof (result as Record<string, unknown>).agent_id !== 'string') return null;

  return result as ExternalAgentChatResponse;
}

function channelStableKey(principal: ExternalApiPrincipal, dto: ExternalAgentChatDto) {
  return [
    principal.key.id,
    principal.user.id,
    normalizeIdempotencyKey(dto.idempotency_key),
    dto.title?.trim(),
    dto.message.slice(0, 128),
  ].filter(Boolean).join(':');
}

function isConversationStreamEvent(value: unknown): value is ConversationStreamEvent {
  return Boolean(value && typeof value === 'object' && 'type' in value);
}
