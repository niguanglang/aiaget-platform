import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  SolutionPackageCustomerAssessmentSummary,
  SolutionPackageDetail,
  SolutionPackageLinkedResources,
  SolutionPackageListItem,
  SolutionPackageOwnerSummary,
  SolutionPackageRoleScenarioSummary,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSolutionPackageDto } from './dto/create-solution-package.dto';
import type { ListSolutionPackagesDto } from './dto/list-solution-packages.dto';
import type { UpdateSolutionPackageDto } from './dto/update-solution-package.dto';

const solutionPackageInclude = {
  owner: true,
  customerAssessment: true,
  roleScenario: true,
} satisfies Prisma.SolutionPackageInclude;

type SolutionPackageRecord = Prisma.SolutionPackageGetPayload<{ include: typeof solutionPackageInclude }>;
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class SolutionPackagesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListSolutionPackagesDto,
  ): Promise<PaginatedResult<SolutionPackageListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.SolutionPackageWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.customer_type) where.customerType = query.customer_type;
    if (query.package_stage) where.packageStage = query.package_stage;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.owner_id) where.ownerId = query.owner_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { industry: { contains: keyword, mode: 'insensitive' } },
        { executiveSummary: { contains: keyword, mode: 'insensitive' } },
        { businessObjectives: { contains: keyword, mode: 'insensitive' } },
        { scopeSummary: { contains: keyword, mode: 'insensitive' } },
        { scenarioBlueprint: { contains: keyword, mode: 'insensitive' } },
        { deliveryRoadmap: { contains: keyword, mode: 'insensitive' } },
        { acceptancePlan: { contains: keyword, mode: 'insensitive' } },
        { roiSummary: { contains: keyword, mode: 'insensitive' } },
        { riskMitigation: { contains: keyword, mode: 'insensitive' } },
        { commercialStrategy: { contains: keyword, mode: 'insensitive' } },
        { nextMilestone: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.SolutionPackageWhereInput>(
        currentUser,
        'SOLUTION_PACKAGE',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.solutionPackage.findMany({
        where,
        include: solutionPackageInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.solutionPackage.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateSolutionPackageDto): Promise<SolutionPackageDetail> {
    await this.validateReferences(currentUser.tenantId, dto);
    const packageScore = dto.package_score ?? calculatePackageScore(dto);

    try {
      const solutionPackage = await this.prisma.solutionPackage.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          customerAssessmentId: nullableId(dto.customer_assessment_id),
          roleScenarioId: nullableId(dto.role_scenario_id),
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          industry: nullableText(dto.industry),
          customerType: dto.customer_type ?? 'UNKNOWN',
          packageStage: dto.package_stage ?? 'DISCOVERY',
          status: dto.status ?? 'DRAFT',
          priority: dto.priority ?? 'MEDIUM',
          executiveSummary: dto.executive_summary.trim(),
          businessObjectives: dto.business_objectives.trim(),
          scopeSummary: dto.scope_summary.trim(),
          scenarioBlueprint: dto.scenario_blueprint.trim(),
          deliveryRoadmap: dto.delivery_roadmap.trim(),
          acceptancePlan: dto.acceptance_plan.trim(),
          roiSummary: dto.roi_summary.trim(),
          riskMitigation: dto.risk_mitigation.trim(),
          commercialStrategy: dto.commercial_strategy.trim(),
          nextMilestone: dto.next_milestone.trim(),
          packageScore,
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: solutionPackageInclude,
      });

      return this.mapDetail(solutionPackage);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A solution package with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<SolutionPackageDetail> {
    const solutionPackage = await this.findPackage(currentUser.tenantId, id);

    return this.mapDetail(solutionPackage);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateSolutionPackageDto,
  ): Promise<SolutionPackageDetail> {
    const existing = await this.ensurePackage(currentUser.tenantId, id);
    await this.validateReferences(currentUser.tenantId, dto);

    const scoreInput = {
      customer_type: dto.customer_type ?? existing.customerType,
      package_stage: dto.package_stage ?? existing.packageStage,
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      executive_summary: dto.executive_summary ?? existing.executiveSummary,
      business_objectives: dto.business_objectives ?? existing.businessObjectives,
      scope_summary: dto.scope_summary ?? existing.scopeSummary,
      scenario_blueprint: dto.scenario_blueprint ?? existing.scenarioBlueprint,
      delivery_roadmap: dto.delivery_roadmap ?? existing.deliveryRoadmap,
      acceptance_plan: dto.acceptance_plan ?? existing.acceptancePlan,
      roi_summary: dto.roi_summary ?? existing.roiSummary,
      risk_mitigation: dto.risk_mitigation ?? existing.riskMitigation,
      commercial_strategy: dto.commercial_strategy ?? existing.commercialStrategy,
      next_milestone: dto.next_milestone ?? existing.nextMilestone,
      customer_assessment_id:
        dto.customer_assessment_id === undefined ? existing.customerAssessmentId : dto.customer_assessment_id,
      role_scenario_id: dto.role_scenario_id === undefined ? existing.roleScenarioId : dto.role_scenario_id,
    };

    const data: Prisma.SolutionPackageUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.industry !== undefined) data.industry = nullableText(dto.industry);
    if (dto.customer_type !== undefined) data.customerType = dto.customer_type;
    if (dto.package_stage !== undefined) data.packageStage = dto.package_stage;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.executive_summary !== undefined) data.executiveSummary = dto.executive_summary.trim();
    if (dto.business_objectives !== undefined) data.businessObjectives = dto.business_objectives.trim();
    if (dto.scope_summary !== undefined) data.scopeSummary = dto.scope_summary.trim();
    if (dto.scenario_blueprint !== undefined) data.scenarioBlueprint = dto.scenario_blueprint.trim();
    if (dto.delivery_roadmap !== undefined) data.deliveryRoadmap = dto.delivery_roadmap.trim();
    if (dto.acceptance_plan !== undefined) data.acceptancePlan = dto.acceptance_plan.trim();
    if (dto.roi_summary !== undefined) data.roiSummary = dto.roi_summary.trim();
    if (dto.risk_mitigation !== undefined) data.riskMitigation = dto.risk_mitigation.trim();
    if (dto.commercial_strategy !== undefined) data.commercialStrategy = dto.commercial_strategy.trim();
    if (dto.next_milestone !== undefined) data.nextMilestone = dto.next_milestone.trim();
    if (dto.package_score !== undefined) {
      data.packageScore = dto.package_score;
    } else {
      data.packageScore = calculatePackageScore(scoreInput);
    }
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (dto.customer_assessment_id !== undefined) {
      data.customerAssessment = dto.customer_assessment_id
        ? { connect: { id: dto.customer_assessment_id } }
        : { disconnect: true };
    }
    if (dto.role_scenario_id !== undefined) {
      data.roleScenario = dto.role_scenario_id ? { connect: { id: dto.role_scenario_id } } : { disconnect: true };
    }

    await this.prisma.solutionPackage.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensurePackage(currentUser.tenantId, id);
    await this.prisma.solutionPackage.update({
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

  private async findPackage(tenantId: string, id: string): Promise<SolutionPackageRecord> {
    const solutionPackage = await this.prisma.solutionPackage.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: solutionPackageInclude,
    });

    if (!solutionPackage) {
      throw new NotFoundException('Solution package not found');
    }

    return solutionPackage;
  }

  private async ensurePackage(tenantId: string, id: string) {
    const solutionPackage = await this.prisma.solutionPackage.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!solutionPackage) {
      throw new NotFoundException('Solution package not found');
    }

    return solutionPackage;
  }

  private async validateReferences(tenantId: string, dto: {
    owner_id?: string | null;
    customer_assessment_id?: string | null;
    role_scenario_id?: string | null;
  }) {
    await Promise.all([
      this.ensureUser(tenantId, dto.owner_id),
      this.ensureCustomerAssessment(tenantId, dto.customer_assessment_id),
      this.ensureRoleScenario(tenantId, dto.role_scenario_id),
    ]);
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Solution package owner does not exist in this tenant');
  }

  private async ensureCustomerAssessment(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.customerAssessment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound customer assessment does not exist in this tenant');
  }

  private async ensureRoleScenario(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.roleScenario.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound role scenario does not exist in this tenant');
  }

  private mapListItem(solutionPackage: SolutionPackageRecord): SolutionPackageListItem {
    return {
      id: solutionPackage.id,
      tenant_id: solutionPackage.tenantId,
      name: solutionPackage.name,
      code: solutionPackage.code,
      customer_name: solutionPackage.customerName,
      industry: solutionPackage.industry,
      customer_type: solutionPackage.customerType as SolutionPackageListItem['customer_type'],
      package_stage: solutionPackage.packageStage as SolutionPackageListItem['package_stage'],
      status: solutionPackage.status as SolutionPackageListItem['status'],
      priority: solutionPackage.priority as SolutionPackageListItem['priority'],
      package_score: solutionPackage.packageScore,
      executive_summary_preview: preview(solutionPackage.executiveSummary),
      roadmap_preview: preview(solutionPackage.deliveryRoadmap),
      roi_preview: preview(solutionPackage.roiSummary),
      owner: solutionPackage.owner ? this.mapOwner(solutionPackage.owner) : null,
      linked_resources: this.mapLinkedResources(solutionPackage),
      tags: solutionPackage.tags,
      created_at: solutionPackage.createdAt.toISOString(),
      updated_at: solutionPackage.updatedAt.toISOString(),
    };
  }

  private mapDetail(solutionPackage: SolutionPackageRecord): SolutionPackageDetail {
    return {
      ...this.mapListItem(solutionPackage),
      executive_summary: solutionPackage.executiveSummary,
      business_objectives: solutionPackage.businessObjectives,
      scope_summary: solutionPackage.scopeSummary,
      scenario_blueprint: solutionPackage.scenarioBlueprint,
      delivery_roadmap: solutionPackage.deliveryRoadmap,
      acceptance_plan: solutionPackage.acceptancePlan,
      roi_summary: solutionPackage.roiSummary,
      risk_mitigation: solutionPackage.riskMitigation,
      commercial_strategy: solutionPackage.commercialStrategy,
      next_milestone: solutionPackage.nextMilestone,
      notes: solutionPackage.notes,
    };
  }

  private mapLinkedResources(solutionPackage: SolutionPackageRecord): SolutionPackageLinkedResources {
    return {
      customer_assessment: solutionPackage.customerAssessment
        ? this.mapCustomerAssessment(solutionPackage.customerAssessment)
        : null,
      role_scenario: solutionPackage.roleScenario ? this.mapRoleScenario(solutionPackage.roleScenario) : null,
    };
  }

  private mapCustomerAssessment(
    assessment: NonNullable<SolutionPackageRecord['customerAssessment']>,
  ): SolutionPackageCustomerAssessmentSummary {
    return {
      id: assessment.id,
      customer_name: assessment.customerName,
      customer_type: assessment.customerType as SolutionPackageCustomerAssessmentSummary['customer_type'],
      decision_stage: assessment.decisionStage as SolutionPackageCustomerAssessmentSummary['decision_stage'],
      readiness_score: assessment.readinessScore,
    };
  }

  private mapRoleScenario(
    scenario: NonNullable<SolutionPackageRecord['roleScenario']>,
  ): SolutionPackageRoleScenarioSummary {
    return {
      id: scenario.id,
      name: scenario.name,
      code: scenario.code,
      role_name: scenario.roleName,
      department_name: scenario.departmentName,
      impact_score: scenario.impactScore,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): SolutionPackageOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }
}

