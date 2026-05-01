import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  ToolApprovalDetail,
  ToolApprovalListItem,
  ToolApprovalOverview,
  ToolCallStatus,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import type { ListToolApprovalsDto } from './dto/list-tool-approvals.dto';
import type { ReviewToolApprovalDto } from './dto/review-tool-approval.dto';

const approvalListInclude = {
  tool: true,
  agent: true,
  conversation: true,
  requester: true,
  reviewer: true,
  toolCallLog: true,
} satisfies Prisma.ToolApprovalRequestInclude;

type ToolApprovalRecord = Prisma.ToolApprovalRequestGetPayload<{ include: typeof approvalListInclude }>;

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ToolsService) private readonly toolsService: ToolsService,
  ) {}

  async overview(currentUser: AuthenticatedUser): Promise<ToolApprovalOverview> {
    const where = {
      tenantId: currentUser.tenantId,
    } satisfies Prisma.ToolApprovalRequestWhereInput;

    const [pendingCount, approvedCount, rejectedCount, runtimePendingCount, testPendingCount] =
      await this.prisma.$transaction([
        this.prisma.toolApprovalRequest.count({
          where: {
            ...where,
            status: 'PENDING',
          },
        }),
        this.prisma.toolApprovalRequest.count({
          where: {
            ...where,
            status: 'APPROVED',
          },
        }),
        this.prisma.toolApprovalRequest.count({
          where: {
            ...where,
            status: 'REJECTED',
          },
        }),
        this.prisma.toolApprovalRequest.count({
          where: {
            ...where,
            status: 'PENDING',
            triggerSource: 'RUNTIME',
          },
        }),
        this.prisma.toolApprovalRequest.count({
          where: {
            ...where,
            status: 'PENDING',
            triggerSource: 'TEST',
          },
        }),
      ]);

    return {
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      runtime_pending_count: runtimePendingCount,
      test_pending_count: testPendingCount,
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListToolApprovalsDto,
  ): Promise<PaginatedResult<ToolApprovalListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.ToolApprovalRequestWhereInput = {
      tenantId: currentUser.tenantId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.trigger_source) {
      where.triggerSource = query.trigger_source;
    }

    if (query.tool_id) {
      where.toolId = query.tool_id;
    }

    if (keyword) {
      where.OR = [
        { tool: { name: { contains: keyword, mode: 'insensitive' } } },
        { tool: { code: { contains: keyword, mode: 'insensitive' } } },
        { conversation: { title: { contains: keyword, mode: 'insensitive' } } },
        { requester: { email: { contains: keyword, mode: 'insensitive' } } },
        { toolCallLog: { requestUrl: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.toolApprovalRequest.findMany({
        where,
        include: approvalListInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.toolApprovalRequest.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapApprovalListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<ToolApprovalDetail> {
    const approval = await this.findApproval(currentUser.tenantId, id);
    return this.mapApprovalDetail(approval);
  }

  async approve(
    currentUser: AuthenticatedUser,
    id: string,
    dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    await this.ensurePendingApproval(currentUser.tenantId, id);

    await this.toolsService.executeApprovalRequest(currentUser, id);
    await this.prisma.toolApprovalRequest.update({
      where: {
        id,
      },
      data: {
        status: 'APPROVED',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        decisionNote: nullableText(dto.decision_note),
      },
    });

    const detail = await this.get(currentUser, id);
    await this.appendConversationOutcome(currentUser, detail, 'approve');
    return detail;
  }

  async reject(
    currentUser: AuthenticatedUser,
    id: string,
    dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    const approval = await this.findApproval(currentUser.tenantId, id);
    if (approval.status !== 'PENDING') {
      throw new BadRequestException('Only pending approval requests can be rejected');
    }

    const rejectionMessage = nullableText(dto.decision_note) ?? '审批人已拒绝当前工具调用。';

    await this.prisma.$transaction([
      this.prisma.toolCallLog.update({
        where: {
          id: approval.toolCallLogId,
        },
        data: {
          status: 'REJECTED',
          latencyMs: 0,
          responseStatus: null,
          responseHeaders: Prisma.JsonNull,
          responseBody: Prisma.JsonNull,
          errorMessage: rejectionMessage,
        },
      }),
      this.prisma.toolApprovalRequest.update({
        where: {
          id,
        },
        data: {
          status: 'REJECTED',
          reviewedBy: currentUser.id,
          reviewedAt: new Date(),
          decisionNote: rejectionMessage,
        },
      }),
    ]);

    const detail = await this.get(currentUser, id);
    await this.appendConversationOutcome(currentUser, detail, 'reject');
    return detail;
  }

  private async findApproval(tenantId: string, id: string): Promise<ToolApprovalRecord> {
    const approval = await this.prisma.toolApprovalRequest.findFirst({
      where: {
        tenantId,
        id,
      },
      include: approvalListInclude,
    });

    if (!approval) {
      throw new NotFoundException('Tool approval request not found');
    }

    return approval;
  }

  private async ensurePendingApproval(tenantId: string, id: string) {
    const approval = await this.prisma.toolApprovalRequest.findFirst({
      where: {
        tenantId,
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!approval) {
      throw new NotFoundException('Tool approval request not found');
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException('Only pending approval requests can be approved');
    }
  }

  private mapApprovalListItem(approval: ToolApprovalRecord): ToolApprovalListItem {
    return {
      id: approval.id,
      tool_id: approval.toolId,
      tool_name: approval.tool.name,
      tool_code: approval.tool.code,
      agent_id: approval.agentId ?? null,
      agent_name: approval.agent?.name ?? null,
      conversation_id: approval.conversationId ?? null,
      conversation_title: approval.conversation?.title ?? null,
      status: approval.status as ToolApprovalListItem['status'],
      trigger_source: approval.triggerSource as ToolApprovalListItem['trigger_source'],
      execution_status: approval.toolCallLog.status as ToolApprovalListItem['execution_status'],
      request_url: approval.toolCallLog.requestUrl,
      request_method: approval.toolCallLog.requestMethod as ToolApprovalListItem['request_method'],
      reason: approval.reason,
      decision_note: approval.decisionNote,
      created_at: approval.createdAt.toISOString(),
      reviewed_at: approval.reviewedAt?.toISOString() ?? null,
      requested_by: approval.requester ? this.mapActor(approval.requester) : null,
      reviewed_by: approval.reviewer ? this.mapActor(approval.reviewer) : null,
    };
  }

  private mapApprovalDetail(approval: ToolApprovalRecord): ToolApprovalDetail {
    return {
      ...this.mapApprovalListItem(approval),
      request_headers: normalizeStringRecord(approval.toolCallLog.requestHeaders),
      request_body: approval.toolCallLog.requestBody ?? null,
      response_status: approval.toolCallLog.responseStatus ?? null,
      response_headers: normalizeStringRecord(approval.toolCallLog.responseHeaders),
      response_body: approval.toolCallLog.responseBody ?? null,
      latency_ms: approval.toolCallLog.latencyMs,
      error_message: approval.toolCallLog.errorMessage,
    };
  }

  private mapActor(user: { id: string; name: string; email: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private async appendConversationOutcome(
    currentUser: AuthenticatedUser,
    approval: ToolApprovalDetail,
    action: 'approve' | 'reject',
  ) {
    if (!approval.conversation_id || !approval.agent_id) {
      return;
    }

    const runStatus = action === 'reject'
      ? 'SUCCESS'
      : approval.execution_status === 'FAILED'
        ? 'FAILED'
        : 'SUCCESS';
    const assistantMessage = buildApprovalAssistantMessage(approval, action);
    const now = new Date();
    const toolCallSummary = buildConversationToolCallSummary(approval);
    const steps = buildApprovalSteps(approval, action);

    const run = await this.prisma.conversationRun.create({
      data: {
        tenantId: currentUser.tenantId,
        conversationId: approval.conversation_id,
        agentId: approval.agent_id,
        status: runStatus,
        requestModel: 'approval-workflow-m16',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: approval.latency_ms,
        steps: steps as unknown as Prisma.InputJsonValue,
        startedAt: now,
        endedAt: now,
        createdBy: currentUser.id,
      },
    });

    await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          tenantId: currentUser.tenantId,
          conversationId: approval.conversation_id,
          runId: run.id,
          role: 'ASSISTANT',
          content: assistantMessage,
          references: Prisma.JsonNull,
          toolCalls: [toolCallSummary] as unknown as Prisma.InputJsonValue,
          createdBy: currentUser.id,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id: approval.conversation_id,
        },
        data: {
          messageCount: {
            increment: 1,
          },
          lastMessagePreview: createPreview(assistantMessage),
          lastMessageAt: now,
          lastRunStatus: runStatus,
          updatedBy: currentUser.id,
        },
      }),
    ]);
  }
}

function normalizeStringRecord(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, typeof entry === 'string' ? entry : JSON.stringify(entry)]),
  );
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function createPreview(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.length > 100 ? `${normalized.slice(0, 100)}…` : normalized;
}

function createOutputPreview(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.length > 240 ? `${value.slice(0, 240)}…` : value;
  }

  const serialized = JSON.stringify(value);
  return serialized.length > 240 ? `${serialized.slice(0, 240)}…` : serialized;
}

function buildApprovalAssistantMessage(approval: ToolApprovalDetail, action: 'approve' | 'reject') {
  if (action === 'reject') {
    return [
      `工具 ${approval.tool_name} 的调用申请已被拒绝。`,
      approval.decision_note ? `审批备注：${approval.decision_note}` : null,
    ].filter(Boolean).join('\n');
  }

  if (approval.execution_status === 'FAILED') {
    return [
      `工具 ${approval.tool_name} 已通过审批，但执行失败。`,
      approval.error_message ? `失败原因：${approval.error_message}` : null,
    ].filter(Boolean).join('\n');
  }

  return [
    `工具 ${approval.tool_name} 已通过审批并执行完成。`,
    createOutputPreview(approval.response_body) ? `结果摘要：${createOutputPreview(approval.response_body)}` : null,
  ].filter(Boolean).join('\n');
}

function buildApprovalSteps(approval: ToolApprovalDetail, action: 'approve' | 'reject') {
  return [
    {
      id: 'approval-decision',
      type: 'tool',
      title: '审批决策',
      status: 'done',
      summary: action === 'approve' ? '审批人已同意执行工具调用。' : '审批人已拒绝执行工具调用。',
    },
    {
      id: 'tool-execution',
      type: 'tool',
      title: '工具执行',
      status: action === 'reject' ? 'skipped' : approval.execution_status === 'FAILED' ? 'failed' : 'done',
      summary:
        action === 'reject'
          ? '工具执行被拒绝，未向目标服务发起调用。'
          : approval.execution_status === 'FAILED'
            ? approval.error_message ?? '工具执行失败。'
            : createOutputPreview(approval.response_body) ?? '工具执行成功。',
    },
  ];
}

function buildConversationToolCallSummary(approval: ToolApprovalDetail) {
  const status: ToolCallStatus =
    approval.status === 'REJECTED' ? 'REJECTED' : approval.execution_status;

  return {
    tool_id: approval.tool_id,
    tool_name: approval.tool_name,
    tool_code: approval.tool_code,
    status,
    approval_request_id: approval.id,
    latency_ms: approval.latency_ms,
    response_status: approval.response_status,
    output_preview: createOutputPreview(approval.response_body),
    error_message: approval.error_message,
  };
}
