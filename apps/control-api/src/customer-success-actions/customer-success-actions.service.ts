import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CustomerSuccessActionDetail,
  CustomerSuccessActionLinkedResources,
  CustomerSuccessActionListItem,
  CustomerSuccessActionPlanSummary,
  CustomerSuccessPlanAssetSummary,
  CustomerSuccessPlanOwnerSummary,
  CustomerSuccessPlanReviewSummary,
  CustomerSuccessPlanSolutionPackageSummary,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerSuccessActionDto } from './dto/create-customer-success-action.dto';
import type { ListCustomerSuccessActionsDto } from './dto/list-customer-success-actions.dto';
import type { UpdateCustomerSuccessActionDto } from './dto/update-customer-success-action.dto';

const customerSuccessActionInclude = {
  owner: true,
  customerSuccessPlan: true,
  deliveryReview: true,
  deliveryAsset: true,
  solutionPackage: true,
} satisfies Prisma.CustomerSuccessActionInclude;

type CustomerSuccessActionRecord = Prisma.CustomerSuccessActionGetPayload<{ include: typeof customerSuccessActionInclude }>;
type CustomerSuccessPlanReference = {
  id: string;
  customerName: string;
  deliveryReviewId: string;
  deliveryAssetId: string | null;
  solutionPackageId: string | null;
};
type DeliveryReviewReference = { id: string; solutionPackageId: string };
type DeliveryAssetReference = { id: string; solutionPackageId: string | null; deliveryReviewId: string };
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class CustomerSuccessActionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListCustomerSuccessActionsDto,
  ): Promise<PaginatedResult<CustomerSuccessActionListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.CustomerSuccessActionWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.action_type) where.actionType = query.action_type;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.risk_level) where.riskLevel = query.risk_level;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (query.customer_success_plan_id) where.customerSuccessPlanId = query.customer_success_plan_id;
    if (query.delivery_review_id) where.deliveryReviewId = query.delivery_review_id;
    if (query.delivery_asset_id) where.deliveryAssetId = query.delivery_asset_id;
    if (query.solution_package_id) where.solutionPackageId = query.solution_package_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { actionSummary: { contains: keyword, mode: 'insensitive' } },
        { expectedOutcome: { contains: keyword, mode: 'insensitive' } },
        { executionNotes: { contains: keyword, mode: 'insensitive' } },
        { blockerSummary: { contains: keyword, mode: 'insensitive' } },
        { completionEvidence: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.CustomerSuccessActionWhereInput>(
        currentUser,
        'CUSTOMER_SUCCESS_ACTION',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerSuccessAction.findMany({
        where,
        include: customerSuccessActionInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customerSuccessAction.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateCustomerSuccessActionDto): Promise<CustomerSuccessActionDetail> {
    const references = await this.validateReferences(currentUser.tenantId, dto);
    const actionScore = dto.action_score ?? calculateActionScore(dto);

    try {
      const action = await this.prisma.customerSuccessAction.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          customerSuccessPlanId: dto.customer_success_plan_id,
          deliveryReviewId: references.review?.id ?? null,
          deliveryAssetId: references.asset?.id ?? null,
          solutionPackageId: references.packageId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          actionType: dto.action_type ?? 'FOLLOW_UP',
          status: dto.status ?? 'TODO',
          priority: dto.priority ?? 'MEDIUM',
          riskLevel: dto.risk_level ?? 'LOW',
          actionScore,
          actionSummary: dto.action_summary.trim(),
          expectedOutcome: dto.expected_outcome.trim(),
          executionNotes: dto.execution_notes.trim(),
          blockerSummary: dto.blocker_summary.trim(),
          completionEvidence: dto.completion_evidence.trim(),
          nextAction: dto.next_action.trim(),
          dueAt: nullableDate(dto.due_at),
          completedAt: nullableDate(dto.completed_at),
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: customerSuccessActionInclude,
      });

      return this.mapDetail(action);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A customer success action with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<CustomerSuccessActionDetail> {
    const action = await this.findAction(currentUser.tenantId, id);

    return this.mapDetail(action);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateCustomerSuccessActionDto,
  ): Promise<CustomerSuccessActionDetail> {
    const existing = await this.ensureAction(currentUser.tenantId, id);
    const references = await this.validateReferences(currentUser.tenantId, dto, {
      customerSuccessPlanId: existing.customerSuccessPlanId,
      deliveryReviewId: existing.deliveryReviewId,
      deliveryAssetId: existing.deliveryAssetId,
      solutionPackageId: existing.solutionPackageId,
    });
    const scoreInput = {
      action_type: dto.action_type ?? existing.actionType,
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      risk_level: dto.risk_level ?? existing.riskLevel,
      action_summary: dto.action_summary ?? existing.actionSummary,
      expected_outcome: dto.expected_outcome ?? existing.expectedOutcome,
      execution_notes: dto.execution_notes ?? existing.executionNotes,
      blocker_summary: dto.blocker_summary ?? existing.blockerSummary,
      completion_evidence: dto.completion_evidence ?? existing.completionEvidence,
      next_action: dto.next_action ?? existing.nextAction,
      due_at: dto.due_at === undefined ? existing.dueAt?.toISOString() : dto.due_at,
      completed_at: dto.completed_at === undefined ? existing.completedAt?.toISOString() : dto.completed_at,
    };
    const data: Prisma.CustomerSuccessActionUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.action_type !== undefined) data.actionType = dto.action_type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.risk_level !== undefined) data.riskLevel = dto.risk_level;
    if (dto.action_score !== undefined) data.actionScore = dto.action_score;
    else data.actionScore = calculateActionScore(scoreInput);
    if (dto.action_summary !== undefined) data.actionSummary = dto.action_summary.trim();
    if (dto.expected_outcome !== undefined) data.expectedOutcome = dto.expected_outcome.trim();
    if (dto.execution_notes !== undefined) data.executionNotes = dto.execution_notes.trim();
    if (dto.blocker_summary !== undefined) data.blockerSummary = dto.blocker_summary.trim();
    if (dto.completion_evidence !== undefined) data.completionEvidence = dto.completion_evidence.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.due_at !== undefined) data.dueAt = nullableDate(dto.due_at);
    if (dto.completed_at !== undefined) data.completedAt = nullableDate(dto.completed_at);
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    if (dto.customer_success_plan_id !== undefined) {
      data.customerSuccessPlan = { connect: { id: references.plan.id } };
    }
    if (dto.delivery_review_id !== undefined) {
      data.deliveryReview = references.review ? { connect: { id: references.review.id } } : { disconnect: true };
    }
    if (dto.delivery_asset_id !== undefined) {
      data.deliveryAsset = references.asset ? { connect: { id: references.asset.id } } : { disconnect: true };
    }
    if (dto.solution_package_id !== undefined) {
      data.solutionPackage = references.packageId ? { connect: { id: references.packageId } } : { disconnect: true };
    }

    await this.prisma.customerSuccessAction.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureAction(currentUser.tenantId, id);
    await this.prisma.customerSuccessAction.update({
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

  private async findAction(tenantId: string, id: string): Promise<CustomerSuccessActionRecord> {
    const action = await this.prisma.customerSuccessAction.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: customerSuccessActionInclude,
    });

    if (!action) {
      throw new NotFoundException('Customer success action not found');
    }

    return action;
  }

  private async ensureAction(tenantId: string, id: string) {
    const action = await this.prisma.customerSuccessAction.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!action) {
      throw new NotFoundException('Customer success action not found');
    }

    return action;
  }

  private async validateReferences(
    tenantId: string,
    dto: {
      owner_id?: string | null;
      customer_success_plan_id?: string | null;
      delivery_review_id?: string | null;
      delivery_asset_id?: string | null;
      solution_package_id?: string | null;
    },
    fallback?: {
      customerSuccessPlanId?: string | null;
      deliveryReviewId?: string | null;
      deliveryAssetId?: string | null;
      solutionPackageId?: string | null;
    },
  ): Promise<{
    plan: CustomerSuccessPlanReference;
    review: DeliveryReviewReference | null;
    asset: DeliveryAssetReference | null;
    packageId: string | null;
  }> {
    const planId = dto.customer_success_plan_id === undefined ? fallback?.customerSuccessPlanId : dto.customer_success_plan_id;
    const plan = await this.ensureCustomerSuccessPlan(tenantId, planId);
    const reviewId = dto.delivery_review_id === undefined ? fallback?.deliveryReviewId ?? plan.deliveryReviewId : dto.delivery_review_id;
    const assetId = dto.delivery_asset_id === undefined ? fallback?.deliveryAssetId ?? plan.deliveryAssetId : dto.delivery_asset_id;
    const packageId = dto.solution_package_id === undefined
      ? fallback?.solutionPackageId ?? plan.solutionPackageId
      : dto.solution_package_id;
    const [review, asset] = await Promise.all([
      this.ensureDeliveryReview(tenantId, reviewId),
      this.ensureDeliveryAsset(tenantId, assetId),
      this.ensureSolutionPackage(tenantId, packageId),
      this.ensureUser(tenantId, dto.owner_id),
    ]);

    if (review && review.id !== plan.deliveryReviewId) {
      throw new BadRequestException('Bound delivery review must match the selected customer success plan');
    }

    if (asset && plan.deliveryAssetId && asset.id !== plan.deliveryAssetId) {
      throw new BadRequestException('Bound delivery asset must match the selected customer success plan');
    }

    if (asset && review && asset.deliveryReviewId !== review.id) {
      throw new BadRequestException('Bound delivery asset must come from the selected delivery review');
    }

    const effectivePackageId = packageId || asset?.solutionPackageId || review?.solutionPackageId || plan.solutionPackageId;
    if (effectivePackageId && plan.solutionPackageId && effectivePackageId !== plan.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the selected customer success plan');
    }

    if (effectivePackageId && review && effectivePackageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the delivery review source package');
    }

    if (asset?.solutionPackageId && review && asset.solutionPackageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound delivery asset must match the delivery review source package');
    }

    return { plan, review, asset, packageId: effectivePackageId ?? null };
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Customer success action owner does not exist in this tenant');
  }

  private async ensureCustomerSuccessPlan(tenantId: string, id: string | null | undefined): Promise<CustomerSuccessPlanReference> {
    if (!id) throw new BadRequestException('Customer success action must be bound to a customer success plan');
    const found = await this.prisma.customerSuccessPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        customerName: true,
        deliveryReviewId: true,
        deliveryAssetId: true,
        solutionPackageId: true,
      },
    });
    if (!found) throw new BadRequestException('Bound customer success plan does not exist in this tenant');

    return found;
  }

  private async ensureDeliveryReview(tenantId: string, id: string | null | undefined) {
    if (!id) return null;
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

  private mapListItem(action: CustomerSuccessActionRecord): CustomerSuccessActionListItem {
    return {
      id: action.id,
      tenant_id: action.tenantId,
      name: action.name,
      code: action.code,
      customer_name: action.customerName,
      action_type: action.actionType as CustomerSuccessActionListItem['action_type'],
      status: action.status as CustomerSuccessActionListItem['status'],
      priority: action.priority as CustomerSuccessActionListItem['priority'],
      risk_level: action.riskLevel as CustomerSuccessActionListItem['risk_level'],
      action_score: action.actionScore,
      action_summary_preview: preview(action.actionSummary),
      next_action_preview: preview(action.nextAction),
      owner: action.owner ? this.mapOwner(action.owner) : null,
      linked_resources: this.mapLinkedResources(action),
      due_at: action.dueAt?.toISOString() ?? null,
      completed_at: action.completedAt?.toISOString() ?? null,
      tags: action.tags,
      created_at: action.createdAt.toISOString(),
      updated_at: action.updatedAt.toISOString(),
    };
  }

  private mapDetail(action: CustomerSuccessActionRecord): CustomerSuccessActionDetail {
    return {
      ...this.mapListItem(action),
      action_summary: action.actionSummary,
      expected_outcome: action.expectedOutcome,
      execution_notes: action.executionNotes,
      blocker_summary: action.blockerSummary,
      completion_evidence: action.completionEvidence,
      next_action: action.nextAction,
      notes: action.notes,
    };
  }

  private mapLinkedResources(action: CustomerSuccessActionRecord): CustomerSuccessActionLinkedResources {
    return {
      customer_success_plan: action.customerSuccessPlan ? this.mapPlan(action.customerSuccessPlan) : null,
      delivery_review: action.deliveryReview ? this.mapDeliveryReview(action.deliveryReview) : null,
      delivery_asset: action.deliveryAsset ? this.mapDeliveryAsset(action.deliveryAsset) : null,
      solution_package: action.solutionPackage ? this.mapSolutionPackage(action.solutionPackage) : null,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): CustomerSuccessPlanOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapPlan(plan: NonNullable<CustomerSuccessActionRecord['customerSuccessPlan']>): CustomerSuccessActionPlanSummary {
    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      customer_name: plan.customerName,
      plan_stage: plan.planStage as CustomerSuccessActionPlanSummary['plan_stage'],
      status: plan.status as CustomerSuccessActionPlanSummary['status'],
      priority: plan.priority as CustomerSuccessActionPlanSummary['priority'],
      health_level: plan.healthLevel as CustomerSuccessActionPlanSummary['health_level'],
      success_score: plan.successScore,
    };
  }

  private mapDeliveryReview(review: NonNullable<CustomerSuccessActionRecord['deliveryReview']>): CustomerSuccessPlanReviewSummary {
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

  private mapDeliveryAsset(asset: NonNullable<CustomerSuccessActionRecord['deliveryAsset']>): CustomerSuccessPlanAssetSummary {
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
    solutionPackage: NonNullable<CustomerSuccessActionRecord['solutionPackage']>,
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

function calculateActionScore(input: {
  action_type?: string | null;
  status?: string | null;
  priority?: string | null;
  risk_level?: string | null;
  action_summary?: string | null;
  expected_outcome?: string | null;
  execution_notes?: string | null;
  blocker_summary?: string | null;
  completion_evidence?: string | null;
  next_action?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
}) {
  let score = 22;
  if (input.status === 'DONE') score += 14;
  else if (input.status === 'IN_PROGRESS') score += 9;
  else if (input.status === 'BLOCKED') score += 3;

  if (input.priority === 'HIGH') score += 5;
  else if (input.priority === 'MEDIUM') score += 3;

  if (input.risk_level === 'HIGH') score -= 4;
  else if (input.risk_level === 'MEDIUM') score += 2;
  else if (input.risk_level === 'LOW') score += 5;

  if (input.action_type && input.action_type !== 'FOLLOW_UP') score += 4;

  for (const value of [
    input.action_summary,
    input.expected_outcome,
    input.execution_notes,
    input.blocker_summary,
    input.completion_evidence,
    input.next_action,
  ]) {
    if (String(value ?? '').trim().length >= 8) score += 7;
  }

  if (input.due_at) score += 2;
  if (input.completed_at) score += 6;

  return Math.max(0, Math.min(100, score));
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];

  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function nullableDate(value?: string | null) {
  if (!value) return null;

  return new Date(value);
}

function preview(value: string, length = 80) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
