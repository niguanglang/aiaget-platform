import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  DeliveryReviewDetail,
  DeliveryReviewLinkedResources,
  DeliveryReviewListItem,
  DeliveryReviewOwnerSummary,
  DeliveryReviewSolutionPackageSummary,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDeliveryReviewDto } from './dto/create-delivery-review.dto';
import type { ListDeliveryReviewsDto } from './dto/list-delivery-reviews.dto';
import type { UpdateDeliveryReviewDto } from './dto/update-delivery-review.dto';

const deliveryReviewInclude = {
  owner: true,
  solutionPackage: true,
} satisfies Prisma.DeliveryReviewInclude;

type DeliveryReviewRecord = Prisma.DeliveryReviewGetPayload<{ include: typeof deliveryReviewInclude }>;
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class DeliveryReviewsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListDeliveryReviewsDto,
  ): Promise<PaginatedResult<DeliveryReviewListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.DeliveryReviewWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.review_stage) where.reviewStage = query.review_stage;
    if (query.result) where.result = query.result;
    if (query.status) where.status = query.status;
    if (query.satisfaction_level) where.satisfactionLevel = query.satisfaction_level;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (query.solution_package_id) where.solutionPackageId = query.solution_package_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { deliveredScope: { contains: keyword, mode: 'insensitive' } },
        { acceptanceSummary: { contains: keyword, mode: 'insensitive' } },
        { issueSummary: { contains: keyword, mode: 'insensitive' } },
        { improvementActions: { contains: keyword, mode: 'insensitive' } },
        { expansionPlan: { contains: keyword, mode: 'insensitive' } },
        { reusableAssets: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.DeliveryReviewWhereInput>(
        currentUser,
        'DELIVERY_REVIEW',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deliveryReview.findMany({
        where,
        include: deliveryReviewInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deliveryReview.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateDeliveryReviewDto): Promise<DeliveryReviewDetail> {
    await this.validateReferences(currentUser.tenantId, dto);
    const acceptanceScore = dto.acceptance_score ?? calculateAcceptanceScore(dto);

    try {
      const review = await this.prisma.deliveryReview.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          solutionPackageId: dto.solution_package_id,
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          reviewStage: dto.review_stage ?? 'PILOT_ACCEPTANCE',
          result: dto.result ?? 'PARTIAL',
          status: dto.status ?? 'DRAFT',
          satisfactionLevel: dto.satisfaction_level ?? 'MEDIUM',
          acceptanceScore,
          deliveredScope: dto.delivered_scope.trim(),
          acceptanceSummary: dto.acceptance_summary.trim(),
          issueSummary: dto.issue_summary.trim(),
          improvementActions: dto.improvement_actions.trim(),
          expansionPlan: dto.expansion_plan.trim(),
          reusableAssets: dto.reusable_assets.trim(),
          nextAction: dto.next_action.trim(),
          reviewedAt: nullableDate(dto.reviewed_at),
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: deliveryReviewInclude,
      });

      return this.mapDetail(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A delivery review with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<DeliveryReviewDetail> {
    const review = await this.findReview(currentUser.tenantId, id);

    return this.mapDetail(review);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateDeliveryReviewDto,
  ): Promise<DeliveryReviewDetail> {
    const existing = await this.ensureReview(currentUser.tenantId, id);
    await this.validateReferences(currentUser.tenantId, dto);

    const scoreInput = {
      review_stage: dto.review_stage ?? existing.reviewStage,
      result: dto.result ?? existing.result,
      status: dto.status ?? existing.status,
      satisfaction_level: dto.satisfaction_level ?? existing.satisfactionLevel,
      delivered_scope: dto.delivered_scope ?? existing.deliveredScope,
      acceptance_summary: dto.acceptance_summary ?? existing.acceptanceSummary,
      issue_summary: dto.issue_summary ?? existing.issueSummary,
      improvement_actions: dto.improvement_actions ?? existing.improvementActions,
      expansion_plan: dto.expansion_plan ?? existing.expansionPlan,
      reusable_assets: dto.reusable_assets ?? existing.reusableAssets,
      next_action: dto.next_action ?? existing.nextAction,
      reviewed_at: dto.reviewed_at === undefined ? existing.reviewedAt?.toISOString() : dto.reviewed_at,
      solution_package_id:
        dto.solution_package_id === undefined ? existing.solutionPackageId : dto.solution_package_id,
    };

    const data: Prisma.DeliveryReviewUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.review_stage !== undefined) data.reviewStage = dto.review_stage;
    if (dto.result !== undefined) data.result = dto.result;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.satisfaction_level !== undefined) data.satisfactionLevel = dto.satisfaction_level;
    if (dto.acceptance_score !== undefined) {
      data.acceptanceScore = dto.acceptance_score;
    } else {
      data.acceptanceScore = calculateAcceptanceScore(scoreInput);
    }
    if (dto.delivered_scope !== undefined) data.deliveredScope = dto.delivered_scope.trim();
    if (dto.acceptance_summary !== undefined) data.acceptanceSummary = dto.acceptance_summary.trim();
    if (dto.issue_summary !== undefined) data.issueSummary = dto.issue_summary.trim();
    if (dto.improvement_actions !== undefined) data.improvementActions = dto.improvement_actions.trim();
    if (dto.expansion_plan !== undefined) data.expansionPlan = dto.expansion_plan.trim();
    if (dto.reusable_assets !== undefined) data.reusableAssets = dto.reusable_assets.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.reviewed_at !== undefined) data.reviewedAt = nullableDate(dto.reviewed_at);
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (dto.solution_package_id !== undefined) {
      if (!dto.solution_package_id) {
        throw new BadRequestException('Delivery review must be bound to a solution package');
      }
      data.solutionPackage = { connect: { id: dto.solution_package_id } };
    }

    await this.prisma.deliveryReview.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureReview(currentUser.tenantId, id);
    await this.prisma.deliveryReview.update({
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

  private async findReview(tenantId: string, id: string): Promise<DeliveryReviewRecord> {
    const review = await this.prisma.deliveryReview.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: deliveryReviewInclude,
    });

    if (!review) {
      throw new NotFoundException('Delivery review not found');
    }

    return review;
  }

  private async ensureReview(tenantId: string, id: string) {
    const review = await this.prisma.deliveryReview.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!review) {
      throw new NotFoundException('Delivery review not found');
    }

    return review;
  }

  private async validateReferences(tenantId: string, dto: {
    owner_id?: string | null;
    solution_package_id?: string | null;
  }) {
    await Promise.all([
      this.ensureUser(tenantId, dto.owner_id),
      this.ensureSolutionPackage(tenantId, dto.solution_package_id),
    ]);
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Delivery review owner does not exist in this tenant');
  }

  private async ensureSolutionPackage(tenantId: string, id: string | null | undefined) {
    if (!id) throw new BadRequestException('Delivery review must be bound to a solution package');
    const found = await this.prisma.solutionPackage.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound solution package does not exist in this tenant');
  }

  private mapListItem(review: DeliveryReviewRecord): DeliveryReviewListItem {
    return {
      id: review.id,
      tenant_id: review.tenantId,
      name: review.name,
      code: review.code,
      customer_name: review.customerName,
      review_stage: review.reviewStage as DeliveryReviewListItem['review_stage'],
      result: review.result as DeliveryReviewListItem['result'],
      status: review.status as DeliveryReviewListItem['status'],
      satisfaction_level: review.satisfactionLevel as DeliveryReviewListItem['satisfaction_level'],
      acceptance_score: review.acceptanceScore,
      acceptance_summary_preview: preview(review.acceptanceSummary),
      issue_summary_preview: preview(review.issueSummary),
      owner: review.owner ? this.mapOwner(review.owner) : null,
      linked_resources: this.mapLinkedResources(review),
      reviewed_at: review.reviewedAt?.toISOString() ?? null,
      tags: review.tags,
      created_at: review.createdAt.toISOString(),
      updated_at: review.updatedAt.toISOString(),
    };
  }

  private mapDetail(review: DeliveryReviewRecord): DeliveryReviewDetail {
    return {
      ...this.mapListItem(review),
      delivered_scope: review.deliveredScope,
      acceptance_summary: review.acceptanceSummary,
      issue_summary: review.issueSummary,
      improvement_actions: review.improvementActions,
      expansion_plan: review.expansionPlan,
      reusable_assets: review.reusableAssets,
      next_action: review.nextAction,
      notes: review.notes,
    };
  }

  private mapLinkedResources(review: DeliveryReviewRecord): DeliveryReviewLinkedResources {
    return {
      solution_package: review.solutionPackage ? this.mapSolutionPackage(review.solutionPackage) : null,
    };
  }

  private mapSolutionPackage(
    solutionPackage: NonNullable<DeliveryReviewRecord['solutionPackage']>,
  ): DeliveryReviewSolutionPackageSummary {
    return {
      id: solutionPackage.id,
      name: solutionPackage.name,
      code: solutionPackage.code,
      customer_name: solutionPackage.customerName,
      package_stage: solutionPackage.packageStage as DeliveryReviewSolutionPackageSummary['package_stage'],
      status: solutionPackage.status as DeliveryReviewSolutionPackageSummary['status'],
      package_score: solutionPackage.packageScore,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): DeliveryReviewOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }
}

