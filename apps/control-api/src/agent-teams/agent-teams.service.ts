import { createHash } from 'node:crypto';

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AgentOwnerSummary,
  AgentTeamDetail,
  AgentTeamFeedbackItem,
  AgentTeamHandoffItem,
  AgentTeamListItem,
  AgentTeamModelCallItem,
  AgentTeamMemberItem,
  AgentTeamOverview,
  AgentTeamRunReportArchiveApprovalItem,
  AgentTeamRunReportArchiveListResult,
  AgentTeamRunReportArchiveItem,
  AgentTeamRunSummary,
  AgentTeamStepItem,
  ConversationReferenceItem,
  ConversationRunStepItem,
  ConversationToolCallItem,
  CreateAgentTeamRunReportArchiveResult,
  PaginatedResult,
  StorageDownloadUrlResult,
} from '@aiaget/shared-types';

import { requireEnv } from '../common/env';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import {
  buildTraceparent,
  createChildTraceContext,
  createSpanId,
  createTraceId,
  traceHeaders,
  type TraceContext,
} from '../common/tracing/trace-context';
import type { AuthenticatedUser } from '../common/types/request-context';
import { decryptSecret } from '../models/model-secrets';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateAgentTeamDto } from './dto/create-agent-team.dto';
import type { CreateAgentTeamFeedbackDto } from './dto/create-agent-team-feedback.dto';
import type { CreateAgentTeamHandoffDto } from './dto/create-agent-team-handoff.dto';
import type { CreateAgentTeamMemberDto } from './dto/create-agent-team-member.dto';
import type { ListAgentTeamsDto } from './dto/list-agent-teams.dto';
import type { ReviewAgentTeamHandoffDto } from './dto/review-agent-team-handoff.dto';
import type { StartAgentTeamRunDto } from './dto/start-agent-team-run.dto';
import type { UpdateAgentTeamDto } from './dto/update-agent-team.dto';
import type { UpdateAgentTeamMemberDto } from './dto/update-agent-team-member.dto';

const RUNTIME_BASE_URL = requireEnv('RUNTIME_BASE_URL');
const CONTROL_API_INTERNAL_BASE_URL = requireEnv('CONTROL_API_INTERNAL_BASE_URL');
const RUNTIME_INTERNAL_TOKEN = requireEnv('RUNTIME_INTERNAL_TOKEN');
const AGENT_TEAM_WORKFLOW_MODE = normalizeWorkflowMode(process.env.AGENT_TEAM_WORKFLOW_MODE);
const WORKFLOW_REQUEST_TIMEOUT_MS = 5000;
const AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX = 'agent-team-run-reports';
const AGENT_TEAM_RUN_REPORT_ARCHIVE_DOWNLOAD_EXPIRES_IN = 300;

