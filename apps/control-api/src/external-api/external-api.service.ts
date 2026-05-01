import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  ConversationDetail,
  ConversationMessageItem,
  ConversationRunItem,
  ExternalAgentChatResponse,
} from '@aiaget/shared-types';

import { ConversationsService } from '../conversations/conversations.service';
import { ExternalApiKeyService, type ExternalApiPrincipal } from './external-api-key.service';
import type { ExternalAgentChatDto } from './dto/external-agent-chat.dto';

@Injectable()
export class ExternalApiService {
  constructor(
    @Inject(ConversationsService) private readonly conversationsService: ConversationsService,
    @Inject(ExternalApiKeyService) private readonly externalApiKeys: ExternalApiKeyService,
  ) {}

  async chat(principal: ExternalApiPrincipal, agentId: string, dto: ExternalAgentChatDto): Promise<ExternalAgentChatResponse> {
    const conversation = await this.conversationsService.create(principal.user, {
      agent_id: agentId,
      message: dto.message,
      title: dto.title,
    });

    await this.externalApiKeys.markUsed(principal.key.id);

    return mapExternalResponse(conversation);
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
