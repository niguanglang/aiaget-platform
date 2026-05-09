import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  RoleScenarioAssetSummary,
  RoleScenarioDetail,
  RoleScenarioLinkedResources,
  RoleScenarioListItem,
  RoleScenarioOwnerSummary,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleScenarioDto } from './dto/create-role-scenario.dto';
import type { ListRoleScenariosDto } from './dto/list-role-scenarios.dto';
import type { UpdateRoleScenarioDto } from './dto/update-role-scenario.dto';

const roleScenarioInclude = {
  owner: true,
  agent: true,
  skill: true,
  knowledge: true,
  tool: true,
  prompt: true,
} satisfies Prisma.RoleScenarioInclude;

type RoleScenarioRecord = Prisma.RoleScenarioGetPayload<{ include: typeof roleScenarioInclude }>;
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class RoleScenariosService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(currentUser: AuthenticatedUser, query: ListRoleScenariosDto): Promise<PaginatedResult<RoleScenarioListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.RoleScenarioWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.scenario_type) where.scenarioType = query.scenario_type;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.owner_id) where.ownerId = query.owner_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { roleName: { contains: keyword, mode: 'insensitive' } },
        { departmentName: { contains: keyword, mode: 'insensitive' } },
        { painPoint: { contains: keyword, mode: 'insensitive' } },
        { businessGoal: { contains: keyword, mode: 'insensitive' } },
        { workflowSummary: { contains: keyword, mode: 'insensitive' } },
        { expectedOutcome: { contains: keyword, mode: 'insensitive' } },
        { sampleDeliverable: { contains: keyword, mode: 'insensitive' } },
        { acceptanceCriteria: { contains: keyword, mode: 'insensitive' } },
        { roiMetric: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.RoleScenarioWhereInput>(
        currentUser,
        'ROLE_SCENARIO',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.roleScenario.findMany({
        where,
        include: roleScenarioInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.roleScenario.count({ where }),
    ]);

    return {
      items: items.map((scenario) => this.mapListItem(scenario)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateRoleScenarioDto): Promise<RoleScenarioDetail> {
    await this.validateReferences(currentUser.tenantId, dto);
    const impactScore = dto.impact_score ?? calculateImpactScore(dto);

    try {
      const scenario = await this.prisma.roleScenario.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          agentId: nullableId(dto.agent_id),
          skillId: nullableId(dto.skill_id),
          knowledgeId: nullableId(dto.knowledge_id),
          toolId: nullableId(dto.tool_id),
          promptId: nullableId(dto.prompt_id),
          name: dto.name.trim(),
          code: dto.code.trim(),
          roleName: dto.role_name.trim(),
          departmentName: dto.department_name.trim(),
          scenarioType: dto.scenario_type ?? 'CUSTOM',
          status: dto.status ?? 'DRAFT',
          priority: dto.priority ?? 'MEDIUM',
          painPoint: dto.pain_point.trim(),
          businessGoal: dto.business_goal.trim(),
          workflowSummary: dto.workflow_summary.trim(),
          expectedOutcome: dto.expected_outcome.trim(),
          sampleDeliverable: dto.sample_deliverable.trim(),
          acceptanceCriteria: dto.acceptance_criteria.trim(),
          roiMetric: dto.roi_metric.trim(),
          impactScore,
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: roleScenarioInclude,
      });

      return this.mapDetail(scenario);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A role scenario with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<RoleScenarioDetail> {
    const scenario = await this.findScenario(currentUser.tenantId, id);

    return this.mapDetail(scenario);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateRoleScenarioDto): Promise<RoleScenarioDetail> {
    const existing = await this.ensureScenario(currentUser.tenantId, id);
    await this.validateReferences(currentUser.tenantId, dto);

    const scoreInput = {
      scenario_type: dto.scenario_type ?? existing.scenarioType,
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      pain_point: dto.pain_point ?? existing.painPoint,
      business_goal: dto.business_goal ?? existing.businessGoal,
      workflow_summary: dto.workflow_summary ?? existing.workflowSummary,
      expected_outcome: dto.expected_outcome ?? existing.expectedOutcome,
      sample_deliverable: dto.sample_deliverable ?? existing.sampleDeliverable,
      acceptance_criteria: dto.acceptance_criteria ?? existing.acceptanceCriteria,
      roi_metric: dto.roi_metric ?? existing.roiMetric,
      agent_id: dto.agent_id === undefined ? existing.agentId : dto.agent_id,
      skill_id: dto.skill_id === undefined ? existing.skillId : dto.skill_id,
      knowledge_id: dto.knowledge_id === undefined ? existing.knowledgeId : dto.knowledge_id,
      tool_id: dto.tool_id === undefined ? existing.toolId : dto.tool_id,
      prompt_id: dto.prompt_id === undefined ? existing.promptId : dto.prompt_id,
    };

    const data: Prisma.RoleScenarioUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.role_name !== undefined) data.roleName = dto.role_name.trim();
    if (dto.department_name !== undefined) data.departmentName = dto.department_name.trim();
    if (dto.scenario_type !== undefined) data.scenarioType = dto.scenario_type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.pain_point !== undefined) data.painPoint = dto.pain_point.trim();
    if (dto.business_goal !== undefined) data.businessGoal = dto.business_goal.trim();
    if (dto.workflow_summary !== undefined) data.workflowSummary = dto.workflow_summary.trim();
    if (dto.expected_outcome !== undefined) data.expectedOutcome = dto.expected_outcome.trim();
    if (dto.sample_deliverable !== undefined) data.sampleDeliverable = dto.sample_deliverable.trim();
    if (dto.acceptance_criteria !== undefined) data.acceptanceCriteria = dto.acceptance_criteria.trim();
    if (dto.roi_metric !== undefined) data.roiMetric = dto.roi_metric.trim();
    if (dto.impact_score !== undefined) {
      data.impactScore = dto.impact_score;
    } else {
      data.impactScore = calculateImpactScore(scoreInput);
    }
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (dto.agent_id !== undefined) {
      data.agent = dto.agent_id ? { connect: { id: dto.agent_id } } : { disconnect: true };
    }
    if (dto.skill_id !== undefined) {
      data.skill = dto.skill_id ? { connect: { id: dto.skill_id } } : { disconnect: true };
    }
    if (dto.knowledge_id !== undefined) {
      data.knowledge = dto.knowledge_id ? { connect: { id: dto.knowledge_id } } : { disconnect: true };
    }
    if (dto.tool_id !== undefined) {
      data.tool = dto.tool_id ? { connect: { id: dto.tool_id } } : { disconnect: true };
    }
    if (dto.prompt_id !== undefined) {
      data.prompt = dto.prompt_id ? { connect: { id: dto.prompt_id } } : { disconnect: true };
    }

    await this.prisma.roleScenario.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureScenario(currentUser.tenantId, id);
    await this.prisma.roleScenario.update({
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

  private async findScenario(tenantId: string, id: string): Promise<RoleScenarioRecord> {
    const scenario = await this.prisma.roleScenario.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: roleScenarioInclude,
    });

    if (!scenario) {
      throw new NotFoundException('Role scenario not found');
    }

    return scenario;
  }

  private async ensureScenario(tenantId: string, id: string) {
    const scenario = await this.prisma.roleScenario.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!scenario) {
      throw new NotFoundException('Role scenario not found');
    }

    return scenario;
  }

  private async validateReferences(tenantId: string, dto: {
    owner_id?: string | null;
    agent_id?: string | null;
    skill_id?: string | null;
    knowledge_id?: string | null;
    tool_id?: string | null;
    prompt_id?: string | null;
  }) {
    await Promise.all([
      this.ensureUser(tenantId, dto.owner_id, 'Role scenario owner does not exist in this tenant'),
      this.ensureAgent(tenantId, dto.agent_id),
      this.ensureSkill(tenantId, dto.skill_id),
      this.ensureKnowledge(tenantId, dto.knowledge_id),
      this.ensureTool(tenantId, dto.tool_id),
      this.ensurePrompt(tenantId, dto.prompt_id),
    ]);
  }

  private async ensureUser(tenantId: string, id: string | null | undefined, message: string) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException(message);
  }

  private async ensureAgent(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.agent.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound agent does not exist in this tenant');
  }

  private async ensureSkill(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.skill.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound skill does not exist in this tenant');
  }

  private async ensureKnowledge(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.knowledgeBase.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound knowledge base does not exist in this tenant');
  }

  private async ensureTool(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.tool.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound tool does not exist in this tenant');
  }

  private async ensurePrompt(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.promptTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound prompt does not exist in this tenant');
  }

  private mapListItem(scenario: RoleScenarioRecord): RoleScenarioListItem {
    return {
      id: scenario.id,
      tenant_id: scenario.tenantId,
      name: scenario.name,
      code: scenario.code,
      role_name: scenario.roleName,
      department_name: scenario.departmentName,
      scenario_type: scenario.scenarioType as RoleScenarioListItem['scenario_type'],
      status: scenario.status as RoleScenarioListItem['status'],
      priority: scenario.priority as RoleScenarioListItem['priority'],
      impact_score: scenario.impactScore,
      pain_point_preview: preview(scenario.painPoint),
      workflow_preview: preview(scenario.workflowSummary),
      expected_outcome_preview: preview(scenario.expectedOutcome),
      owner: scenario.owner ? this.mapOwner(scenario.owner) : null,
      linked_resources: this.mapLinkedResources(scenario),
      tags: scenario.tags,
      created_at: scenario.createdAt.toISOString(),
      updated_at: scenario.updatedAt.toISOString(),
    };
  }

  private mapDetail(scenario: RoleScenarioRecord): RoleScenarioDetail {
    return {
      ...this.mapListItem(scenario),
      pain_point: scenario.painPoint,
      business_goal: scenario.businessGoal,
      workflow_summary: scenario.workflowSummary,
      expected_outcome: scenario.expectedOutcome,
      sample_deliverable: scenario.sampleDeliverable,
      acceptance_criteria: scenario.acceptanceCriteria,
      roi_metric: scenario.roiMetric,
      notes: scenario.notes,
    };
  }

  private mapLinkedResources(scenario: RoleScenarioRecord): RoleScenarioLinkedResources {
    return {
      agent: scenario.agent
        ? this.mapAsset(scenario.agent, scenario.agent.status)
        : null,
      skill: scenario.skill
        ? this.mapAsset(scenario.skill, scenario.skill.status)
        : null,
      knowledge: scenario.knowledge
        ? this.mapAsset(scenario.knowledge, scenario.knowledge.status)
        : null,
      tool: scenario.tool
        ? this.mapAsset(scenario.tool, scenario.tool.status, scenario.tool.riskLevel)
        : null,
      prompt: scenario.prompt
        ? this.mapAsset(scenario.prompt, scenario.prompt.status)
        : null,
    };
  }

  private mapAsset(asset: { id: string; name: string; code: string }, status: string, extra?: string | null): RoleScenarioAssetSummary {
    return {
      id: asset.id,
      name: asset.name,
      code: asset.code,
      status,
      extra: extra ?? null,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): RoleScenarioOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }
}

function calculateImpactScore(input: {
  priority?: string | null;
  status?: string | null;
  pain_point?: string | null;
  business_goal?: string | null;
  workflow_summary?: string | null;
  expected_outcome?: string | null;
  sample_deliverable?: string | null;
  acceptance_criteria?: string | null;
  roi_metric?: string | null;
  agent_id?: string | null;
  skill_id?: string | null;
  knowledge_id?: string | null;
  tool_id?: string | null;
  prompt_id?: string | null;
}) {
  let score = input.priority === 'HIGH' ? 18 : input.priority === 'LOW' ? 8 : 12;
  if (input.status && input.status !== 'DRAFT') score += 8;

  for (const value of [
    input.pain_point,
    input.business_goal,
    input.workflow_summary,
    input.expected_outcome,
    input.sample_deliverable,
    input.acceptance_criteria,
    input.roi_metric,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 6;
  }

  for (const value of [input.agent_id, input.skill_id, input.knowledge_id, input.tool_id, input.prompt_id]) {
    if (value) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];

  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}

function nullableText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function nullableId(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function preview(value: string, length = 48) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