function calculatePackageScore(input: {
  customer_type?: string | null;
  package_stage?: string | null;
  status?: string | null;
  priority?: string | null;
  executive_summary?: string | null;
  business_objectives?: string | null;
  scope_summary?: string | null;
  scenario_blueprint?: string | null;
  delivery_roadmap?: string | null;
  acceptance_plan?: string | null;
  roi_summary?: string | null;
  risk_mitigation?: string | null;
  commercial_strategy?: string | null;
  next_milestone?: string | null;
  customer_assessment_id?: string | null;
  role_scenario_id?: string | null;
}) {
  let score = input.priority === 'HIGH' ? 14 : input.priority === 'LOW' ? 8 : 12;
  if (input.customer_type && input.customer_type !== 'UNKNOWN') score += 8;
  if (input.package_stage && input.package_stage !== 'DISCOVERY') score += 8;
  if (input.status && input.status !== 'DRAFT') score += 8;

  for (const value of [
    input.executive_summary,
    input.business_objectives,
    input.scope_summary,
    input.scenario_blueprint,
    input.delivery_roadmap,
    input.acceptance_plan,
    input.roi_summary,
    input.risk_mitigation,
    input.commercial_strategy,
    input.next_milestone,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 5;
  }

  if (input.customer_assessment_id) score += 5;
  if (input.role_scenario_id) score += 5;

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

function preview(value: string, length = 54) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
