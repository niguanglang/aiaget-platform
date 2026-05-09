import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  SkillAgentReferenceItem,
  SkillDetail,
  SkillListItem,
  SkillOwnerSummary,
  SkillVersionItem,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSkillDto } from './dto/create-skill.dto';
import type { ListSkillsDto } from './dto/list-skills.dto';
import type { PublishSkillDto } from './dto/publish-skill.dto';
import type { UpdateSkillDto } from './dto/update-skill.dto';

const skillInclude = {
  owner: true,
  versions: {
    where: {
      deletedAt: null,
    },
    include: {
      creator: true,
    },
    orderBy: {
      version: 'desc',
    },
  },
  agentBindings: {
    where: {
      deletedAt: null,
    },
    include: {
      agent: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  },
} satisfies Prisma.SkillInclude;

type SkillRecord = Prisma.SkillGetPayload<{ include: typeof skillInclude }>;
type AgentSkillBindingRecord = Prisma.AgentSkillBindingGetPayload<{ include: { agent: true } }>;

@Injectable()
export class SkillsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(currentUser: AuthenticatedUser, query: ListSkillsDto): Promise<PaginatedResult<SkillListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.SkillWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.owner_id) where.ownerId = query.owner_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { triggerScenario: { contains: keyword, mode: 'insensitive' } },
        { inputRequirements: { contains: keyword, mode: 'insensitive' } },
        { executionSteps: { contains: keyword, mode: 'insensitive' } },
        { outputFormat: { contains: keyword, mode: 'insensitive' } },
        { qualityCriteria: { contains: keyword, mode: 'insensitive' } },
        { boundaryRules: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        include: skillInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.skill.count({ where }),
    ]);
    const referenceCounts = await this.getAgentReferenceCounts(currentUser.tenantId, items.map((item) => item.id));

    return {
      items: items.map((skill) => this.mapListItem(skill, referenceCounts.get(skill.id) ?? 0)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateSkillDto): Promise<SkillDetail> {
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    try {
      const skill = await this.prisma.skill.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          name: dto.name.trim(),
          code: dto.code.trim(),
          category: dto.category ?? 'GENERAL',
          description: nullableText(dto.description),
          triggerScenario: dto.trigger_scenario.trim(),
          inputRequirements: dto.input_requirements.trim(),
          executionSteps: dto.execution_steps.trim(),
          outputFormat: dto.output_format.trim(),
          qualityCriteria: dto.quality_criteria.trim(),
          boundaryRules: dto.boundary_rules.trim(),
          tags: normalizeTags(dto.tags),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: skillInclude,
      });

      return this.mapDetail(skill, []);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A skill with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<SkillDetail> {
    const skill = await this.findSkill(currentUser.tenantId, id);
    const references = await this.getAgentReferences(currentUser.tenantId, id);

    return this.mapDetail(skill, references);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateSkillDto): Promise<SkillDetail> {
    await this.ensureSkill(currentUser.tenantId, id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    const data: Prisma.SkillUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.description !== undefined) data.description = nullableText(dto.description);
    if (dto.trigger_scenario !== undefined) data.triggerScenario = dto.trigger_scenario.trim();
    if (dto.input_requirements !== undefined) data.inputRequirements = dto.input_requirements.trim();
    if (dto.execution_steps !== undefined) data.executionSteps = dto.execution_steps.trim();
    if (dto.output_format !== undefined) data.outputFormat = dto.output_format.trim();
    if (dto.quality_criteria !== undefined) data.qualityCriteria = dto.quality_criteria.trim();
    if (dto.boundary_rules !== undefined) data.boundaryRules = dto.boundary_rules.trim();
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }

    await this.prisma.skill.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureSkill(currentUser.tenantId, id);

    await this.prisma.skill.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return {
      success: true,
    };
  }

  async copy(currentUser: AuthenticatedUser, id: string): Promise<SkillDetail> {
    const skill = await this.findSkill(currentUser.tenantId, id);
    const code = await this.createCopyCode(currentUser.tenantId, skill.code);

    const copied = await this.prisma.skill.create({
      data: {
        tenantId: currentUser.tenantId,
        ownerId: currentUser.id,
        name: `${skill.name} Copy`,
        code,
        category: skill.category,
        description: skill.description,
        triggerScenario: skill.triggerScenario,
        inputRequirements: skill.inputRequirements,
        executionSteps: skill.executionSteps,
        outputFormat: skill.outputFormat,
        qualityCriteria: skill.qualityCriteria,
        boundaryRules: skill.boundaryRules,
        tags: skill.tags,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: skillInclude,
    });

    return this.mapDetail(copied, []);
  }

  async publish(currentUser: AuthenticatedUser, id: string, dto: PublishSkillDto): Promise<SkillDetail> {
    const skill = await this.findSkill(currentUser.tenantId, id);
    const latest = await this.prisma.skillVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        skillId: id,
      },
      orderBy: {
        version: 'desc',
      },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    await this.prisma.$transaction([
      this.prisma.skillVersion.create({
        data: {
          tenantId: currentUser.tenantId,
          skillId: id,
          version: nextVersion,
          status: 'PUBLISHED',
          snapshot: this.createSnapshot(skill),
          changeNote: dto.change_note?.trim() || null,
          publishedAt: new Date(),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.skill.update({
        where: {
          id,
        },
        data: {
          version: nextVersion,
          status: 'PUBLISHED',
          updatedBy: currentUser.id,
        },
      }),
    ]);

    return this.get(currentUser, id);
  }

  private createSnapshot(skill: SkillRecord): Prisma.InputJsonObject {
    return {
      id: skill.id,
      name: skill.name,
      code: skill.code,
      category: skill.category,
      status: skill.status,
      description: skill.description,
      trigger_scenario: skill.triggerScenario,
      input_requirements: skill.inputRequirements,
      execution_steps: skill.executionSteps,
      output_format: skill.outputFormat,
      quality_criteria: skill.qualityCriteria,
      boundary_rules: skill.boundaryRules,
      tags: skill.tags,
    };
  }

  private async findSkill(tenantId: string, id: string): Promise<SkillRecord> {
    const skill = await this.prisma.skill.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: skillInclude,
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  private async ensureSkill(tenantId: string, id: string) {
    const skill = await this.prisma.skill.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  private async validateOwner(tenantId: string, ownerId?: string | null) {
    if (!ownerId) return;

    const owner = await this.prisma.user.findFirst({
      where: {
        id: ownerId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!owner) {
      throw new BadRequestException('Skill owner does not exist in this tenant');
    }
  }

  private async createCopyCode(tenantId: string, code: string) {
    const base = `${code}_copy`.slice(0, 88);

    for (let index = 1; index < 100; index += 1) {
      const nextCode = `${base}_${index}`;
      const existing = await this.prisma.skill.findFirst({
        where: {
          tenantId,
          code: nextCode,
        },
      });

      if (!existing) return nextCode;
    }

    throw new BadRequestException('Unable to generate unique copy code');
  }

  private async getAgentReferenceCounts(tenantId: string, skillIds: string[]) {
    const counts = new Map<string, number>();

    if (skillIds.length === 0) return counts;

    const references = await this.prisma.agentSkillBinding.groupBy({
      by: ['skillId'],
      where: {
        tenantId,
        skillId: {
          in: skillIds,
        },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    references.forEach((reference) => counts.set(reference.skillId, reference._count._all));

    return counts;
  }

  private async getAgentReferences(tenantId: string, skillId: string): Promise<SkillAgentReferenceItem[]> {
    const references = await this.prisma.agentSkillBinding.findMany({
      where: {
        tenantId,
        skillId,
        deletedAt: null,
      },
      include: {
        agent: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return references.map((reference) => this.mapAgentReference(reference));
  }

  private mapListItem(skill: SkillRecord, agentReferenceCount: number): SkillListItem {
    return {
      id: skill.id,
      tenant_id: skill.tenantId,
      name: skill.name,
      code: skill.code,
      category: skill.category as SkillListItem['category'],
      status: skill.status as SkillListItem['status'],
      version: skill.version,
      description: skill.description,
      trigger_scenario_preview: preview(skill.triggerScenario),
      output_format_preview: preview(skill.outputFormat),
      owner: skill.owner ? this.mapOwner(skill.owner) : null,
      tags: skill.tags,
      agent_reference_count: agentReferenceCount,
      created_at: skill.createdAt.toISOString(),
      updated_at: skill.updatedAt.toISOString(),
    };
  }

  private mapDetail(skill: SkillRecord, references: SkillAgentReferenceItem[]): SkillDetail {
    return {
      ...this.mapListItem(skill, references.length),
      trigger_scenario: skill.triggerScenario,
      input_requirements: skill.inputRequirements,
      execution_steps: skill.executionSteps,
      output_format: skill.outputFormat,
      quality_criteria: skill.qualityCriteria,
      boundary_rules: skill.boundaryRules,
      versions: skill.versions.map((version) => this.mapVersion(version)),
      agent_references: references,
      audit_records: [
        {
          id: `${skill.id}-created`,
          action: 'CREATED',
          message: 'Skill 已创建。',
          created_at: skill.createdAt.toISOString(),
          operator: null,
        },
        ...(skill.version > 0
          ? [
              {
                id: `${skill.id}-published-${skill.version}`,
                action: 'PUBLISHED',
                message: `Skill 已发布到 v${skill.version}。`,
                created_at: skill.updatedAt.toISOString(),
                operator: null,
              },
            ]
          : []),
      ],
    };
  }

  private mapVersion(version: Prisma.SkillVersionGetPayload<{ include: { creator: true } }>): SkillVersionItem {
    return {
      id: version.id,
      version: version.version,
      status: version.status as SkillVersionItem['status'],
      change_note: version.changeNote,
      published_at: version.publishedAt?.toISOString() ?? null,
      created_at: version.createdAt.toISOString(),
      created_by: version.creator ? this.mapOwner(version.creator) : null,
    };
  }

  private mapAgentReference(reference: AgentSkillBindingRecord): SkillAgentReferenceItem {
    return {
      id: reference.id,
      agent_id: reference.agentId,
      agent_name: reference.agent.name,
      agent_code: reference.agent.code,
      agent_status: reference.agent.status,
      binding_type: reference.bindingType as SkillAgentReferenceItem['binding_type'],
      sort_order: reference.sortOrder,
      created_at: reference.createdAt.toISOString(),
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): SkillOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }
}

function nullableText(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function normalizeTags(tags?: string[] | null) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  );
}

function preview(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}