function calculateAcceptanceScore(input: {
  review_stage?: string | null;
  result?: string | null;
  status?: string | null;
  satisfaction_level?: string | null;
  delivered_scope?: string | null;
  acceptance_summary?: string | null;
  issue_summary?: string | null;
  improvement_actions?: string | null;
  expansion_plan?: string | null;
  reusable_assets?: string | null;
  next_action?: string | null;
  reviewed_at?: string | null;
  solution_package_id?: string | null;
}) {
  let score = 16;
  if (input.result === 'PASSED') score += 18;
  else if (input.result === 'PARTIAL') score += 10;
  else if (input.result === 'DEFERRED') score += 6;

  if (input.status === 'COMPLETED') score += 10;
  else if (input.status === 'ACTION_REQUIRED' || input.status === 'IN_REVIEW') score += 5;

  if (input.satisfaction_level === 'VERY_HIGH') score += 10;
  else if (input.satisfaction_level === 'HIGH') score += 8;
  else if (input.satisfaction_level === 'MEDIUM') score += 5;
  else if (input.satisfaction_level === 'LOW') score += 1;

  for (const value of [
    input.delivered_scope,
    input.acceptance_summary,
    input.issue_summary,
    input.improvement_actions,
    input.expansion_plan,
    input.reusable_assets,
    input.next_action,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 5;
  }

  if (input.review_stage && input.review_stage !== 'PILOT_ACCEPTANCE') score += 3;
  if (input.reviewed_at) score += 4;
  if (input.solution_package_id) score += 4;

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

function nullableDate(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? new Date(normalized) : null;
}

function preview(value: string, length = 54) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
