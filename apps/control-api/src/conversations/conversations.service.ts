import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ConversationDetail,
  ConversationFeedbackItem,
  ConversationListItem,
  ConversationMessageItem,
  ConversationReferenceItem,
  ConversationRunItem,
  ConversationRunStepItem,
  ConversationToolCallItem,
  PaginatedResult,
  TestToolResult,
} from '@aiaget/shared-types';

import {
  buildTraceparent,
  createChildTraceContext,
  createSpanId,
  createTraceId,
  traceHeaders,
  type TraceContext,
} from '../common/tracing/trace-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret } from '../models/model-secrets';
import {
  executeOpenAiCompatibleChat,
  streamOpenAiCompatibleChat,
  type OpenAiCompatibleResult,
  type ChatExecutionMessage,
} from '../models/openai-compatible-client';
import { ToolsService } from '../tools/tools.service';
import { requireEnv } from '../common/env';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateConversationFeedbackDto } from './dto/create-conversation-feedback.dto';
import type { ListConversationsDto } from './dto/list-conversations.dto';
import type { SendConversationMessageDto } from './dto/send-conversation-message.dto';

const RUNTIME_BASE_URL = requireEnv('RUNTIME_BASE_URL');
const AGENT_RUNTIME_EXECUTION_MODE = process.env.AGENT_RUNTIME_EXECUTION_MODE ?? 'runtime_first';
const CONTROL_API_INTERNAL_BASE_URL = requireEnv('CONTROL_API_INTERNAL_BASE_URL');
const RUNTIME_INTERNAL_TOKEN = requireEnv('RUNTIME_INTERNAL_TOKEN');

