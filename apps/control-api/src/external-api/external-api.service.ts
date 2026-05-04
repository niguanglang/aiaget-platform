import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class ExternalApiService {
  constructor(
    @Inject(ConversationsService) private readonly conversationsService: ConversationsService,
    @Inject(ExternalApiKeyService) private readonly externalApiKeys: ExternalApiKeyService,
    @Inject(ExternalChannelRolloutGateService) private readonly rolloutGate: ExternalChannelRolloutGateService,
    @Inject(ExternalWebhookService) private readonly webhooks: ExternalWebhookService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async chat(principal: ExternalApiPrincipal, agentId: string, dto: ExternalAgentChatDto): Promise<ExternalAgentChatResponse> {
    const conversation = await this.conversationsService.create(principal.user, {
      agent_id: agentId,
      message: dto.message,
      title: dto.title,
    });

    await this.externalApiKeys.markUsed(principal.key.id);

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

    const result = await this.chat(principal, agentId, dto);

    await this.recordChannelInvocation(principal, channelId, result, {
      eventType: 'channel.external.chat.completed',
      streaming: false,
      conversationContinuation: false,
    });

    return withChannel(result, channelId);
  }

  async continueChat(
    principal: ExternalApiPrincipal,
    conversationId: string,
    dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const conversation = await this.conversationsService.sendMessage(principal.user, conversationId, {
      message: dto.message,
    });

    await this.externalApiKeys.markUsed(principal.key.id);

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

    const result = await this.continueChat(principal, conversationId, dto);

    await this.recordChannelInvocation(principal, channelId, result, {
      eventType: 'channel.external.conversation.completed',
      streaming: false,
      conversationContinuation: true,
    });

    return withChannel(result, channelId);
  }

  async streamChat(
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

    await this.externalApiKeys.markUsed(principal.key.id);

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

    let finalResult: ExternalAgentChatResponse | null = null;
    const result = await this.streamChat(principal, agentId, dto, (eventName, payload) => {
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
      streaming: true,
      conversationContinuation: false,
    });

    return response;
  }

  async streamContinueChat(
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

    await this.externalApiKeys.markUsed(principal.key.id);

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

    let finalResult: ExternalAgentChatResponse | null = null;
    const result = await this.streamContinueChat(principal, conversationId, dto, (eventName, payload) => {
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
      streaming: true,
      conversationContinuation: true,
    });

    return response;
  }

  private async recordChannelInvocation(
    principal: ExternalApiPrincipal,
    channelId: string,
    result: ExternalAgentChatResponse,
    options: {
      eventType: string;
      streaming: boolean;
      conversationContinuation: boolean;
    },
  ) {
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
      billable: false,
      summary: `渠道外部调用完成：${result.agent_name}`,
      payloadJson: {
        api_key_id: principal.key.id,
        api_key_prefix: principal.key.keyPrefix,
        streaming: options.streaming,
        conversation_continuation: options.conversationContinuation,
        message_id: result.message_id,
        status: result.status,
        usage: result.usage,
      },
      sourceSystem: 'external_channel_api',
      sourceId: channelId,
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
      billable: false,
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

function channelStableKey(principal: ExternalApiPrincipal, dto: ExternalAgentChatDto) {
  return [
    principal.key.id,
    principal.user.id,
    dto.title?.trim(),
    dto.message.slice(0, 128),
  ].filter(Boolean).join(':');
}

function isConversationStreamEvent(value: unknown): value is ConversationStreamEvent {
  return Boolean(value && typeof value === 'object' && 'type' in value);
}
