import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CustomerSuccessPlanAssetSummary,
  CustomerSuccessPlanDetail,
  CustomerSuccessPlanLinkedResources,
  CustomerSuccessPlanListItem,
  CustomerSuccessPlanOwnerSummary,
  CustomerSuccessPlanReviewSummary,
  CustomerSuccessPlanSolutionPackageSummary,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerSuccessPlanDto } from './dto/create-customer-success-plan.dto';
import type { ListCustomerSuccessPlansDto } from './dto/list-customer-success-plans.dto';
import type { UpdateCustomerSuccessPlanDto } from './dto/update-customer-success-plan.dto';

const customerSuccessPlanInclude = {
  owner: true,
  deliveryReview: true,
  deliveryAsset: true,
  solutionPackage: true,
} satisfies Prisma.CustomerSuccessPlanInclude;

type CustomerSuccessPlanRecord = Prisma.CustomerSuccessPlanGetPayload<{ include: typeof customerSuccessPlanInclude }>;
type DeliveryReviewReference = { id: string; solutionPackageId: string };
type DeliveryAssetReference = { id: string; solutionPackageId: string | null; deliveryReviewId: string };
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class CustomerSuccessPlansService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListCustomerSuccessPlansDto,
  ): Promise<PaginatedResult<CustomerSuccessPlanListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.CustomerSuccessPlanWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.plan_stage) where.planStage = query.plan_stage;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.health_level) where.healthLevel = query.health_level;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (query.delivery_review_id) where.deliveryReviewId = query.delivery_review_id;
    if (query.delivery_asset_id) where.deliveryAssetId = query.delivery_asset_id;
    if (query.solution_package_id) where.solutionPackageId = query.solution_package_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { expansionScope: { contains: keyword, mode: 'insensitive' } },
        { successObjectives: { contains: keyword, mode: 'insensitive' } },
        { stakeholderPlan: { contains: keyword, mode: 'insensitive' } },
        { assetReusePlan: { contains: keyword, mode: 'insensitive' } },
        { renewalPlan: { contains: keyword, mode: 'insensitive' } },
        { riskSummary: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.CustomerSuccessPlanWhereInput>(
        currentUser,
        'CUSTOMER_SUCCESS_PLAN',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerSuccessPlan.findMany({
        where,
        include: customerSuccessPlanInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customerSuccessPlan.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateCustomerSuccessPlanDto): Promise<CustomerSuccessPlanDetail> {
    const references = await this.validateReferences(currentUser.tenantId, dto);
    const solutionPackageId = dto.solution_package_id || references.asset?.solutionPackageId || references.review.solutionPackageId;
    const successScore = dto.success_score ?? calculateSuccessScore({ ...dto, solution_package_id: solutionPackageId });

    try {
      const plan = await this.prisma.customerSuccessPlan.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          deliveryReviewId: dto.delivery_review_id,
          deliveryAssetId: nullableId(dto.delivery_asset_id),
          solutionPackageId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          planStage: dto.plan_stage ?? 'DISCOVERY',
          status: dto.status ?? 'DRAFT',
          priority: dto.priority ?? 'MEDIUM',
          healthLevel: dto.health_level ?? 'MEDIUM',
          successScore,
          expansionScope: dto.expansion_scope.trim(),
          successObjectives: dto.success_objectives.trim(),
          stakeholderPlan: dto.stakeholder_plan.trim(),
          assetReusePlan: dto.asset_reuse_plan.trim(),
          renewalPlan: dto.renewal_plan.trim(),
          riskSummary: dto.risk_summary.trim(),
          nextAction: dto.next_action.trim(),
          dueAt: nullableDate(dto.due_at),
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: customerSuccessPlanInclude,
      });

      return this.mapDetail(plan);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A customer success plan with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<CustomerSuccessPlanDetail> {
    const plan = await this.findPlan(currentUser.tenantId, id);

    return this.mapDetail(plan);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateCustomerSuccessPlanDto,
  ): Promise<CustomerSuccessPlanDetail> {
    const existing = await this.ensurePlan(currentUser.tenantId, id);
    const references = await this.validateReferences(currentUser.tenantId, dto, {
      deliveryReviewId: existing.deliveryReviewId,
      deliveryAssetId: existing.deliveryAssetId,
      solutionPackageId: existing.solutionPackageId,
    });
    const solutionPackageId = dto.solution_package_id === undefined
      ? existing.solutionPackageId
      : dto.solution_package_id || references.asset?.solutionPackageId || references.review.solutionPackageId || null;

    const scoreInput = {
      plan_stage: dto.plan_stage ?? existing.planStage,
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      health_level: dto.health_level ?? existing.healthLevel,
      expansion_scope: dto.expansion_scope ?? existing.expansionScope,
      success_objectives: dto.success_objectives ?? existing.successObjectives,
      stakeholder_plan: dto.stakeholder_plan ?? existing.stakeholderPlan,
      asset_reuse_plan: dto.asset_reuse_plan ?? existing.assetReusePlan,
      renewal_plan: dto.renewal_plan ?? existing.renewalPlan,
      risk_summary: dto.risk_summary ?? existing.riskSummary,
      next_action: dto.next_action ?? existing.nextAction,
      delivery_review_id: dto.delivery_review_id === undefined ? existing.deliveryReviewId : dto.delivery_review_id,
      delivery_asset_id: dto.delivery_asset_id === undefined ? existing.deliveryAssetId : dto.delivery_asset_id,
      solution_package_id: solutionPackageId,
      due_at: dto.due_at === undefined ? existing.dueAt?.toISOString() : dto.due_at,
    };

    const data: Prisma.CustomerSuccessPlanUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.plan_stage !== undefined) data.planStage = dto.plan_stage;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.health_level !== undefined) data.healthLevel = dto.health_level;
    if (dto.success_score !== undefined) data.successScore = dto.success_score;
    else data.successScore = calculateSuccessScore(scoreInput);
    if (dto.expansion_scope !== undefined) data.expansionScope = dto.expansion_scope.trim();
    if (dto.success_objectives !== undefined) data.successObjectives = dto.success_objectives.trim();
    if (dto.stakeholder_plan !== undefined) data.stakeholderPlan = dto.stakeholder_plan.trim();
    if (dto.asset_reuse_plan !== undefined) data.assetReusePlan = dto.asset_reuse_plan.trim();
    if (dto.renewal_plan !== undefined) data.renewalPlan = dto.renewal_plan.trim();
    if (dto.risk_summary !== undefined) data.riskSummary = dto.risk_summary.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.due_at !== undefined) data.dueAt = nullableDate(dto.due_at);
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (dto.delivery_review_id !== undefined) {
      if (!dto.delivery_review_id) {
        throw new BadRequestException('Customer success plan must be bound to a delivery review');
      }
      data.deliveryReview = { connect: { id: dto.delivery_review_id } };
    }
    if (dto.delivery_asset_id !== undefined) {
      data.deliveryAsset = dto.delivery_asset_id ? { connect: { id: dto.delivery_asset_id } } : { disconnect: true };
    }
    if (dto.solution_package_id !== undefined) {
      data.solutionPackage = solutionPackageId ? { connect: { id: solutionPackageId } } : { disconnect: true };
    }

    await this.prisma.customerSuccessPlan.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensurePlan(currentUser.tenantId, id);
    await this.prisma.customerSuccessPlan.update({
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

  private async findPlan(tenantId: string, id: string): Promise<CustomerSuccessPlanRecord> {
    const plan = await this.prisma.customerSuccessPlan.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: customerSuccessPlanInclude,
    });

    if (!plan) {
      throw new NotFoundException('Customer success plan not found');
    }

    return plan;
  }

  private async ensurePlan(tenantId: string, id: string) {
    const plan = await this.prisma.customerSuccessPlan.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!plan) {
      throw new NotFoundException('Customer success plan not found');
    }

    return plan;
  }

  private async validateReferences(
    tenantId: string,
    dto: {
      owner_id?: string | null;
      delivery_review_id?: string | null;
      delivery_asset_id?: string | null;
      solution_package_id?: string | null;
    },
    fallback?: {
      deliveryReviewId?: string | null;
      deliveryAssetId?: string | null;
      solutionPackageId?: string | null;
    },
  ): Promise<{ review: DeliveryReviewReference; asset: DeliveryAssetReference | null }> {
    const reviewId = dto.delivery_review_id === undefined ? fallback?.deliveryReviewId : dto.delivery_review_id;
    const assetId = dto.delivery_asset_id === undefined ? fallback?.deliveryAssetId : dto.delivery_asset_id;
    const packageId = dto.solution_package_id === undefined ? fallback?.solutionPackageId : dto.solution_package_id;
    const [review, asset] = await Promise.all([
      this.ensureDeliveryReview(tenantId, reviewId),
      this.ensureDeliveryAsset(tenantId, assetId),
      this.ensureSolutionPackage(tenantId, packageId),
      this.ensureUser(tenantId, dto.owner_id),
    ]);

    if (asset && review && asset.deliveryReviewId !== review.id) {
      throw new BadRequestException('Bound delivery asset must come from the selected delivery review');
    }

    if (packageId && review && packageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the delivery review source package');
    }

    if (asset?.solutionPackageId && review && asset.solutionPackageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound delivery asset must match the delivery review source package');
    }

    return { review, asset };
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Customer success plan owner does not exist in this tenant');
  }

  private async ensureDeliveryReview(tenantId: string, id: string | null | undefined) {
    if (!id) throw new BadRequestException('Customer success plan must be bound to a delivery review');
    const found = await this.prisma.deliveryReview.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        solutionPackageId: true,
      },
    });
    if (!found) throw new BadRequestException('Bound delivery review does not exist in this tenant');

    return found;
  }

  private async ensureDeliveryAsset(tenantId: string, id: string | null | undefined) {
    if (!id) return null;
    const found = await this.prisma.deliveryAsset.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        solutionPackageId: true,
        deliveryReviewId: true,
      },
    });
    if (!found) throw new BadRequestException('Bound delivery asset does not exist in this tenant');

    return found;
  }

  private async ensureSolutionPackage(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.solutionPackage.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound solution package does not exist in this tenant');
  }

  private mapListItem(plan: CustomerSuccessPlanRecord): CustomerSuccessPlanListItem {
    return {
      id: plan.id,
      tenant_id: plan.tenantId,
      name: plan.name,
      code: plan.code,
      customer_name: plan.customerName,
      plan_stage: plan.planStage as CustomerSuccessPlanListItem['plan_stage'],
      status: plan.status as CustomerSuccessPlanListItem['status'],
      priority: plan.priority as CustomerSuccessPlanListItem['priority'],
      health_level: plan.healthLevel as CustomerSuccessPlanListItem['health_level'],
      success_score: plan.successScore,
      expansion_scope_preview: preview(plan.expansionScope),
      next_action_preview: preview(plan.nextAction),
      owner: plan.owner ? this.mapOwner(plan.owner) : null,
      linked_resources: this.mapLinkedResources(plan),
      due_at: plan.dueAt?.toISOString() ?? null,
      tags: plan.tags,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    };
  }

  private mapDetail(plan: CustomerSuccessPlanRecord): CustomerSuccessPlanDetail {
    return {
      ...this.mapListItem(plan),
      expansion_scope: plan.expansionScope,
      success_objectives: plan.successObjectives,
      stakeholder_plan: plan.stakeholderPlan,
      asset_reuse_plan: plan.assetReusePlan,
      renewal_plan: plan.renewalPlan,
      risk_summary: plan.riskSummary,
      next_action: plan.nextAction,
      notes: plan.notes,
    };
  }

  private mapLinkedResources(plan: CustomerSuccessPlanRecord): CustomerSuccessPlanLinkedResources {
    return {
      delivery_review: plan.deliveryReview ? this.mapDeliveryReview(plan.deliveryReview) : null,
      delivery_asset: plan.deliveryAsset ? this.mapDeliveryAsset(plan.deliveryAsset) : null,
      solution_package: plan.solutionPackage ? this.mapSolutionPackage(plan.solutionPackage) : null,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): CustomerSuccessPlanOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapDeliveryReview(review: NonNullable<CustomerSuccessPlanRecord['deliveryReview']>): CustomerSuccessPlanReviewSummary {
    return {
      id: review.id,
      name: review.name,
      code: review.code,
      customer_name: review.customerName,
      result: review.result as CustomerSuccessPlanReviewSummary['result'],
      status: review.status as CustomerSuccessPlanReviewSummary['status'],
      acceptance_score: review.acceptanceScore,
    };
  }

  private mapDeliveryAsset(asset: NonNullable<CustomerSuccessPlanRecord['deliveryAsset']>): CustomerSuccessPlanAssetSummary {
    return {
      id: asset.id,
      name: asset.name,
      code: asset.code,
      customer_name: asset.customerName,
      asset_type: asset.assetType as CustomerSuccessPlanAssetSummary['asset_type'],
      status: asset.status as CustomerSuccessPlanAssetSummary['status'],
      reuse_score: asset.reuseScore,
    };
  }

  private mapSolutionPackage(
    solutionPackage: NonNullable<CustomerSuccessPlanRecord['solutionPackage']>,
  ): CustomerSuccessPlanSolutionPackageSummary {
    return {
      id: solutionPackage.id,
      name: solutionPackage.name,
      code: solutionPackage.code,
      customer_name: solutionPackage.customerName,
      package_stage: solutionPackage.packageStage as CustomerSuccessPlanSolutionPackageSummary['package_stage'],
      status: solutionPackage.status as CustomerSuccessPlanSolutionPackageSummary['status'],
      package_score: solutionPackage.packageScore,
    };
  }
}