const teamInclude = {
  owner: true,
  supervisorModel: true,
  members: {
    where: {
      deletedAt: null,
    },
    include: {
      agent: {
        include: {
          toolBindings: true,
          modelBindings: true,
          promptBindings: true,
          knowledgeBindings: true,
        },
      },
    },
    orderBy: [
      {
        executionOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  },
  runs: {
    where: {
      deletedAt: null,
    },
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  },
  steps: {
    include: {
      agent: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 120,
  },
  handoffs: {
    where: {
      deletedAt: null,
    },
    include: {
      fromAgent: true,
      toAgent: true,
      decider: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
  feedback: {
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.AgentTeamInclude;

const runReportArchiveAuditInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ApprovalAuditEventInclude;

type RunReportArchiveAuditEventRecord = Prisma.ApprovalAuditEventGetPayload<{ include: typeof runReportArchiveAuditInclude }>;

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

type AgentTeamRecord = Prisma.AgentTeamGetPayload<{ include: typeof teamInclude }>;
type AgentTeamListRecord = Prisma.AgentTeamGetPayload<{
  include: {
    owner: true;
    supervisorModel: true;
    members: true;
    runs: {
      include: {
        operator: true;
      };
    };
  };
}>;

type AgentTeamMemberRecord = AgentTeamRecord['members'][number];
type AgentTeamWorkflowMode = 'local' | 'temporal_first' | 'temporal';
type RuntimeWorkflowBackend = 'TEMPORAL' | 'LOCAL_FALLBACK';

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

interface RuntimePromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RuntimePromptSnapshot {
  binding_id: string;
  prompt_id: string;
  prompt_type: string;
  role: RuntimePromptMessage['role'];
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

interface RuntimeModelConfig {
  provider_type: string;
  base_url: string;
  api_key: string;
  model: string;
  temperature: number;
  api_version: string | null;
  max_output_tokens: number | null;
  input_price: number;
  output_price: number;
}

interface RuntimeSupervisorPolicy {
  model_config: RuntimeModelConfig | null;
  prompt: string | null;
  failure_policy: AgentTeamListItem['failure_policy'];
  quality_gate_enabled: boolean;
  quality_threshold: number;
  budget_token_limit: number | null;
  budget_cost_limit: number | null;
}

interface RuntimeConversationRequest {
  request_id?: string | null;
  trace_id?: string | null;
  parent_span_id?: string | null;
  traceparent?: string | null;
  conversation_id?: string | null;
  agent: RuntimeAgentSnapshot;
  agent_name: string;
  agent_code: string;
  user_message: string;
  history: Array<{ role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL'; content: string }>;
  prompt_messages: RuntimePromptMessage[];
  prompts: RuntimePromptSnapshot[];
  knowledge_bindings: RuntimeKnowledgeBindingSnapshot[];
  tools: RuntimeToolSnapshot[];
  tool_calls: [];
  references: [];
  control_api: RuntimeControlApiSnapshot;
  model_config: RuntimeModelConfig | null;
  resume_context?: {
    run_id?: string;
    handoff_id: string | null;
    decision_note: string | null;
    completed_member_ids: string[];
    previous_outputs: string[];
    next_round_index: number;
  } | null;
}

interface RuntimeAgentTeamRequest {
  request_id?: string | null;
  trace_id?: string | null;
  parent_span_id?: string | null;
  traceparent?: string | null;
  run_id: string;
  objective: string;
  team: {
    tenant_id: string;
    user_id: string;
    team_id: string;
    name: string;
    code: string;
    status: string;
    mode: AgentTeamListItem['mode'];
    max_rounds: number;
    timeout_seconds: number;
    handoff_policy: AgentTeamListItem['handoff_policy'];
    supervisor_model_id: string | null;
    supervisor_prompt: string | null;
    failure_policy: AgentTeamListItem['failure_policy'];
    quality_gate_enabled: boolean;
    quality_threshold: number;
    budget_token_limit: number | null;
    budget_cost_limit: number | null;
    supervisor_policy: RuntimeSupervisorPolicy;
  };
  members: RuntimeAgentTeamMemberRequest[];
  resume_context?: {
    handoff_id: string | null;
    decision_note: string | null;
    completed_member_ids: string[];
    previous_outputs: string[];
    next_round_index: number;
  } | null;
}

interface RuntimeAgentTeamMemberRequest {
  member_id: string;
  role: string;
  responsibility: string | null;
  execution_order: number;
  required: boolean;
  agent_request: RuntimeConversationRequest;
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
  error_message?: string | null;
}

interface RuntimeAgentTeamStepResult {
  member_id: string | null;
  agent_id: string | null;
  step_type: AgentTeamStepItem['step_type'];
  title: string;
  status: AgentTeamStepItem['status'];
  input_summary: string | null;
  output_summary: string | null;
  trace_id: string | null;
  span_id: string | null;
  parent_span_id: string | null;
  duration_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_total: number;
  error_message: string | null;
  started_at: string | null;
  ended_at: string | null;
  child_steps?: ConversationRunStepItem[];
  references?: ConversationReferenceItem[];
  tool_calls?: ConversationToolCallItem[];
  model_call?: AgentTeamModelCallItem | null;
}

interface RuntimeAgentTeamHandoffResult {
  from_member_id: string | null;
  to_member_id: string | null;
  from_agent_id: string | null;
  to_agent_id: string | null;
  reason: string;
  status: AgentTeamHandoffItem['status'];
  decision_note: string | null;
  decided_at: string | null;
}

interface RuntimeAgentTeamMemberResult {
  member_id: string;
  agent_id: string | null;
  agent_name: string;
  agent_code: string;
  status: 'SUCCESS' | 'FAILED';
  assistant_message: string;
  request_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_total: number;
  latency_ms: number;
  steps?: ConversationRunStepItem[];
  references?: ConversationReferenceItem[];
  tool_calls?: ConversationToolCallItem[];
  model_call?: RuntimeModelCallSummary | null;
  error_message?: string | null;
}

interface RuntimeAgentTeamResponse {
  trace_id: string;
  status: 'SUCCESS' | 'FAILED' | 'WAITING_HUMAN';
  summary: string;
  total_tokens: number;
  total_cost: number;
  latency_ms: number;
  steps: RuntimeAgentTeamStepResult[];
  handoffs?: RuntimeAgentTeamHandoffResult[];
  member_results: RuntimeAgentTeamMemberResult[];
  error_message?: string | null;
}

interface RuntimeWorkflowSignalResponse {
  workflow_id: string | null;
  run_id: string | null;
  status: 'SIGNALED' | 'RESUMED';
  backend: RuntimeWorkflowBackend;
}

interface TeamResumeContext {
  handoffId: string | null;
  decisionNote: string | null;
  completedMemberIds: string[];
  previousOutputs: string[];
  nextRoundIndex: number;
}

interface TeamRunPlatformProjection {
  status: RuntimeAgentTeamResponse['status'];
  traceId: string | null;
  requestId?: string | null;
  totalTokens: number;
  totalCost: number;
  latencyMs: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  summary: string;
  errorMessage?: string | null;
  handoffs: RuntimeAgentTeamHandoffResult[];
  sourceSystem: string;
}

interface AgentTeamRunReportInput {
  team: {
    id: string;
    name: string;
    code: string;
    mode: string;
    handoffPolicy: string;
    failurePolicy: string;
    supervisorModel: string | null;
    ownerName: string | null;
  };
  run: AgentTeamRunSummary;
  steps: AgentTeamStepItem[];
  handoffs: AgentTeamHandoffItem[];
  feedback: AgentTeamFeedbackItem[];
}

@Injectable()
export class AgentTeamsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  async overview(currentUser: AuthenticatedUser): Promise<AgentTeamOverview> {
    const [teams, runs, memberCount] = await this.prisma.$transaction([
      this.prisma.agentTeam.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          status: true,
        },
      }),
      this.prisma.agentTeamRun.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          status: true,
        },
        take: 500,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.agentTeamMember.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      total: teams.length,
      active_count: teams.filter((team) => team.status === 'ACTIVE').length,
      draft_count: teams.filter((team) => team.status === 'DRAFT').length,
      disabled_count: teams.filter((team) => team.status === 'DISABLED').length,
      running_count: runs.filter((run) => run.status === 'RUNNING' || run.status === 'QUEUED').length,
      waiting_human_count: runs.filter((run) => run.status === 'WAITING_HUMAN').length,
      failed_run_count: runs.filter((run) => run.status === 'FAILED').length,
      member_count: memberCount,
    };
  }

  async list(currentUser: AuthenticatedUser, query: ListAgentTeamsDto): Promise<PaginatedResult<AgentTeamListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.AgentTeamWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.mode) where.mode = query.mode;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (keyword) {
      where.OR = [
        {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.AgentTeamWhereInput>(currentUser, 'AGENT_TEAM');
    mergeDataScopeWhere(where, dataScope.where);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agentTeam.findMany({
        where,
        include: {
          owner: true,
          supervisorModel: true,
          members: {
            where: {
              deletedAt: null,
            },
          },
          runs: {
            where: {
              deletedAt: null,
            },
            include: {
              operator: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.agentTeam.count({ where }),
    ]);

    return {
      items: items.map((team) => this.mapTeamListItem(team)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateAgentTeamDto): Promise<AgentTeamDetail> {
    await this.validateOwner(currentUser.tenantId, dto.owner_id);
    await this.validateSupervisorModel(currentUser.tenantId, dto.supervisor_model_id);
    this.validateTeamPolicyLimits(dto);

    try {
      const team = await this.prisma.agentTeam.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          name: dto.name.trim(),
          code: dto.code.trim(),
          description: dto.description?.trim() || null,
          status: dto.status ?? 'DRAFT',
          mode: dto.mode ?? 'SEQUENTIAL',
          maxRounds: dto.max_rounds ?? 3,
          timeoutSeconds: dto.timeout_seconds ?? 300,
          handoffPolicy: dto.handoff_policy ?? 'AUTO',
          supervisorModelId: dto.supervisor_model_id || null,
          supervisorPrompt: dto.supervisor_prompt?.trim() || null,
          failurePolicy: dto.failure_policy ?? 'MATCH_HANDOFF_POLICY',
          qualityGateEnabled: dto.quality_gate_enabled ?? false,
          qualityThreshold: new Prisma.Decimal(dto.quality_threshold ?? 0.75),
          budgetTokenLimit: dto.budget_token_limit ?? null,
          budgetCostLimit: dto.budget_cost_limit === undefined || dto.budget_cost_limit === null
            ? null
            : new Prisma.Decimal(dto.budget_cost_limit),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      });

      return this.get(currentUser, team.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Agent 协作团队编码已存在。');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<AgentTeamDetail> {
    const team = await this.findTeam(currentUser.tenantId, id);
    return this.mapTeamDetail(team);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateAgentTeamDto): Promise<AgentTeamDetail> {
    await this.ensureTeamExists(currentUser.tenantId, id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);
    await this.validateSupervisorModel(currentUser.tenantId, dto.supervisor_model_id);
    this.validateTeamPolicyLimits(dto);

    const data: Prisma.AgentTeamUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.mode !== undefined) data.mode = dto.mode;
    if (dto.max_rounds !== undefined) data.maxRounds = dto.max_rounds;
    if (dto.timeout_seconds !== undefined) data.timeoutSeconds = dto.timeout_seconds;
    if (dto.handoff_policy !== undefined) data.handoffPolicy = dto.handoff_policy;
    if (dto.supervisor_model_id !== undefined) {
      data.supervisorModel = dto.supervisor_model_id ? { connect: { id: dto.supervisor_model_id } } : { disconnect: true };
    }
    if (dto.supervisor_prompt !== undefined) data.supervisorPrompt = dto.supervisor_prompt?.trim() || null;
    if (dto.failure_policy !== undefined) data.failurePolicy = dto.failure_policy;
    if (dto.quality_gate_enabled !== undefined) data.qualityGateEnabled = dto.quality_gate_enabled;
    if (dto.quality_threshold !== undefined) data.qualityThreshold = new Prisma.Decimal(dto.quality_threshold);
    if (dto.budget_token_limit !== undefined) data.budgetTokenLimit = dto.budget_token_limit ?? null;
    if (dto.budget_cost_limit !== undefined) {
      data.budgetCostLimit = dto.budget_cost_limit === null ? null : new Prisma.Decimal(dto.budget_cost_limit);
    }
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }

    await this.prisma.agentTeam.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureTeamExists(currentUser.tenantId, id);
    await this.prisma.agentTeam.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async addMember(
    currentUser: AuthenticatedUser,
    teamId: string,
    dto: CreateAgentTeamMemberDto,
  ): Promise<AgentTeamDetail> {
    await this.ensureTeamExists(currentUser.tenantId, teamId);
    await this.ensureAgentExists(currentUser.tenantId, dto.agent_id);

    try {
      await this.prisma.agentTeamMember.upsert({
        where: {
          tenantId_teamId_agentId: {
            tenantId: currentUser.tenantId,
            teamId,
            agentId: dto.agent_id,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          teamId,
          agentId: dto.agent_id,
          role: dto.role.trim(),
          responsibility: dto.responsibility?.trim() || null,
          executionOrder: dto.execution_order ?? 0,
          required: dto.required ?? true,
          status: dto.status ?? 'ACTIVE',
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          role: dto.role.trim(),
          responsibility: dto.responsibility?.trim() || null,
          executionOrder: dto.execution_order ?? 0,
          required: dto.required ?? true,
          status: dto.status ?? 'ACTIVE',
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });

      await this.touchTeam(teamId, currentUser.id);
      return this.get(currentUser, teamId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Agent 协作团队成员引用无效。');
      }
      throw error;
    }
  }

  async updateMember(
    currentUser: AuthenticatedUser,
    teamId: string,
    memberId: string,
    dto: UpdateAgentTeamMemberDto,
  ): Promise<AgentTeamDetail> {
    await this.ensureMemberExists(currentUser.tenantId, teamId, memberId);

    const data: Prisma.AgentTeamMemberUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.role !== undefined) data.role = dto.role.trim();
    if (dto.responsibility !== undefined) data.responsibility = dto.responsibility?.trim() || null;
    if (dto.execution_order !== undefined) data.executionOrder = dto.execution_order;
    if (dto.required !== undefined) data.required = dto.required;
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.agentTeamMember.update({
      where: {
        id: memberId,
      },
      data,
    });
    await this.touchTeam(teamId, currentUser.id);

    return this.get(currentUser, teamId);
  }

  async removeMember(currentUser: AuthenticatedUser, teamId: string, memberId: string): Promise<AgentTeamDetail> {
    await this.ensureMemberExists(currentUser.tenantId, teamId, memberId);
    await this.prisma.agentTeamMember.update({
      where: {
        id: memberId,
      },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });
    await this.touchTeam(teamId, currentUser.id);

    return this.get(currentUser, teamId);
  }

  async startRun(currentUser: AuthenticatedUser, teamId: string, dto: StartAgentTeamRunDto): Promise<AgentTeamDetail> {
    const team = await this.findTeam(currentUser.tenantId, teamId);
    const activeMembers = team.members.filter((member) => member.status === 'ACTIVE');

    if (team.status !== 'ACTIVE') {
      throw new BadRequestException('只有启用中的 Agent 协作团队可以启动任务。');
    }

    if (activeMembers.length === 0) {
      throw new BadRequestException('Agent 协作团队至少需要一个启用成员。');
    }

    const startedAt = new Date();
    let traceContext = resolveTeamTraceContext(currentUser);
    const requestId = traceContext.requestId ?? `team_run_${Date.now()}`;
    traceContext = {
      ...traceContext,
      requestId,
    };
    const run = await this.prisma.agentTeamRun.create({
      data: {
        tenantId: currentUser.tenantId,
        teamId,
        objective: dto.objective.trim(),
        status: 'RUNNING',
        requestId,
        traceId: traceContext.traceId,
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        totalTokens: 0,
        totalCost: new Prisma.Decimal(0),
        latencyMs: 0,
        startedAt,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });

    await this.recordTeamRunStartedEvent(currentUser, {
      teamId,
      runId: run.id,
      objective: run.objective,
      requestId,
      traceId: traceContext.traceId,
      startedAt,
    });
    await this.dispatchTeamRun(currentUser, run.id);

    await this.touchTeam(teamId, currentUser.id);
    return this.get(currentUser, teamId);
  }

  async exportRunReport(currentUser: AuthenticatedUser, runId: string): Promise<string> {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: runId,
        deletedAt: null,
      },
      include: {
        operator: true,
        team: {
          include: {
            owner: true,
            supervisorModel: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在。');
    }

    const [steps, handoffs, feedback] = await Promise.all([
      this.prisma.agentTeamStep.findMany({
        where: {
          tenantId: currentUser.tenantId,
          runId: run.id,
        },
        include: {
          agent: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.agentTeamHandoff.findMany({
        where: {
          tenantId: currentUser.tenantId,
          runId: run.id,
          deletedAt: null,
        },
        include: {
          fromAgent: true,
          toAgent: true,
          decider: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.agentTeamFeedback.findMany({
        where: {
          tenantId: currentUser.tenantId,
          runId: run.id,
        },
        include: {
          author: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    return buildAgentTeamRunReportCsv({
      team: {
        id: run.team.id,
        name: run.team.name,
        code: run.team.code,
        mode: run.team.mode,
        handoffPolicy: run.team.handoffPolicy,
        failurePolicy: run.team.failurePolicy,
        supervisorModel: run.team.supervisorModel?.model ?? null,
        ownerName: run.team.owner?.name ?? null,
      },
      run: this.mapRun(run),
      steps: steps.map((step) => this.mapStep(step)),
      handoffs: handoffs.map((handoff) => this.mapHandoff(handoff)),
      feedback: feedback.map((item) => this.mapFeedback(item)),
    });
  }

  async createRunReportArchive(
    currentUser: AuthenticatedUser,
    runId: string,
  ): Promise<CreateAgentTeamRunReportArchiveResult> {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: runId,
        deletedAt: null,
      },
      include: {
        team: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在。');
    }

    const csv = await this.exportRunReport(currentUser, runId);
    const createdAt = new Date();
    const archiveKey = `${AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX}/${run.teamId}/${createdAt.toISOString().replace(/[:.]/g, '-')}-${run.id}.csv`;
    const item = await this.storageService.putTenantObject({
      tenantId: currentUser.tenantId,
      key: archiveKey,
      body: `\uFEFF${csv}`,
      contentType: 'text/csv; charset=utf-8',
      metadata: {
        archive_type: 'agent_team_run_report',
        team_id: run.teamId,
        run_id: run.id,
        created_by: currentUser.id,
      },
    });
    const mappedItem = mapAgentTeamRunReportArchive(item);

    await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: agentTeamRunReportArchiveSourceIdFromKey(mappedItem.key),
      eventType: 'ARCHIVED',
      eventStatus: 'SUCCESS',
      title: '团队运行报告归档已生成',
      note: `归档文件 ${mappedItem.file_name} 已保存到对象存储。`,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? run.traceId ?? null,
      metadata: {
        archive_id: mappedItem.id,
        archive_key: mappedItem.key,
        archive_file_name: mappedItem.file_name,
        archive_size_bytes: mappedItem.size_bytes,
        team_id: run.teamId,
        team_name: run.team.name,
        run_id: run.id,
        run_objective: run.objective,
      },
      actorId: currentUser.id,
    });

    return {
      item: mappedItem,
    };
  }

  async listRunReportArchives(currentUser: AuthenticatedUser): Promise<AgentTeamRunReportArchiveListResult> {
    const items = (await this.storageService.listTenantObjects({
      tenantId: currentUser.tenantId,
      prefix: AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX,
      limit: 200,
    })).map(mapAgentTeamRunReportArchive);

    return {
      items,
      total: items.length,
      summary: {
        archive_count: items.length,
        total_size_bytes: items.reduce((sum, item) => sum + item.size_bytes, 0),
      },
    };
  }

  async getRunReportArchiveDownloadUrl(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    const key = agentTeamRunReportArchiveKeyFromId(archiveId);
    const result = await this.storageService.getTenantObjectDownloadUrl(
      currentUser.tenantId,
      key,
      AGENT_TEAM_RUN_REPORT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    );

    await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: agentTeamRunReportArchiveSourceIdFromKey(key),
      eventType: 'DOWNLOAD_URL_CREATED',
      eventStatus: 'INFO',
      title: '团队运行报告归档下载链接已生成',
      note: '已生成短期归档下载链接。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_id: archiveId,
        archive_key: key,
        expires_in: result.expires_in,
      },
      actorId: currentUser.id,
    });

    return result;
  }

  async requestDeleteRunReportArchive(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    const key = agentTeamRunReportArchiveKeyFromId(archiveId);
    const sourceId = agentTeamRunReportArchiveSourceIdFromKey(key);
    const archiveContext = await this.resolveRunReportArchiveContext(currentUser.tenantId, key);
    const existing = await this.findPendingRunReportArchiveDeleteApproval(currentUser.tenantId, sourceId);

    if (existing) {
      return {
        success: true,
        approval_id: existing.id,
      };
    }

    const event = await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId,
      eventType: 'DELETE_REQUESTED',
      eventStatus: 'WARNING',
      title: '团队运行报告归档删除待审批',
      note: '删除团队运行报告归档属于高危审计操作，已进入审批队列。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_id: archiveId,
        archive_key: key,
        archive_file_name: key.split('/').at(-1) ?? key,
        archive_folder: key.split('/').slice(0, -1).join('/') || null,
        archive_source: AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX,
        archive_context: '团队运行报告归档',
        team_id: archiveContext.teamId,
        team_name: archiveContext.teamName,
        run_id: archiveContext.runId,
        run_objective: archiveContext.runObjective,
      },
      actorId: currentUser.id,
    });

    return {
      success: true,
      approval_id: event.id,
    };
  }

  async listRunReportArchiveDeleteApprovals(
    currentUser: AuthenticatedUser,
  ): Promise<AgentTeamRunReportArchiveApprovalItem[]> {
    const events = await this.loadRunReportArchiveDeleteEvents(currentUser.tenantId);
    return buildRunReportArchiveDeleteApprovals(events);
  }

  async approveRunReportArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamRunReportArchiveApprovalItem> {
    const detail = await this.getRunReportArchiveDeleteApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的报告归档删除申请可以通过。');
    }

    await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: detail.archive_id,
      eventType: 'APPROVED',
      eventStatus: 'SUCCESS',
      title: '团队运行报告归档删除已批准',
      note: nullableText(dto.decision_note),
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    await this.storageService.deleteTenantObject(currentUser.tenantId, detail.archive_key);
    await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: detail.archive_id,
      eventType: 'DELETE_APPLIED',
      eventStatus: 'SUCCESS',
      title: '团队运行报告归档删除已生效',
      note: '报告归档文件已从对象存储删除。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    return this.getRunReportArchiveDeleteApproval(currentUser, approvalId);
  }

  async rejectRunReportArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamRunReportArchiveApprovalItem> {
    const detail = await this.getRunReportArchiveDeleteApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的报告归档删除申请可以拒绝。');
    }

    await this.recordRunReportArchiveAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: detail.archive_id,
      eventType: 'REJECTED',
      eventStatus: 'WARNING',
      title: '团队运行报告归档删除已拒绝',
      note: nullableText(dto.decision_note) ?? '报告归档删除申请已拒绝。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    return this.getRunReportArchiveDeleteApproval(currentUser, approvalId);
  }

  private async resolveRunReportArchiveContext(tenantId: string, key: string) {
    const parsed = parseRunReportArchiveKey(key);
    const run = parsed.runId
      ? await this.prisma.agentTeamRun.findFirst({
          where: {
            tenantId,
            id: parsed.runId,
            deletedAt: null,
          },
          include: {
            team: true,
          },
        })
      : null;

    if (run) {
      return {
        teamId: run.teamId,
        teamName: run.team.name,
        runId: run.id,
        runObjective: run.objective,
      };
    }

    const team = parsed.teamId
      ? await this.prisma.agentTeam.findFirst({
          where: {
            tenantId,
            id: parsed.teamId,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : null;

    return {
      teamId: parsed.teamId,
      teamName: team?.name ?? null,
      runId: parsed.runId,
      runObjective: null,
    };
  }

  async runWorkflowRun(
    runId: string,
    resumeContext?: {
      handoffId?: string | null;
      decisionNote?: string | null;
      completedMemberIds?: string[];
      previousOutputs?: string[];
      nextRoundIndex?: number;
    },
  ): Promise<{ success: boolean; run_id: string; status: AgentTeamRunSummary['status'] }> {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        id: runId,
        deletedAt: null,
      },
      include: {
        operator: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在。');
    }

    const actor = await this.resolveRunActor(run);
    await this.executeRuntimeTeamRun(actor, run.id, resumeContext ?? null);
    const updatedRun = await this.prisma.agentTeamRun.findUnique({
      where: {
        id: run.id,
      },
      select: {
        status: true,
      },
    });
    return { success: true, run_id: run.id, status: (updatedRun?.status ?? run.status) as AgentTeamRunSummary['status'] };
  }

  private async dispatchTeamRun(currentUser: AuthenticatedUser, runId: string) {
    if (AGENT_TEAM_WORKFLOW_MODE === 'local') {
      await this.executeRuntimeTeamRun(currentUser, runId);
      return;
    }

    try {
      await this.startRuntimeTeamWorkflow(runId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown agent team workflow dispatch error';
      if (AGENT_TEAM_WORKFLOW_MODE === 'temporal_first') {
        await this.executeRuntimeTeamRun(currentUser, runId);
        return;
      }

      await this.markWorkflowDispatchFailed(currentUser, runId, message);
    }
  }

  private async executeRuntimeTeamRun(
    currentUser: AuthenticatedUser,
    runId: string,
    resumeContextInput: {
      handoffId?: string | null;
      decisionNote?: string | null;
      completedMemberIds?: string[];
      previousOutputs?: string[];
      nextRoundIndex?: number;
    } | null = null,
  ) {
    const run = await this.findExecutableRun(currentUser.tenantId, runId);
    const team = await this.findTeam(currentUser.tenantId, run.teamId);
    const activeMembers = team.members.filter((member) => member.status === 'ACTIVE');
    const startedAt = run.startedAt ?? new Date();
    const resumeContext = resumeContextInput
      ? {
          handoffId: resumeContextInput.handoffId ?? null,
          decisionNote: resumeContextInput.decisionNote ?? null,
          completedMemberIds: resumeContextInput.completedMemberIds ?? [],
          previousOutputs: resumeContextInput.previousOutputs ?? [],
          nextRoundIndex: resumeContextInput.nextRoundIndex ?? 1,
        }
      : run.totalSteps > 0 || run.status === 'WAITING_HUMAN'
        ? await this.buildTeamResumeContext(currentUser.tenantId, run.id, null, null)
      : null;
    const traceContext = resolveTeamTraceContext({
      ...currentUser,
      traceId: run.traceId ?? currentUser.traceId,
      requestId: run.requestId ?? currentUser.requestId,
    });

    try {
      const runtimePayload = await this.buildRuntimeTeamRequest(
        currentUser,
        team,
        activeMembers,
        run.id,
        run.objective.trim(),
        traceContext,
        resumeContext,
      );
      const runtimeResponse = await this.requestRuntimeTeamRun(runtimePayload, traceContext);
      await this.persistRuntimeTeamRun(currentUser, team.id, run.id, runtimeResponse, {
        appendExisting: Boolean(resumeContext),
      });
    } catch (error) {
      const fallbackSteps = buildRunSteps(team, activeMembers, run.objective, traceContext.traceId, startedAt, error);
      await this.persistBuiltTeamRun(currentUser, team.id, run.id, fallbackSteps, {
        status: 'FAILED',
        traceId: traceContext.traceId,
        startedAt,
        latencyMs: Math.max(1, Date.now() - startedAt.getTime()),
        errorMessage: error instanceof Error ? error.message : 'Runtime 团队编排失败。',
      });
      await this.recordTeamRunPlatformProjection(currentUser, team.id, run.id, {
        status: 'FAILED',
        traceId: traceContext.traceId,
        requestId: traceContext.requestId ?? run.requestId,
        totalTokens: 0,
        totalCost: 0,
        latencyMs: Math.max(1, Date.now() - startedAt.getTime()),
        totalSteps: fallbackSteps.length,
        completedSteps: fallbackSteps.filter((step) => step.status === 'SUCCESS').length,
        failedSteps: fallbackSteps.filter((step) => step.status === 'FAILED').length,
        summary: 'Runtime 团队编排失败，已写入失败台账。',
        errorMessage: error instanceof Error ? error.message : 'Runtime 团队编排失败。',
        handoffs: [],
        sourceSystem: 'agent_team_run',
      });
    }
  }

  private async startRuntimeTeamWorkflow(runId: string) {
    const response = await fetch(new URL('/runtime/workflows/agent-team-runs/start', RUNTIME_BASE_URL), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-runtime-internal-token': RUNTIME_INTERNAL_TOKEN,
      },
      body: JSON.stringify({ run_id: runId }),
      signal: AbortSignal.timeout(WORKFLOW_REQUEST_TIMEOUT_MS),
    });
    const body = await safeJson(response);

    if (!response.ok) {
      throw new Error(extractWorkflowError(body) ?? `Runtime workflow endpoint responded with HTTP ${response.status}`);
    }

    const workflow = parseRuntimeWorkflowStartResponse(body);
    if (AGENT_TEAM_WORKFLOW_MODE === 'temporal' && workflow.backend !== 'TEMPORAL') {
      throw new Error('Runtime workflow endpoint returned LOCAL_FALLBACK while AGENT_TEAM_WORKFLOW_MODE=temporal');
    }
  }

  private async resumeRuntimeTeamWorkflow(
    runId: string,
    approved: boolean,
    handoffId: string,
    decisionNote: string | null,
    resumeContext: TeamResumeContext | null,
  ) {
    const response = await fetch(new URL('/runtime/workflows/agent-team-runs/resume', RUNTIME_BASE_URL), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-runtime-internal-token': RUNTIME_INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        run_id: runId,
        approved,
        handoff_id: handoffId,
        decision_note: decisionNote,
        completed_member_ids: resumeContext?.completedMemberIds ?? [],
        previous_outputs: resumeContext?.previousOutputs ?? [],
        next_round_index: resumeContext?.nextRoundIndex ?? 1,
      }),
      signal: AbortSignal.timeout(WORKFLOW_REQUEST_TIMEOUT_MS),
    });
    const body = await safeJson(response);

    if (!response.ok) {
      throw new Error(extractWorkflowError(body) ?? `Runtime workflow resume endpoint responded with HTTP ${response.status}`);
    }

    const workflow = parseRuntimeWorkflowSignalResponse(body);
    if (AGENT_TEAM_WORKFLOW_MODE === 'temporal' && workflow.backend !== 'TEMPORAL') {
      throw new Error('Runtime workflow resume endpoint returned LOCAL_FALLBACK while AGENT_TEAM_WORKFLOW_MODE=temporal');
    }
  }

  private async markWorkflowDispatchFailed(currentUser: AuthenticatedUser, runId: string, message: string) {
    const run = await this.prisma.agentTeamRun.update({
      where: {
        id: runId,
      },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        errorMessage: `Temporal workflow dispatch failed: ${message}`,
        updatedBy: currentUser.id,
      },
    });

    await this.recordTeamRunPlatformProjection(currentUser, run.teamId, run.id, {
      status: 'FAILED',
      traceId: run.traceId ?? currentUser.traceId ?? null,
      requestId: run.requestId ?? currentUser.requestId ?? null,
      totalTokens: run.totalTokens,
      totalCost: Number(run.totalCost),
      latencyMs: run.latencyMs,
      totalSteps: run.totalSteps,
      completedSteps: run.completedSteps,
      failedSteps: run.failedSteps,
      summary: 'Temporal 团队工作流派发失败。',
      errorMessage: `Temporal workflow dispatch failed: ${message}`,
      handoffs: [],
      sourceSystem: 'agent_team_run',
    });
  }

  private async findExecutableRun(tenantId: string, runId: string) {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId,
        id: runId,
        deletedAt: null,
        status: {
          in: ['QUEUED', 'RUNNING', 'WAITING_HUMAN'],
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在或不可执行。');
    }

    return run;
  }

  private async resolveRunActor(run: { tenantId: string; createdBy: string | null; traceId: string | null; requestId: string | null }) {
    const user = run.createdBy
      ? await this.prisma.user.findFirst({
          where: {
            tenantId: run.tenantId,
            id: run.createdBy,
            deletedAt: null,
          },
          include: {
            userRoles: {
              where: {
                deletedAt: null,
                role: {
                  deletedAt: null,
                },
              },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      where: {
                        deletedAt: null,
                      },
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : null;

    if (!user) {
      throw new NotFoundException('Agent 协作运行发起人不存在。');
    }

    const activeRoles = user.userRoles.filter((userRole) => userRole.role);
    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId,
      email: user.email,
      roles: activeRoles.map((userRole) => userRole.role.code),
      roleIds: activeRoles.map((userRole) => userRole.role.id),
      permissions: Array.from(
        new Set(
          activeRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
          ),
        ),
      ),
      requestId: run.requestId ?? undefined,
      traceId: run.traceId ?? undefined,
    };
  }

  private async buildRuntimeTeamRequest(
    currentUser: AuthenticatedUser,
    team: AgentTeamRecord,
    members: AgentTeamMemberRecord[],
    runId: string,
    objective: string,
    traceContext: TraceContext,
    resumeContext: TeamResumeContext | null,
  ): Promise<RuntimeAgentTeamRequest> {
    const supervisorPolicy = await this.buildSupervisorPolicy(currentUser.tenantId, team);

    return {
      request_id: traceContext.requestId ?? null,
      trace_id: traceContext.traceId,
      parent_span_id: traceContext.parentSpanId ?? traceContext.spanId,
      traceparent: traceContext.traceparent,
      run_id: runId,
      objective,
      team: {
        tenant_id: currentUser.tenantId,
        user_id: currentUser.id,
        team_id: team.id,
        name: team.name,
        code: team.code,
        status: team.status,
        mode: team.mode as AgentTeamListItem['mode'],
        max_rounds: team.maxRounds,
        timeout_seconds: team.timeoutSeconds,
        handoff_policy: team.handoffPolicy as AgentTeamListItem['handoff_policy'],
        supervisor_model_id: team.supervisorModelId,
        supervisor_prompt: team.supervisorPrompt,
        failure_policy: team.failurePolicy as AgentTeamListItem['failure_policy'],
        quality_gate_enabled: team.qualityGateEnabled,
        quality_threshold: Number(team.qualityThreshold),
        budget_token_limit: team.budgetTokenLimit,
        budget_cost_limit: team.budgetCostLimit === null ? null : Number(team.budgetCostLimit),
        supervisor_policy: supervisorPolicy,
      },
      members: await Promise.all(
        members.map(async (member) => ({
          member_id: member.id,
          role: member.role,
          responsibility: member.responsibility,
          execution_order: member.executionOrder,
          required: member.required,
          agent_request: await this.buildMemberRuntimeRequest(currentUser, member, objective, traceContext),
        })),
      ),
      resume_context: resumeContext
        ? {
            handoff_id: resumeContext.handoffId,
            decision_note: resumeContext.decisionNote,
            completed_member_ids: resumeContext.completedMemberIds,
            previous_outputs: resumeContext.previousOutputs,
            next_round_index: resumeContext.nextRoundIndex,
          }
        : null,
    };
  }

  private async buildTeamResumeContext(
    tenantId: string,
    runId: string,
    handoffId: string | null = null,
    decisionNote: string | null = null,
  ): Promise<TeamResumeContext> {
    const steps = await this.prisma.agentTeamStep.findMany({
      where: {
        tenantId,
        runId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        memberId: true,
        outputSummary: true,
        stepType: true,
      },
    });
    const completedMemberIds = Array.from(
      new Set(
        steps
          .filter((step) => step.stepType === 'AGENT_RUN' && step.memberId)
          .map((step) => step.memberId as string),
      ),
    );
    const previousOutputs = steps
      .filter((step) => step.stepType === 'AGENT_RUN' && step.outputSummary)
      .map((step) => step.outputSummary as string)
      .slice(-8);
    const nextRoundIndex = Math.max(1, completedMemberIds.length + 1);
    const resolvedHandoffId = handoffId ?? (await this.prisma.agentTeamHandoff.findFirst({
      where: {
        tenantId,
        runId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    }))?.id ?? null;
    return {
      handoffId: resolvedHandoffId,
      decisionNote,
      completedMemberIds,
      previousOutputs,
      nextRoundIndex,
    };
  }

  private async buildMemberRuntimeRequest(
    currentUser: AuthenticatedUser,
    member: AgentTeamMemberRecord,
    objective: string,
    traceContext: TraceContext,
  ): Promise<RuntimeConversationRequest> {
    const [prompts, knowledgeBindings, tools, modelConfig] = await Promise.all([
      this.resolvePromptSnapshots(currentUser.tenantId, member),
      this.resolveKnowledgeBindingSnapshots(currentUser.tenantId, member),
      this.resolveToolSnapshots(currentUser.tenantId, member),
      this.resolveModelConfig(currentUser.tenantId, member),
    ]);

    return {
      request_id: traceContext.requestId ?? null,
      trace_id: traceContext.traceId,
      parent_span_id: traceContext.spanId,
      traceparent: traceContext.traceparent,
      conversation_id: null,
      agent: {
        tenant_id: currentUser.tenantId,
        user_id: currentUser.id,
        agent_id: member.agent.id,
        name: member.agent.name,
        code: member.agent.code,
        status: member.agent.status,
        version: member.agent.version,
        temperature: Number(member.agent.temperature),
        max_context_tokens: member.agent.maxContextTokens,
        enable_stream: member.agent.enableStream,
        enable_log: member.agent.enableLog,
      },
      agent_name: member.agent.name,
      agent_code: member.agent.code,
      user_message: objective,
      history: [],
      prompt_messages: [],
      prompts,
      knowledge_bindings: knowledgeBindings,
      tools,
      tool_calls: [],
      references: [],
      control_api: {
        base_url: CONTROL_API_INTERNAL_BASE_URL,
        internal_token: RUNTIME_INTERNAL_TOKEN,
      },
      model_config: modelConfig,
    };
  }

  private async buildSupervisorPolicy(
    tenantId: string,
    team: AgentTeamRecord,
  ): Promise<RuntimeSupervisorPolicy> {
    return {
      model_config: await this.resolveSupervisorModelConfig(tenantId, team.supervisorModelId),
      prompt: team.supervisorPrompt,
      failure_policy: team.failurePolicy as AgentTeamListItem['failure_policy'],
      quality_gate_enabled: team.qualityGateEnabled,
      quality_threshold: Number(team.qualityThreshold),
      budget_token_limit: team.budgetTokenLimit,
      budget_cost_limit: team.budgetCostLimit === null ? null : Number(team.budgetCostLimit),
    };
  }

  private async requestRuntimeTeamRun(
    payload: RuntimeAgentTeamRequest,
    traceContext: TraceContext,
  ): Promise<RuntimeAgentTeamResponse> {
    const runtimeTrace = createChildTraceContext(traceContext);
    const url = new URL('/runtime/agent-teams/run', RUNTIME_BASE_URL);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-request-id': traceContext.requestId ?? '',
        ...traceHeaders(runtimeTrace),
      },
      body: JSON.stringify({
        ...payload,
        trace_id: runtimeTrace.traceId,
        parent_span_id: runtimeTrace.parentSpanId,
        traceparent: runtimeTrace.traceparent,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`Runtime team responded with HTTP ${response.status}`);
    }

    return (await response.json()) as RuntimeAgentTeamResponse;
  }

  private async persistRuntimeTeamRun(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    runtimeResponse: RuntimeAgentTeamResponse,
    options: {
      appendExisting?: boolean;
    } = {},
  ) {
    const enrichedSteps = enrichRuntimeTeamSteps(runtimeResponse.steps, runtimeResponse.member_results);

    if (!options.appendExisting) {
      await this.persistBuiltTeamRun(currentUser, teamId, runId, enrichedSteps, {
        status: runtimeResponse.status,
        traceId: runtimeResponse.trace_id,
        latencyMs: runtimeResponse.latency_ms,
        totalTokens: runtimeResponse.total_tokens,
        totalCost: runtimeResponse.total_cost,
        errorMessage: runtimeResponse.error_message ?? null,
      });
      await this.persistRuntimeHandoffs(currentUser, teamId, runId, runtimeResponse.handoffs ?? []);
    } else {
      const existingRun = await this.prisma.agentTeamRun.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          id: runId,
          deletedAt: null,
        },
        select: {
          totalSteps: true,
          completedSteps: true,
          failedSteps: true,
          totalTokens: true,
          totalCost: true,
          startedAt: true,
          requestId: true,
          traceId: true,
        },
      });
      if (await this.isDuplicateRuntimeTeamResume(currentUser.tenantId, runId, enrichedSteps)) {
        return;
      }
      const createdAt = existingRun?.startedAt ?? new Date();
      await this.prisma.agentTeamStep.createMany({
        data: enrichedSteps.map((step) => ({
          ...mapTeamStepCreateInput(currentUser.tenantId, teamId, step, createdAt, runtimeResponse.trace_id),
          runId,
        })),
      });
      if (runtimeResponse.handoffs?.length) {
        await this.prisma.agentTeamHandoff.createMany({
          data: runtimeResponse.handoffs.map((handoff) => ({
            tenantId: currentUser.tenantId,
            teamId,
            runId,
            fromMemberId: handoff.from_member_id,
            toMemberId: handoff.to_member_id,
            fromAgentId: handoff.from_agent_id,
            toAgentId: handoff.to_agent_id,
            reason: handoff.reason,
            status: handoff.status,
            decisionNote: handoff.decision_note,
            decidedBy: handoff.status === 'PENDING' ? null : currentUser.id,
            decidedAt: handoff.status === 'PENDING' ? null : parseDate(handoff.decided_at) ?? new Date(),
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          })),
        });
      }
      const totalSteps = (existingRun?.totalSteps ?? 0) + enrichedSteps.length;
      const completedSteps = (existingRun?.completedSteps ?? 0) + enrichedSteps.filter((step) => step.status === 'SUCCESS').length;
      const failedSteps = (existingRun?.failedSteps ?? 0) + enrichedSteps.filter((step) => step.status === 'FAILED').length;
      const totalTokens = Number(existingRun?.totalTokens ?? 0) + runtimeResponse.total_tokens;
      const totalCost = Number(existingRun?.totalCost ?? 0) + runtimeResponse.total_cost;

      await this.prisma.agentTeamRun.update({
        where: {
          id: runId,
        },
        data: {
          status: runtimeResponse.status,
          traceId: runtimeResponse.trace_id,
          totalSteps,
          completedSteps,
          failedSteps,
          totalTokens,
          totalCost: new Prisma.Decimal(totalCost),
          latencyMs: Math.max(1, runtimeResponse.latency_ms),
          errorMessage: runtimeResponse.error_message ?? null,
          endedAt: runtimeResponse.status === 'SUCCESS' ? new Date() : null,
          updatedBy: currentUser.id,
        },
      });
    }

    await this.recordRuntimeTeamStepEvents(
      currentUser,
      teamId,
      runId,
      enrichedSteps,
      options.appendExisting ? 'agent_team_run_resume' : 'agent_team_run',
      null,
      runtimeResponse.trace_id,
    );

    await Promise.all(
      runtimeResponse.member_results
        .map((memberResult) => memberResult.model_call)
        .filter((modelCall): modelCall is RuntimeModelCallSummary => Boolean(modelCall))
        .map((modelCall) => this.writeRuntimeModelCallLog(currentUser, modelCall)),
    );

    await this.recordTeamRunPlatformProjection(currentUser, teamId, runId, {
      status: runtimeResponse.status,
      traceId: runtimeResponse.trace_id,
      requestId: undefined,
      totalTokens: runtimeResponse.total_tokens,
      totalCost: runtimeResponse.total_cost,
      latencyMs: runtimeResponse.latency_ms,
      totalSteps: enrichedSteps.length,
      completedSteps: enrichedSteps.filter((step) => step.status === 'SUCCESS').length,
      failedSteps: enrichedSteps.filter((step) => step.status === 'FAILED').length,
      summary: runtimeResponse.summary,
      errorMessage: runtimeResponse.error_message ?? null,
      handoffs: runtimeResponse.handoffs ?? [],
      sourceSystem: options.appendExisting ? 'agent_team_run_resume' : 'agent_team_run',
    });
  }

  private async isDuplicateRuntimeTeamResume(
    tenantId: string,
    runId: string,
    steps: RuntimeAgentTeamStepResult[],
  ) {
    if (steps.length === 0) {
      return false;
    }

    const duplicateChecks = await Promise.all(
      steps.map((step) => {
        const fingerprint = buildRuntimeTeamStepFingerprint(step);
        return this.prisma.agentTeamStep.count({
          where: {
            tenantId,
            runId,
            stepType: fingerprint.stepType,
            memberId: fingerprint.memberId,
            agentId: fingerprint.agentId,
            traceId: fingerprint.traceId,
            spanId: fingerprint.spanId,
          },
        });
      }),
    );

    return duplicateChecks.every((count) => count > 0);
  }

  private async persistRuntimeHandoffs(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    handoffs: RuntimeAgentTeamHandoffResult[],
  ) {
    if (handoffs.length === 0) {
      return;
    }

    await this.prisma.agentTeamHandoff.deleteMany({
      where: {
        tenantId: currentUser.tenantId,
        runId,
        status: 'AUTO',
      },
    });

    await this.prisma.agentTeamHandoff.createMany({
      data: handoffs.map((handoff) => ({
        tenantId: currentUser.tenantId,
        teamId,
        runId,
        fromMemberId: handoff.from_member_id,
        toMemberId: handoff.to_member_id,
        fromAgentId: handoff.from_agent_id,
        toAgentId: handoff.to_agent_id,
        reason: handoff.reason,
        status: handoff.status,
        decisionNote: handoff.decision_note,
        decidedBy: handoff.status === 'PENDING' ? null : currentUser.id,
        decidedAt: handoff.status === 'PENDING' ? null : parseDate(handoff.decided_at) ?? new Date(),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      })),
    });
  }

  private async persistBuiltTeamRun(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    steps: BuiltStep[] | RuntimeAgentTeamStepResult[],
    options: {
      status: AgentTeamRunSummary['status'];
      traceId: string;
      startedAt?: Date;
      latencyMs: number;
      totalTokens?: number;
      totalCost?: number;
      errorMessage?: string | null;
    },
  ) {
    const completedSteps = steps.filter((step) => step.status === 'SUCCESS').length;
    const failedSteps = steps.filter((step) => step.status === 'FAILED').length;
    const now = new Date();
    const startedAt = options.startedAt ?? now;

    await this.prisma.agentTeamStep.deleteMany({
      where: {
        tenantId: currentUser.tenantId,
        runId,
      },
    });

    await this.prisma.agentTeamRun.update({
      where: {
        id: runId,
      },
      data: {
        status: options.status,
        traceId: options.traceId,
        totalSteps: steps.length,
        completedSteps,
        failedSteps,
        totalTokens: options.totalTokens ?? sumStepNumbers(steps, 'totalTokens', 'total_tokens'),
        totalCost: new Prisma.Decimal(options.totalCost ?? sumStepNumbers(steps, 'costTotal', 'cost_total')),
        latencyMs: options.latencyMs,
        errorMessage: options.errorMessage ?? null,
        endedAt: options.status === 'WAITING_HUMAN' ? null : now,
        updatedBy: currentUser.id,
        steps: {
          create: steps.map((step) => mapTeamStepCreateInput(currentUser.tenantId, teamId, step, startedAt, options.traceId)),
        },
      },
    });
  }

  private async recordTeamRunPlatformProjection(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    projection: TeamRunPlatformProjection,
  ) {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: runId,
        deletedAt: null,
      },
      select: {
        requestId: true,
        traceId: true,
        createdAt: true,
        endedAt: true,
      },
    });
    const requestId = projection.requestId ?? run?.requestId ?? currentUser.requestId ?? null;
    const traceId = projection.traceId ?? run?.traceId ?? currentUser.traceId ?? null;
    const occurredAt = run?.endedAt ?? new Date();
    const eventType = teamRunEventType(projection.status);
    const severity = teamRunSeverity(projection.status);

    const event = await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'AGENT_TEAM',
      resourceId: teamId,
      teamId,
      runId,
      requestId,
      traceId,
      eventSource: 'AGENT_TEAM',
      eventType,
      status: projection.status,
      severity,
      billable: projection.status !== 'FAILED',
      summary: projection.summary,
      payloadJson: {
        total_steps: projection.totalSteps,
        completed_steps: projection.completedSteps,
        failed_steps: projection.failedSteps,
        total_tokens: projection.totalTokens,
        total_cost: projection.totalCost,
        latency_ms: projection.latencyMs,
        error_message: projection.errorMessage,
        handoff_count: projection.handoffs.length,
      },
      occurredAt,
      sourceSystem: projection.sourceSystem,
      sourceId: runId,
      dedupeKey: `${projection.sourceSystem}:${runId}:${eventType}`,
    });

    await Promise.all([
      this.platformEvents.recordUsage({
        tenantId: currentUser.tenantId,
        departmentId: currentUser.departmentId ?? null,
        userId: currentUser.id,
        subjectType: 'AGENT_TEAM',
        subjectId: teamId,
        resourceType: 'AGENT_TEAM',
        resourceId: teamId,
        metricType: 'agent_team_runs',
        unit: 'run',
        quantity: 1,
        amount: 0,
        billable: false,
        costSource: 'AGENT_TEAM_RUNTIME',
        traceId,
        requestId,
        eventId: event.id,
        sourceSystem: 'agent_team_run',
        sourceId: runId,
        occurredAt,
      }),
      this.platformEvents.recordUsage({
        tenantId: currentUser.tenantId,
        departmentId: currentUser.departmentId ?? null,
        userId: currentUser.id,
        subjectType: 'AGENT_TEAM',
        subjectId: teamId,
        resourceType: 'AGENT_TEAM',
        resourceId: teamId,
        metricType: 'workflow_steps',
        unit: 'step',
        quantity: projection.totalSteps,
        amount: 0,
        billable: false,
        costSource: 'AGENT_TEAM_RUNTIME',
        traceId,
        requestId,
        eventId: event.id,
        sourceSystem: 'agent_team_run',
        sourceId: runId,
        occurredAt,
      }),
      this.platformEvents.recordUsage({
        tenantId: currentUser.tenantId,
        departmentId: currentUser.departmentId ?? null,
        userId: currentUser.id,
        subjectType: 'AGENT_TEAM',
        subjectId: teamId,
        resourceType: 'MODEL',
        resourceId: null,
        metricType: 'model_tokens',
        unit: 'token',
        quantity: projection.totalTokens,
        amount: projection.totalCost,
        billable: projection.totalTokens > 0,
        costSource: 'AGENT_TEAM_RUNTIME',
        traceId,
        requestId,
        eventId: event.id,
        sourceSystem: 'agent_team_run',
        sourceId: runId,
        occurredAt,
      }),
      this.platformEvents.recordUsage({
        tenantId: currentUser.tenantId,
        departmentId: currentUser.departmentId ?? null,
        userId: currentUser.id,
        subjectType: 'AGENT_TEAM',
        subjectId: teamId,
        resourceType: 'AGENT_TEAM',
        resourceId: teamId,
        metricType: 'agent_team_cost',
        unit: 'usd',
        quantity: projection.totalCost,
        amount: projection.totalCost,
        billable: projection.totalCost > 0,
        costSource: 'AGENT_TEAM_RUNTIME',
        traceId,
        requestId,
        eventId: event.id,
        sourceSystem: 'agent_team_run',
        sourceId: runId,
        occurredAt,
      }),
      ...projection.handoffs.map((handoff, index) =>
        this.platformEvents.recordEvent({
          tenantId: currentUser.tenantId,
          departmentId: currentUser.departmentId ?? null,
          userId: currentUser.id,
          actorType: handoff.status === 'PENDING' ? 'RUNTIME' : 'SYSTEM',
          resourceType: 'AGENT_TEAM',
          resourceId: teamId,
          agentId: handoff.to_agent_id ?? handoff.from_agent_id ?? null,
          teamId,
          runId,
          requestId,
          traceId,
          eventSource: 'AGENT_TEAM',
          eventType: 'agent.team.handoff',
          status: handoff.status,
          severity: handoff.status === 'PENDING' ? 'WARN' : 'INFO',
          billable: false,
          summary: handoff.reason,
          payloadJson: {
            from_member_id: handoff.from_member_id,
            to_member_id: handoff.to_member_id,
            from_agent_id: handoff.from_agent_id,
            to_agent_id: handoff.to_agent_id,
            decision_note: handoff.decision_note,
            decided_at: handoff.decided_at,
          },
          occurredAt: parseDate(handoff.decided_at) ?? occurredAt,
          sourceSystem: 'agent_team_handoff',
          sourceId: `${runId}:${index + 1}`,
          dedupeKey: `agent_team_handoff:${runId}:${index + 1}`,
        }),
      ),
    ]);
  }

  private async recordTeamRunStartedEvent(
    currentUser: AuthenticatedUser,
    input: {
      teamId: string;
      runId: string;
      objective: string;
      requestId: string | null;
      traceId: string | null;
      startedAt: Date;
    },
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'AGENT_TEAM',
      resourceId: input.teamId,
      teamId: input.teamId,
      runId: input.runId,
      requestId: input.requestId,
      traceId: input.traceId,
      eventSource: 'AGENT_TEAM',
      eventType: 'agent.team.run.started',
      status: 'RUNNING',
      severity: 'INFO',
      billable: false,
      summary: '多 Agent 协作团队运行已启动。',
      payloadJson: {
        team_id: input.teamId,
        run_id: input.runId,
        objective: input.objective,
      },
      occurredAt: input.startedAt,
      sourceSystem: 'agent_team_run',
      sourceId: input.runId,
      dedupeKey: `agent_team_run:${input.runId}:started`,
    });
  }

  private async resolvePromptSnapshots(
    tenantId: string,
    member: AgentTeamMemberRecord,
  ): Promise<RuntimePromptSnapshot[]> {
    const activeBindings = member.agent.promptBindings.filter((binding) => binding.deletedAt === null);
    if (activeBindings.length === 0) {
      return [];
    }

    const templates = await this.prisma.promptTemplate.findMany({
      where: {
        tenantId,
        id: {
          in: activeBindings.map((binding) => binding.promptId),
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
    member: AgentTeamMemberRecord,
  ): Promise<RuntimeKnowledgeBindingSnapshot[]> {
    const activeBindings = member.agent.knowledgeBindings.filter((binding) => binding.deletedAt === null);
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
    member: AgentTeamMemberRecord,
  ): Promise<RuntimeToolSnapshot[]> {
    const activeBindings = member.agent.toolBindings.filter((binding) => binding.deletedAt === null);
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

  private async resolveModelConfig(
    tenantId: string,
    member: AgentTeamMemberRecord,
  ): Promise<RuntimeModelConfig | null> {
    const boundModelId = member.agent.modelBindings.find((binding) => binding.deletedAt === null)?.modelId ?? null;
    const model = await this.prisma.modelConfig.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(boundModelId ? { id: boundModelId } : { isDefault: true }),
        provider: {
          is: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
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
              take: 1,
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

    const activeKey = model?.provider.apiKeys[0] ?? null;
    if (!model || !activeKey) {
      return null;
    }

    return {
      provider_type: model.provider.providerType,
      base_url: model.provider.baseUrl,
      api_key: decryptSecret(activeKey.encryptedKey),
      model: model.model,
      temperature: Number(member.agent.temperature),
      api_version: model.apiVersion,
      max_output_tokens: model.maxOutputTokens,
      input_price: Number(model.inputPrice),
      output_price: Number(model.outputPrice),
    };
  }

  private async resolveSupervisorModelConfig(
    tenantId: string,
    modelId?: string | null,
  ): Promise<RuntimeModelConfig | null> {
    if (!modelId) {
      return null;
    }

    const model = await this.prisma.modelConfig.findFirst({
      where: {
        tenantId,
        id: modelId,
        deletedAt: null,
        status: 'ACTIVE',
        provider: {
          is: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
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
              take: 1,
            },
          },
        },
      },
    });

    const activeKey = model?.provider.apiKeys[0] ?? null;
    if (!model || !activeKey) {
      return null;
    }

    return {
      provider_type: model.provider.providerType,
      base_url: model.provider.baseUrl,
      api_key: decryptSecret(activeKey.encryptedKey),
      model: model.model,
      temperature: 0.2,
      api_version: model.apiVersion,
      max_output_tokens: model.maxOutputTokens,
      input_price: Number(model.inputPrice),
      output_price: Number(model.outputPrice),
    };
  }

  private async writeRuntimeModelCallLog(
    currentUser: AuthenticatedUser,
    modelCall: RuntimeModelCallSummary,
  ) {
    const model = await this.prisma.modelConfig.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        model: modelCall.request_model,
        deletedAt: null,
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
              take: 1,
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    }) ?? await this.prisma.modelConfig.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
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
              take: 1,
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    if (!model) {
      return;
    }

    const inputCost = (modelCall.prompt_tokens / 1000) * Number(model.inputPrice);
    const outputCost = (modelCall.completion_tokens / 1000) * Number(model.outputPrice);
    const activeKey = model.provider.apiKeys[0] ?? null;

    await this.prisma.modelCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId: model.providerId,
        modelConfigId: model.id,
        traceId: modelCall.trace_id,
        requestModel: modelCall.request_model,
        status: modelCall.status,
        promptTokens: modelCall.prompt_tokens,
        completionTokens: modelCall.completion_tokens,
        totalTokens: modelCall.total_tokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        latencyMs: modelCall.latency_ms,
        requestSummary: modelCall.request_summary as Prisma.InputJsonValue,
        responseSummary: modelCall.response_summary as Prisma.InputJsonValue,
        errorMessage: modelCall.error_message ?? null,
      },
    });

    if (activeKey) {
      await this.prisma.modelApiKey.update({
        where: {
          id: activeKey.id,
        },
        data: {
          lastUsedAt: new Date(),
          updatedBy: currentUser.id,
        },
      });
    }
  }

  async createHandoff(
    currentUser: AuthenticatedUser,
    runId: string,
    dto: CreateAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: runId,
        deletedAt: null,
      },
      include: {
        team: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在。');
    }

    await this.validateHandoffReferences(currentUser.tenantId, run.teamId, dto);
    const status = dto.status ?? 'PENDING';
    const decided = status === 'APPROVED' || status === 'REJECTED' || status === 'AUTO';

    const createdHandoff = await this.prisma.agentTeamHandoff.create({
      data: {
        tenantId: currentUser.tenantId,
        teamId: run.teamId,
        runId,
        fromMemberId: dto.from_member_id || null,
        toMemberId: dto.to_member_id || null,
        fromAgentId: dto.from_agent_id || null,
        toAgentId: dto.to_agent_id || null,
        reason: dto.reason.trim(),
        status,
        decisionNote: dto.decision_note?.trim() || null,
        decidedBy: decided ? currentUser.id : null,
        decidedAt: decided ? new Date() : null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });

    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'AGENT_TEAM',
      resourceId: run.teamId,
      teamId: run.teamId,
      runId,
      requestId: run.requestId ?? currentUser.requestId ?? null,
      traceId: run.traceId ?? currentUser.traceId ?? null,
      eventSource: 'AGENT_TEAM',
      eventType: 'agent.team.handoff.created',
      status,
      severity: status === 'PENDING' ? 'INFO' : 'WARN',
      billable: false,
      summary: dto.reason.trim(),
      payloadJson: {
        handoff_status: status,
        from_member_id: dto.from_member_id ?? null,
        to_member_id: dto.to_member_id ?? null,
        from_agent_id: dto.from_agent_id ?? null,
        to_agent_id: dto.to_agent_id ?? null,
        decision_note: dto.decision_note?.trim() || null,
      },
      sourceSystem: 'agent_team_handoff',
      sourceId: createdHandoff.id,
      dedupeKey: `agent_team_handoff_created:${createdHandoff.id}`,
    });

    if (status === 'PENDING') {
      await this.prisma.agentTeamRun.update({
        where: {
          id: runId,
        },
        data: {
          status: 'WAITING_HUMAN',
          updatedBy: currentUser.id,
        },
      });
    }

    await this.touchTeam(run.teamId, currentUser.id);
    return this.get(currentUser, run.teamId);
  }

  async approveHandoff(
    currentUser: AuthenticatedUser,
    handoffId: string,
    dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    const handoff = await this.findPendingHandoff(currentUser.tenantId, handoffId);
    const decisionNote = nullableText(dto.decision_note) ?? '审批通过，继续执行团队任务。';
    const resumeContext = await this.buildTeamResumeContext(currentUser.tenantId, handoff.runId, handoff.id, decisionNote);

    await this.prisma.$transaction([
      this.prisma.agentTeamHandoff.update({
        where: {
          id: handoff.id,
        },
        data: {
          status: 'APPROVED',
          decisionNote,
          decidedBy: currentUser.id,
          decidedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.agentTeamRun.update({
        where: {
          id: handoff.runId,
        },
        data: {
          status: 'RUNNING',
          endedAt: null,
          errorMessage: null,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    try {
      await this.resumeRuntimeTeamWorkflow(handoff.runId, true, handoff.id, decisionNote, resumeContext);
    } catch (error) {
      if (AGENT_TEAM_WORKFLOW_MODE === 'temporal_first') {
        await this.executeRuntimeTeamRun(currentUser, handoff.runId);
      } else {
        const message = error instanceof Error ? error.message : 'Temporal workflow resume failed';
        await this.markWorkflowDispatchFailed(currentUser, handoff.runId, message);
      }
    }

    await this.recordHandoffDecisionEvent(
      currentUser,
      handoff.teamId,
      handoff.runId,
      handoff.id,
      'APPROVED',
      decisionNote,
      handoff.run.requestId ?? currentUser.requestId ?? null,
      handoff.run.traceId ?? currentUser.traceId ?? null,
    );
    await this.touchTeam(handoff.teamId, currentUser.id);
    return this.get(currentUser, handoff.teamId);
  }

  async rejectHandoff(
    currentUser: AuthenticatedUser,
    handoffId: string,
    dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    const handoff = await this.findPendingHandoff(currentUser.tenantId, handoffId);
    const decisionNote = nullableText(dto.decision_note) ?? '审批拒绝，团队任务已结束。';

    await this.prisma.$transaction([
      this.prisma.agentTeamHandoff.update({
        where: {
          id: handoff.id,
        },
        data: {
          status: 'REJECTED',
          decisionNote,
          decidedBy: currentUser.id,
          decidedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.agentTeamRun.update({
        where: {
          id: handoff.runId,
        },
        data: {
          status: 'FAILED',
          errorMessage: decisionNote,
          endedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
    ]);

    try {
      await this.resumeRuntimeTeamWorkflow(handoff.runId, false, handoff.id, decisionNote, null);
    } catch {
      // Runtime signal is best-effort for rejection; Control API is already the source of truth.
    }

    const run = await this.prisma.agentTeamRun.findUnique({
      where: {
        id: handoff.runId,
      },
    });
    if (run) {
      await this.recordTeamRunPlatformProjection(currentUser, handoff.teamId, handoff.runId, {
        status: 'FAILED',
        traceId: run.traceId,
        requestId: run.requestId,
        totalTokens: run.totalTokens,
        totalCost: Number(run.totalCost),
        latencyMs: run.latencyMs,
        totalSteps: run.totalSteps,
        completedSteps: run.completedSteps,
        failedSteps: run.failedSteps,
        summary: '人工介入已拒绝，团队任务结束。',
        errorMessage: decisionNote,
        handoffs: [],
        sourceSystem: 'agent_team_handoff',
      });
    }

    await this.recordHandoffDecisionEvent(
      currentUser,
      handoff.teamId,
      handoff.runId,
      handoff.id,
      'REJECTED',
      decisionNote,
      run?.requestId ?? currentUser.requestId ?? null,
      run?.traceId ?? currentUser.traceId ?? null,
    );
    await this.touchTeam(handoff.teamId, currentUser.id);
    return this.get(currentUser, handoff.teamId);
  }

  async createFeedback(
    currentUser: AuthenticatedUser,
    runId: string,
    dto: CreateAgentTeamFeedbackDto,
  ): Promise<AgentTeamFeedbackItem> {
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: runId,
        deletedAt: null,
      },
    });

    if (!run) {
      throw new NotFoundException('Agent 协作运行不存在。');
    }

    const feedback = await this.prisma.agentTeamFeedback.create({
      data: {
        tenantId: currentUser.tenantId,
        teamId: run.teamId,
        runId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        createdBy: currentUser.id,
      },
      include: {
        author: true,
      },
    });

    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'AGENT_TEAM',
      resourceId: run.teamId,
      teamId: run.teamId,
      runId,
      requestId: run.requestId ?? currentUser.requestId ?? null,
      traceId: run.traceId ?? currentUser.traceId ?? null,
      eventSource: 'AGENT_TEAM',
      eventType: 'agent.team.feedback.created',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: '已提交团队反馈。',
      payloadJson: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      sourceSystem: 'agent_team_feedback',
      sourceId: feedback.id,
      dedupeKey: `agent_team_feedback_created:${feedback.id}`,
    });

    await this.touchTeam(run.teamId, currentUser.id);
    return this.mapFeedback(feedback);
  }

  private async findPendingHandoff(tenantId: string, handoffId: string) {
    const handoff = await this.prisma.agentTeamHandoff.findFirst({
      where: {
        tenantId,
        id: handoffId,
        deletedAt: null,
      },
      include: {
        run: true,
      },
    });

    if (!handoff) {
      throw new NotFoundException('Agent 协作接力记录不存在。');
    }

    if (handoff.status !== 'PENDING') {
      throw new BadRequestException('只有待处理接力可以审批。');
    }

    if (handoff.run.status !== 'WAITING_HUMAN') {
      throw new BadRequestException('当前团队运行未处于等待人工介入状态。');
    }

    return handoff;
  }

  private async recordHandoffDecisionEvent(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    handoffId: string,
    status: 'APPROVED' | 'REJECTED',
    decisionNote: string,
    requestId?: string | null,
    traceId?: string | null,
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'AGENT_TEAM',
      resourceId: teamId,
      teamId,
      runId,
      requestId: requestId ?? currentUser.requestId ?? null,
      traceId: traceId ?? currentUser.traceId ?? null,
      eventSource: 'AGENT_TEAM',
      eventType: status === 'APPROVED' ? 'agent.team.handoff.approved' : 'agent.team.handoff.rejected',
      status,
      severity: status === 'APPROVED' ? 'INFO' : 'WARN',
      billable: false,
      summary: decisionNote,
      payloadJson: {
        handoff_id: handoffId,
        decision_note: decisionNote,
      },
      occurredAt: new Date(),
      sourceSystem: 'agent_team_handoff',
      sourceId: handoffId,
      dedupeKey: `agent_team_handoff_decision:${handoffId}:${status}`,
    });
  }

  private async findTeam(tenantId: string, id: string): Promise<AgentTeamRecord> {
    const team = await this.prisma.agentTeam.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: teamInclude,
    });

    if (!team) {
      throw new NotFoundException('Agent 协作团队不存在。');
    }

    return team;
  }

  private async ensureTeamExists(tenantId: string, id: string) {
    await this.findTeam(tenantId, id);
  }

  private async ensureAgentExists(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
    });

    if (!agent) {
      throw new BadRequestException('Agent 不存在或已删除。');
    }
  }

  private async ensureMemberExists(tenantId: string, teamId: string, memberId: string) {
    const member = await this.prisma.agentTeamMember.findFirst({
      where: {
        tenantId,
        teamId,
        id: memberId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException('Agent 协作团队成员不存在。');
    }
  }

  private async getRunReportArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
  ): Promise<AgentTeamRunReportArchiveApprovalItem> {
    const items = await this.listRunReportArchiveDeleteApprovals(currentUser);
    const item = items.find((approval) => approval.id === approvalId);

    if (!item) {
      throw new NotFoundException('团队运行报告归档删除审批不存在。');
    }

    return item;
  }

  private async loadRunReportArchiveDeleteEvents(tenantId: string) {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'AGENT_TEAM_RUN_REPORT_ARCHIVE',
        eventType: {
          in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'],
        },
      },
      include: runReportArchiveAuditInclude,
      orderBy: {
        occurredAt: 'desc',
      },
      take: 500,
    });

    return items.map(mapRunReportArchiveAuditEvent);
  }

  private async findPendingRunReportArchiveDeleteApproval(tenantId: string, sourceId: string) {
    const events = (await this.loadRunReportArchiveDeleteEvents(tenantId)).filter((event) => event.source_id === sourceId);
    const approval = buildRunReportArchiveDeleteApprovals(events)[0] ?? null;
    return approval?.status === 'PENDING' ? approval : null;
  }

  private async recordRunReportArchiveAuditEvent(input: {
    tenantId: string;
    sourceId: string;
    eventType: string;
    eventStatus: string;
    title: string;
    note?: string | null;
    requestId?: string | null;
    traceId?: string | null;
    metadata?: Record<string, unknown> | null;
    actorId?: string | null;
  }) {
    return this.prisma.approvalAuditEvent.create({
      data: {
        tenantId: input.tenantId,
        sourceType: 'AGENT_TEAM_RUN_REPORT_ARCHIVE',
        sourceId: input.sourceId,
        eventType: input.eventType,
        eventStatus: input.eventStatus,
        title: input.title,
        note: input.note ?? null,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        metadata: input.metadata ? toJsonInput(input.metadata) : Prisma.JsonNull,
        actorId: input.actorId ?? null,
      },
    });
  }

  private async validateOwner(tenantId: string, ownerId?: string | null) {
    if (!ownerId) return;

    const owner = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id: ownerId,
        deletedAt: null,
      },
    });

    if (!owner) {
      throw new BadRequestException('负责人不存在或已删除。');
    }
  }

  private async validateSupervisorModel(tenantId: string, modelId?: string | null) {
    if (!modelId) return;

    const model = await this.prisma.modelConfig.findFirst({
      where: {
        tenantId,
        id: modelId,
        deletedAt: null,
        status: 'ACTIVE',
        provider: {
          is: {
            deletedAt: null,
            status: 'ACTIVE',
            apiKeys: {
              some: {
                deletedAt: null,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!model) {
      throw new BadRequestException('Supervisor 模型不存在、已停用、已删除或缺少可用密钥。');
    }
  }

  private validateTeamPolicyLimits(dto: CreateAgentTeamDto | UpdateAgentTeamDto) {
    if (dto.quality_threshold !== undefined && (dto.quality_threshold < 0 || dto.quality_threshold > 1)) {
      throw new BadRequestException('质量门槛阈值必须在 0 到 1 之间。');
    }

    if (dto.budget_token_limit !== undefined && dto.budget_token_limit !== null && dto.budget_token_limit <= 0) {
      throw new BadRequestException('Token 预算上限必须大于 0。');
    }

    if (dto.budget_cost_limit !== undefined && dto.budget_cost_limit !== null && dto.budget_cost_limit <= 0) {
      throw new BadRequestException('成本预算上限必须大于 0。');
    }
  }

  private async validateHandoffReferences(tenantId: string, teamId: string, dto: CreateAgentTeamHandoffDto) {
    const memberIds = [dto.from_member_id, dto.to_member_id].filter((id): id is string => Boolean(id));
    if (memberIds.length > 0) {
      const count = await this.prisma.agentTeamMember.count({
        where: {
          tenantId,
          teamId,
          id: {
            in: memberIds,
          },
          deletedAt: null,
        },
      });
      if (count !== new Set(memberIds).size) {
        throw new BadRequestException('接力成员必须属于当前 Agent 协作团队。');
      }
    }

    const agentIds = [dto.from_agent_id, dto.to_agent_id].filter((id): id is string => Boolean(id));
    if (agentIds.length > 0) {
      const count = await this.prisma.agent.count({
        where: {
          tenantId,
          id: {
            in: agentIds,
          },
          deletedAt: null,
        },
      });
      if (count !== new Set(agentIds).size) {
        throw new BadRequestException('接力 Agent 不存在或已删除。');
      }
    }
  }

  private async touchTeam(teamId: string, userId: string) {
    await this.prisma.agentTeam.update({
      where: {
        id: teamId,
      },
      data: {
        updatedBy: userId,
      },
    });
  }

  private mapTeamListItem(team: AgentTeamListRecord): AgentTeamListItem {
    const latestRun = team.runs[0] ?? null;

    return {
      id: team.id,
      tenant_id: team.tenantId,
      name: team.name,
      code: team.code,
      description: team.description,
      status: team.status as AgentTeamListItem['status'],
      mode: team.mode as AgentTeamListItem['mode'],
      max_rounds: team.maxRounds,
      timeout_seconds: team.timeoutSeconds,
      handoff_policy: team.handoffPolicy as AgentTeamListItem['handoff_policy'],
      supervisor_model_id: team.supervisorModelId,
      supervisor_model_name: team.supervisorModel?.name ?? null,
      supervisor_model: team.supervisorModel?.model ?? null,
      supervisor_prompt: team.supervisorPrompt,
      failure_policy: team.failurePolicy as AgentTeamListItem['failure_policy'],
      quality_gate_enabled: team.qualityGateEnabled,
      quality_threshold: Number(team.qualityThreshold),
      budget_token_limit: team.budgetTokenLimit,
      budget_cost_limit: team.budgetCostLimit === null ? null : Number(team.budgetCostLimit),
      owner: team.owner ? mapOwner(team.owner) : null,
      member_count: team.members.length,
      active_member_count: team.members.filter((member) => member.status === 'ACTIVE').length,
      run_count: team.runs.length,
      latest_run: latestRun ? this.mapRun(latestRun) : null,
      created_at: team.createdAt.toISOString(),
      updated_at: team.updatedAt.toISOString(),
    };
  }

  private mapTeamDetail(team: AgentTeamRecord): AgentTeamDetail {
    return {
      ...this.mapTeamListItem(team),
      member_count: team.members.length,
      active_member_count: team.members.filter((member) => member.status === 'ACTIVE').length,
      run_count: team.runs.length,
      latest_run: team.runs[0] ? this.mapRun(team.runs[0]) : null,
      members: team.members.map((member) => this.mapMember(member)),
      runs: team.runs.map((run) => this.mapRun(run)),
      steps: team.steps.map((step) => this.mapStep(step)),
      handoffs: team.handoffs.map((handoff) => this.mapHandoff(handoff)),
      feedback: team.feedback.map((feedback) => this.mapFeedback(feedback)),
    };
  }

  private mapMember(
    member: Prisma.AgentTeamMemberGetPayload<{
      include: {
        agent: true;
      };
    }>,
  ): AgentTeamMemberItem {
    return {
      id: member.id,
      agent_id: member.agentId,
      agent_name: member.agent.name,
      agent_code: member.agent.code,
      role: member.role,
      responsibility: member.responsibility,
      execution_order: member.executionOrder,
      required: member.required,
      status: member.status as AgentTeamMemberItem['status'],
      created_at: member.createdAt.toISOString(),
      updated_at: member.updatedAt.toISOString(),
    };
  }

  private mapRun(
    run: Prisma.AgentTeamRunGetPayload<{
      include: {
        operator: true;
      };
    }>,
  ): AgentTeamRunSummary {
    return {
      id: run.id,
      objective: run.objective,
      status: run.status as AgentTeamRunSummary['status'],
      request_id: run.requestId,
      trace_id: run.traceId,
      total_steps: run.totalSteps,
      completed_steps: run.completedSteps,
      failed_steps: run.failedSteps,
      total_tokens: run.totalTokens,
      total_cost: Number(run.totalCost),
      latency_ms: run.latencyMs,
      error_message: run.errorMessage,
      started_at: run.startedAt?.toISOString() ?? null,
      ended_at: run.endedAt?.toISOString() ?? null,
      created_at: run.createdAt.toISOString(),
      created_by: run.operator ? mapOwner(run.operator) : null,
    };
  }

  private mapStep(
    step: Prisma.AgentTeamStepGetPayload<{
      include: {
        agent: true;
      };
    }>,
  ): AgentTeamStepItem {
    return {
      id: step.id,
      run_id: step.runId,
      member_id: step.memberId,
      agent_id: step.agentId,
      agent_name: step.agent?.name ?? null,
      agent_code: step.agent?.code ?? null,
      step_type: step.stepType as AgentTeamStepItem['step_type'],
      title: step.title,
      status: step.status as AgentTeamStepItem['status'],
      input_summary: step.inputSummary,
      output_summary: step.outputSummary,
      trace_id: step.traceId,
      span_id: step.spanId,
      parent_span_id: step.parentSpanId,
      duration_ms: step.durationMs,
      prompt_tokens: step.promptTokens,
      completion_tokens: step.completionTokens,
      total_tokens: step.totalTokens,
      cost_total: Number(step.costTotal),
      child_steps: normalizeJsonArray<ConversationRunStepItem>(step.childSteps),
      references: normalizeJsonArray<ConversationReferenceItem>(step.references),
      tool_calls: normalizeJsonArray<ConversationToolCallItem>(step.toolCalls),
      model_call: normalizeJsonObject<AgentTeamModelCallItem>(step.modelCall),
      error_message: step.errorMessage,
      started_at: step.startedAt?.toISOString() ?? null,
      ended_at: step.endedAt?.toISOString() ?? null,
      created_at: step.createdAt.toISOString(),
    };
  }

  private mapHandoff(
    handoff: Prisma.AgentTeamHandoffGetPayload<{
      include: {
        fromAgent: true;
        toAgent: true;
        decider: true;
      };
    }>,
  ): AgentTeamHandoffItem {
    return {
      id: handoff.id,
      run_id: handoff.runId,
      from_member_id: handoff.fromMemberId,
      to_member_id: handoff.toMemberId,
      from_agent_id: handoff.fromAgentId,
      to_agent_id: handoff.toAgentId,
      from_agent_name: handoff.fromAgent?.name ?? null,
      to_agent_name: handoff.toAgent?.name ?? null,
      reason: handoff.reason,
      status: handoff.status as AgentTeamHandoffItem['status'],
      decision_note: handoff.decisionNote,
      decided_by: handoff.decider ? mapOwner(handoff.decider) : null,
      decided_at: handoff.decidedAt?.toISOString() ?? null,
      created_at: handoff.createdAt.toISOString(),
      created_by: null,
    };
  }

  private async recordRuntimeTeamStepEvents(
    currentUser: AuthenticatedUser,
    teamId: string,
    runId: string,
    steps: Array<BuiltStep | RuntimeAgentTeamStepResult>,
    sourceSystem: string,
    requestId: string | null,
    traceId: string | null,
  ) {
    if (steps.length === 0) {
      return;
    }

    await Promise.all(
      steps.map((step) => {
        const memberId = stepString(step, 'memberId', 'member_id');
        const agentId = stepString(step, 'agentId', 'agent_id');
        const stepType = stepString(step, 'stepType', 'step_type') ?? 'AGENT_RUN';
        const inputSummary = stepString(step, 'inputSummary', 'input_summary');
        const outputSummary = stepString(step, 'outputSummary', 'output_summary');
        const stepTraceId = stepString(step, 'traceId', 'trace_id') ?? traceId;
        const parentSpanId = stepString(step, 'parentSpanId', 'parent_span_id');
        const stepSourceId = memberId ?? agentId ?? `${runId}:${stepType}`;

        return this.platformEvents.recordEvent({
          tenantId: currentUser.tenantId,
          departmentId: currentUser.departmentId ?? null,
          userId: currentUser.id,
          actorType: 'RUNTIME',
          resourceType: 'AGENT_TEAM',
          resourceId: teamId,
          teamId,
          runId,
          requestId,
          traceId: stepTraceId,
          parentTraceId: parentSpanId,
          eventSource: 'AGENT_TEAM',
          eventType: `agent.team.step.${stepType.toLowerCase()}.${step.status.toLowerCase()}`,
          status: step.status,
          severity: step.status === 'FAILED' ? 'ERROR' : step.status === 'SUCCESS' ? 'INFO' : 'WARN',
          billable: false,
          summary: step.title ?? outputSummary ?? '团队步骤已记录。',
          payloadJson: {
            step_id: `${runId}:${stepSourceId}:${stepType}`,
            member_id: memberId,
            agent_id: agentId,
            step_type: stepType,
            input_summary: inputSummary,
            output_summary: outputSummary,
            duration_ms: stepNumber(step, 'durationMs', 'duration_ms'),
            prompt_tokens: stepNumber(step, 'promptTokens', 'prompt_tokens'),
            completion_tokens: stepNumber(step, 'completionTokens', 'completion_tokens'),
            total_tokens: stepNumber(step, 'totalTokens', 'total_tokens'),
            cost_total: stepNumber(step, 'costTotal', 'cost_total'),
            error_message: stepString(step, 'errorMessage', 'error_message'),
          },
          sourceSystem,
          sourceId: stepSourceId,
          dedupeKey: `${sourceSystem}:${runId}:${stepSourceId}:${step.status}`,
        });
      }),
    );
  }

  private mapFeedback(
    feedback: Prisma.AgentTeamFeedbackGetPayload<{
      include: {
        author: true;
      };
    }>,
  ): AgentTeamFeedbackItem {
    return {
      id: feedback.id,
      run_id: feedback.runId,
      rating: feedback.rating,
      comment: feedback.comment,
      created_at: feedback.createdAt.toISOString(),
      created_by: feedback.author ? mapOwner(feedback.author) : null,
    };
  }
}

interface BuiltStep {
  memberId: string | null;
  agentId: string | null;
  stepType: AgentTeamStepItem['step_type'];
  title: string;
  status: AgentTeamStepItem['status'];
  inputSummary: string | null;
  outputSummary: string | null;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costTotal?: number;
  childSteps?: ConversationRunStepItem[];
  references?: ConversationReferenceItem[];
  toolCalls?: ConversationToolCallItem[];
  modelCall?: AgentTeamModelCallItem | null;
  errorMessage?: string | null;
  startedAt?: Date;
  endedAt?: Date;
}

function buildRunSteps(
  team: AgentTeamRecord,
  members: AgentTeamRecord['members'],
  objective: string,
  traceId: string,
  startedAt: Date,
  error?: unknown,
): BuiltStep[] {
  const rootSpanId = createSpanId();
  const errorMessage = error instanceof Error ? error.message : error ? 'Runtime 团队编排失败。' : null;
  const steps: BuiltStep[] = [
    {
      memberId: null,
      agentId: null,
      stepType: 'PLAN',
      title: '团队任务规划',
      status: 'SUCCESS',
      inputSummary: objective.trim(),
      outputSummary: errorMessage
        ? `已按 ${team.mode} 模式规划 ${members.length} 个成员步骤，但 Runtime 编排失败，已进入失败台账。`
        : `已按 ${team.mode} 模式规划 ${members.length} 个成员步骤，Trace ${traceId}。`,
      traceId,
      spanId: rootSpanId,
      parentSpanId: null,
      durationMs: Math.max(1, Date.now() - startedAt.getTime()),
      startedAt,
      endedAt: new Date(),
    },
  ];

  members.forEach((member, index) => {
    steps.push({
      memberId: member.id,
      agentId: member.agentId,
      stepType: 'AGENT_RUN',
      title: `${member.agent.name} 执行 ${member.role}`,
      status: errorMessage ? 'SKIPPED' : 'SUCCESS',
      inputSummary: member.responsibility || objective.trim(),
      outputSummary: errorMessage
        ? `Runtime 编排失败，${member.agent.name} 未执行。`
        : `已记录 ${member.agent.name} 的协作执行台账，Runtime 编排已接入真实子 Agent 执行链路。`,
      traceId,
      spanId: createSpanId(),
      parentSpanId: rootSpanId,
      durationMs: 20 + index * 5,
      errorMessage,
      startedAt,
      endedAt: new Date(startedAt.getTime() + 20 + index * 5),
    });
  });

  steps.push({
    memberId: null,
    agentId: null,
    stepType: 'SUMMARY',
    title: '团队结果汇总',
    status: errorMessage ? 'FAILED' : 'SUCCESS',
    inputSummary: `完成 ${members.length} 个成员步骤。`,
    outputSummary: errorMessage || '团队协作台账已生成，可在监控和审计中通过 trace_id 继续追踪。',
    traceId,
    spanId: createSpanId(),
    parentSpanId: rootSpanId,
    durationMs: 15,
    errorMessage,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 15),
  });

  return steps;
}

function mapAgentTeamRunReportArchive(item: {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}): AgentTeamRunReportArchiveItem {
  const metadata = parseRunReportArchiveKey(item.key);
  return {
    id: Buffer.from(item.key, 'utf8').toString('base64url'),
    key: item.key,
    file_name: item.file_name,
    folder: item.folder,
    size_bytes: item.size_bytes,
    etag: item.etag,
    last_modified: item.last_modified,
    download_expires_in: AGENT_TEAM_RUN_REPORT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    team_id: metadata.teamId,
    team_name: null,
    run_id: metadata.runId,
    run_objective: null,
    created_by: null,
  };
}

function parseRunReportArchiveKey(key: string) {
  const parts = key.split('/');
  const teamId = parts.length >= 3 && parts[0] === AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX ? parts[1] ?? null : null;
  const fileName = parts.at(-1) ?? '';
  const fileNameWithoutExtension = fileName.endsWith('.csv') ? fileName.slice(0, -4) : '';
  const candidateRunId = fileNameWithoutExtension.slice(-36);
  const runId = isUuid(candidateRunId) ? candidateRunId : null;
  return { teamId, runId };
}

function buildRunReportArchiveDeleteApprovals(
  events: AgentTeamRunReportArchiveAuditEventItem[],
): AgentTeamRunReportArchiveApprovalItem[] {
  const groups = new Map<string, AgentTeamRunReportArchiveAuditEventItem[]>();

  for (const event of events) {
    groups.set(event.source_id, [...(groups.get(event.source_id) ?? []), event]);
  }

  return Array.from(groups.entries())
    .map(([sourceId, groupEvents]) => {
      const sorted = [...groupEvents].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
      const request = sorted.find((event) => event.event_type === 'DELETE_REQUESTED');
      if (!request) return null;
      const reversed = [...sorted].reverse();
      const applied = reversed.find((event) => event.event_type === 'DELETE_APPLIED') ?? null;
      const approved = reversed.find((event) => event.event_type === 'APPROVED') ?? null;
      const rejected = reversed.find((event) => event.event_type === 'REJECTED') ?? null;
      const latestDecision = applied ?? rejected ?? approved;
      const metadata = normalizeRunReportArchiveMetadata(request.metadata);

      return {
        id: request.id,
        archive_id: sourceId,
        archive_key: metadata.archive_key,
        archive_file_name: metadata.archive_file_name,
        archive_size_bytes: metadata.archive_size_bytes,
        status: runReportArchiveApprovalStatus({ applied, approved, rejected }),
        reason: request.note,
        requested_by: request.actor,
        reviewed_by: latestDecision?.actor ?? null,
        requested_at: request.occurred_at,
        reviewed_at: latestDecision?.occurred_at ?? null,
      };
    })
    .filter((item): item is AgentTeamRunReportArchiveApprovalItem => Boolean(item))
    .sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
}

function runReportArchiveApprovalStatus(input: {
  applied: AgentTeamRunReportArchiveAuditEventItem | null;
  approved: AgentTeamRunReportArchiveAuditEventItem | null;
  rejected: AgentTeamRunReportArchiveAuditEventItem | null;
}): AgentTeamRunReportArchiveApprovalItem['status'] {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function normalizeRunReportArchiveMetadata(metadata: Record<string, unknown> | null) {
  const archiveKey = typeof metadata?.archive_key === 'string' ? metadata.archive_key : '';
  return {
    archive_key: archiveKey,
    archive_file_name:
      typeof metadata?.archive_file_name === 'string'
        ? metadata.archive_file_name
        : archiveKey.split('/').at(-1) ?? '团队运行报告归档.csv',
    archive_size_bytes:
      typeof metadata?.archive_size_bytes === 'number'
        ? metadata.archive_size_bytes
        : 0,
  };
}

interface AgentTeamRunReportArchiveAuditEventItem {
  id: string;
  source_id: string;
  event_type: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
  actor: AgentOwnerSummary | null;
  occurred_at: string;
}

function mapRunReportArchiveAuditEvent(item: RunReportArchiveAuditEventRecord): AgentTeamRunReportArchiveAuditEventItem {
  return {
    id: item.id,
    source_id: item.sourceId,
    event_type: item.eventType,
    note: item.note,
    metadata: normalizeJsonRecord(item.metadata),
    actor: item.actor ? mapOwner(item.actor) : null,
    occurred_at: item.occurredAt.toISOString(),
  };
}

function agentTeamRunReportArchiveKeyFromId(archiveId: string) {
  const key = Buffer.from(archiveId, 'base64url').toString('utf8');
  if (!key.startsWith(`${AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX}/`)) {
    throw new BadRequestException('无效的团队运行报告归档 ID。');
  }
  return key;
}

function agentTeamRunReportArchiveSourceIdFromKey(key: string) {
  return uuidFromText(`agent-team-run-report-archive:${key}`);
}

function uuidFromText(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeJsonRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  return isPlainRecord(value) ? value : null;
}

function buildAgentTeamRunReportCsv(input: AgentTeamRunReportInput) {
  const rows: string[][] = [];
  const add = (section: string, recordType: string, values: Record<string, unknown>) => {
    rows.push([
      section,
      recordType,
      stringOrEmpty(values['id']),
      stringOrEmpty(values['name']),
      stringOrEmpty(values['status']),
      stringOrEmpty(values['summary']),
      stringOrEmpty(values['metric']),
      stringOrEmpty(values['metric_value']),
      stringOrEmpty(values['trace_id']),
      stringOrEmpty(values['span_id']),
      stringOrEmpty(values['parent_span_id']),
      stringOrEmpty(values['created_at']),
      stringOrEmpty(values['extra']),
    ]);
  };

  rows.push([
    '报告分区',
    '记录类型',
    '记录ID',
    '名称',
    '状态',
    '摘要',
    '指标',
    '指标值',
    'Trace ID',
    'Span ID',
    '父 Span ID',
    '时间',
    '扩展信息',
  ]);

  add('团队信息', 'team', {
    id: input.team.id,
    name: `${input.team.name} / ${input.team.code}`,
    status: input.team.mode,
    summary: `负责人：${input.team.ownerName ?? '未设置'}；Supervisor：${input.team.supervisorModel ?? '成员模型兜底'}`,
    metric: 'handoff_policy/failure_policy',
    metric_value: `${input.team.handoffPolicy}/${input.team.failurePolicy}`,
  });

  add('运行摘要', 'run', {
    id: input.run.id,
    name: input.run.objective,
    status: input.run.status,
    summary: input.run.error_message ?? '运行完成或正在执行。',
    metric: 'steps/tokens/cost/latency',
    metric_value: `${input.run.completed_steps}/${input.run.total_steps}; ${input.run.total_tokens}; ${input.run.total_cost}; ${input.run.latency_ms}ms`,
    trace_id: input.run.trace_id,
    created_at: input.run.created_at,
    extra: `request_id=${input.run.request_id ?? ''}; started_at=${input.run.started_at ?? ''}; ended_at=${input.run.ended_at ?? ''}`,
  });

  input.steps.forEach((step, index) => {
    add('成员步骤', step.step_type, {
      id: step.id,
      name: `${index + 1}. ${step.title}`,
      status: step.status,
      summary: step.output_summary ?? step.input_summary ?? step.error_message ?? '',
      metric: 'tokens/cost/latency',
      metric_value: `${step.total_tokens}; ${step.cost_total}; ${step.duration_ms}ms`,
      trace_id: step.trace_id,
      span_id: step.span_id,
      parent_span_id: step.parent_span_id,
      created_at: step.created_at,
      extra: `agent=${step.agent_name ?? '团队节点'}; prompt_tokens=${step.prompt_tokens}; completion_tokens=${step.completion_tokens}`,
    });

    step.child_steps.forEach((childStep) => {
      add('成员内部事件', childStep.type, {
        id: childStep.id,
        name: childStep.title,
        status: childStep.status,
        summary: childStep.summary,
        metric: 'tokens/items/latency',
        metric_value: `${childStep.total_tokens ?? 0}; ${childStep.item_count ?? 0}; ${childStep.latency_ms ?? 0}ms`,
        trace_id: childStep.trace_id ?? step.trace_id,
        span_id: childStep.span_id,
        parent_span_id: childStep.parent_span_id,
        created_at: step.created_at,
        extra: `model=${childStep.request_model ?? ''}; tool=${childStep.tool_name ?? ''}; retrieval=${childStep.retrieval_mode ?? ''}; response_status=${childStep.response_status ?? ''}`,
      });
    });

    step.references.forEach((reference) => {
      add('知识引用', 'reference', {
        id: reference.id,
        name: reference.title,
        status: reference.source_type ?? '',
        summary: reference.snippet,
        metric: 'score',
        metric_value: reference.score ?? '',
        trace_id: step.trace_id,
        span_id: step.span_id,
        created_at: step.created_at,
      });
    });

    step.tool_calls.forEach((toolCall) => {
      add('工具调用', 'tool_call', {
        id: toolCall.tool_id ?? toolCall.tool_code,
        name: `${toolCall.tool_name} / ${toolCall.tool_code}`,
        status: toolCall.status,
        summary: toolCall.output_preview ?? toolCall.error_message ?? '',
        metric: 'latency/response_status',
        metric_value: `${toolCall.latency_ms}ms; ${toolCall.response_status ?? ''}`,
        trace_id: step.trace_id,
        span_id: step.span_id,
        created_at: step.created_at,
        extra: `approval_request_id=${toolCall.approval_request_id ?? ''}`,
      });
    });

    if (step.model_call) {
      add('模型调用', 'model_call', {
        id: step.model_call.trace_id ?? step.id,
        name: step.model_call.request_model,
        status: step.model_call.status,
        summary: step.model_call.output_preview ?? step.model_call.error_message ?? '',
        metric: 'tokens/latency',
        metric_value: `${step.model_call.total_tokens}; ${step.model_call.latency_ms}ms`,
        trace_id: step.model_call.trace_id ?? step.trace_id,
        span_id: step.span_id,
        created_at: step.created_at,
        extra: `prompt_tokens=${step.model_call.prompt_tokens}; completion_tokens=${step.model_call.completion_tokens}`,
      });
    }
  });

  input.handoffs.forEach((handoff) => {
    add('接力记录', 'handoff', {
      id: handoff.id,
      name: `${handoff.from_agent_name ?? '团队'} -> ${handoff.to_agent_name ?? '人工处理'}`,
      status: handoff.status,
      summary: handoff.reason,
      metric: 'decision',
      metric_value: handoff.decision_note ?? '',
      created_at: handoff.created_at,
      extra: `decided_by=${handoff.decided_by?.name ?? ''}; decided_at=${handoff.decided_at ?? ''}`,
    });
  });

  input.feedback.forEach((feedback) => {
    add('反馈记录', 'feedback', {
      id: feedback.id,
      name: feedback.created_by?.name ?? '未知用户',
      status: `${feedback.rating} 分`,
      summary: feedback.comment ?? '',
      metric: 'rating',
      metric_value: feedback.rating,
      created_at: feedback.created_at,
      extra: `email=${feedback.created_by?.email ?? ''}`,
    });
  });

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function stringOrEmpty(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

function teamRunEventType(status: RuntimeAgentTeamResponse['status']) {
  if (status === 'FAILED') return 'agent.team.run.failed';
  if (status === 'WAITING_HUMAN') return 'agent.team.run.waiting_human';
  return 'agent.team.run.finished';
}

function teamRunSeverity(status: RuntimeAgentTeamResponse['status']) {
  if (status === 'FAILED') return 'ERROR';
  if (status === 'WAITING_HUMAN') return 'WARN';
  return 'INFO';
}

function mapTeamStepCreateInput(
  tenantId: string,
  teamId: string,
  step: BuiltStep | RuntimeAgentTeamStepResult,
  fallbackStartedAt: Date,
  fallbackTraceId: string,
) {
  const durationMs = stepNumber(step, 'durationMs', 'duration_ms');
  const startedAt = stepDate(step, 'startedAt', 'started_at') ?? fallbackStartedAt;
  const endedAt = stepDate(step, 'endedAt', 'ended_at') ?? new Date(startedAt.getTime() + durationMs);

  return {
    tenantId,
    teamId,
    memberId: stepString(step, 'memberId', 'member_id'),
    agentId: stepString(step, 'agentId', 'agent_id'),
    stepType: stepString(step, 'stepType', 'step_type') ?? 'AGENT_RUN',
    title: step.title,
    status: step.status,
    inputSummary: stepString(step, 'inputSummary', 'input_summary'),
    outputSummary: stepString(step, 'outputSummary', 'output_summary'),
    traceId: stepString(step, 'traceId', 'trace_id') ?? fallbackTraceId,
    spanId: stepString(step, 'spanId', 'span_id'),
    parentSpanId: stepString(step, 'parentSpanId', 'parent_span_id'),
    durationMs,
    promptTokens: stepNumber(step, 'promptTokens', 'prompt_tokens'),
    completionTokens: stepNumber(step, 'completionTokens', 'completion_tokens'),
    totalTokens: stepNumber(step, 'totalTokens', 'total_tokens'),
    costTotal: new Prisma.Decimal(stepNumber(step, 'costTotal', 'cost_total')),
    childSteps: toNullableJsonInput(stepJsonArray(step, 'childSteps', 'child_steps')),
    references: toNullableJsonInput(stepJsonArray(step, 'references', 'references')),
    toolCalls: toNullableJsonInput(stepJsonArray(step, 'toolCalls', 'tool_calls')),
    modelCall: toNullableJsonInput(stepJsonObject(step, 'modelCall', 'model_call')),
    errorMessage: stepString(step, 'errorMessage', 'error_message'),
    startedAt,
    endedAt,
  };
}

function buildRuntimeTeamStepFingerprint(step: RuntimeAgentTeamStepResult) {
  return {
    stepType: stepString(step, 'stepType', 'step_type') ?? 'AGENT_RUN',
    memberId: stepString(step, 'memberId', 'member_id'),
    agentId: stepString(step, 'agentId', 'agent_id'),
    traceId: stepString(step, 'traceId', 'trace_id'),
    spanId: stepString(step, 'spanId', 'span_id'),
  };
}

function enrichRuntimeTeamSteps(
  steps: RuntimeAgentTeamStepResult[],
  memberResults: RuntimeAgentTeamMemberResult[],
): RuntimeAgentTeamStepResult[] {
  if (steps.length === 0 || memberResults.length === 0) {
    return steps;
  }

  const membersById = new Map(memberResults.map((member) => [member.member_id, member]));
  return steps.map((step) => {
    if (step.step_type !== 'AGENT_RUN' || !step.member_id) {
      return step;
    }

    const member = membersById.get(step.member_id);
    if (!member) {
      return step;
    }

    return {
      ...step,
      child_steps: member.steps ?? [],
      references: member.references ?? [],
      tool_calls: member.tool_calls ?? [],
      model_call: mapRuntimeModelCallToTeamModelCall(member.model_call),
    };
  });
}

function mapRuntimeModelCallToTeamModelCall(modelCall?: RuntimeModelCallSummary | null): AgentTeamModelCallItem | null {
  if (!modelCall) {
    return null;
  }

  const outputPreview = stringValue(modelCall.response_summary.output_preview)
    ?? stringValue(modelCall.response_summary.output_text)?.slice(0, 240)
    ?? stringValue(modelCall.response_summary.message)?.slice(0, 240)
    ?? null;

  return {
    trace_id: modelCall.trace_id ?? null,
    status: modelCall.status,
    request_model: modelCall.request_model,
    prompt_tokens: modelCall.prompt_tokens,
    completion_tokens: modelCall.completion_tokens,
    total_tokens: modelCall.total_tokens,
    latency_ms: modelCall.latency_ms,
    output_preview: outputPreview,
    error_message: modelCall.error_message ?? null,
  };
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function stepJsonArray(
  step: BuiltStep | RuntimeAgentTeamStepResult,
  camelKey: string,
  snakeKey: string,
): unknown[] | null {
  const record = step as unknown as Record<string, unknown>;
  const value = record[camelKey] ?? record[snakeKey];
  return Array.isArray(value) ? value : null;
}

function stepJsonObject(
  step: BuiltStep | RuntimeAgentTeamStepResult,
  camelKey: string,
  snakeKey: string,
): Record<string, unknown> | null {
  const record = step as unknown as Record<string, unknown>;
  const value = record[camelKey] ?? record[snakeKey];
  return isPlainRecord(value) ? value : null;
}

function toNullableJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeJsonArray<T>(value: Prisma.JsonValue | null): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as T[];
}

function normalizeJsonObject<T>(value: Prisma.JsonValue | null): T | null {
  if (!isPlainRecord(value)) {
    return null;
  }

  return value as T;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stepString(
  step: BuiltStep | RuntimeAgentTeamStepResult,
  camelKey: string,
  snakeKey: string,
): string | null {
  const record = step as unknown as Record<string, unknown>;
  const value = record[camelKey] ?? record[snakeKey];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function stepNumber(
  step: BuiltStep | RuntimeAgentTeamStepResult,
  camelKey: string,
  snakeKey: string,
): number {
  const record = step as unknown as Record<string, unknown>;
  const value = record[camelKey] ?? record[snakeKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stepDate(
  step: BuiltStep | RuntimeAgentTeamStepResult,
  camelKey: string,
  snakeKey: string,
): Date | null {
  const record = step as unknown as Record<string, unknown>;
  const value = record[camelKey] ?? record[snakeKey];
  return parseDate(value);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sumStepNumbers(
  steps: Array<BuiltStep | RuntimeAgentTeamStepResult>,
  camelKey: string,
  snakeKey: string,
) {
  return steps.reduce((sum, step) => sum + stepNumber(step, camelKey, snakeKey), 0);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeChatRole(role: string): RuntimePromptMessage['role'] {
  const normalized = role.toLowerCase();
  if (normalized === 'assistant') return 'assistant';
  if (normalized === 'user') return 'user';
  return 'system';
}

function resolveTeamTraceContext(currentUser: AuthenticatedUser): TraceContext {
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

function normalizeWorkflowMode(value: string | undefined): AgentTeamWorkflowMode {
  if (value === 'temporal' || value === 'temporal_first' || value === 'local') {
    return value;
  }

  if (value === 'runtime_first' || value === 'runtime_only') {
    return 'temporal_first';
  }

  return 'local';
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractWorkflowError(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  if (typeof record.message === 'string') return record.message;
  return null;
}

function parseRuntimeWorkflowStartResponse(value: unknown): {
  workflowId: string | null;
  runId: string | null;
  backend: RuntimeWorkflowBackend;
} {
  if (!value || typeof value !== 'object') {
    throw new Error('Runtime workflow endpoint returned an invalid response');
  }

  const record = value as Record<string, unknown>;
  if (record.backend !== 'TEMPORAL' && record.backend !== 'LOCAL_FALLBACK') {
    throw new Error('Runtime workflow endpoint returned an invalid backend');
  }

  return {
    workflowId: typeof record.workflow_id === 'string' ? record.workflow_id : null,
    runId: typeof record.run_id === 'string' ? record.run_id : null,
    backend: record.backend,
  };
}

function parseRuntimeWorkflowSignalResponse(value: unknown): RuntimeWorkflowSignalResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('Runtime workflow resume endpoint returned an invalid response');
  }

  const record = value as Record<string, unknown>;
  if (record.backend !== 'TEMPORAL' && record.backend !== 'LOCAL_FALLBACK') {
    throw new Error('Runtime workflow resume endpoint returned an invalid backend');
  }
  if (record.status !== 'SIGNALED' && record.status !== 'RESUMED') {
    throw new Error('Runtime workflow resume endpoint returned an invalid status');
  }

  return {
    workflow_id: typeof record.workflow_id === 'string' ? record.workflow_id : null,
    run_id: typeof record.run_id === 'string' ? record.run_id : null,
    status: record.status,
    backend: record.backend,
  };
}

function mapOwner(owner: { id: string; name: string; email: string }): AgentOwnerSummary {
  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
  };
}
