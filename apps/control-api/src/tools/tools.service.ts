import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import type {
  PaginatedResult,
  TestToolResult,
  ToolAgentReferenceItem,
  ToolCallLogItem,
  ToolCallTriggerSource,
  ToolDetail,
  ToolListItem,
} from '@aiaget/shared-types';

import type { TraceContext } from '../common/tracing/trace-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { ToolGatewayService, type ToolGatewayCallLogRecord } from '../tool-gateway/tool-gateway.service';
import type { CreateToolDto } from './dto/create-tool.dto';
import type { ListToolCallLogsDto } from './dto/list-tool-call-logs.dto';
import type { ListToolsDto } from './dto/list-tools.dto';
import type { TestToolDto } from './dto/test-tool.dto';
import type { UpdateToolDto } from './dto/update-tool.dto';
import { ensureSchemaDocument, isPlainObject } from './tool-schema';

const toolListInclude = {
  callLogs: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
    include: {
      approvalRequest: true,
    },
  },
} satisfies Prisma.ToolInclude;

const toolDetailInclude = {
  callLogs: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    include: {
      tool: true,
      operator: true,
      approvalRequest: true,
    },
  },
} satisfies Prisma.ToolInclude;

type ToolListRecord = Prisma.ToolGetPayload<{ include: typeof toolListInclude }>;
type ToolDetailRecord = Prisma.ToolGetPayload<{ include: typeof toolDetailInclude }>;
type ToolCallLogRecord = ToolGatewayCallLogRecord;
type ToolCallLogListRecord = Prisma.ToolCallLogGetPayload<{
  include: {
    tool: true;
    operator: true;
    approvalRequest: true;
  };
}>;
type ToolAgentBindingRecord = Prisma.AgentToolBindingGetPayload<{
  include: {
    agent: true;
  };
}>;

interface ToolExecutionContext {
  triggerSource: ToolCallTriggerSource;
  agentId?: string | null;
  conversationId?: string | null;
  traceContext?: TraceContext | null;
  requireApproval?: boolean | null;
}

