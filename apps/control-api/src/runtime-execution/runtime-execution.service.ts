import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { expandPermissionCodes, hasPermission, type ConversationReferenceItem, type DataScopeResourceType, type RuntimeWorkflowRecoverableTaskItem, type RuntimeWorkflowRetryResult, type RuntimeWorkflowStatusOverview, type RuntimeWorkflowTaskType, type TestToolResult } from '@aiaget/shared-types';

import { AgentTeamsService } from '../agent-teams/agent-teams.service';
import { buildTraceparent, createSpanId, type TraceContext } from '../common/tracing/trace-context';
import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopeQueryService } from '../common/services/data-scope-query.service';
import { ResourceAccessService } from '../common/services/resource-access.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { KnowledgeTaskDispatcherService } from '../knowledge/knowledge-task-dispatcher.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import { ChannelsService } from '../channels/channels.service';
import { ChannelReleaseAutomationWorkflowService } from '../channels/channel-release-automation-workflow.service';
import { ChannelReleaseSelfHealingWorkflowService } from '../channels/channel-release-self-healing-workflow.service';
import type { RuntimeChannelReleaseAutomationDto } from './dto/runtime-channel-release-automation.dto';
import type { RuntimeChannelReleaseSelfHealingDto } from './dto/runtime-channel-release-self-healing.dto';
import type { RuntimeKnowledgeTaskDto } from './dto/runtime-knowledge-task.dto';
import type { RuntimeAgentTeamRunDto } from './dto/runtime-agent-team-run.dto';
import type { RuntimeRetrieveDto } from './dto/runtime-retrieve.dto';
import type { RuntimeToolCallDto } from './dto/runtime-tool-call.dto';
import { normalizeWorkflowBackend, normalizeWorkflowMode, resolveWorkflowBackendStatus } from './runtime-workflow-status';