const conversationListInclude = {
  agent: true,
  user: true,
  feedback: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.ConversationInclude;

const conversationDetailInclude = {
  agent: true,
  user: true,
  messages: {
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  runs: {
    orderBy: {
      createdAt: 'desc',
    },
  },
  feedback: {
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.ConversationInclude;

type ConversationListRecord = Prisma.ConversationGetPayload<{ include: typeof conversationListInclude }>;
type ConversationDetailRecord = Prisma.ConversationGetPayload<{ include: typeof conversationDetailInclude }>;

interface RuntimeConversationRequest {
  request_id?: string | null;
  trace_id?: string | null;
  parent_span_id?: string | null;
  traceparent?: string | null;
  conversation_id: string;
  agent: RuntimeAgentSnapshot;
  agent_name: string;
  agent_code: string;
  user_message: string;
  history: Array<{ role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL'; content: string }>;
  prompt_messages: ChatExecutionMessage[];
  prompts: RuntimePromptSnapshot[];
  knowledge_bindings: RuntimeKnowledgeBindingSnapshot[];
  tools: RuntimeToolSnapshot[];
  tool_calls: RuntimeToolCallSummary[];
  references: RuntimeReferenceSummary[];
  control_api: RuntimeControlApiSnapshot;
}

interface PreparedConversationExecution {
  runtimePayload: RuntimeConversationRequest;
  toolStep: ConversationRunStepItem | null;
  referenceStep: ConversationRunStepItem | null;
  traceContext: TraceContext;
}

const promptTemplateSelect = {
  id: true,
  name: true,
  code: true,
  type: true,
  content: true,
  variables: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    select: {
      name: true,
      defaultValue: true,
    },
  },
} satisfies Prisma.PromptTemplateSelect;

interface RuntimeAgentSnapshot {
  tenant_id: string;
  user_id: string;
  agent_id: string;
  name: string;
  code: string;
  status: string;
  version: number;
  temperature: number;
  max_context_tokens: number;
  enable_stream: boolean;
  enable_log: boolean;
}

interface RuntimePromptSnapshot {
  binding_id: string;
  prompt_id: string;
  prompt_type: string;
  role: ChatExecutionMessage['role'];
  template_name: string;
  template_code: string;
  template_type: string;
  content: string;
  variables: Array<{ name: string; default_value: string | null }>;
}

interface RuntimeKnowledgeBindingSnapshot {
  binding_id: string;
  knowledge_id: string;
  knowledge_name: string;
  knowledge_code: string;
  weight: number;
  recall_top_k: number;
}

interface RuntimeToolSnapshot {
  binding_id: string;
  tool_id: string;
  tool_name: string;
  tool_code: string;
  tool_type: string;
  method: string;
  risk_level: string;
  require_approval: boolean;
  binding_require_approval: boolean;
}

interface RuntimeControlApiSnapshot {
  base_url: string;
  internal_token: string;
}

interface ModelExecutionContext {
  providerId: string;
  modelConfigId: string;
  providerType: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  inputPrice: number;
  outputPrice: number;
  providerKeyId: string;
}

interface RuntimeToolCallSummary {
  tool_id: string;
  tool_name: string;
  tool_code: string;
  status: 'SUCCESS' | 'FAILED' | 'APPROVAL_REQUIRED' | 'REJECTED';
  approval_request_id?: string | null;
  latency_ms: number;
  response_status: number | null;
  output_preview: string | null;
  error_message: string | null;
}

interface RuntimeReferenceSummary {
  id: string;
  title: string;
  snippet: string;
  score: number | null;
  source_type: string | null;
}

interface RuntimeConversationResponse {
  trace_id?: string | null;
  status?: 'SUCCESS' | 'FAILED';
  assistant_message: string;
  request_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  steps: Array<{
    id: string;
    type: 'prompt' | 'tool' | 'knowledge' | 'response';
    title: string;
    status: 'done' | 'failed' | 'skipped';
    summary: string;
    trace_id?: string | null;
    span_id?: string | null;
    parent_span_id?: string | null;
  }>;
  references: RuntimeReferenceSummary[];
  tool_calls: RuntimeToolCallSummary[];
  model_call?: RuntimeModelCallSummary | null;
  error_message?: string | null;
}

interface RuntimeModelConfig {
  provider_type: string;
  base_url: string;
  api_key: string;
  model: string;
  temperature: number;
  input_price: number;
  output_price: number;
}

interface RuntimeModelCallSummary {
  trace_id: string;
  status: 'SUCCESS' | 'FAILED';
  request_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  request_summary: Record<string, unknown>;
  response_summary: Record<string, unknown>;
  error_message: string | null;
}

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService,
    @Inject(ToolsService) private readonly toolsService: ToolsService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListConversationsDto,
  ): Promise<PaginatedResult<ConversationListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.ConversationWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.agent_id) {
      where.agentId = query.agent_id;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { lastMessagePreview: { contains: keyword, mode: 'insensitive' } },
        { agent: { name: { contains: keyword, mode: 'insensitive' } } },
        { user: { email: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.ConversationWhereInput>(currentUser, 'CONVERSATION');
    mergeDataScopeWhere(where, dataScope.where);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: conversationListInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapConversationListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateConversationDto): Promise<ConversationDetail> {
    const agent = await this.findConversationAgent(currentUser.tenantId, dto.agent_id);
    const trimmedMessage = dto.message.trim();
    const now = new Date();
    const conversation = await this.prisma.conversation.create({
      data: {
        tenantId: currentUser.tenantId,
        agentId: agent.id,
        userId: currentUser.id,
        title: dto.title?.trim() || createConversationTitle(trimmedMessage),
        status: 'ACTIVE',
        messageCount: 1,
        lastMessagePreview: createPreview(trimmedMessage),
        lastMessageAt: now,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
        messages: {
          create: {
            tenantId: currentUser.tenantId,
            role: 'USER',
            content: trimmedMessage,
            createdBy: currentUser.id,
          },
        },
      },
      include: conversationDetailInclude,
    });

    await this.generateAssistantTurn(currentUser, conversation.id, agent, trimmedMessage);

    return this.get(currentUser, conversation.id);
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<ConversationDetail> {
    const conversation = await this.findConversation(currentUser.tenantId, id);
    return this.mapConversationDetail(conversation);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureConversation(currentUser.tenantId, id);

    await this.prisma.conversation.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async sendMessage(
    currentUser: AuthenticatedUser,
    id: string,
    dto: SendConversationMessageDto,
  ): Promise<ConversationDetail> {
    const conversation = await this.findConversation(currentUser.tenantId, id);
    const agent = await this.findConversationAgent(currentUser.tenantId, conversation.agentId);
    const trimmedMessage = dto.message.trim();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          tenantId: currentUser.tenantId,
          conversationId: id,
          role: 'USER',
          content: trimmedMessage,
          createdBy: currentUser.id,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id,
        },
        data: {
          messageCount: {
            increment: 1,
          },
          lastMessagePreview: createPreview(trimmedMessage),
          lastMessageAt: now,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    await this.generateAssistantTurn(currentUser, id, agent, trimmedMessage);

    return this.get(currentUser, id);
  }

  async streamMessage(
    currentUser: AuthenticatedUser,
    id: string,
    dto: SendConversationMessageDto,
    emit: (eventName: string, payload: unknown) => void,
  ): Promise<void> {
    const conversation = await this.findConversation(currentUser.tenantId, id);
    const agent = await this.findConversationAgent(currentUser.tenantId, conversation.agentId);
    const trimmedMessage = dto.message.trim();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          tenantId: currentUser.tenantId,
          conversationId: id,
          role: 'USER',
          content: trimmedMessage,
          createdBy: currentUser.id,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id,
        },
        data: {
          messageCount: {
            increment: 1,
          },
          lastMessagePreview: createPreview(trimmedMessage),
          lastMessageAt: now,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    const preparation = await this.buildRuntimeRequest(currentUser, id, agent, trimmedMessage);
    const modelContext = await this.resolveModelExecutionContext(currentUser.tenantId, agent);
    let finalResponse: RuntimeConversationResponse | null = null;

    if (shouldExecuteViaRuntime()) {
      try {
        await this.requestRuntimeStream(preparation, modelContext, (eventName, payload) => {
          if (eventName === 'done') {
            finalResponse = payload as RuntimeConversationResponse;
            return;
          }

          emit(eventName, payload);
        });
      } catch (error) {
        if (!modelContext || AGENT_RUNTIME_EXECUTION_MODE === 'runtime_only') {
          throw error;
        }

        finalResponse = await this.streamControlModelFallback(currentUser, modelContext, preparation, emit);
      }
    } else if (modelContext) {
      emit('start', {
        type: 'start',
        trace_id: preparation.traceContext.traceId,
        request_model: modelContext.model,
        steps: buildModelStartSteps(preparation.runtimePayload, {
          toolStep: preparation.toolStep,
          referenceStep: preparation.referenceStep,
          traceContext: preparation.traceContext,
        }),
        references: preparation.runtimePayload.references,
        tool_calls: preparation.runtimePayload.tool_calls,
      });

      finalResponse = await this.requestModelStream(currentUser, modelContext, preparation, (delta) => {
        emit('delta', {
          type: 'delta',
          delta,
        });
      });
    }

    if (!finalResponse) {
      throw new BadRequestException('Runtime stream completed without final payload');
    }

    if (modelContext) {
      await this.writeRuntimeModelCallLog(currentUser, modelContext, finalResponse);
    }
    await this.persistAssistantTurn(currentUser, id, agent, finalResponse);
    const persistedConversation = await this.get(currentUser, id);

    emit('done', {
      type: 'done',
      conversation: persistedConversation,
    });
  }

  async createFeedback(
    currentUser: AuthenticatedUser,
    id: string,
    dto: CreateConversationFeedbackDto,
  ): Promise<ConversationFeedbackItem> {
    await this.ensureConversation(currentUser.tenantId, id);

    if (dto.run_id) {
      await this.ensureRun(currentUser.tenantId, id, dto.run_id);
    }

    const feedback = await this.prisma.conversationFeedback.create({
      data: {
        tenantId: currentUser.tenantId,
        conversationId: id,
        runId: dto.run_id ?? null,
        rating: dto.rating,
        comment: nullableText(dto.comment),
        createdBy: currentUser.id,
      },
      include: {
        author: true,
      },
    });

    return this.mapFeedback(feedback);
  }

  private async generateAssistantTurn(
    currentUser: AuthenticatedUser,
    conversationId: string,
    agent: AgentConversationRecord,
    userMessage: string,
  ) {
    const preparation = await this.buildRuntimeRequest(currentUser, conversationId, agent, userMessage);
    const modelContext = await this.resolveModelExecutionContext(currentUser.tenantId, agent);
    const runtimeResponse = await this.executeAgentTurn(currentUser, modelContext, preparation);
    await this.persistAssistantTurn(currentUser, conversationId, agent, runtimeResponse);
  }

  private async buildRuntimeRequest(
    currentUser: AuthenticatedUser,
    conversationId: string,
    agent: AgentConversationRecord,
    userMessage: string,
  ): Promise<PreparedConversationExecution> {
    const traceContext = resolveUserTraceContext(currentUser);
    const historyMessages = await this.prisma.conversationMessage.findMany({
      where: {
        tenantId: currentUser.tenantId,
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 12,
    });

    const [prompts, knowledgeBindings, tools] = await Promise.all([
      this.resolvePromptSnapshots(currentUser.tenantId, agent),
      this.resolveKnowledgeBindingSnapshots(currentUser.tenantId, agent),
      this.resolveToolSnapshots(currentUser.tenantId, agent),
    ]);
    const shouldPrepareInControl = AGENT_RUNTIME_EXECUTION_MODE === 'control_first';
    let referenceResult: { references: RuntimeReferenceSummary[]; step: ConversationRunStepItem | null } = {
      references: [],
      step: null,
    };
    let promptMessages: ChatExecutionMessage[] = [];
    if (shouldPrepareInControl) {
      [referenceResult, promptMessages] = await Promise.all([
        this.resolveReferences(currentUser, agent, userMessage, traceContext),
        this.resolvePromptMessages(currentUser.tenantId, agent.code),
      ]);
    }
    const toolResult = shouldPrepareInControl
      ? await this.resolveToolCalls(currentUser, conversationId, agent, userMessage, traceContext)
      : { toolCalls: [], step: null };

    return {
      runtimePayload: {
        request_id: traceContext.requestId ?? null,
        trace_id: traceContext.traceId,
        parent_span_id: traceContext.spanId,
        traceparent: traceContext.traceparent,
        conversation_id: conversationId,
        agent: {
          tenant_id: currentUser.tenantId,
          user_id: currentUser.id,
          agent_id: agent.id,
          name: agent.name,
          code: agent.code,
          status: agent.status,
          version: agent.version,
          temperature: Number(agent.temperature),
          max_context_tokens: agent.maxContextTokens,
          enable_stream: agent.enableStream,
          enable_log: agent.enableLog,
        },
        agent_name: agent.name,
        agent_code: agent.code,
        user_message: userMessage,
        history: historyMessages.map((message) => ({
          role: message.role as RuntimeConversationRequest['history'][number]['role'],
          content: message.content,
        })),
        prompt_messages: promptMessages,
        prompts,
        knowledge_bindings: knowledgeBindings,
        tools,
        tool_calls: toolResult.toolCalls,
        references: referenceResult.references,
        control_api: {
          base_url: CONTROL_API_INTERNAL_BASE_URL,
          internal_token: RUNTIME_INTERNAL_TOKEN,
        },
      },
      toolStep: toolResult.step,
      referenceStep: referenceResult.step,
      traceContext,
    };
  }

  private async resolveReferences(
    currentUser: AuthenticatedUser,
    agent: AgentConversationRecord,
    userMessage: string,
    traceContext: TraceContext,
  ): Promise<{ references: RuntimeReferenceSummary[]; step: ConversationRunStepItem | null }> {
    const hasKnowledgeBinding = agent.knowledgeBindings.some((binding) => binding.deletedAt === null);
    if (!hasKnowledgeBinding) {
      return {
        references: [],
        step: null,
      };
    }

    const retrievalSpan = createChildTraceContext(traceContext);
    const retrievalResult = await this.knowledgeService.retrieveAgentReferences(currentUser, agent.id, userMessage, retrievalSpan);
    const references = retrievalResult.references.map((reference) => ({
      id: reference.id,
      title: reference.title,
      snippet: reference.snippet,
      score: reference.score,
      source_type: reference.source_type,
    }));

    return {
      references,
      step: references.length > 0
        ? {
            id: 'knowledge',
            type: 'knowledge',
            title: '整理引用上下文',
            status: 'done',
            summary: `已命中 ${references.length} 条引用线索。`,
            trace_id: retrievalSpan.traceId,
            span_id: retrievalSpan.spanId,
            parent_span_id: retrievalSpan.parentSpanId,
            retrieval_mode: retrievalResult.mode,
            latency_ms: retrievalResult.latency_ms,
            cost_total: retrievalResult.cost_total,
            item_count: references.length,
          }
        : null,
    };
  }

  private async resolvePromptSnapshots(
    tenantId: string,
    agent: AgentConversationRecord,
  ): Promise<RuntimePromptSnapshot[]> {
    const activeBindings = agent.promptBindings.filter((binding) => binding.deletedAt === null);
    if (activeBindings.length === 0) {
      return [];
    }

    const promptIds = activeBindings.map((binding) => binding.promptId);
    const templates = await this.prisma.promptTemplate.findMany({
      where: {
        tenantId,
        id: {
          in: promptIds,
        },
        deletedAt: null,
      },
      select: promptTemplateSelect,
    });
    const templateMap = new Map(templates.map((template) => [template.id, template]));

    return activeBindings.flatMap((binding) => {
      const template = templateMap.get(binding.promptId);
      if (!template) {
        return [];
      }

      return [{
        binding_id: binding.id,
        prompt_id: binding.promptId,
        prompt_type: binding.promptType,
        role: normalizeChatRole(binding.promptType),
        template_name: template.name,
        template_code: template.code,
        template_type: template.type,
        content: template.content,
        variables: template.variables.map((variable) => ({
          name: variable.name,
          default_value: variable.defaultValue,
        })),
      }];
    });
  }

  private async resolveKnowledgeBindingSnapshots(
    tenantId: string,
    agent: AgentConversationRecord,
  ): Promise<RuntimeKnowledgeBindingSnapshot[]> {
    const activeBindings = agent.knowledgeBindings.filter((binding) => binding.deletedAt === null);
    if (activeBindings.length === 0) {
      return [];
    }

    const knowledgeBases = await this.prisma.knowledgeBase.findMany({
      where: {
        tenantId,
        id: {
          in: activeBindings.map((binding) => binding.knowledgeId),
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
    const knowledgeMap = new Map(knowledgeBases.map((knowledgeBase) => [knowledgeBase.id, knowledgeBase]));

    return activeBindings.flatMap((binding) => {
      const knowledgeBase = knowledgeMap.get(binding.knowledgeId);
      if (!knowledgeBase) {
        return [];
      }

      return [{
        binding_id: binding.id,
        knowledge_id: binding.knowledgeId,
        knowledge_name: knowledgeBase.name,
        knowledge_code: knowledgeBase.code,
        weight: binding.weight,
        recall_top_k: binding.recallTopK,
      }];
    });
  }

  private async resolveToolSnapshots(
    tenantId: string,
    agent: AgentConversationRecord,
  ): Promise<RuntimeToolSnapshot[]> {
    const activeBindings = agent.toolBindings.filter((binding) => binding.deletedAt === null);
    if (activeBindings.length === 0) {
      return [];
    }

    const tools = await this.prisma.tool.findMany({
      where: {
        tenantId,
        id: {
          in: activeBindings.map((binding) => binding.toolId),
        },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        code: true,
        toolType: true,
        method: true,
        riskLevel: true,
        requireApproval: true,
      },
    });
    const toolMap = new Map(tools.map((tool) => [tool.id, tool]));

    return activeBindings.flatMap((binding) => {
      const tool = toolMap.get(binding.toolId);
      if (!tool) {
        return [];
      }

      return [{
        binding_id: binding.id,
        tool_id: binding.toolId,
        tool_name: tool.name,
        tool_code: tool.code,
        tool_type: tool.toolType,
        method: tool.method,
        risk_level: tool.riskLevel,
        require_approval: tool.requireApproval,
        binding_require_approval: binding.requireApproval,
      }];
    });
  }

  private async resolveModelExecutionContext(
    tenantId: string,
    agent: AgentConversationRecord,
  ): Promise<ModelExecutionContext | null> {
    const boundModelId = agent.modelBindings.find((binding) => binding.deletedAt === null)?.modelId ?? null;

    const model = await this.prisma.modelConfig.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(boundModelId ? { id: boundModelId } : { isDefault: true }),
      },
      include: {
        provider: {
          include: {
            apiKeys: {
              where: {
                deletedAt: null,
                status: 'ACTIVE',
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
      orderBy: boundModelId
        ? undefined
        : [
            { isDefault: 'desc' },
            { updatedAt: 'desc' },
          ],
    });

    if (!model) {
      return null;
    }

    const activeKey = model.provider.apiKeys[0] ?? null;
    if (!activeKey) {
      return null;
    }

    return {
      providerId: model.providerId,
      modelConfigId: model.id,
      providerType: model.provider.providerType,
      baseUrl: model.provider.baseUrl,
      apiKey: decryptSecret(activeKey.encryptedKey),
      model: model.model,
      temperature: Number(agent.temperature),
      inputPrice: Number(model.inputPrice),
      outputPrice: Number(model.outputPrice),
      providerKeyId: activeKey.id,
    };
  }

  private async requestModelResponse(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext,
    preparation: PreparedConversationExecution,
  ): Promise<RuntimeConversationResponse> {
    const payload = preparation.runtimePayload;
    if (modelContext.providerType !== 'OPENAI_COMPATIBLE') {
      return buildProviderFailureResponse(
        payload,
        modelContext.model,
        '当前仅支持 OPENAI_COMPATIBLE 模型供应商参与会话执行。',
        preparation,
      );
    }

    const messages = await this.buildModelMessages(currentUser.tenantId, payload);
    const execution = await executeOpenAiCompatibleChat({
      apiKey: modelContext.apiKey,
      baseUrl: modelContext.baseUrl,
      model: modelContext.model,
      temperature: modelContext.temperature,
      messages,
      traceId: preparation.traceContext.traceId,
      traceparent: createChildTraceContext(preparation.traceContext).traceparent,
    });

    await this.writeModelCallLog(currentUser, modelContext, execution);

    if (execution.errorMessage) {
      return buildProviderFailureResponse(payload, execution.requestModel, execution.errorMessage, preparation);
    }

    return buildProviderSuccessResponse(payload, execution, modelContext, preparation);
  }

  private async requestModelStream(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext,
    preparation: PreparedConversationExecution,
    onDelta: (delta: string) => void,
  ): Promise<RuntimeConversationResponse> {
    const payload = preparation.runtimePayload;
    if (modelContext.providerType !== 'OPENAI_COMPATIBLE') {
      return buildProviderFailureResponse(
        payload,
        modelContext.model,
        '当前仅支持 OPENAI_COMPATIBLE 模型供应商参与会话执行。',
        preparation,
      );
    }

    const messages = await this.buildModelMessages(currentUser.tenantId, payload);
    const execution = await streamOpenAiCompatibleChat({
      apiKey: modelContext.apiKey,
      baseUrl: modelContext.baseUrl,
      model: modelContext.model,
      temperature: modelContext.temperature,
      messages,
      traceId: preparation.traceContext.traceId,
      traceparent: createChildTraceContext(preparation.traceContext).traceparent,
    }, {
      onDelta,
    });

    await this.writeModelCallLog(currentUser, modelContext, execution);

    if (execution.errorMessage) {
      return buildProviderFailureResponse(payload, execution.requestModel, execution.errorMessage, preparation);
    }

    return buildProviderSuccessResponse(payload, execution, modelContext, preparation);
  }

  private async executeAgentTurn(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext | null,
    preparation: PreparedConversationExecution,
  ): Promise<RuntimeConversationResponse> {
    if (shouldExecuteViaRuntime()) {
      try {
        const runtimeResponse = await this.requestRuntimeResponse(preparation, modelContext);
        if (modelContext) {
          await this.writeRuntimeModelCallLog(currentUser, modelContext, runtimeResponse);
        }

        return runtimeResponse;
      } catch (error) {
        if (!modelContext || AGENT_RUNTIME_EXECUTION_MODE === 'runtime_only') {
          throw error;
        }
      }
    }

    return modelContext
      ? this.requestModelResponse(currentUser, modelContext, preparation)
      : this.requestRuntimeResponse(preparation, null);
  }

  private async streamControlModelFallback(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext,
    preparation: PreparedConversationExecution,
    emit: (eventName: string, payload: unknown) => void,
  ): Promise<RuntimeConversationResponse> {
    emit('start', {
      type: 'start',
      trace_id: preparation.traceContext.traceId,
      request_model: modelContext.model,
      steps: buildModelStartSteps(preparation.runtimePayload, {
        toolStep: preparation.toolStep,
        referenceStep: preparation.referenceStep,
        traceContext: preparation.traceContext,
      }),
      references: preparation.runtimePayload.references,
      tool_calls: preparation.runtimePayload.tool_calls,
    });

    return this.requestModelStream(currentUser, modelContext, preparation, (delta) => {
      emit('delta', {
        type: 'delta',
        delta,
      });
    });
  }

  private async buildModelMessages(
    tenantId: string,
    payload: RuntimeConversationRequest,
  ): Promise<ChatExecutionMessage[]> {
    const promptContents = payload.prompt_messages.length > 0
      ? payload.prompt_messages
      : await this.resolvePromptMessages(tenantId, payload.agent_code);
    const messages: ChatExecutionMessage[] = [
      {
        role: 'system',
        content: `你是企业智能体 ${payload.agent_name}（${payload.agent_code}）。请始终用中文回答，并保持专业、准确、简洁。`,
      },
      ...promptContents,
      ...payload.history.map((message) => ({
        role: normalizeChatRole(message.role),
        content: message.content,
      })),
    ];

    if (payload.tool_calls.length > 0) {
      messages.push({
        role: 'system',
        content: `最近工具调用摘要：${payload.tool_calls
          .map((toolCall) => `${toolCall.tool_name} ${toolCall.status} ${toolCall.output_preview ?? toolCall.error_message ?? ''}`.trim())
          .join('；')}`,
      });
    }

    if (payload.references.length > 0) {
      messages.push({
        role: 'system',
        content: `参考上下文：${payload.references
          .map((reference) => `《${reference.title}》${reference.snippet}`)
          .join('；')}`,
      });
    }

    return messages;
  }

  private async resolvePromptMessages(
    tenantId: string,
    agentCode: string,
  ): Promise<ChatExecutionMessage[]> {
    const agent = await this.prisma.agent.findFirst({
      where: {
        tenantId,
        code: agentCode,
        deletedAt: null,
      },
      include: {
        promptBindings: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!agent || agent.promptBindings.length === 0) {
      return [];
    }

    const promptIds = agent.promptBindings.map((binding) => binding.promptId);
    const templates = await this.prisma.promptTemplate.findMany({
      where: {
        tenantId,
        id: {
          in: promptIds,
        },
        deletedAt: null,
      },
      select: promptTemplateSelect,
    });
    const templateMap = new Map(templates.map((template) => [template.id, template]));

    return agent.promptBindings.flatMap((binding) => {
      const template = templateMap.get(binding.promptId);
      if (!template) {
        return [];
      }

      return [{
        role: normalizeChatRole(binding.promptType),
        content: template.content,
      }];
    });
  }

  private async writeModelCallLog(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext,
    execution: OpenAiCompatibleResult,
  ) {
    const inputCost = (execution.promptTokens / 1000) * modelContext.inputPrice;
    const outputCost = (execution.completionTokens / 1000) * modelContext.outputPrice;
    const totalCost = inputCost + outputCost;

    await this.prisma.modelCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId: modelContext.providerId,
        modelConfigId: modelContext.modelConfigId,
        traceId: execution.traceId,
        requestModel: execution.requestModel,
        status: execution.errorMessage ? 'FAILED' : 'SUCCESS',
        promptTokens: execution.promptTokens,
        completionTokens: execution.completionTokens,
        totalTokens: execution.totalTokens,
        inputCost,
        outputCost,
        totalCost,
        latencyMs: execution.latencyMs,
        requestSummary: execution.requestSummary as unknown as Prisma.InputJsonValue,
        responseSummary: execution.responseSummary as unknown as Prisma.InputJsonValue,
        errorMessage: execution.errorMessage,
      },
    });

    await this.prisma.modelApiKey.update({
      where: {
        id: modelContext.providerKeyId,
      },
      data: {
        lastUsedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });
  }

  private async persistAssistantTurn(
    currentUser: AuthenticatedUser,
    conversationId: string,
    agent: AgentConversationRecord,
    runtimeResponse: RuntimeConversationResponse,
  ) {
    const now = new Date();
    const runStatus = runtimeResponse.status ?? 'SUCCESS';
    const runRecord = await this.prisma.conversationRun.create({
      data: {
        tenantId: currentUser.tenantId,
        conversationId,
        agentId: agent.id,
        status: runStatus,
        requestModel: runtimeResponse.request_model,
        promptTokens: runtimeResponse.prompt_tokens,
        completionTokens: runtimeResponse.completion_tokens,
        totalTokens: runtimeResponse.total_tokens,
        latencyMs: runtimeResponse.latency_ms,
        steps: runtimeResponse.steps as unknown as Prisma.InputJsonValue,
        errorMessage: runtimeResponse.error_message ?? null,
        startedAt: now,
        endedAt: now,
        createdBy: currentUser.id,
      },
    });

    await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          tenantId: currentUser.tenantId,
          conversationId,
          runId: runRecord.id,
          role: 'ASSISTANT',
          content: runtimeResponse.assistant_message,
          references: runtimeResponse.references as unknown as Prisma.InputJsonValue,
          toolCalls: runtimeResponse.tool_calls as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          messageCount: {
            increment: 1,
          },
          lastMessagePreview: createPreview(runtimeResponse.assistant_message),
          lastMessageAt: now,
          lastRunStatus: runStatus,
          updatedBy: currentUser.id,
        },
      }),
    ]);
  }

  private async requestRuntimeResponse(
    preparation: PreparedConversationExecution,
    modelContext: ModelExecutionContext | null,
  ): Promise<RuntimeConversationResponse> {
    const runtimeTrace = createChildTraceContext(preparation.traceContext);
    const payload = buildRuntimeExecutionPayload(preparation.runtimePayload, modelContext, runtimeTrace);
    const url = new URL('/runtime/conversations/respond', RUNTIME_BASE_URL);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-request-id': preparation.traceContext.requestId ?? '',
        ...traceHeaders(runtimeTrace),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new BadRequestException(`Runtime responded with HTTP ${response.status}`);
    }

    const runtimeResponse = (await response.json()) as RuntimeConversationResponse;
    return enrichRuntimeResponse(runtimeResponse, preparation);
  }

  private async requestRuntimeStream(
    preparation: PreparedConversationExecution,
    modelContext: ModelExecutionContext | null,
    onEvent: (eventName: string, payload: unknown) => void,
  ): Promise<void> {
    const runtimeTrace = createChildTraceContext(preparation.traceContext);
    const payload = buildRuntimeExecutionPayload(preparation.runtimePayload, modelContext, runtimeTrace);
    const url = new URL('/runtime/conversations/respond-stream', RUNTIME_BASE_URL);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'content-type': 'application/json',
        'x-request-id': preparation.traceContext.requestId ?? '',
        ...traceHeaders(runtimeTrace),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new BadRequestException(`Runtime stream responded with HTTP ${response.status}`);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const rawEvent = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        if (rawEvent) {
          const parsed = parseSseEvent(rawEvent);
          if (parsed) {
            onEvent(
              parsed.event,
              parsed.event === 'done'
                ? enrichRuntimeResponse(parsed.payload as RuntimeConversationResponse, preparation)
                : parsed.payload,
            );
          }
        }

        boundary = buffer.indexOf('\n\n');
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const parsed = parseSseEvent(tail);
      if (parsed) {
        onEvent(
          parsed.event,
          parsed.event === 'done'
            ? enrichRuntimeResponse(parsed.payload as RuntimeConversationResponse, preparation)
            : parsed.payload,
        );
      }
    }
  }

  private async writeRuntimeModelCallLog(
    currentUser: AuthenticatedUser,
    modelContext: ModelExecutionContext,
    runtimeResponse: RuntimeConversationResponse,
  ) {
    const modelCall = runtimeResponse.model_call;
    if (!modelCall) {
      return;
    }

    const inputCost = (modelCall.prompt_tokens / 1000) * modelContext.inputPrice;
    const outputCost = (modelCall.completion_tokens / 1000) * modelContext.outputPrice;
    const totalCost = inputCost + outputCost;

    await this.prisma.modelCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId: modelContext.providerId,
        modelConfigId: modelContext.modelConfigId,
        traceId: modelCall.trace_id,
        requestModel: modelCall.request_model,
        status: modelCall.status,
        promptTokens: modelCall.prompt_tokens,
        completionTokens: modelCall.completion_tokens,
        totalTokens: modelCall.total_tokens,
        inputCost,
        outputCost,
        totalCost,
        latencyMs: modelCall.latency_ms,
        requestSummary: modelCall.request_summary as unknown as Prisma.InputJsonValue,
        responseSummary: modelCall.response_summary as unknown as Prisma.InputJsonValue,
        errorMessage: modelCall.error_message,
      },
    });

    await this.prisma.modelApiKey.update({
      where: {
        id: modelContext.providerKeyId,
      },
      data: {
        lastUsedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });
  }

  private async resolveToolCalls(
    currentUser: AuthenticatedUser,
    conversationId: string,
    agent: AgentConversationRecord,
    userMessage: string,
    traceContext: TraceContext,
  ): Promise<{ toolCalls: RuntimeToolCallSummary[]; step: ConversationRunStepItem | null }> {
    if (!shouldTriggerHealthTool(userMessage)) {
      return {
        toolCalls: [],
        step: null,
      };
    }

    const firstBinding = agent.toolBindings.find((binding) => binding.deletedAt === null);
    if (!firstBinding) {
      return {
        toolCalls: [],
        step: null,
      };
    }

    const tool = await this.prisma.tool.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: firstBinding.toolId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!tool) {
      return {
        toolCalls: [],
        step: null,
      };
    }

    const toolSpan = createChildTraceContext(traceContext);
    const result = await this.toolsService.execute(currentUser, tool.id, {}, {
      triggerSource: 'RUNTIME',
      conversationId,
      agentId: agent.id,
      traceContext: toolSpan,
      requireApproval: firstBinding.requireApproval,
    });
    const toolCall = mapToolCallSummary(tool.id, tool.name, tool.code, result);
    return {
      toolCalls: [toolCall],
      step: {
        id: 'tool',
        type: 'tool',
        title: '执行工具检查',
        status: toolCall.status === 'SUCCESS' ? 'done' : toolCall.status === 'FAILED' ? 'failed' : 'skipped',
        summary:
          toolCall.status === 'SUCCESS'
            ? `工具 ${toolCall.tool_name} 调用成功。`
            : `工具 ${toolCall.tool_name} 返回 ${toolCall.status}。`,
        trace_id: toolSpan.traceId,
        span_id: toolSpan.spanId,
        parent_span_id: toolSpan.parentSpanId,
        tool_name: toolCall.tool_name,
        response_status: toolCall.response_status,
        latency_ms: toolCall.latency_ms,
        cost_total: 0,
      },
    };
  }

  private async ensureConversation(tenantId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
  }

  private async ensureRun(tenantId: string, conversationId: string, runId: string) {
    const run = await this.prisma.conversationRun.findFirst({
      where: {
        tenantId,
        conversationId,
        id: runId,
      },
      select: {
        id: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Conversation run not found');
    }
  }

  private async findConversation(tenantId: string, id: string): Promise<ConversationDetailRecord> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: conversationDetailInclude,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async findConversationAgent(tenantId: string, id: string): Promise<AgentConversationRecord> {
    const agent = await this.prisma.agent.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: {
        toolBindings: true,
        modelBindings: true,
        promptBindings: true,
        knowledgeBindings: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  private mapConversationListItem(conversation: ConversationListRecord): ConversationListItem {
    return {
      id: conversation.id,
      tenant_id: conversation.tenantId,
      agent_id: conversation.agentId,
      agent_name: conversation.agent.name,
      agent_code: conversation.agent.code,
      user: conversation.user ? this.mapUserSummary(conversation.user) : null,
      title: conversation.title,
      status: conversation.status as ConversationListItem['status'],
      message_count: conversation.messageCount,
      last_message_preview: conversation.lastMessagePreview,
      last_message_at: conversation.lastMessageAt?.toISOString() ?? null,
      last_run_status: (conversation.lastRunStatus as ConversationListItem['last_run_status']) ?? null,
      feedback_count: conversation.feedback.length,
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
    };
  }

  private mapConversationDetail(conversation: ConversationDetailRecord): ConversationDetail {
    return {
      ...this.mapConversationListItem(conversation),
      messages: conversation.messages.map((message) => this.mapMessage(message)),
      runs: conversation.runs.map((run) => this.mapRun(run)),
      feedback: conversation.feedback.map((feedback) => this.mapFeedback(feedback)),
    };
  }

  private mapMessage(
    message: Prisma.ConversationMessageGetPayload<{
      include: {
        author: true;
      };
    }>,
  ): ConversationMessageItem {
    return {
      id: message.id,
      role: message.role as ConversationMessageItem['role'],
      content: message.content,
      references: parseReferenceItems(message.references),
      tool_calls: parseToolCallItems(message.toolCalls),
      created_at: message.createdAt.toISOString(),
      created_by: message.author ? this.mapUserSummary(message.author) : null,
    };
  }

  private mapRun(run: Prisma.ConversationRunGetPayload<object>): ConversationRunItem {
    const steps = parseRunSteps(run.steps);
    return {
      id: run.id,
      trace_id: extractTraceIdFromRunSteps(steps),
      status: run.status as ConversationRunItem['status'],
      request_model: run.requestModel,
      prompt_tokens: run.promptTokens,
      completion_tokens: run.completionTokens,
      total_tokens: run.totalTokens,
      latency_ms: run.latencyMs,
      cost_total: extractRunCostTotal(steps),
      steps,
      error_message: run.errorMessage,
      started_at: run.startedAt?.toISOString() ?? null,
      ended_at: run.endedAt?.toISOString() ?? null,
      created_at: run.createdAt.toISOString(),
    };
  }

  private mapFeedback(
    feedback: Prisma.ConversationFeedbackGetPayload<{
      include: {
        author: true;
      };
    }>,
  ): ConversationFeedbackItem {
    return {
      id: feedback.id,
      run_id: feedback.runId,
      rating: feedback.rating,
      comment: feedback.comment,
      created_at: feedback.createdAt.toISOString(),
      created_by: feedback.author ? this.mapUserSummary(feedback.author) : null,
    };
  }

  private mapUserSummary(user: { id: string; name: string; email: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

type AgentConversationRecord = Prisma.AgentGetPayload<{
  include: {
    toolBindings: true;
    modelBindings: true;
    promptBindings: true;
    knowledgeBindings: true;
  };
}>;

function shouldTriggerHealthTool(message: string) {
  return /健康|health|状态|可用|检查/.test(message.toLowerCase());
}

function shouldExecuteViaRuntime() {
  return AGENT_RUNTIME_EXECUTION_MODE !== 'control_first';
}

function buildRuntimeExecutionPayload(
  payload: RuntimeConversationRequest,
  modelContext: ModelExecutionContext | null,
  traceContext?: TraceContext,
): RuntimeConversationRequest & { model_config: RuntimeModelConfig | null } {
  return {
    ...payload,
    request_id: traceContext?.requestId ?? payload.request_id ?? null,
    trace_id: traceContext?.traceId ?? payload.trace_id ?? null,
    parent_span_id: traceContext?.parentSpanId ?? payload.parent_span_id ?? null,
    traceparent: traceContext?.traceparent ?? payload.traceparent ?? null,
    model_config: modelContext
      ? {
          provider_type: modelContext.providerType,
          base_url: modelContext.baseUrl,
          api_key: modelContext.apiKey,
          model: modelContext.model,
          temperature: modelContext.temperature,
          input_price: modelContext.inputPrice,
          output_price: modelContext.outputPrice,
        }
      : null,
  };
}

function createConversationTitle(message: string) {
  return message.length > 30 ? `${message.slice(0, 30)}…` : message;
}

function createPreview(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.length > 100 ? `${normalized.slice(0, 100)}…` : normalized;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseReferenceItems(value: Prisma.JsonValue | null): ConversationReferenceItem[] {
  return Array.isArray(value) ? (value as unknown as ConversationReferenceItem[]) : [];
}

function parseToolCallItems(value: Prisma.JsonValue | null): ConversationToolCallItem[] {
  return Array.isArray(value) ? (value as unknown as ConversationToolCallItem[]) : [];
}

function parseRunSteps(value: Prisma.JsonValue | null): ConversationRunStepItem[] {
  return Array.isArray(value) ? (value as unknown as ConversationRunStepItem[]) : [];
}

function buildModelStartSteps(
  payload: RuntimeConversationRequest,
  options?: {
    toolStep?: ConversationRunStepItem | null;
    referenceStep?: ConversationRunStepItem | null;
    traceContext?: TraceContext | null;
  },
): ConversationRunStepItem[] {
  const traceContext = options?.traceContext;
  const promptSpan = traceContext ? createChildTraceContext(traceContext) : null;
  const modelSpan = traceContext ? createChildTraceContext(traceContext) : null;
  const steps: ConversationRunStepItem[] = [
    {
      id: 'prompt',
      type: 'prompt',
      title: '整理上下文',
      status: 'done',
      summary: `已读取智能体 ${payload.agent_name} 和 ${payload.history.length} 条历史消息。`,
      trace_id: promptSpan?.traceId ?? payload.trace_id ?? null,
      span_id: promptSpan?.spanId ?? null,
      parent_span_id: promptSpan?.parentSpanId ?? null,
      item_count: payload.history.length,
    },
  ];

  if (options?.toolStep) {
    steps.push(options.toolStep);
  }

  if (options?.referenceStep) {
    steps.push(options.referenceStep);
  }

  steps.push({
    id: 'model',
    type: 'response',
    title: '调用模型',
    status: 'done',
    summary: '已开始向真实模型供应商发起对话请求。',
    trace_id: modelSpan?.traceId ?? payload.trace_id ?? null,
    span_id: modelSpan?.spanId ?? null,
    parent_span_id: modelSpan?.parentSpanId ?? null,
  });

  return steps;
}

function buildProviderSuccessResponse(
  payload: RuntimeConversationRequest,
  execution: OpenAiCompatibleResult,
  modelContext: ModelExecutionContext,
  preparation: PreparedConversationExecution,
): RuntimeConversationResponse {
  const steps = buildModelStartSteps(payload, {
    toolStep: preparation.toolStep,
    referenceStep: preparation.referenceStep,
    traceContext: preparation.traceContext,
  }).map((step) =>
    step.id === 'model'
      ? {
          ...step,
          request_model: execution.requestModel,
          latency_ms: execution.latencyMs,
          prompt_tokens: execution.promptTokens,
          completion_tokens: execution.completionTokens,
          total_tokens: execution.totalTokens,
          cost_total: calculateModelCost(modelContext, execution),
        }
      : step,
  );
  steps.push({
    id: 'response',
    type: 'response',
    title: '生成回复',
    status: 'done',
    summary: '已收到模型输出并完成结构化响应。',
    trace_id: preparation.traceContext.traceId,
    span_id: createSpanId(),
    parent_span_id: preparation.traceContext.spanId,
    item_count: execution.outputText.length,
  });

  return {
    trace_id: preparation.traceContext.traceId,
    status: 'SUCCESS',
    assistant_message: execution.outputText,
    request_model: execution.requestModel,
    prompt_tokens: execution.promptTokens,
    completion_tokens: execution.completionTokens,
    total_tokens: execution.totalTokens,
    latency_ms: execution.latencyMs,
    steps,
    references: payload.references,
    tool_calls: payload.tool_calls,
    error_message: null,
  };
}

function buildProviderFailureResponse(
  payload: RuntimeConversationRequest,
  requestModel: string,
  errorMessage: string,
  preparation: PreparedConversationExecution,
): RuntimeConversationResponse {
  const steps = buildModelStartSteps(payload, {
    toolStep: preparation.toolStep,
    referenceStep: preparation.referenceStep,
    traceContext: preparation.traceContext,
  }).map((step) =>
    step.id === 'model'
      ? {
          ...step,
          status: 'failed' as const,
          summary: errorMessage,
          request_model: requestModel,
        }
      : step,
  );
  steps.push({
    id: 'response',
    type: 'response',
    title: '返回失败结果',
    status: 'skipped',
    summary: '模型调用失败，已返回可读错误信息。',
    trace_id: preparation.traceContext.traceId,
    span_id: createSpanId(),
    parent_span_id: preparation.traceContext.spanId,
  });

  const assistantMessage = `当前模型调用失败：${errorMessage}`;
  const promptTokens = estimateConversationRequestTokens(payload);
  const completionTokens = estimateTokens(assistantMessage);

  return {
    trace_id: preparation.traceContext.traceId,
    status: 'FAILED',
    assistant_message: assistantMessage,
    request_model: requestModel,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    latency_ms: 0,
    steps,
    references: payload.references,
    tool_calls: payload.tool_calls,
    error_message: errorMessage,
  };
}

function normalizeChatRole(role: RuntimeConversationRequest['history'][number]['role'] | string): ChatExecutionMessage['role'] {
  if (role === 'ASSISTANT') return 'assistant';
  if (role === 'USER') return 'user';
  return 'system';
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function estimateConversationRequestTokens(payload: RuntimeConversationRequest) {
  return payload.history.reduce((sum, message) => sum + estimateTokens(message.content), estimateTokens(payload.user_message));
}

function enrichRuntimeResponse(
  runtimeResponse: RuntimeConversationResponse,
  preparation: PreparedConversationExecution,
): RuntimeConversationResponse {
  if (runtimeResponse.steps.length > 0) {
    return {
      ...runtimeResponse,
      trace_id: runtimeResponse.trace_id ?? preparation.traceContext.traceId,
      steps: runtimeResponse.steps.map((step) => ({
        ...step,
        trace_id: step.trace_id ?? preparation.traceContext.traceId,
        span_id: step.span_id ?? null,
        parent_span_id: step.parent_span_id ?? null,
      })),
    };
  }

  return {
    ...runtimeResponse,
    trace_id: runtimeResponse.trace_id ?? preparation.traceContext.traceId,
    steps: buildModelStartSteps(preparation.runtimePayload, {
      toolStep: preparation.toolStep,
      referenceStep: preparation.referenceStep,
      traceContext: preparation.traceContext,
    }).concat(runtimeResponse.steps.slice(-1).map((step) => ({
      ...step,
      trace_id: step.trace_id ?? preparation.traceContext.traceId,
      span_id: step.span_id ?? null,
      parent_span_id: step.parent_span_id ?? null,
      request_model: runtimeResponse.request_model,
      latency_ms: runtimeResponse.latency_ms,
      prompt_tokens: runtimeResponse.prompt_tokens,
      completion_tokens: runtimeResponse.completion_tokens,
      total_tokens: runtimeResponse.total_tokens,
      item_count: runtimeResponse.assistant_message.length,
    }))),
  };
}

function calculateModelCost(
  modelContext: Pick<ModelExecutionContext, 'inputPrice' | 'outputPrice'>,
  execution: OpenAiCompatibleResult,
) {
  const inputCost = (execution.promptTokens / 1000) * modelContext.inputPrice;
  const outputCost = (execution.completionTokens / 1000) * modelContext.outputPrice;
  return Number((inputCost + outputCost).toFixed(6));
}

function resolveUserTraceContext(currentUser: AuthenticatedUser): TraceContext {
  const traceId = currentUser.traceId ?? createTraceId();
  const spanId = currentUser.spanId ?? createSpanId();

  return {
    traceId,
    spanId,
    parentSpanId: currentUser.parentSpanId ?? null,
    traceparent: currentUser.traceparent ?? buildTraceparent(traceId, spanId),
    requestId: currentUser.requestId ?? null,
  };
}

function extractTraceIdFromRunSteps(steps: ConversationRunStepItem[]) {
  return steps.find((step) => step.trace_id)?.trace_id ?? null;
}

function extractRunCostTotal(steps: ConversationRunStepItem[]) {
  return steps.reduce((sum, step) => sum + (step.cost_total ?? 0), 0);
}

function mapToolCallSummary(
  toolId: string,
  toolName: string,
  toolCode: string,
  result: TestToolResult,
): RuntimeToolCallSummary {
  return {
    tool_id: toolId,
    tool_name: toolName,
    tool_code: toolCode,
    status: result.status,
    approval_request_id: result.approval_request_id,
    latency_ms: result.latency_ms,
    response_status: result.response_status,
    output_preview: createOutputPreview(result.response_body),
    error_message: result.error_message,
  };
}

function createOutputPreview(value: unknown) {
  if (value === undefined || value === null) return null;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return serialized.length > 280 ? `${serialized.slice(0, 280)}…` : serialized;
}

function parseSseEvent(rawEvent: string): { event: string; payload: unknown } | null {
  const lines = rawEvent.split('\n');
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    event: eventName,
    payload: JSON.parse(dataLines.join('\n')),
  };
}