@Injectable()
export class ToolsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(ToolGatewayService) private readonly toolGateway: ToolGatewayService,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListToolsDto,
  ): Promise<PaginatedResult<ToolListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.ToolWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') {
      where.status = query.status;
    }

    if (query.tool_type) {
      where.toolType = query.tool_type;
    }

    if (query.risk_level) {
      where.riskLevel = query.risk_level;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { url: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.ToolWhereInput>(currentUser, 'TOOL');
    mergeDataScopeWhere(where, dataScope.where);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: toolListInclude,
      }),
      this.prisma.tool.count({ where }),
    ]);

    const toolIds = items.map((item) => item.id);
    const [todayCallStats, agentReferenceStats] = toolIds.length
      ? await Promise.all([
          this.prisma.toolCallLog.groupBy({
            by: ['toolId', 'status'],
            where: {
              tenantId: currentUser.tenantId,
              toolId: {
                in: toolIds,
              },
              createdAt: {
                gte: startOfToday(),
              },
            },
            _count: {
              _all: true,
            },
          }),
          this.prisma.agentToolBinding.groupBy({
            by: ['toolId'],
            where: {
              tenantId: currentUser.tenantId,
              deletedAt: null,
              toolId: {
                in: toolIds,
              },
            },
            _count: {
              _all: true,
            },
          }),
        ])
      : [[], []];

    const callCountMap = new Map<string, number>();
    const failureCountMap = new Map<string, number>();
    for (const item of todayCallStats) {
      const nextCount = (callCountMap.get(item.toolId) ?? 0) + item._count._all;
      callCountMap.set(item.toolId, nextCount);

      if (item.status === 'FAILED') {
        failureCountMap.set(item.toolId, (failureCountMap.get(item.toolId) ?? 0) + item._count._all);
      }
    }

    const agentRefMap = new Map(agentReferenceStats.map((item) => [item.toolId, item._count._all]));

    return {
      items: items.map((tool) =>
        this.mapToolListItem(
          tool,
          callCountMap.get(tool.id) ?? 0,
          failureCountMap.get(tool.id) ?? 0,
          agentRefMap.get(tool.id) ?? 0,
        ),
      ),
      page,
      page_size: pageSize,
      total,
    };
  }

  async listLogs(
    currentUser: AuthenticatedUser,
    query: ListToolCallLogsDto,
  ): Promise<PaginatedResult<ToolCallLogItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.ToolCallLogWhereInput = {
      tenantId: currentUser.tenantId,
    };

    if (query.tool_id) {
      where.toolId = query.tool_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.trigger_source) {
      where.triggerSource = query.trigger_source;
    }

    if (query.approval_status) {
      where.approvalRequest = {
        status: query.approval_status,
      };
    }

    if (query.request_method) {
      where.requestMethod = query.request_method;
    }

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.date_from) {
      dateFilter.gte = new Date(query.date_from);
    }
    if (query.date_to) {
      dateFilter.lte = new Date(query.date_to);
    }
    if (dateFilter.gte || dateFilter.lte) {
      where.createdAt = dateFilter;
    }

    if (keyword) {
      where.OR = [
        { requestUrl: { contains: keyword, mode: 'insensitive' } },
        { errorMessage: { contains: keyword, mode: 'insensitive' } },
        { tool: { name: { contains: keyword, mode: 'insensitive' } } },
        { tool: { code: { contains: keyword, mode: 'insensitive' } } },
        { operator: { email: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.ToolWhereInput>(currentUser, 'TOOL');
    appendToolLogWhere(where, dataScope.where ? { tool: dataScope.where } : null);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.toolCallLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tool: true,
          operator: true,
          approvalRequest: true,
        },
      }),
      this.prisma.toolCallLog.count({ where }),
    ]);

    return {
      items: items.map((callLog) => this.mapToolCallLog(callLog)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateToolDto): Promise<ToolDetail> {
    try {
      const tool: ToolDetailRecord = await this.prisma.tool.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          description: nullableText(dto.description),
          toolType: dto.tool_type ?? 'HTTP',
          method: dto.method,
          url: dto.url.trim(),
          riskLevel: dto.risk_level ?? 'LOW',
          timeoutMs: dto.timeout_ms ?? 10000,
          requireApproval: dto.require_approval ?? false,
          headers: toJsonInput(normalizeStringRecord(dto.headers, 'headers')),
          authType: dto.auth_type ?? 'NONE',
          authConfig: toJsonInput(normalizeJsonRecord(dto.auth_config, 'auth_config')),
          inputSchema: toJsonInput(ensureSchemaDocument(dto.input_schema, 'input_schema')),
          outputSchema: toJsonInput(ensureSchemaDocument(dto.output_schema, 'output_schema')),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: toolDetailInclude,
      });

      return this.mapToolDetail(tool, []);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A tool with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<ToolDetail> {
    const tool = await this.findTool(currentUser.tenantId, id);
    const references = await this.findAgentReferences(currentUser.tenantId, id);

    return this.mapToolDetail(tool, references);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateToolDto): Promise<ToolDetail> {
    await this.ensureTool(currentUser.tenantId, id);

    const data: Prisma.ToolUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = nullableText(dto.description);
    if (dto.method !== undefined) data.method = dto.method;
    if (dto.url !== undefined) data.url = dto.url.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.risk_level !== undefined) data.riskLevel = dto.risk_level;
    if (dto.timeout_ms !== undefined) data.timeoutMs = dto.timeout_ms;
    if (dto.require_approval !== undefined) data.requireApproval = dto.require_approval;
    if (dto.headers !== undefined) data.headers = toJsonInput(normalizeStringRecord(dto.headers, 'headers'));
    if (dto.auth_type !== undefined) data.authType = dto.auth_type;
    if (dto.auth_config !== undefined) data.authConfig = toJsonInput(normalizeJsonRecord(dto.auth_config, 'auth_config'));
    if (dto.input_schema !== undefined) data.inputSchema = toJsonInput(ensureSchemaDocument(dto.input_schema, 'input_schema'));
    if (dto.output_schema !== undefined) data.outputSchema = toJsonInput(ensureSchemaDocument(dto.output_schema, 'output_schema'));

    const tool: ToolDetailRecord = await this.prisma.tool.update({
      where: {
        id,
      },
      data,
      include: toolDetailInclude,
    });
    const references = await this.findAgentReferences(currentUser.tenantId, id);

    return this.mapToolDetail(tool, references);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureTool(currentUser.tenantId, id);

    await this.prisma.tool.update({
      where: {
        id,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async copy(currentUser: AuthenticatedUser, id: string): Promise<ToolDetail> {
    const tool = await this.findTool(currentUser.tenantId, id);

    const copiedTool: ToolDetailRecord = await this.prisma.tool.create({
      data: {
        tenantId: currentUser.tenantId,
        name: `${tool.name} 副本`,
        code: `${tool.code}_copy_${randomUUID().slice(0, 6)}`,
        description: tool.description,
        toolType: tool.toolType,
        method: tool.method,
        url: tool.url,
        status: 'DISABLED',
        riskLevel: tool.riskLevel,
        timeoutMs: tool.timeoutMs,
        requireApproval: tool.requireApproval,
        headers: toJsonInput(tool.headers),
        authType: tool.authType,
        authConfig: toJsonInput(tool.authConfig),
        inputSchema: toJsonInput(tool.inputSchema),
        outputSchema: toJsonInput(tool.outputSchema),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: toolDetailInclude,
    });

    return this.mapToolDetail(copiedTool, []);
  }

  async setStatus(
    currentUser: AuthenticatedUser,
    id: string,
    status: 'ACTIVE' | 'DISABLED',
  ): Promise<ToolDetail> {
    await this.ensureTool(currentUser.tenantId, id);

    const tool: ToolDetailRecord = await this.prisma.tool.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
      include: toolDetailInclude,
    });
    const references = await this.findAgentReferences(currentUser.tenantId, id);

    return this.mapToolDetail(tool, references);
  }

  async execute(
    currentUser: AuthenticatedUser,
    id: string,
    input: Record<string, unknown>,
    context: ToolExecutionContext,
  ): Promise<TestToolResult> {
    const result = await this.toolGateway.execute(currentUser, id, input, context);
    return this.mapTestResult(result.callLog, result.approvalRequired);
  }

  async test(currentUser: AuthenticatedUser, id: string, dto: TestToolDto): Promise<TestToolResult> {
    return this.execute(currentUser, id, dto.input ?? {}, {
      triggerSource: 'TEST',
      traceContext: traceContextFromUser(currentUser),
    });
  }

  async executeApprovalRequest(
    currentUser: AuthenticatedUser,
    approvalRequestId: string,
  ): Promise<ToolCallLogItem> {
    const result = await this.toolGateway.executeApprovalRequest(currentUser, approvalRequestId);
    return this.mapToolCallLog(result.callLog);
  }

  private async ensureTool(tenantId: string, id: string) {
    const tool = await this.prisma.tool.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
  }

  private async findTool(tenantId: string, id: string): Promise<ToolDetailRecord> {
    const tool = await this.prisma.tool.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: toolDetailInclude,
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    return tool;
  }

  private async findAgentReferences(tenantId: string, toolId: string): Promise<ToolAgentBindingRecord[]> {
    return this.prisma.agentToolBinding.findMany({
      where: {
        tenantId,
        toolId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        agent: true,
      },
    });
  }

  private mapToolListItem(
    tool: ToolListRecord,
    callCountToday: number,
    failureCountToday: number,
    agentReferenceCount: number,
  ): ToolListItem {
    const lastCall = tool.callLogs[0] ?? null;

    return {
      id: tool.id,
      tenant_id: tool.tenantId,
      name: tool.name,
      code: tool.code,
      description: tool.description,
      tool_type: tool.toolType as ToolListItem['tool_type'],
      method: tool.method as ToolListItem['method'],
      url: tool.url,
      status: tool.status as ToolListItem['status'],
      risk_level: tool.riskLevel as ToolListItem['risk_level'],
      timeout_ms: tool.timeoutMs,
      require_approval: tool.requireApproval,
      auth_type: tool.authType as ToolListItem['auth_type'],
      call_count_today: callCountToday,
      failure_count_today: failureCountToday,
      last_call_at: lastCall?.createdAt.toISOString() ?? null,
      last_call_status: (lastCall?.status as ToolListItem['last_call_status']) ?? null,
      agent_reference_count: agentReferenceCount,
      created_at: tool.createdAt.toISOString(),
      updated_at: tool.updatedAt.toISOString(),
    };
  }

  private mapToolDetail(tool: ToolDetailRecord, references: ToolAgentBindingRecord[]): ToolDetail {
    const todayLogs = tool.callLogs.filter((log) => isSameLocalDay(log.createdAt, new Date()));
    const failureCountToday = todayLogs.filter((log) => log.status === 'FAILED').length;

    return {
      ...this.mapToolListItem(tool, todayLogs.length, failureCountToday, references.length),
      headers: normalizeStringRecord(tool.headers, 'headers'),
      auth_config: normalizeJsonRecord(tool.authConfig, 'auth_config'),
      input_schema: normalizeJsonRecord(tool.inputSchema, 'input_schema'),
      output_schema: normalizeJsonRecord(tool.outputSchema, 'output_schema'),
      call_logs: tool.callLogs.map((callLog) => this.mapToolCallLog(callLog)),
      agent_references: references.map((reference) => this.mapToolAgentReference(reference)),
    };
  }

  private mapToolCallLog(callLog: ToolCallLogRecord | ToolCallLogListRecord): ToolCallLogItem {
    return {
      id: callLog.id,
      tool_id: callLog.toolId,
      tool_name: 'tool' in callLog ? callLog.tool.name : callLog.toolId,
      tool_code: 'tool' in callLog ? callLog.tool.code : callLog.toolId,
      trigger_source: callLog.triggerSource as ToolCallLogItem['trigger_source'],
      status: callLog.status as ToolCallLogItem['status'],
      approval_request_id: callLog.approvalRequest?.id ?? null,
      approval_status: (callLog.approvalRequest?.status as ToolCallLogItem['approval_status']) ?? null,
      request_url: callLog.requestUrl,
      request_method: callLog.requestMethod as ToolCallLogItem['request_method'],
      request_headers: normalizeStringRecord(callLog.requestHeaders, 'request_headers'),
      request_body: callLog.requestBody ?? null,
      response_status: callLog.responseStatus ?? null,
      response_headers: normalizeStringRecord(callLog.responseHeaders, 'response_headers'),
      response_body: callLog.responseBody ?? null,
      latency_ms: callLog.latencyMs,
      error_message: callLog.errorMessage,
      created_at: callLog.createdAt.toISOString(),
      created_by: callLog.operator
        ? {
            id: callLog.operator.id,
            name: callLog.operator.name,
            email: callLog.operator.email,
          }
        : null,
    };
  }

  private mapToolAgentReference(reference: ToolAgentBindingRecord): ToolAgentReferenceItem {
    return {
      id: reference.id,
      agent_id: reference.agentId,
      agent_name: reference.agent.name,
      agent_code: reference.agent.code,
      require_approval: reference.requireApproval,
      created_at: reference.createdAt.toISOString(),
    };
  }

  private mapTestResult(
    callLog: ToolCallLogRecord,
    approvalRequired: boolean,
  ): TestToolResult {
    return {
      id: callLog.id,
      tool_id: callLog.toolId,
      status: callLog.status as TestToolResult['status'],
      approval_request_id: callLog.approvalRequest?.id ?? null,
      request_url: callLog.requestUrl,
      request_method: callLog.requestMethod as TestToolResult['request_method'],
      request_headers: normalizeStringRecord(callLog.requestHeaders, 'request_headers'),
      request_body: callLog.requestBody ?? null,
      response_status: callLog.responseStatus ?? null,
      response_headers: normalizeStringRecord(callLog.responseHeaders, 'response_headers'),
      response_body: callLog.responseBody ?? null,
      latency_ms: callLog.latencyMs,
      error_message: callLog.errorMessage,
      approval_required: approvalRequired,
    };
  }
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeStringRecord(value: unknown, fieldName: string): Record<string, string> | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw new BadRequestException(`${fieldName} must be a JSON object`);
  }

  const output: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new BadRequestException(`${fieldName}.${key} must be a string`);
    }
    output[key] = entry;
  }

  return output;
}

function normalizeJsonRecord(value: unknown, fieldName: string): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw new BadRequestException(`${fieldName} must be a JSON object`);
  }

  return value;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function traceContextFromUser(currentUser: AuthenticatedUser): TraceContext | null {
  if (!currentUser.traceId || !currentUser.spanId || !currentUser.traceparent) {
    return null;
  }

  return {
    traceId: currentUser.traceId,
    spanId: currentUser.spanId,
    parentSpanId: currentUser.parentSpanId ?? null,
    traceparent: currentUser.traceparent,
    requestId: currentUser.requestId ?? null,
  };
}

function appendToolLogWhere(where: Prisma.ToolCallLogWhereInput, clause: Prisma.ToolCallLogWhereInput | null) {
  if (!clause) return;

  const current = where.AND;
  const currentItems = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...currentItems, clause];
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}