export interface RuntimeToolCallSummary {
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

@Injectable()
export class RuntimeExecutionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService,
    @Inject(KnowledgeTaskDispatcherService) private readonly knowledgeTaskDispatcher: KnowledgeTaskDispatcherService,
    @Inject(ToolsService) private readonly toolsService: ToolsService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(ResourceAccessService) private readonly resourceAccess: ResourceAccessService,
    @Inject(AgentTeamsService) private readonly agentTeamsService: AgentTeamsService,
    @Inject(ChannelsService) private readonly channelsService: ChannelsService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Optional() @Inject(ChannelReleaseAutomationWorkflowService) private readonly releaseAutomationWorkflow: ChannelReleaseAutomationWorkflowService | null = null,
    @Optional() @Inject(ChannelReleaseSelfHealingWorkflowService) private readonly releaseSelfHealingWorkflow: ChannelReleaseSelfHealingWorkflowService | null = null,
  ) {}

  async retrieve(dto: RuntimeRetrieveDto) {
    const user = await this.resolveRuntimeUser(dto.tenant_id, dto.user_id, dto);
    await this.ensureAgent(dto.tenant_id, dto.agent_id);
    await this.ensureDataScopeAccess(user, 'AGENT', dto.agent_id);
    await this.ensureAgentPermission(user, dto.agent_id, 'agent:agent:use');

    const result = await this.knowledgeService.retrieveAgentReferences(
      user,
      dto.agent_id,
      dto.query,
      toTraceContext(dto) ?? undefined,
    );

    await this.recordRuntimeEvent(user, {
      resourceType: 'AGENT',
      resourceId: dto.agent_id,
      agentId: dto.agent_id,
      eventType: 'runtime.knowledge.retrieve.finished',
      status: 'SUCCESS',
      summary: `Runtime 知识检索完成，召回 ${result.references.length} 条引用。`,
      payloadJson: {
        agent_id: dto.agent_id,
        mode: result.mode,
        reference_count: result.references.length,
        latency_ms: result.latency_ms,
        cost_total: result.cost_total,
      },
      sourceSystem: 'runtime_internal',
      sourceId: dto.agent_id,
    });
    await this.recordRuntimeUsage(user, {
      subjectType: 'AGENT',
      subjectId: dto.agent_id,
      resourceType: 'KNOWLEDGE',
      resourceId: dto.agent_id,
      metricType: 'knowledge_queries',
      unit: 'query',
      quantity: 1,
      amount: result.cost_total,
      sourceSystem: 'runtime_internal',
      sourceId: dto.agent_id,
    });

    return {
      references: result.references.map(mapReferenceSummary),
      mode: result.mode,
      latency_ms: result.latency_ms,
      cost_total: result.cost_total,
    };
  }

  async callTool(dto: RuntimeToolCallDto) {
    const user = await this.resolveRuntimeUser(dto.tenant_id, dto.user_id, dto);
    const binding = await this.ensureAgentToolBinding(dto.tenant_id, dto.agent_id, dto.tool_id);
    await this.ensureDataScopeAccess(user, 'AGENT', dto.agent_id);
    await this.ensureDataScopeAccess(user, 'TOOL', dto.tool_id);
    await this.ensureAgentPermission(user, dto.agent_id, 'agent:agent:use');
    this.ensurePermission(user, 'tool:call:execute');
    await this.ensureResourcePermission(user, 'TOOL', dto.tool_id, 'tool:call:execute');

    const tool = await this.prisma.tool.findFirst({
      where: {
        tenantId: dto.tenant_id,
        id: dto.tool_id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    const result = await this.toolsService.execute(user, tool.id, dto.input ?? {}, {
      triggerSource: 'RUNTIME',
      conversationId: dto.conversation_id ?? undefined,
      agentId: dto.agent_id,
      traceContext: toTraceContext(dto),
      requireApproval: binding.requireApproval,
    });

    await this.recordRuntimeEvent(user, {
      resourceType: 'TOOL',
      resourceId: tool.id,
      agentId: dto.agent_id,
      conversationId: dto.conversation_id ?? null,
      eventType: result.status === 'SUCCESS' ? 'runtime.tool.call.finished' : 'runtime.tool.call.failed',
      status: result.status,
      severity: result.status === 'FAILED' ? 'ERROR' : result.status === 'APPROVAL_REQUIRED' ? 'WARN' : 'INFO',
      summary: `Runtime 工具适配调用 ${tool.name}：${result.status}`,
      payloadJson: {
        agent_id: dto.agent_id,
        tool_id: tool.id,
        tool_code: tool.code,
        status: result.status,
        approval_request_id: result.approval_request_id ?? null,
        latency_ms: result.latency_ms,
        response_status: result.response_status,
        error_message: result.error_message,
      },
      sourceSystem: 'runtime_internal',
      sourceId: tool.id,
    });

    return mapToolCallSummary(tool.id, tool.name, tool.code, result);
  }

  async runKnowledgeTask(dto: RuntimeKnowledgeTaskDto) {
    const result = await this.knowledgeService.runWorkflowTask(dto.task_id);
    const task = await this.prisma.knowledgeEmbeddingTask.findFirst({
      where: {
        id: dto.task_id,
      },
      select: {
        tenantId: true,
        status: true,
        documentId: true,
        knowledgeId: true,
      },
    });
    await this.recordWorkflowEvent({
      tenantId: task?.tenantId ?? '00000000-0000-0000-0000-000000000000',
      resourceType: 'KNOWLEDGE_TASK',
      resourceId: dto.task_id,
      taskId: dto.task_id,
      eventType: task?.status === 'FAILED' ? 'workflow.knowledge_task.failed' : 'workflow.knowledge_task.finished',
      status: task?.status ?? (result.success ? 'COMPLETED' : 'FAILED'),
      severity: task?.status === 'FAILED' ? 'ERROR' : 'INFO',
      summary: `知识库后台任务 ${dto.task_id} 执行${task?.status === 'FAILED' ? '失败' : '完成'}。`,
      payloadJson: {
        task_id: dto.task_id,
        workflow_id: dto.workflow_id ?? null,
        workflow_run_id: dto.run_id ?? null,
        status: task?.status ?? null,
        knowledge_base_id: task?.knowledgeId ?? null,
        document_id: task?.documentId ?? null,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: dto.task_id,
    });
    return result;
  }

  async getWorkflowStatus(currentUser: AuthenticatedUser): Promise<RuntimeWorkflowStatusOverview> {
    const mode = normalizeWorkflowMode(process.env.KNOWLEDGE_WORKFLOW_MODE);
    const [latestEvent, failedTasks, failedChannelEvents] = await this.prisma.$transaction([
      this.prisma.platformEvent.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          eventSource: 'runtime_workflow',
          OR: [
            { eventType: { in: ['workflow.knowledge_task.dispatched', 'workflow.knowledge_task.dispatch_failed'] } },
            { eventType: { startsWith: 'workflow.channel_release_' } },
          ],
        },
        orderBy: {
          occurredAt: 'desc',
        },
      }),
      this.prisma.knowledgeEmbeddingTask.findMany({
        where: {
          tenantId: currentUser.tenantId,
          status: 'FAILED',
          taskType: {
            in: ['PROCESS', 'REBUILD'],
          },
          knowledge: {
            deletedAt: null,
          },
        },
        include: {
          knowledge: true,
          document: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          eventSource: 'runtime_workflow',
          status: 'FAILED',
          eventType: {
            in: ['workflow.channel_release_automation.failed', 'workflow.channel_release_self_healing.failed'],
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 5,
      }),
    ]);
    const payload = jsonObjectOrNull(latestEvent?.payloadJson);
    const backendStatus = resolveWorkflowBackendStatus(mode, latestEvent ? {
      eventType: latestEvent.eventType,
      workflowBackend: normalizeWorkflowBackend(payload?.workflow_backend),
      errorMessage: latestEvent.summary ?? stringValue(payload?.error_message),
    } : null);
    const channelIds = Array.from(
      new Set(
        failedChannelEvents
          .map((event) => channelIdFromWorkflowEvent(event))
          .filter((channelId): channelId is string => Boolean(channelId)),
      ),
    );
    const channels = channelIds.length > 0 ? await this.prisma.agentPublishChannel.findMany({
      where: {
        tenantId: currentUser.tenantId,
        id: {
          in: channelIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        channel: true,
      },
    }) : [];
    const channelById = new Map(channels.map((channel) => [channel.id, channel]));
    const recoverableTasks: RuntimeWorkflowRecoverableTaskItem[] = [
      ...failedTasks.map((task) => ({
        task_type: 'knowledge_task' as const,
        task_id: task.id,
        workflow_task_type: task.taskType,
        status: task.status,
        title: task.document?.title ?? task.knowledge.name,
        knowledge_base_id: task.knowledgeId,
        document_id: task.documentId,
        error_message: task.errorMessage,
        updated_at: task.updatedAt.toISOString(),
      })),
      ...failedChannelEvents
        .map((event) => mapChannelWorkflowRecoverableTask(event, channelById.get(channelIdFromWorkflowEvent(event) ?? '')))
        .filter((task): task is RuntimeWorkflowRecoverableTaskItem => Boolean(task)),
    ].slice(0, 10);

    return {
      generated_at: new Date().toISOString(),
      workflow_mode: mode,
      workflow_backend: backendStatus.backend,
      backend_status: backendStatus.status,
      latest_failure: backendStatus.latest_failure ? {
        task_type: workflowTaskTypeFromEvent(latestEvent?.eventType),
        task_id: latestEvent?.taskId ?? latestEvent?.resourceId ?? null,
        error_message: backendStatus.latest_failure.error_message,
        occurred_at: latestEvent?.occurredAt.toISOString() ?? null,
      } : null,
      recoverable_tasks: recoverableTasks,
    };
  }

  async retryWorkflowTask(
    currentUser: AuthenticatedUser,
    taskId: string,
    taskType: RuntimeWorkflowTaskType = 'knowledge_task',
  ): Promise<RuntimeWorkflowRetryResult> {
    if (taskType === 'channel_release_automation') {
      return this.retryChannelReleaseAutomationWorkflow(currentUser, taskId);
    }

    if (taskType === 'channel_release_self_healing') {
      return this.retryChannelReleaseSelfHealingWorkflow(currentUser, taskId);
    }

    const task = await this.prisma.knowledgeEmbeddingTask.findFirst({
      where: {
        id: taskId,
        tenantId: currentUser.tenantId,
      },
      include: {
        knowledge: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Workflow task not found');
    }

    if (task.taskType !== 'PROCESS' && task.taskType !== 'REBUILD') {
      throw new BadRequestException(`Unsupported workflow task type: ${task.taskType}`);
    }

    await this.prisma.knowledgeEmbeddingTask.update({
      where: { id: task.id },
      data: {
        status: 'PENDING',
        startedAt: null,
        endedAt: null,
        errorMessage: null,
      },
    });
    await this.recordWorkflowEvent({
      tenantId: currentUser.tenantId,
      resourceType: 'KNOWLEDGE_TASK',
      resourceId: task.id,
      taskId: task.id,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventType: 'workflow.knowledge_task.retry_requested',
      status: 'PENDING',
      severity: 'INFO',
      summary: `知识库后台任务 ${task.id} 已请求恢复重试。`,
      payloadJson: {
        task_id: task.id,
        workflow_task_type: task.taskType,
        knowledge_base_id: task.knowledgeId,
        document_id: task.documentId ?? null,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: task.id,
    });
    this.knowledgeTaskDispatcher.enqueue(task.id);

    return {
      task_type: 'knowledge_task',
      task_id: task.id,
      status: 'QUEUED',
      message: '知识任务已重置为待处理，运行时恢复任务会重新调度。',
    };
  }

  private async retryChannelReleaseAutomationWorkflow(
    currentUser: AuthenticatedUser,
    channelId: string,
  ): Promise<RuntimeWorkflowRetryResult> {
    const channel = await this.ensureRecoverableChannel(currentUser, channelId);
    if (!this.releaseAutomationWorkflow) {
      throw new BadRequestException('Channel release automation workflow service is not available');
    }

    await this.recordWorkflowEvent({
      tenantId: currentUser.tenantId,
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      channelId: channel.id,
      taskId: channel.id,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventType: 'workflow.channel_release_automation.retry_requested',
      status: 'PENDING',
      severity: 'INFO',
      summary: `渠道自动推进工作流 ${channel.name ?? channel.channel} 已请求恢复重试。`,
      payloadJson: {
        channel_id: channel.id,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: channel.id,
    });
    await this.releaseAutomationWorkflow.dispatch(currentUser, channel.id);

    return {
      task_type: 'channel_release_automation' as RuntimeWorkflowTaskType,
      task_id: channel.id,
      status: 'QUEUED',
      message: '渠道自动推进工作流已重新派发。',
    };
  }

  private async retryChannelReleaseSelfHealingWorkflow(
    currentUser: AuthenticatedUser,
    channelId: string,
  ): Promise<RuntimeWorkflowRetryResult> {
    const channel = await this.ensureRecoverableChannel(currentUser, channelId);
    if (!this.releaseSelfHealingWorkflow) {
      throw new BadRequestException('Channel release self-healing workflow service is not available');
    }

    await this.recordWorkflowEvent({
      tenantId: currentUser.tenantId,
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      channelId: channel.id,
      taskId: channel.id,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventType: 'workflow.channel_release_self_healing.retry_requested',
      status: 'PENDING',
      severity: 'INFO',
      summary: `渠道发布自愈工作流 ${channel.name ?? channel.channel} 已请求恢复重试。`,
      payloadJson: {
        channel_id: channel.id,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: channel.id,
    });
    await this.releaseSelfHealingWorkflow.dispatch(currentUser, channel.id);

    return {
      task_type: 'channel_release_self_healing' as RuntimeWorkflowTaskType,
      task_id: channel.id,
      status: 'QUEUED',
      message: '渠道发布自愈工作流已重新派发。',
    };
  }

  async runAgentTeamRun(dto: RuntimeAgentTeamRunDto) {
    const result = await this.agentTeamsService.runWorkflowRun(dto.run_id, {
      handoffId: dto.handoff_id ?? null,
      decisionNote: dto.decision_note ?? null,
      completedMemberIds: dto.completed_member_ids ?? [],
      previousOutputs: dto.previous_outputs ?? [],
      nextRoundIndex: dto.next_round_index ?? 1,
    });
    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        id: dto.run_id,
      },
      select: {
        tenantId: true,
        teamId: true,
        requestId: true,
        traceId: true,
      },
    });
    await this.recordWorkflowEvent({
      tenantId: run?.tenantId ?? '00000000-0000-0000-0000-000000000000',
      resourceType: 'AGENT_TEAM',
      resourceId: run?.teamId ?? dto.run_id,
      teamId: run?.teamId ?? null,
      runId: dto.run_id,
      taskId: dto.run_id,
      requestId: run?.requestId ?? null,
      traceId: run?.traceId ?? null,
      eventType: result.status === 'FAILED' ? 'workflow.agent_team_run.failed' : 'workflow.agent_team_run.finished',
      status: result.status,
      severity: result.status === 'FAILED' ? 'ERROR' : result.status === 'WAITING_HUMAN' ? 'WARN' : 'INFO',
      summary: `多 Agent 团队运行 ${dto.run_id} 已由 Runtime 工作流回调执行。`,
      payloadJson: {
        run_id: dto.run_id,
        team_id: run?.teamId ?? null,
        status: result.status,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: dto.run_id,
    });
    return result;
  }

  async runChannelReleaseAutomation(dto: RuntimeChannelReleaseAutomationDto) {
    const result = await this.channelsService.runWorkflowReleaseAutomation(dto.channel_id, {
      workflowId: dto.workflow_id ?? null,
      workflowRunId: dto.run_id ?? null,
    });
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: dto.channel_id,
      },
      select: {
        tenantId: true,
      },
    });
    const failed = !result || result.decision === 'FAILED' || Boolean(result.error_message);
    await this.recordWorkflowEvent({
      tenantId: channel?.tenantId ?? '00000000-0000-0000-0000-000000000000',
      resourceType: 'CHANNEL',
      resourceId: dto.channel_id,
      channelId: dto.channel_id,
      taskId: dto.workflow_id ?? dto.run_id ?? null,
      eventType: failed ? 'workflow.channel_release_automation.failed' : 'workflow.channel_release_automation.finished',
      status: failed ? 'FAILED' : 'SUCCESS',
      severity: failed ? 'ERROR' : 'INFO',
      summary: `渠道发布自动推进工作流执行：${result?.decision ?? 'FAILED'}。`,
      payloadJson: {
        channel_id: dto.channel_id,
        workflow_id: dto.workflow_id ?? null,
        workflow_run_id: dto.run_id ?? null,
        decision: result?.decision ?? 'FAILED',
        error_message: result?.error_message ?? null,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: dto.workflow_id ?? dto.run_id ?? dto.channel_id,
    });
    return result;
  }

  async runChannelReleaseSelfHealing(dto: RuntimeChannelReleaseSelfHealingDto) {
    const result = await this.channelsService.runWorkflowReleaseSelfHealing(dto.channel_id, {
      workflowId: dto.workflow_id ?? null,
      workflowRunId: dto.run_id ?? null,
    });
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: dto.channel_id,
      },
      select: {
        tenantId: true,
      },
    });
    const failed = !result || result.decision === 'FAILED' || Boolean(result.error_message);
    await this.recordWorkflowEvent({
      tenantId: channel?.tenantId ?? '00000000-0000-0000-0000-000000000000',
      resourceType: 'CHANNEL',
      resourceId: dto.channel_id,
      channelId: dto.channel_id,
      taskId: dto.workflow_id ?? dto.run_id ?? null,
      eventType: failed ? 'workflow.channel_release_self_healing.failed' : 'workflow.channel_release_self_healing.finished',
      status: failed ? 'FAILED' : 'SUCCESS',
      severity: failed ? 'ERROR' : 'INFO',
      summary: `渠道发布自愈工作流执行：${result?.decision ?? 'FAILED'}。`,
      payloadJson: {
        channel_id: dto.channel_id,
        workflow_id: dto.workflow_id ?? null,
        workflow_run_id: dto.run_id ?? null,
        decision: result?.decision ?? 'FAILED',
        error_message: result?.error_message ?? null,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: dto.workflow_id ?? dto.run_id ?? dto.channel_id,
    });
    return result;
  }

  private async recordRuntimeEvent(user: AuthenticatedUser, input: RuntimeProjectionInput) {
    return this.platformEvents.recordEvent({
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      userId: user.id,
      actorType: 'RUNTIME',
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      agentId: input.agentId ?? null,
      teamId: input.teamId ?? null,
      channelId: input.channelId ?? null,
      conversationId: input.conversationId ?? null,
      runId: input.runId ?? null,
      taskId: input.taskId ?? null,
      requestId: user.requestId ?? null,
      traceId: user.traceId ?? null,
      parentTraceId: user.parentSpanId ?? null,
      eventSource: input.sourceSystem,
      eventType: input.eventType,
      status: input.status,
      severity: input.severity ?? 'INFO',
      securityLevel: 'INTERNAL',
      billable: false,
      summary: input.summary,
      payloadJson: input.payloadJson,
      sourceSystem: input.sourceSystem,
      sourceId: input.sourceId,
      dedupeKey: `${input.sourceSystem}:${input.sourceId}:${input.eventType}:${user.traceId ?? user.requestId ?? 'none'}`,
    });
  }

  private async recordRuntimeUsage(user: AuthenticatedUser, input: RuntimeUsageProjectionInput) {
    return this.platformEvents.recordUsage({
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      userId: user.id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metricType: input.metricType,
      unit: input.unit,
      quantity: input.quantity,
      amount: input.amount ?? 0,
      currency: 'USD',
      billable: false,
      costSource: input.sourceSystem,
      traceId: user.traceId ?? null,
      requestId: user.requestId ?? null,
      sourceSystem: input.sourceSystem,
      sourceId: input.sourceId,
    });
  }

  private async recordWorkflowEvent(input: WorkflowProjectionInput) {
    return this.platformEvents.recordEvent({
      tenantId: input.tenantId,
      actorType: 'RUNTIME',
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      agentId: input.agentId ?? null,
      teamId: input.teamId ?? null,
      channelId: input.channelId ?? null,
      runId: input.runId ?? null,
      taskId: input.taskId ?? null,
      requestId: input.requestId ?? null,
      traceId: input.traceId ?? null,
      eventSource: input.sourceSystem,
      eventType: input.eventType,
      status: input.status,
      severity: input.severity,
      securityLevel: 'INTERNAL',
      billable: false,
      summary: input.summary,
      payloadJson: input.payloadJson,
      sourceSystem: input.sourceSystem,
      sourceId: input.sourceId,
      dedupeKey: `${input.sourceSystem}:${input.sourceId}:${input.eventType}`,
    });
  }

  private async resolveRuntimeUser(
    tenantId: string,
    userId: string,
    traceInput: RuntimeTraceInput,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id: userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userRoles: {
          where: {
            deletedAt: null,
            role: {
              status: 'ACTIVE',
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
    });

    if (!user) {
      throw new NotFoundException('Runtime user not found');
    }

    const activeRoles = user.userRoles.filter((userRole) => userRole.role);
    const permissions = expandPermissionCodes(
      Array.from(
        new Set(
          activeRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
          ),
        ),
      ),
    );
    const traceContext = toTraceContext(traceInput);

    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId,
      email: user.email,
      roles: activeRoles.map((userRole) => userRole.role.code),
      roleIds: activeRoles.map((userRole) => userRole.role.id),
      permissions,
      requestId: traceContext?.requestId ?? undefined,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      parentSpanId: traceContext?.parentSpanId ?? null,
      traceparent: traceContext?.traceparent,
    };
  }

  private async ensureAgent(tenantId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        tenantId,
        id: agentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
  }

  private async ensureRecoverableChannel(currentUser: AuthenticatedUser, channelId: string) {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        channel: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Publish channel not found');
    }

    return channel;
  }

  private async ensureAgentToolBinding(tenantId: string, agentId: string, toolId: string) {
    const binding = await this.prisma.agentToolBinding.findFirst({
      where: {
        tenantId,
        agentId,
        toolId,
        deletedAt: null,
      },
      select: {
        id: true,
        requireApproval: true,
      },
    });

    if (!binding) {
      throw new BadRequestException('Tool is not bound to this agent');
    }

    return binding;
  }

  private async ensureDataScopeAccess(
    user: AuthenticatedUser,
    resourceType: DataScopeResourceType,
    resourceId: string,
  ) {
    const dataScope = await this.dataScopeQuery.buildWhere<Record<string, unknown>>(user, resourceType);
    if (!dataScope.where) {
      return;
    }

    const exists = await this.resourceExists(user.tenantId, resourceType, resourceId, dataScope.where);
    if (!exists) {
      throw new ForbiddenException('Runtime data scope denied');
    }
  }

  private async resourceExists(
    tenantId: string,
    resourceType: DataScopeResourceType,
    resourceId: string,
    dataScopeWhere: Record<string, unknown>,
  ) {
    const where = {
      tenantId,
      id: resourceId,
      deletedAt: null,
      AND: [dataScopeWhere],
    };

    switch (resourceType) {
      case 'AGENT':
        return (await this.prisma.agent.count({ where })) > 0;
      case 'TOOL':
        return (await this.prisma.tool.count({ where })) > 0;
      case 'KNOWLEDGE_BASE':
        return (await this.prisma.knowledgeBase.count({ where })) > 0;
      case 'DOCUMENT':
        return (await this.prisma.knowledgeDocument.count({ where })) > 0;
      case 'MODEL':
        return (await this.prisma.modelConfig.count({ where })) > 0;
      case 'CONVERSATION':
        return (await this.prisma.conversation.count({ where })) > 0;
      case 'AUDIT_LOG':
        return (await this.prisma.operationLog.count({
          where: {
            tenantId,
            id: resourceId,
            AND: [dataScopeWhere],
          },
        })) > 0;
    }
  }

  private async ensureAgentPermission(user: AuthenticatedUser, agentId: string, permissionCode: string) {
    return this.ensureResourcePermission(user, 'AGENT', agentId, permissionCode);
  }

  private ensurePermission(user: AuthenticatedUser, permissionCode: string) {
    if (!hasPermission(user.permissions, permissionCode)) {
      throw new ForbiddenException('Runtime permission denied');
    }
  }

  private async ensureResourcePermission(
    user: AuthenticatedUser,
    resourceType: DataScopeResourceType,
    resourceId: string,
    permissionCode: string,
  ) {
    const acls = await this.prisma.resourceAcl.findMany({
      where: {
        tenantId: user.tenantId,
        resourceType,
        resourceId,
        permissionCode,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (acls.length === 0) {
      return;
    }

    const subjectKeys = await this.resourceAccess.buildResourceAclSubjectKeys(user);
    const matched = acls.filter((acl) => subjectKeys.has(resourceAclSubjectKey(acl.subjectType, acl.subjectId)));
    if (matched.some((acl) => acl.effect === 'DENY')) {
      throw new ForbiddenException('Runtime resource ACL denied');
    }
    if (user.roles.includes('tenant_admin')) {
      return;
    }
    if (!matched.some((acl) => acl.effect === 'ALLOW')) {
      throw new ForbiddenException('Runtime resource ACL denied');
    }
  }
}

function toTraceContext(
  input: RuntimeTraceInput,
): TraceContext | null {
  if (!input.trace_id) {
    return null;
  }

  const spanId = createSpanId();
  return {
    traceId: input.trace_id,
    spanId,
    parentSpanId: input.parent_span_id ?? null,
    traceparent: input.traceparent ?? buildTraceparent(input.trace_id, spanId),
    requestId: input.request_id ?? null,
  };
}

interface RuntimeTraceInput {
  request_id?: string | null;
  trace_id?: string | null;
  parent_span_id?: string | null;
  traceparent?: string | null;
}

interface RuntimeProjectionInput {
  resourceType: string;
  resourceId: string | null;
  agentId?: string | null;
  teamId?: string | null;
  channelId?: string | null;
  conversationId?: string | null;
  runId?: string | null;
  taskId?: string | null;
  eventType: string;
  status: string;
  severity?: string;
  summary: string;
  payloadJson: Prisma.InputJsonValue;
  sourceSystem: string;
  sourceId: string | null;
}

interface RuntimeUsageProjectionInput {
  subjectType: string;
  subjectId: string | null;
  resourceType: string;
  resourceId: string | null;
  metricType: string;
  unit: string;
  quantity: number;
  amount?: number;
  sourceSystem: string;
  sourceId: string | null;
}

interface WorkflowProjectionInput {
  tenantId: string;
  resourceType: string;
  resourceId: string | null;
  agentId?: string | null;
  teamId?: string | null;
  channelId?: string | null;
  runId?: string | null;
  taskId?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  eventType: string;
  status: string;
  severity: string;
  summary: string;
  payloadJson: Prisma.InputJsonValue;
  sourceSystem: string;
  sourceId: string | null;
}

function resourceAclSubjectKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
}

function workflowTaskTypeFromEvent(eventType: string | undefined | null): RuntimeWorkflowTaskType {
  if (eventType === 'workflow.channel_release_automation.failed') {
    return 'channel_release_automation';
  }

  if (eventType === 'workflow.channel_release_self_healing.failed') {
    return 'channel_release_self_healing';
  }

  return 'knowledge_task';
}

function channelIdFromWorkflowEvent(event: {
  channelId?: string | null;
  resourceId?: string | null;
  payloadJson?: unknown;
}) {
  const payload = jsonObjectOrNull(event.payloadJson);
  return stringValue(event.channelId)
    ?? stringValue(payload?.channel_id)
    ?? stringValue(event.resourceId);
}

function mapChannelWorkflowRecoverableTask(
  event: {
    eventType: string;
    channelId?: string | null;
    resourceId?: string | null;
    taskId?: string | null;
    summary?: string | null;
    payloadJson?: unknown;
    occurredAt: Date;
  },
  channel: { id: string; name?: string | null; channel?: string | null } | undefined,
): RuntimeWorkflowRecoverableTaskItem | null {
  const taskType = workflowTaskTypeFromEvent(event.eventType);
  if (taskType === 'knowledge_task') {
    return null;
  }

  const channelId = channelIdFromWorkflowEvent(event);
  if (!channelId) {
    return null;
  }

  const payload = jsonObjectOrNull(event.payloadJson);
  const workflowTaskType = taskType === 'channel_release_automation'
    ? 'CHANNEL_RELEASE_AUTOMATION'
    : 'CHANNEL_RELEASE_SELF_HEALING';

  return {
    task_type: taskType,
    task_id: channelId,
    workflow_task_type: workflowTaskType,
    status: 'FAILED',
    title: channel?.name ?? channel?.channel ?? channelId,
    knowledge_base_id: null as string | null,
    document_id: null,
    channel_id: channelId,
    error_message: stringValue(payload?.error_message) ?? stringValue(event.summary),
    updated_at: event.occurredAt.toISOString(),
  };
}

function mapReferenceSummary(reference: ConversationReferenceItem) {
  return {
    id: reference.id,
    title: reference.title,
    snippet: reference.snippet,
    score: reference.score,
    source_type: reference.source_type,
  };
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
  if (value === undefined || value === null || value === Prisma.JsonNull) return null;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
  return serialized.length > 280 ? `${serialized.slice(0, 280)}...` : serialized;
}

function jsonObjectOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
