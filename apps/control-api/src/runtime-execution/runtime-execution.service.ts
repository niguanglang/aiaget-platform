import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { expandPermissionCodes, hasPermission, type ConversationReferenceItem, type DataScopeResourceType, type TestToolResult } from '@aiaget/shared-types';

import { buildTraceparent, createSpanId, type TraceContext } from '../common/tracing/trace-context';
import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopeQueryService } from '../common/services/data-scope-query.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { ToolsService } from '../tools/tools.service';
import type { RuntimeKnowledgeTaskDto } from './dto/runtime-knowledge-task.dto';
import type { RuntimeRetrieveDto } from './dto/runtime-retrieve.dto';
import type { RuntimeToolCallDto } from './dto/runtime-tool-call.dto';

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
    @Inject(ToolsService) private readonly toolsService: ToolsService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
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

    return mapToolCallSummary(tool.id, tool.name, tool.code, result);
  }

  async runKnowledgeTask(dto: RuntimeKnowledgeTaskDto) {
    return this.knowledgeService.runWorkflowTask(dto.task_id);
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

    const subjectKeys = buildSubjectKeys(user);
    const matched = acls.filter((acl) => subjectKeys.has(subjectKey(acl.subjectType, acl.subjectId)));
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

function buildSubjectKeys(user: AuthenticatedUser) {
  const output = new Set<string>();
  output.add(subjectKey('USER', user.id));
  output.add(subjectKey('TENANT', user.tenantId));

  for (const roleId of user.roleIds ?? []) {
    output.add(subjectKey('ROLE', roleId));
  }

  if (user.departmentId) {
    output.add(subjectKey('DEPARTMENT', user.departmentId));
  }

  return output;
}

function subjectKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
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
