import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  SecurityPolicyDetail,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyOverview,
  SimulateSecurityPolicyResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSecurityPolicyDto } from './dto/create-security-policy.dto';
import type { ListSecurityPoliciesDto } from './dto/list-security-policies.dto';
import type { ListSecurityPolicyEvaluationsDto } from './dto/list-security-policy-evaluations.dto';
import type { SimulateSecurityPolicyDto } from './dto/simulate-security-policy.dto';
import type { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';
import {
  evaluateSecurityPolicies,
  normalizeConditions,
  normalizePolicyEffect,
  type PolicyLike,
} from './security-policy-evaluator';

const policyDetailInclude = {
  creator: true,
  updater: true,
} satisfies Prisma.SecurityPolicyInclude;

const evaluationInclude = {
  matchedPolicy: true,
  operator: true,
} satisfies Prisma.SecurityPolicyEvaluationInclude;

type SecurityPolicyRecord = Prisma.SecurityPolicyGetPayload<{ include: typeof policyDetailInclude }>;
type SecurityPolicyEvaluationRecord = Prisma.SecurityPolicyEvaluationGetPayload<{ include: typeof evaluationInclude }>;

@Injectable()
export class SecurityPoliciesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<SecurityPolicyOverview> {
    const [total, active, disabled, deny, allow, policyStats, evaluationStats, recentEvaluations] =
      await this.prisma.$transaction([
        this.prisma.securityPolicy.count({
          where: {
            tenantId: currentUser.tenantId,
            deletedAt: null,
          },
        }),
        this.prisma.securityPolicy.count({
          where: {
            tenantId: currentUser.tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
        this.prisma.securityPolicy.count({
          where: {
            tenantId: currentUser.tenantId,
            status: 'DISABLED',
            deletedAt: null,
          },
        }),
        this.prisma.securityPolicy.count({
          where: {
            tenantId: currentUser.tenantId,
            effect: 'DENY',
            deletedAt: null,
          },
        }),
        this.prisma.securityPolicy.count({
          where: {
            tenantId: currentUser.tenantId,
            effect: 'ALLOW',
            deletedAt: null,
          },
        }),
        this.prisma.securityPolicy.findMany({
          where: {
            tenantId: currentUser.tenantId,
            deletedAt: null,
          },
          select: {
            resourceType: true,
          },
        }),
        this.prisma.securityPolicyEvaluation.findMany({
          where: {
            tenantId: currentUser.tenantId,
          },
          select: {
            decision: true,
          },
        }),
        this.prisma.securityPolicyEvaluation.findMany({
          where: {
            tenantId: currentUser.tenantId,
          },
          include: evaluationInclude,
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
        }),
      ]);

    return {
      total,
      active,
      disabled,
      deny,
      allow,
      resource_types: countBy(policyStats, (item) => item.resourceType)
        .map(([resourceType, policyCount]) => ({
          resource_type: resourceType,
          policy_count: policyCount,
        }))
        .slice(0, 8),
      decisions: countBy(evaluationStats, (item) => item.decision).map(([decision, evaluationCount]) => ({
        decision: decision as SecurityPolicyOverview['decisions'][number]['decision'],
        evaluation_count: evaluationCount,
      })),
      recent_evaluations: recentEvaluations.map((item) => this.mapEvaluation(item)),
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListSecurityPoliciesDto,
  ): Promise<PaginatedResult<SecurityPolicyListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const where = this.buildPolicyWhere(currentUser.tenantId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.securityPolicy.findMany({
        where,
        include: policyDetailInclude,
        orderBy: [
          {
            priority: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.securityPolicy.count({ where }),
    ]);

    const stats = await this.loadEvaluationStats(currentUser.tenantId, items.map((item) => item.id));

    return {
      items: items.map((item) => this.mapPolicyListItem(item, stats.get(item.id))),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateSecurityPolicyDto): Promise<SecurityPolicyDetail> {
    try {
      const policy = await this.prisma.securityPolicy.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          description: nullableText(dto.description),
          effect: dto.effect,
          resourceType: normalizeResourceType(dto.resource_type),
          action: normalizeAction(dto.action),
          priority: dto.priority ?? 100,
          conditions: normalizeConditions(dto.conditions),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: policyDetailInclude,
      });

      return this.mapPolicyDetail(policy, emptyEvaluationStats());
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A security policy with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<SecurityPolicyDetail> {
    const policy = await this.findPolicy(currentUser.tenantId, id);
    const stats = await this.loadEvaluationStats(currentUser.tenantId, [policy.id]);

    return this.mapPolicyDetail(policy, stats.get(policy.id));
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateSecurityPolicyDto): Promise<SecurityPolicyDetail> {
    await this.ensurePolicy(currentUser.tenantId, id);

    const data: Prisma.SecurityPolicyUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = nullableText(dto.description);
    if (dto.effect !== undefined) data.effect = dto.effect;
    if (dto.resource_type !== undefined) data.resourceType = normalizeResourceType(dto.resource_type);
    if (dto.action !== undefined) data.action = normalizeAction(dto.action);
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.conditions !== undefined) data.conditions = normalizeConditions(dto.conditions);

    const policy = await this.prisma.securityPolicy.update({
      where: {
        id,
      },
      data,
      include: policyDetailInclude,
    });
    const stats = await this.loadEvaluationStats(currentUser.tenantId, [policy.id]);

    return this.mapPolicyDetail(policy, stats.get(policy.id));
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensurePolicy(currentUser.tenantId, id);

    await this.prisma.securityPolicy.update({
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

  async setStatus(
    currentUser: AuthenticatedUser,
    id: string,
    status: 'ACTIVE' | 'DISABLED',
  ): Promise<SecurityPolicyDetail> {
    await this.ensurePolicy(currentUser.tenantId, id);

    const policy = await this.prisma.securityPolicy.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
      include: policyDetailInclude,
    });
    const stats = await this.loadEvaluationStats(currentUser.tenantId, [policy.id]);

    return this.mapPolicyDetail(policy, stats.get(policy.id));
  }

  async simulate(
    currentUser: AuthenticatedUser,
    dto: SimulateSecurityPolicyDto,
  ): Promise<SimulateSecurityPolicyResult> {
    const policies = await this.prisma.securityPolicy.findMany({
      where: {
        tenantId: currentUser.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          effect: 'desc',
        },
      ],
    });
    const result = evaluateSecurityPolicies(policies.map(toPolicyLike), {
      subject: dto.subject,
      resource: dto.resource,
      action: normalizeAction(dto.action),
      context: dto.context,
    });
    const matchedPolicy = result.matchedPolicy
      ? await this.prisma.securityPolicy.findUnique({
          where: {
            id: result.matchedPolicy.id,
          },
          include: policyDetailInclude,
        })
      : null;

    const evaluation = await this.prisma.securityPolicyEvaluation.create({
      data: {
        tenantId: currentUser.tenantId,
        requestId: currentUser.requestId ?? 'unknown',
        traceId: currentUser.traceId ?? null,
        subject: dto.subject as Prisma.InputJsonObject,
        resource: dto.resource as Prisma.InputJsonObject,
        action: normalizeAction(dto.action),
        decision: result.decision,
        matchedPolicyId: result.matchedPolicy?.id ?? null,
        matchedPolicyCode: result.matchedPolicy?.code ?? null,
        reason: result.reason,
        context: dto.context ? (dto.context as Prisma.InputJsonObject) : Prisma.JsonNull,
        createdBy: currentUser.id,
      },
      include: evaluationInclude,
    });

    return {
      decision: result.decision,
      matched_policy: matchedPolicy
        ? this.mapPolicyListItem(
            matchedPolicy,
            await this.loadSingleEvaluationStats(currentUser.tenantId, matchedPolicy.id),
          )
        : null,
      reason: result.reason,
      checked_count: result.checkedCount,
      evaluation: this.mapEvaluation(evaluation),
    };
  }

  async listEvaluations(
    currentUser: AuthenticatedUser,
    query: ListSecurityPolicyEvaluationsDto,
  ): Promise<PaginatedResult<SecurityPolicyEvaluationItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.SecurityPolicyEvaluationWhereInput = {
      tenantId: currentUser.tenantId,
    };

    if (query.decision) {
      where.decision = query.decision;
    }

    if (query.action) {
      where.action = normalizeAction(query.action);
    }

    if (keyword) {
      where.OR = [
        { requestId: { contains: keyword, mode: 'insensitive' } },
        { traceId: { contains: keyword, mode: 'insensitive' } },
        { matchedPolicyCode: { contains: keyword, mode: 'insensitive' } },
        { reason: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.securityPolicyEvaluation.findMany({
        where,
        include: evaluationInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.securityPolicyEvaluation.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapEvaluation(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  private buildPolicyWhere(tenantId: string, query: ListSecurityPoliciesDto): Prisma.SecurityPolicyWhereInput {
    const keyword = query.keyword?.trim();
    const where: Prisma.SecurityPolicyWhereInput = {
      tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') {
      where.status = query.status;
    }

    if (query.effect) {
      where.effect = query.effect;
    }

    if (query.resource_type) {
      where.resourceType = normalizeResourceType(query.resource_type);
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { action: { contains: keyword, mode: 'insensitive' } },
        { resourceType: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async ensurePolicy(tenantId: string, id: string) {
    const policy = await this.prisma.securityPolicy.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!policy) {
      throw new NotFoundException('Security policy not found');
    }
  }

  private async findPolicy(tenantId: string, id: string): Promise<SecurityPolicyRecord> {
    const policy = await this.prisma.securityPolicy.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: policyDetailInclude,
    });

    if (!policy) {
      throw new NotFoundException('Security policy not found');
    }

    return policy;
  }

  private async loadEvaluationStats(tenantId: string, policyIds: string[]) {
    if (policyIds.length === 0) return new Map<string, EvaluationStats>();

    const rows = await this.prisma.securityPolicyEvaluation.groupBy({
      by: ['matchedPolicyId'],
      where: {
        tenantId,
        matchedPolicyId: {
          in: policyIds,
        },
      },
      _count: {
        _all: true,
      },
      _max: {
        createdAt: true,
      },
    });

    return new Map(
      rows
        .filter((row) => row.matchedPolicyId)
        .map((row) => [
          row.matchedPolicyId ?? '',
          {
            evaluationCount: row._count._all,
            lastEvaluatedAt: row._max.createdAt,
          },
        ]),
    );
  }

  private async loadSingleEvaluationStats(tenantId: string, policyId: string) {
    const stats = await this.loadEvaluationStats(tenantId, [policyId]);
    return stats.get(policyId);
  }

  private mapPolicyDetail(policy: SecurityPolicyRecord, stats?: EvaluationStats): SecurityPolicyDetail {
    return {
      ...this.mapPolicyListItem(policy, stats),
      conditions: normalizeJsonOutput(policy.conditions),
    };
  }

  private mapPolicyListItem(policy: SecurityPolicyRecord, stats?: EvaluationStats): SecurityPolicyListItem {
    return {
      id: policy.id,
      tenant_id: policy.tenantId,
      name: policy.name,
      code: policy.code,
      description: policy.description,
      effect: normalizePolicyEffect(policy.effect),
      resource_type: policy.resourceType,
      action: policy.action,
      priority: policy.priority,
      status: policy.status as SecurityPolicyListItem['status'],
      condition_count: countConditions(policy.conditions),
      evaluation_count: stats?.evaluationCount ?? 0,
      last_evaluated_at: stats?.lastEvaluatedAt?.toISOString() ?? null,
      created_at: policy.createdAt.toISOString(),
      updated_at: policy.updatedAt.toISOString(),
      created_by: policy.creator
        ? {
            id: policy.creator.id,
            name: policy.creator.name,
            email: policy.creator.email,
          }
        : null,
      updated_by: policy.updater
        ? {
            id: policy.updater.id,
            name: policy.updater.name,
            email: policy.updater.email,
          }
        : null,
    };
  }

  private mapEvaluation(evaluation: SecurityPolicyEvaluationRecord): SecurityPolicyEvaluationItem {
    return {
      id: evaluation.id,
      tenant_id: evaluation.tenantId,
      request_id: evaluation.requestId,
      trace_id: evaluation.traceId,
      subject: normalizeJsonObjectOutput(evaluation.subject) ?? {},
      resource: normalizeJsonObjectOutput(evaluation.resource) ?? {},
      action: evaluation.action,
      decision: evaluation.decision as SecurityPolicyEvaluationItem['decision'],
      matched_policy_id: evaluation.matchedPolicyId,
      matched_policy_code: evaluation.matchedPolicyCode,
      matched_policy_name: evaluation.matchedPolicy?.name ?? null,
      reason: evaluation.reason,
      context: normalizeJsonObjectOutput(evaluation.context),
      created_at: evaluation.createdAt.toISOString(),
      created_by: evaluation.operator
        ? {
            id: evaluation.operator.id,
            name: evaluation.operator.name,
            email: evaluation.operator.email,
          }
        : null,
    };
  }
}

interface EvaluationStats {
  evaluationCount: number;
  lastEvaluatedAt: Date | null;
}

function emptyEvaluationStats(): EvaluationStats {
  return {
    evaluationCount: 0,
    lastEvaluatedAt: null,
  };
}

function toPolicyLike(policy: Prisma.SecurityPolicyGetPayload<object>): PolicyLike {
  return {
    id: policy.id,
    code: policy.code,
    name: policy.name,
    effect: policy.effect,
    resourceType: policy.resourceType,
    action: policy.action,
    priority: policy.priority,
    conditions: policy.conditions,
  };
}

function normalizeResourceType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    throw new BadRequestException('resource_type is required');
  }

  return normalized;
}

function normalizeAction(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    throw new BadRequestException('action is required');
  }

  return normalized;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function countConditions(value: Prisma.JsonValue | null) {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object') return 0;

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all)) return record.all.length;
  if (Array.isArray(record.conditions)) return record.conditions.length;
  if (record.path || record.field) return 1;

  return 0;
}

function normalizeJsonOutput(value: Prisma.JsonValue | null) {
  if (value === null || value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown> | Array<Record<string, unknown>>;
}

function normalizeJsonObjectOutput(value: Prisma.JsonValue | null) {
  const normalized = normalizeJsonOutput(value);
  return normalized && !Array.isArray(normalized) ? normalized : null;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const output = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, (output.get(key) ?? 0) + 1);
  }

  return Array.from(output.entries()).sort((left, right) => right[1] - left[1]);
}
