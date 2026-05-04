import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import type {
  ApprovalAuditArchiveItem,
  ApprovalAuditArchiveApprovalDetail,
  ApprovalAuditArchiveApprovalItem,
  ApprovalAuditArchiveApprovalOverview,
  ApprovalAuditArchiveListResult,
  ApprovalAuditEventItem,
  ApprovalAuditOverview,
  ApprovalAuditWindow,
  CreateApprovalAuditArchiveResult,
  PaginatedResult,
  StorageDownloadUrlResult,
  ToolApprovalDetail,
  ToolApprovalListItem,
  ToolApprovalOverview,
  ToolCallStatus,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ToolsService } from '../tools/tools.service';
import type { ListToolApprovalsDto } from './dto/list-tool-approvals.dto';
import type { ListApprovalAuditEventsDto } from './dto/list-approval-audit-events.dto';
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

const approvalAuditInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ApprovalAuditEventInclude;

type ApprovalAuditEventRecord = Prisma.ApprovalAuditEventGetPayload<{ include: typeof approvalAuditInclude }>;

const APPROVAL_AUDIT_ARCHIVE_PREFIX = 'audit-archives/approval-audits';
const APPROVAL_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN = 300;

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storageService: StorageService,
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
    const timeline = await this.loadApprovalAuditTimeline(currentUser.tenantId, id);
    return this.mapApprovalDetail(approval, timeline);
  }

  async getAuditOverview(
    currentUser: AuthenticatedUser,
    query: Pick<ListApprovalAuditEventsDto, 'window'>,
  ): Promise<ApprovalAuditOverview> {
    const window = normalizeApprovalAuditWindow(query.window);
    const since = approvalAuditWindowStart(window);
    const items = await this.loadApprovalAuditEvents(currentUser.tenantId, { since, limit: 500 });

    return {
      generated_at: new Date().toISOString(),
      window,
      summary: {
        total_count: items.length,
        success_count: items.filter((item) => item.event_status === 'SUCCESS').length,
        failed_count: items.filter((item) => item.event_status === 'FAILED').length,
        warning_count: items.filter((item) => item.event_status === 'WARNING').length,
        info_count: items.filter((item) => item.event_status === 'INFO').length,
        trace_count: items.filter((item) => item.trace_id).length,
        latest_event_at: items[0]?.occurred_at ?? null,
      },
      source_rankings: buildApprovalAuditSourceRankings(items),
      event_type_rankings: buildApprovalAuditEventTypeRankings(items),
      recent_events: items.slice(0, 8),
    };
  }

  async listAuditEvents(
    currentUser: AuthenticatedUser,
    query: ListApprovalAuditEventsDto,
  ): Promise<PaginatedResult<ApprovalAuditEventItem>> {
    const window = normalizeApprovalAuditWindow(query.window);
    const since = approvalAuditWindowStart(window);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const items = await this.loadFilteredApprovalAuditEvents(currentUser.tenantId, { since, query, limit: 800 });

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      page_size: pageSize,
      total: items.length,
    };
  }

  async exportAuditEvents(currentUser: AuthenticatedUser, query: ListApprovalAuditEventsDto): Promise<string> {
    const window = normalizeApprovalAuditWindow(query.window);
    const since = approvalAuditWindowStart(window);
    const items = await this.loadFilteredApprovalAuditEvents(currentUser.tenantId, { since, query, limit: 5000 });

    return buildApprovalAuditCsv(items);
  }

  async createAuditArchive(
    currentUser: AuthenticatedUser,
    query: ListApprovalAuditEventsDto,
  ): Promise<CreateApprovalAuditArchiveResult> {
    const csv = await this.exportAuditEvents(currentUser, query);
    const window = normalizeApprovalAuditWindow(query.window);
    const createdAt = new Date();
    const archiveKey = `${APPROVAL_AUDIT_ARCHIVE_PREFIX}/${createdAt.toISOString().replace(/[:.]/g, '-')}-${window}.csv`;
    const item = await this.storageService.putTenantObject({
      tenantId: currentUser.tenantId,
      key: archiveKey,
      body: `\uFEFF${csv}`,
      contentType: 'text/csv; charset=utf-8',
      metadata: {
        archive_type: 'approval_audit',
        created_by: currentUser.id,
        window,
        trace_only: query.trace_only ? 'true' : 'false',
      },
    });
    const mappedItem = mapApprovalAuditArchive(item);

    await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId: archiveSourceIdFromKey(mappedItem.key),
      eventType: 'ARCHIVED',
      eventStatus: 'SUCCESS',
      title: '审批审计归档已生成',
      note: `归档文件 ${mappedItem.file_name} 已保存到对象存储。`,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_id: mappedItem.id,
        archive_key: mappedItem.key,
        archive_file_name: mappedItem.file_name,
        archive_size_bytes: mappedItem.size_bytes,
        window,
        trace_only: query.trace_only ?? false,
      },
      actorId: currentUser.id,
    });

    return {
      item: mappedItem,
    };
  }

  async listAuditArchives(currentUser: AuthenticatedUser): Promise<ApprovalAuditArchiveListResult> {
    const items = (await this.storageService.listTenantObjects({
      tenantId: currentUser.tenantId,
      prefix: APPROVAL_AUDIT_ARCHIVE_PREFIX,
      limit: 100,
    })).map(mapApprovalAuditArchive);

    return {
      items,
      total: items.length,
      summary: {
        archive_count: items.length,
        total_size_bytes: items.reduce((sum, item) => sum + item.size_bytes, 0),
      },
    };
  }

  async getAuditArchiveDownloadUrl(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    const key = approvalAuditArchiveKeyFromId(archiveId);
    const result = await this.storageService.getTenantObjectDownloadUrl(
      currentUser.tenantId,
      key,
      APPROVAL_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    );

    await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId: archiveSourceIdFromKey(key),
      eventType: 'DOWNLOAD_URL_CREATED',
      eventStatus: 'INFO',
      title: '审批审计归档下载链接已生成',
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

  async deleteAuditArchive(currentUser: AuthenticatedUser, archiveId: string): Promise<{ success: boolean; approval_id: string }> {
    const key = approvalAuditArchiveKeyFromId(archiveId);
    const sourceId = archiveSourceIdFromKey(key);
    const existing = await this.findPendingArchiveDeleteApproval(currentUser.tenantId, sourceId);

    if (existing) {
      return {
        success: true,
        approval_id: existing.id,
      };
    }

    const event = await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId,
      eventType: 'DELETE_REQUESTED',
      eventStatus: 'WARNING',
      title: '审批审计归档删除待审批',
      note: '删除归档属于高危审计操作，已进入审批队列。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_id: archiveId,
        archive_key: key,
        archive_file_name: key.split('/').at(-1) ?? key,
      },
      actorId: currentUser.id,
    });

    return {
      success: true,
      approval_id: event.id,
    };
  }

  async archiveApprovalOverview(currentUser: AuthenticatedUser): Promise<ApprovalAuditArchiveApprovalOverview> {
    const items = await this.listArchiveDeleteApprovals(currentUser);

    return {
      pending_count: items.filter((item) => item.status === 'PENDING').length,
      approved_count: items.filter((item) => item.status === 'APPROVED').length,
      rejected_count: items.filter((item) => item.status === 'REJECTED').length,
      applied_count: items.filter((item) => item.status === 'APPLIED').length,
    };
  }

  async listArchiveDeleteApprovals(currentUser: AuthenticatedUser): Promise<ApprovalAuditArchiveApprovalItem[]> {
    const events = await this.loadArchiveDeleteEvents(currentUser.tenantId);
    return buildArchiveDeleteApprovals(events);
  }

  async getArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    const events = await this.loadArchiveDeleteEvents(currentUser.tenantId);
    const item = buildArchiveDeleteApprovals(events).find((approval) => approval.id === approvalId);

    if (!item) {
      throw new NotFoundException('Archive delete approval not found');
    }

    return {
      ...item,
      audit_timeline: events
        .filter((event) => event.source_id === item.archive_id)
        .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at)),
    };
  }

  async approveArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewToolApprovalDto,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    const detail = await this.getArchiveDeleteApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('Only pending archive delete approvals can be approved');
    }

    const note = nullableText(dto.decision_note);
    await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId: detail.archive_id,
      eventType: 'APPROVED',
      eventStatus: 'SUCCESS',
      title: '审批审计归档删除已批准',
      note,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    await this.storageService.deleteTenantObject(currentUser.tenantId, detail.archive_key);
    await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId: detail.archive_id,
      eventType: 'DELETE_APPLIED',
      eventStatus: 'SUCCESS',
      title: '审批审计归档删除已生效',
      note: '归档文件已从对象存储删除。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    return this.getArchiveDeleteApproval(currentUser, approvalId);
  }

  async rejectArchiveDeleteApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewToolApprovalDto,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    const detail = await this.getArchiveDeleteApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('Only pending archive delete approvals can be rejected');
    }

    await this.recordApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceType: 'APPROVAL_AUDIT_ARCHIVE',
      sourceId: detail.archive_id,
      eventType: 'REJECTED',
      eventStatus: 'WARNING',
      title: '审批审计归档删除已拒绝',
      note: nullableText(dto.decision_note) ?? '归档删除申请已拒绝。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
      },
      actorId: currentUser.id,
    });

    return this.getArchiveDeleteApproval(currentUser, approvalId);
  }

  async getAuditEvent(currentUser: AuthenticatedUser, eventId: string): Promise<ApprovalAuditEventItem> {
    const event = await this.prisma.approvalAuditEvent.findFirst({
      where: {
        id: eventId,
        tenantId: currentUser.tenantId,
      },
      include: approvalAuditInclude,
    });

    if (!event) {
      throw new NotFoundException('Approval audit event not found');
    }

    return mapApprovalAuditEvent(event);
  }

  async approve(
    currentUser: AuthenticatedUser,
    id: string,
    dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    await this.ensurePendingApproval(currentUser.tenantId, id);

    const result = await this.toolsService.executeApprovalRequest(currentUser, id);
    const decisionNote = nullableText(dto.decision_note);
    await this.prisma.$transaction([
      this.prisma.toolApprovalRequest.update({
        where: {
          id,
        },
        data: {
          status: 'APPROVED',
          reviewedBy: currentUser.id,
          reviewedAt: new Date(),
          decisionNote,
        },
      }),
      this.prisma.approvalAuditEvent.create({
        data: {
          tenantId: currentUser.tenantId,
          sourceType: 'TOOL_APPROVAL',
          sourceId: id,
          eventType: 'APPROVED',
          eventStatus: 'SUCCESS',
          title: '工具审批已批准',
          note: decisionNote,
          requestId: currentUser.requestId ?? null,
          traceId: currentUser.traceId ?? null,
          metadata: toJsonInput({
            execution_status: result.status,
            response_status: result.response_status,
            latency_ms: result.latency_ms,
          }),
          actorId: currentUser.id,
        },
      }),
    ]);
    if (result.status === 'FAILED') {
      await this.recordApprovalAuditEvent({
        tenantId: currentUser.tenantId,
        sourceType: 'TOOL_APPROVAL',
        sourceId: id,
        eventType: 'EXECUTION_FAILED',
        eventStatus: 'FAILED',
        title: '工具审批执行失败',
        note: result.error_message ?? '工具审批通过后执行失败。',
        requestId: currentUser.requestId ?? null,
        traceId: currentUser.traceId ?? null,
        metadata: {
          response_status: result.response_status,
          latency_ms: result.latency_ms,
        },
        actorId: currentUser.id,
      });
    }

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
      this.prisma.approvalAuditEvent.create({
        data: {
          tenantId: currentUser.tenantId,
          sourceType: 'TOOL_APPROVAL',
          sourceId: id,
          eventType: 'REJECTED',
          eventStatus: 'WARNING',
          title: '工具审批已拒绝',
          note: rejectionMessage,
          requestId: currentUser.requestId ?? null,
          traceId: currentUser.traceId ?? null,
          metadata: toJsonInput({
            tool_id: approval.toolId,
            tool_call_log_id: approval.toolCallLogId,
            trigger_source: approval.triggerSource,
          }),
          actorId: currentUser.id,
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

  private mapApprovalDetail(
    approval: ToolApprovalRecord,
    auditTimeline: ApprovalAuditEventItem[] = [],
  ): ToolApprovalDetail {
    return {
      ...this.mapApprovalListItem(approval),
      request_headers: normalizeStringRecord(approval.toolCallLog.requestHeaders),
      request_body: approval.toolCallLog.requestBody ?? null,
      response_status: approval.toolCallLog.responseStatus ?? null,
      response_headers: normalizeStringRecord(approval.toolCallLog.responseHeaders),
      response_body: approval.toolCallLog.responseBody ?? null,
      latency_ms: approval.toolCallLog.latencyMs,
      error_message: approval.toolCallLog.errorMessage,
      audit_timeline: auditTimeline,
    };
  }

  private mapActor(user: { id: string; name: string; email: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private async loadApprovalAuditTimeline(
    tenantId: string,
    sourceId: string,
  ): Promise<ApprovalAuditEventItem[]> {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'TOOL_APPROVAL',
        sourceId,
      },
      include: approvalAuditInclude,
      orderBy: {
        occurredAt: 'asc',
      },
    });

    return items.map(mapApprovalAuditEvent);
  }

  private async loadApprovalAuditEvents(
    tenantId: string,
    options: { since: Date; limit: number },
  ): Promise<ApprovalAuditEventItem[]> {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        occurredAt: {
          gte: options.since,
        },
      },
      include: approvalAuditInclude,
      orderBy: {
        occurredAt: 'desc',
      },
      take: options.limit,
    });

    return items.map(mapApprovalAuditEvent);
  }

  private async loadFilteredApprovalAuditEvents(
    tenantId: string,
    options: { since: Date; query: ListApprovalAuditEventsDto; limit: number },
  ): Promise<ApprovalAuditEventItem[]> {
    const keyword = options.query.keyword?.trim().toLowerCase();
    return (await this.loadApprovalAuditEvents(tenantId, { since: options.since, limit: options.limit })).filter((item) => {
      if (options.query.source_type && item.source_type !== options.query.source_type) return false;
      if (options.query.event_type && item.event_type !== options.query.event_type) return false;
      if (options.query.event_status && item.event_status !== options.query.event_status) return false;
      if (options.query.trace_only && !item.trace_id) return false;
      if (!keyword) return true;

      return [
        item.title,
        item.note,
        item.request_id,
        item.trace_id,
        item.source_id,
        item.actor?.name,
        item.actor?.email,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });
  }

  private async loadArchiveDeleteEvents(tenantId: string): Promise<ApprovalAuditEventItem[]> {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'APPROVAL_AUDIT_ARCHIVE',
        eventType: {
          in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'],
        },
      },
      include: approvalAuditInclude,
      orderBy: {
        occurredAt: 'desc',
      },
      take: 500,
    });

    return items.map(mapApprovalAuditEvent);
  }

  private async findPendingArchiveDeleteApproval(tenantId: string, sourceId: string) {
    const events = (await this.loadArchiveDeleteEvents(tenantId)).filter((event) => event.source_id === sourceId);
    const approval = buildArchiveDeleteApprovals(events)[0] ?? null;
    return approval?.status === 'PENDING' ? approval : null;
  }

  private async recordApprovalAuditEvent(input: {
    tenantId: string;
    sourceType: 'TOOL_APPROVAL' | 'APPROVAL_AUDIT_ARCHIVE';
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
        sourceType: input.sourceType,
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

function mapApprovalAuditEvent(item: ApprovalAuditEventRecord): ApprovalAuditEventItem {
  return {
    id: item.id,
    tenant_id: item.tenantId,
    source_type: item.sourceType as ApprovalAuditEventItem['source_type'],
    source_id: item.sourceId,
    event_type: item.eventType as ApprovalAuditEventItem['event_type'],
    event_status: item.eventStatus as ApprovalAuditEventItem['event_status'],
    title: item.title,
    note: item.note,
    request_id: item.requestId,
    trace_id: item.traceId,
    metadata: normalizeJsonObject(item.metadata),
    actor: item.actor
      ? {
          id: item.actor.id,
          name: item.actor.name,
          email: item.actor.email,
        }
      : null,
    occurred_at: item.occurredAt.toISOString(),
  };
}

function normalizeJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return {};
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeApprovalAuditWindow(window: string | undefined): ApprovalAuditWindow {
  if (window === '7d' || window === '30d') return window;
  return '24h';
}

function approvalAuditWindowStart(window: ApprovalAuditWindow) {
  const now = new Date();
  if (window === '30d') {
    now.setDate(now.getDate() - 30);
    return now;
  }
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function buildApprovalAuditSourceRankings(items: ApprovalAuditEventItem[]): ApprovalAuditOverview['source_rankings'] {
  return Array.from(groupApprovalAuditBy(items, (item) => item.source_type).entries())
    .map(([sourceType, sourceItems]) => ({
      source_type: sourceType,
      event_count: sourceItems.length,
      failed_count: sourceItems.filter((item) => item.event_status === 'FAILED').length,
    }))
    .sort((left, right) => right.event_count - left.event_count);
}

function buildApprovalAuditEventTypeRankings(
  items: ApprovalAuditEventItem[],
): ApprovalAuditOverview['event_type_rankings'] {
  return Array.from(groupApprovalAuditBy(items, (item) => item.event_type).entries())
    .map(([eventType, eventItems]) => ({
      event_type: eventType,
      event_count: eventItems.length,
      failed_count: eventItems.filter((item) => item.event_status === 'FAILED').length,
    }))
    .sort((left, right) => right.event_count - left.event_count)
    .slice(0, 8);
}

function groupApprovalAuditBy<TKey extends string>(
  items: ApprovalAuditEventItem[],
  getKey: (item: ApprovalAuditEventItem) => TKey,
) {
  const output = new Map<TKey, ApprovalAuditEventItem[]>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, [...(output.get(key) ?? []), item]);
  }
  return output;
}

function buildApprovalAuditCsv(items: ApprovalAuditEventItem[]) {
  const rows = [
    [
      '事件ID',
      '租户ID',
      '来源类型',
      '来源记录ID',
      '事件类型',
      '事件状态',
      '标题',
      '备注',
      '操作人',
      '操作人邮箱',
      '请求ID',
      'Trace ID',
      '发生时间',
      '元数据',
    ],
    ...items.map((item) => [
      item.id,
      item.tenant_id,
      item.source_type,
      item.source_id,
      item.event_type,
      item.event_status,
      item.title,
      item.note ?? '',
      item.actor?.name ?? '系统',
      item.actor?.email ?? '',
      item.request_id ?? '',
      item.trace_id ?? '',
      item.occurred_at,
      JSON.stringify(item.metadata ?? {}),
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function mapApprovalAuditArchive(item: {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}): ApprovalAuditArchiveItem {
  return {
    id: Buffer.from(item.key, 'utf8').toString('base64url'),
    key: item.key,
    file_name: item.file_name,
    folder: item.folder,
    size_bytes: item.size_bytes,
    etag: item.etag,
    last_modified: item.last_modified,
    download_expires_in: APPROVAL_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
  };
}

function buildArchiveDeleteApprovals(events: ApprovalAuditEventItem[]): ApprovalAuditArchiveApprovalItem[] {
  const groups = new Map<string, ApprovalAuditEventItem[]>();

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
      const metadata = normalizeArchiveMetadata(request.metadata);

      return {
        id: request.id,
        archive_id: sourceId,
        archive_key: metadata.archive_key,
        archive_file_name: metadata.archive_file_name,
        archive_size_bytes: metadata.archive_size_bytes,
        status: archiveApprovalStatus({ applied, approved, rejected }),
        reason: request.note,
        requested_by: request.actor,
        reviewed_by: latestDecision?.actor ?? null,
        requested_at: request.occurred_at,
        reviewed_at: latestDecision?.occurred_at ?? null,
      };
    })
    .filter((item): item is ApprovalAuditArchiveApprovalItem => Boolean(item))
    .sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
}

function archiveApprovalStatus(input: {
  applied: ApprovalAuditEventItem | null;
  approved: ApprovalAuditEventItem | null;
  rejected: ApprovalAuditEventItem | null;
}): ApprovalAuditArchiveApprovalItem['status'] {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function normalizeArchiveMetadata(metadata: Record<string, unknown> | null) {
  const archiveKey = typeof metadata?.archive_key === 'string' ? metadata.archive_key : '';
  return {
    archive_key: archiveKey,
    archive_file_name:
      typeof metadata?.archive_file_name === 'string'
        ? metadata.archive_file_name
        : archiveKey.split('/').at(-1) ?? '归档文件',
    archive_size_bytes:
      typeof metadata?.archive_size_bytes === 'number'
        ? metadata.archive_size_bytes
        : 0,
  };
}

function approvalAuditArchiveKeyFromId(archiveId: string) {
  const key = Buffer.from(archiveId, 'base64url').toString('utf8');
  if (!key.startsWith(`${APPROVAL_AUDIT_ARCHIVE_PREFIX}/`)) {
    throw new BadRequestException('Invalid approval audit archive id');
  }
  return key;
}

function archiveSourceIdFromKey(key: string) {
  return uuidFromText(`approval-audit-archive:${key}`);
}

function uuidFromText(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
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