function calculateSuccessScore(input: {
  plan_stage?: string | null;
  status?: string | null;
  priority?: string | null;
  health_level?: string | null;
  expansion_scope?: string | null;
  success_objectives?: string | null;
  stakeholder_plan?: string | null;
  asset_reuse_plan?: string | null;
  renewal_plan?: string | null;
  risk_summary?: string | null;
  next_action?: string | null;
  delivery_review_id?: string | null;
  delivery_asset_id?: string | null;
  solution_package_id?: string | null;
  due_at?: string | null;
}) {
  let score = 10;
  if (input.status === 'COMPLETED') score += 12;
  else if (input.status === 'ACTIVE') score += 9;
  else if (input.status === 'BLOCKED') score += 3;

  if (input.plan_stage === 'RENEWAL_PREP') score += 8;
  else if (input.plan_stage === 'PILOT_ROLLOUT') score += 7;
  else if (input.plan_stage === 'EXPANSION_DESIGN') score += 6;

  if (input.priority === 'HIGH') score += 5;
  else if (input.priority === 'MEDIUM') score += 3;

  if (input.health_level === 'HIGH') score += 9;
  else if (input.health_level === 'MEDIUM') score += 5;
  else if (input.health_level === 'LOW') score -= 4;

  for (const value of [
    input.expansion_scope,
    input.success_objectives,
    input.stakeholder_plan,
    input.asset_reuse_plan,
    input.renewal_plan,
    input.risk_summary,
    input.next_action,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 5;
  }

  if (input.delivery_review_id) score += 5;
  if (input.delivery_asset_id) score += 4;
  if (input.solution_package_id) score += 3;
  if (input.due_at) score += 2;

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

function nullableDate(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? new Date(normalized) : null;
}

function preview(value: string, length = 54) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
