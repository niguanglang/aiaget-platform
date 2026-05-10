import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  BillingAdjustmentItem,
  BillingAdjustmentStatus,
  BillingAdjustmentType,
  CustomerSuccessActionPlanSummary,
  CustomerSuccessActionDetail,
  CustomerSuccessActionListItem,
  CustomerSuccessOpportunityAnalytics,
  CustomerSuccessOpportunityAnalyticsBucket,
  CustomerSuccessOpportunityActionSummary,
  CustomerSuccessOpportunityCloseWonAdjustmentResult,
  CustomerSuccessOpportunityDetail,
  CustomerSuccessOpportunityFollowUpActionResult,
  CustomerSuccessOpportunityLinkedResources,
  CustomerSuccessOpportunityListItem,
  CustomerSuccessOpportunityStageFunnelItem,
  CustomerSuccessPlanAssetSummary,
  CustomerSuccessPlanOwnerSummary,
  CustomerSuccessPlanReviewSummary,
  CustomerSuccessPlanSolutionPackageSummary,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CloseWonCustomerSuccessOpportunityDto } from './dto/close-won-customer-success-opportunity.dto';
import type { CreateCustomerSuccessOpportunityDto } from './dto/create-customer-success-opportunity.dto';
import type { CreateCustomerSuccessOpportunityFollowUpActionDto } from './dto/create-customer-success-opportunity-follow-up-action.dto';
import type { ListCustomerSuccessOpportunitiesDto } from './dto/list-customer-success-opportunities.dto';
import type { UpdateCustomerSuccessOpportunityDto } from './dto/update-customer-success-opportunity.dto';

const customerSuccessOpportunityInclude = {
  owner: true,
  customerSuccessPlan: true,
  customerSuccessAction: true,
  deliveryReview: true,
  deliveryAsset: true,
  solutionPackage: true,
} satisfies Prisma.CustomerSuccessOpportunityInclude;
const customerSuccessActionInclude = {
  owner: true,
  customerSuccessPlan: true,
  deliveryReview: true,
  deliveryAsset: true,
  solutionPackage: true,
} satisfies Prisma.CustomerSuccessActionInclude;

type CustomerSuccessOpportunityRecord = Prisma.CustomerSuccessOpportunityGetPayload<{
  include: typeof customerSuccessOpportunityInclude;
}>;
type CustomerSuccessActionRecord = Prisma.CustomerSuccessActionGetPayload<{
  include: typeof customerSuccessActionInclude;
}>;
type BillingAdjustmentRecord = Prisma.BillingAdjustmentGetPayload<{ include: { invoice: true } }>;
const customerSuccessOpportunityStages: CustomerSuccessOpportunityStageFunnelItem['stage'][] = [
  'DISCOVERY',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ARCHIVED',
];
type CustomerSuccessPlanReference = {
  id: string;
  customerName: string;
  deliveryReviewId: string;
  deliveryAssetId: string | null;
  solutionPackageId: string | null;
};
type CustomerSuccessActionReference = {
  id: string;
  customerSuccessPlanId: string;
  deliveryReviewId: string | null;
  deliveryAssetId: string | null;
  solutionPackageId: string | null;
};
type DeliveryReviewReference = { id: string; solutionPackageId: string };
type DeliveryAssetReference = { id: string; solutionPackageId: string | null; deliveryReviewId: string };
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class CustomerSuccessOpportunitiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListCustomerSuccessOpportunitiesDto,
  ): Promise<PaginatedResult<CustomerSuccessOpportunityListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.CustomerSuccessOpportunityWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.opportunity_type) where.opportunityType = query.opportunity_type;
    if (query.stage) where.stage = query.stage;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.confidence_level) where.confidenceLevel = query.confidence_level;
    if (query.risk_level) where.riskLevel = query.risk_level;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (query.customer_success_plan_id) where.customerSuccessPlanId = query.customer_success_plan_id;
    if (query.customer_success_action_id) where.customerSuccessActionId = query.customer_success_action_id;
    if (query.delivery_review_id) where.deliveryReviewId = query.delivery_review_id;
    if (query.delivery_asset_id) where.deliveryAssetId = query.delivery_asset_id;
    if (query.solution_package_id) where.solutionPackageId = query.solution_package_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { opportunitySummary: { contains: keyword, mode: 'insensitive' } },
        { customerValue: { contains: keyword, mode: 'insensitive' } },
        { commercialStrategy: { contains: keyword, mode: 'insensitive' } },
        { decisionPath: { contains: keyword, mode: 'insensitive' } },
        { riskSummary: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.CustomerSuccessOpportunityWhereInput>(
        currentUser,
        'CUSTOMER_SUCCESS_OPPORTUNITY',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerSuccessOpportunity.findMany({
        where,
        include: customerSuccessOpportunityInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customerSuccessOpportunity.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(
    currentUser: AuthenticatedUser,
    dto: CreateCustomerSuccessOpportunityDto,
  ): Promise<CustomerSuccessOpportunityDetail> {
    const references = await this.validateReferences(currentUser.tenantId, dto);
    const opportunityScore = dto.opportunity_score ?? calculateOpportunityScore(dto);

    try {
      const opportunity = await this.prisma.customerSuccessOpportunity.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          customerSuccessPlanId: references.plan.id,
          customerSuccessActionId: references.action?.id ?? null,
          deliveryReviewId: references.review?.id ?? null,
          deliveryAssetId: references.asset?.id ?? null,
          solutionPackageId: references.packageId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          opportunityType: dto.opportunity_type ?? 'RENEWAL',
          stage: dto.stage ?? 'DISCOVERY',
          status: dto.status ?? 'OPEN',
          priority: dto.priority ?? 'MEDIUM',
          confidenceLevel: dto.confidence_level ?? 'MEDIUM',
          riskLevel: dto.risk_level ?? 'LOW',
          opportunityScore,
          estimatedAmount: new Prisma.Decimal(dto.estimated_amount ?? 0),
          probability: dto.probability ?? 0,
          expectedCloseAt: nullableDate(dto.expected_close_at),
          closedAt: nullableDate(dto.closed_at),
          opportunitySummary: dto.opportunity_summary.trim(),
          customerValue: dto.customer_value.trim(),
          commercialStrategy: dto.commercial_strategy.trim(),
          decisionPath: dto.decision_path.trim(),
          riskSummary: dto.risk_summary.trim(),
          nextAction: dto.next_action.trim(),
          lossReason: nullableText(dto.loss_reason),
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: customerSuccessOpportunityInclude,
      });

      return this.mapDetail(opportunity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A customer success opportunity with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<CustomerSuccessOpportunityDetail> {
    const opportunity = await this.findOpportunity(currentUser.tenantId, id);

    return this.mapDetail(opportunity);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateCustomerSuccessOpportunityDto,
  ): Promise<CustomerSuccessOpportunityDetail> {
    const existing = await this.ensureOpportunity(currentUser.tenantId, id);
    const references = await this.validateReferences(currentUser.tenantId, dto, {
      customerSuccessPlanId: existing.customerSuccessPlanId,
      customerSuccessActionId: existing.customerSuccessActionId,
      deliveryReviewId: existing.deliveryReviewId,
      deliveryAssetId: existing.deliveryAssetId,
      solutionPackageId: existing.solutionPackageId,
    });
    const scoreInput = {
      opportunity_type: dto.opportunity_type ?? existing.opportunityType,
      stage: dto.stage ?? existing.stage,
      status: dto.status ?? existing.status,
      priority: dto.priority ?? existing.priority,
      confidence_level: dto.confidence_level ?? existing.confidenceLevel,
      risk_level: dto.risk_level ?? existing.riskLevel,
      estimated_amount: dto.estimated_amount === undefined ? decimalToNumber(existing.estimatedAmount) : dto.estimated_amount,
      probability: dto.probability ?? existing.probability,
      opportunity_summary: dto.opportunity_summary ?? existing.opportunitySummary,
      customer_value: dto.customer_value ?? existing.customerValue,
      commercial_strategy: dto.commercial_strategy ?? existing.commercialStrategy,
      decision_path: dto.decision_path ?? existing.decisionPath,
      risk_summary: dto.risk_summary ?? existing.riskSummary,
      next_action: dto.next_action ?? existing.nextAction,
      expected_close_at: dto.expected_close_at === undefined ? existing.expectedCloseAt?.toISOString() : dto.expected_close_at,
      closed_at: dto.closed_at === undefined ? existing.closedAt?.toISOString() : dto.closed_at,
    };
    const data: Prisma.CustomerSuccessOpportunityUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.opportunity_type !== undefined) data.opportunityType = dto.opportunity_type;
    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.confidence_level !== undefined) data.confidenceLevel = dto.confidence_level;
    if (dto.risk_level !== undefined) data.riskLevel = dto.risk_level;
    if (dto.opportunity_score !== undefined) data.opportunityScore = dto.opportunity_score;
    else data.opportunityScore = calculateOpportunityScore(scoreInput);
    if (dto.estimated_amount !== undefined) data.estimatedAmount = new Prisma.Decimal(dto.estimated_amount);
    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.expected_close_at !== undefined) data.expectedCloseAt = nullableDate(dto.expected_close_at);
    if (dto.closed_at !== undefined) data.closedAt = nullableDate(dto.closed_at);
    if (dto.opportunity_summary !== undefined) data.opportunitySummary = dto.opportunity_summary.trim();
    if (dto.customer_value !== undefined) data.customerValue = dto.customer_value.trim();
    if (dto.commercial_strategy !== undefined) data.commercialStrategy = dto.commercial_strategy.trim();
    if (dto.decision_path !== undefined) data.decisionPath = dto.decision_path.trim();
    if (dto.risk_summary !== undefined) data.riskSummary = dto.risk_summary.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.loss_reason !== undefined) data.lossReason = nullableText(dto.loss_reason);
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    if (dto.customer_success_plan_id !== undefined) {
      data.customerSuccessPlan = { connect: { id: references.plan.id } };
    }
    if (dto.customer_success_action_id !== undefined) {
      data.customerSuccessAction = references.action ? { connect: { id: references.action.id } } : { disconnect: true };
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

    await this.prisma.customerSuccessOpportunity.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureOpportunity(currentUser.tenantId, id);
    await this.prisma.customerSuccessOpportunity.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        stage: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async createFollowUpAction(
    currentUser: AuthenticatedUser,
    id: string,
    dto: CreateCustomerSuccessOpportunityFollowUpActionDto,
  ): Promise<CustomerSuccessOpportunityFollowUpActionResult> {
    const opportunity = await this.findOpportunity(currentUser.tenantId, id);
    if (opportunity.customerSuccessActionId) {
      throw new BadRequestException('Customer success opportunity already has a bound customer success action');
    }

    const actionName = dto.name?.trim() || `${opportunity.name}跟进行动`;
    const dueAt = nullableDate(dto.due_at) ?? deriveFollowUpDueAt(opportunity.expectedCloseAt);
    const actionType = opportunity.opportunityType === 'RISK_SAVE' ? 'RISK_REVIEW' : 'RENEWAL';
    const ownerId = dto.owner_id || opportunity.ownerId || currentUser.id;

    await this.ensureUser(currentUser.tenantId, ownerId);

    const action = await this.prisma.customerSuccessAction.create({
      data: {
        tenantId: currentUser.tenantId,
        ownerId,
        customerSuccessPlanId: opportunity.customerSuccessPlanId,
        deliveryReviewId: opportunity.deliveryReviewId,
        deliveryAssetId: opportunity.deliveryAssetId,
        solutionPackageId: opportunity.solutionPackageId,
        name: actionName,
        code: `${opportunity.code}_follow_up_${Date.now().toString(36)}`,
        customerName: opportunity.customerName,
        actionType,
        status: 'TODO',
        priority: opportunity.priority,
        riskLevel: opportunity.riskLevel,
        actionScore: calculateFollowUpActionScore(opportunity),
        actionSummary: `围绕续约机会「${opportunity.name}」推进客户成功跟进，聚焦机会阶段、客户价值和商务下一步。`,
        expectedOutcome: `推动「${opportunity.name}」从 ${opportunity.stage} 阶段进入下一步，沉淀客户确认、商务材料或风险处理结论。`,
        executionNotes: '由续约机会自动生成，等待负责人补充执行记录。',
        blockerSummary: opportunity.riskSummary,
        completionEvidence: '待补充会议纪要、报价材料、客户确认记录或续约文件。',
        nextAction: opportunity.nextAction,
        dueAt,
        completedAt: null,
        tags: normalizeTags([...opportunity.tags, '机会跟进']),
        notes: `由续约机会 ${opportunity.code} 自动生成。`,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: customerSuccessActionInclude,
    });
    const updatedOpportunity = await this.prisma.customerSuccessOpportunity.update({
      where: { id: opportunity.id },
      data: {
        customerSuccessAction: {
          connect: {
            id: action.id,
          },
        },
        updatedBy: currentUser.id,
      },
      include: customerSuccessOpportunityInclude,
    });

    return {
      action: this.mapActionDetail(action),
      opportunity: this.mapDetail(updatedOpportunity),
    };
  }

  async closeWonAdjustment(
    currentUser: AuthenticatedUser,
    id: string,
    dto: CloseWonCustomerSuccessOpportunityDto,
  ): Promise<CustomerSuccessOpportunityCloseWonAdjustmentResult> {
    const opportunity = await this.findOpportunity(currentUser.tenantId, id);
    if (opportunity.stage === 'WON' || opportunity.status === 'WON') {
      throw new BadRequestException('Customer success opportunity is already won');
    }

    const existingAdjustment = await this.prisma.billingAdjustment.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        sourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
        sourceId: opportunity.id,
        deletedAt: null,
      },
      include: {
        invoice: true,
      },
    });
    if (existingAdjustment) {
      throw new BadRequestException('Customer success opportunity already has a billing adjustment');
    }

    const amount = dto.amount ?? decimalToNumber(opportunity.estimatedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Close won amount must be greater than 0');
    }

    const closedAt = nullableDate(dto.closed_at) ?? new Date();
    const note = dto.reason?.trim() || `续约机会成交入账：${opportunity.name}`;
    const adjustment = await this.prisma.billingAdjustment.create({
      data: {
        tenantId: currentUser.tenantId,
        invoiceId: null,
        adjustmentNo: await this.nextBillingAdjustmentNo(currentUser.tenantId),
        type: 'DEBIT',
        status: 'APPLIED',
        currency: 'USD',
        amount: new Prisma.Decimal(amount),
        reason: `续约机会成交入账：${opportunity.name}`,
        description: note,
        effectiveAt: closedAt,
        approvedAt: closedAt,
        approvedBy: currentUser.id,
        sourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
        sourceId: opportunity.id,
        metadata: {
          opportunity_id: opportunity.id,
          opportunity_code: opportunity.code,
          opportunity_name: opportunity.name,
          customer_name: opportunity.customerName,
          expected_amount: decimalToNumber(opportunity.estimatedAmount),
          close_amount: amount,
          probability_before_close: opportunity.probability,
          request_id: currentUser.requestId ?? null,
          trace_id: currentUser.traceId ?? null,
        },
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: {
        invoice: true,
      },
    });
    const updatedOpportunity = await this.prisma.customerSuccessOpportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        stage: 'WON',
        status: 'WON',
        probability: 100,
        closedAt,
        updatedBy: currentUser.id,
      },
      include: customerSuccessOpportunityInclude,
    });

    return {
      adjustment: mapBillingAdjustment(adjustment),
      opportunity: this.mapDetail(updatedOpportunity),
    };
  }

  async analytics(currentUser: AuthenticatedUser): Promise<CustomerSuccessOpportunityAnalytics> {
    const where: Prisma.CustomerSuccessOpportunityWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.CustomerSuccessOpportunityWhereInput>(
        currentUser,
        'CUSTOMER_SUCCESS_OPPORTUNITY',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const opportunities = await this.prisma.customerSuccessOpportunity.findMany({
      where,
      include: customerSuccessOpportunityInclude,
      orderBy: {
        expectedCloseAt: 'asc',
      },
    });

    const listItems = opportunities.map((item) => this.mapListItem(item));
    const totalCount = listItems.length;
    const totalEstimatedAmount = sum(listItems.map((item) => item.estimated_amount));
    const weightedAmount = sum(listItems.map((item) => item.weighted_amount));
    const openCount = listItems.filter((item) => item.status === 'OPEN').length;
    const atRiskCount = listItems.filter((item) => item.status === 'AT_RISK').length;
    const wonCount = listItems.filter((item) => item.status === 'WON').length;
    const lostCount = listItems.filter((item) => item.status === 'LOST').length;
    const closedCount = wonCount + lostCount;

    return {
      summary: {
        total_count: totalCount,
        open_count: openCount,
        at_risk_count: atRiskCount,
        won_count: wonCount,
        lost_count: lostCount,
        total_estimated_amount: totalEstimatedAmount,
        weighted_amount: roundMoney(weightedAmount),
        average_probability: average(listItems.map((item) => item.probability)),
        average_score: average(listItems.map((item) => item.opportunity_score)),
        conversion_rate: closedCount === 0 ? 0 : roundPercent((wonCount / closedCount) * 100),
        risk_rate: totalCount === 0 ? 0 : roundPercent((atRiskCount / totalCount) * 100),
      },
      stage_funnel: customerSuccessOpportunityStages.map((stage) => {
        const items = listItems.filter((item) => item.stage === stage);

        return {
          stage,
          count: items.length,
          amount: sum(items.map((item) => item.estimated_amount)),
          weighted_amount: sum(items.map((item) => item.weighted_amount)),
        };
      }),
      type_breakdown: buildBreakdown(listItems, (item) => item.opportunity_type),
      risk_breakdown: buildBreakdown(listItems, (item) => item.risk_level),
      top_opportunities: [...listItems]
        .sort((left, right) => right.weighted_amount - left.weighted_amount || right.opportunity_score - left.opportunity_score)
        .slice(0, 5),
      upcoming_closes: listItems
        .filter((item) => item.expected_close_at && item.status !== 'WON' && item.status !== 'LOST' && item.status !== 'ARCHIVED')
        .sort((left, right) => String(left.expected_close_at).localeCompare(String(right.expected_close_at)))
        .slice(0, 5),
    };
  }

  private async findOpportunity(tenantId: string, id: string): Promise<CustomerSuccessOpportunityRecord> {
    const opportunity = await this.prisma.customerSuccessOpportunity.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: customerSuccessOpportunityInclude,
    });

    if (!opportunity) {
      throw new NotFoundException('Customer success opportunity not found');
    }

    return opportunity;
  }

  private async ensureOpportunity(tenantId: string, id: string) {
    const opportunity = await this.prisma.customerSuccessOpportunity.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Customer success opportunity not found');
    }

    return opportunity;
  }

  private async validateReferences(
    tenantId: string,
    dto: {
      owner_id?: string | null;
      customer_success_plan_id?: string | null;
      customer_success_action_id?: string | null;
      delivery_review_id?: string | null;
      delivery_asset_id?: string | null;
      solution_package_id?: string | null;
    },
    fallback?: {
      customerSuccessPlanId?: string | null;
      customerSuccessActionId?: string | null;
      deliveryReviewId?: string | null;
      deliveryAssetId?: string | null;
      solutionPackageId?: string | null;
    },
  ): Promise<{
    plan: CustomerSuccessPlanReference;
    action: CustomerSuccessActionReference | null;
    review: DeliveryReviewReference | null;
    asset: DeliveryAssetReference | null;
    packageId: string | null;
  }> {
    const planId = dto.customer_success_plan_id === undefined ? fallback?.customerSuccessPlanId : dto.customer_success_plan_id;
    const plan = await this.ensureCustomerSuccessPlan(tenantId, planId);
    const actionId = dto.customer_success_action_id === undefined
      ? fallback?.customerSuccessActionId
      : dto.customer_success_action_id;
    const action = await this.ensureCustomerSuccessAction(tenantId, actionId);
    const reviewId = dto.delivery_review_id === undefined
      ? fallback?.deliveryReviewId ?? action?.deliveryReviewId ?? plan.deliveryReviewId
      : dto.delivery_review_id;
    const assetId = dto.delivery_asset_id === undefined
      ? fallback?.deliveryAssetId ?? action?.deliveryAssetId ?? plan.deliveryAssetId
      : dto.delivery_asset_id;
    const packageId = dto.solution_package_id === undefined
      ? fallback?.solutionPackageId ?? action?.solutionPackageId ?? plan.solutionPackageId
      : dto.solution_package_id;
    const [review, asset] = await Promise.all([
      this.ensureDeliveryReview(tenantId, reviewId),
      this.ensureDeliveryAsset(tenantId, assetId),
      this.ensureSolutionPackage(tenantId, packageId),
      this.ensureUser(tenantId, dto.owner_id),
    ]);

    if (action && action.customerSuccessPlanId !== plan.id) {
      throw new BadRequestException('Bound customer success action must belong to the selected customer success plan');
    }

    if (review && review.id !== plan.deliveryReviewId) {
      throw new BadRequestException('Bound delivery review must match the selected customer success plan');
    }

    if (action?.deliveryReviewId && review && action.deliveryReviewId !== review.id) {
      throw new BadRequestException('Bound delivery review must match the selected customer success action');
    }

    if (asset && plan.deliveryAssetId && asset.id !== plan.deliveryAssetId) {
      throw new BadRequestException('Bound delivery asset must match the selected customer success plan');
    }

    if (action?.deliveryAssetId && asset && action.deliveryAssetId !== asset.id) {
      throw new BadRequestException('Bound delivery asset must match the selected customer success action');
    }

    if (asset && review && asset.deliveryReviewId !== review.id) {
      throw new BadRequestException('Bound delivery asset must come from the selected delivery review');
    }

    const effectivePackageId = packageId || asset?.solutionPackageId || review?.solutionPackageId || plan.solutionPackageId;
    if (effectivePackageId && plan.solutionPackageId && effectivePackageId !== plan.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the selected customer success plan');
    }

    if (action?.solutionPackageId && effectivePackageId && action.solutionPackageId !== effectivePackageId) {
      throw new BadRequestException('Bound solution package must match the selected customer success action');
    }

    if (effectivePackageId && review && effectivePackageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the delivery review source package');
    }

    if (asset?.solutionPackageId && review && asset.solutionPackageId !== review.solutionPackageId) {
      throw new BadRequestException('Bound delivery asset must match the delivery review source package');
    }

    return { plan, action, review, asset, packageId: effectivePackageId ?? null };
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Customer success opportunity owner does not exist in this tenant');
  }

  private async ensureCustomerSuccessPlan(tenantId: string, id: string | null | undefined): Promise<CustomerSuccessPlanReference> {
    if (!id) throw new BadRequestException('Customer success opportunity must be bound to a customer success plan');
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

  private async ensureCustomerSuccessAction(tenantId: string, id: string | null | undefined) {
    if (!id) return null;
    const found = await this.prisma.customerSuccessAction.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        customerSuccessPlanId: true,
        deliveryReviewId: true,
        deliveryAssetId: true,
        solutionPackageId: true,
      },
    });
    if (!found) throw new BadRequestException('Bound customer success action does not exist in this tenant');

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

  private async nextBillingAdjustmentNo(tenantId: string) {
    const date = new Date();
    const prefix = `ADJ-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.billingAdjustment.count({
      where: {
        tenantId,
        adjustmentNo: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private mapListItem(opportunity: CustomerSuccessOpportunityRecord): CustomerSuccessOpportunityListItem {
    const estimatedAmount = decimalToNumber(opportunity.estimatedAmount);

    return {
      id: opportunity.id,
      tenant_id: opportunity.tenantId,
      name: opportunity.name,
      code: opportunity.code,
      customer_name: opportunity.customerName,
      opportunity_type: opportunity.opportunityType as CustomerSuccessOpportunityListItem['opportunity_type'],
      stage: opportunity.stage as CustomerSuccessOpportunityListItem['stage'],
      status: opportunity.status as CustomerSuccessOpportunityListItem['status'],
      priority: opportunity.priority as CustomerSuccessOpportunityListItem['priority'],
      confidence_level: opportunity.confidenceLevel as CustomerSuccessOpportunityListItem['confidence_level'],
      risk_level: opportunity.riskLevel as CustomerSuccessOpportunityListItem['risk_level'],
      opportunity_score: opportunity.opportunityScore,
      estimated_amount: estimatedAmount,
      probability: opportunity.probability,
      weighted_amount: Math.round(estimatedAmount * opportunity.probability) / 100,
      opportunity_summary_preview: preview(opportunity.opportunitySummary),
      next_action_preview: preview(opportunity.nextAction),
      owner: opportunity.owner ? this.mapOwner(opportunity.owner) : null,
      linked_resources: this.mapLinkedResources(opportunity),
      expected_close_at: opportunity.expectedCloseAt?.toISOString() ?? null,
      closed_at: opportunity.closedAt?.toISOString() ?? null,
      tags: opportunity.tags,
      created_at: opportunity.createdAt.toISOString(),
      updated_at: opportunity.updatedAt.toISOString(),
    };
  }

  private mapDetail(opportunity: CustomerSuccessOpportunityRecord): CustomerSuccessOpportunityDetail {
    return {
      ...this.mapListItem(opportunity),
      opportunity_summary: opportunity.opportunitySummary,
      customer_value: opportunity.customerValue,
      commercial_strategy: opportunity.commercialStrategy,
      decision_path: opportunity.decisionPath,
      risk_summary: opportunity.riskSummary,
      next_action: opportunity.nextAction,
      loss_reason: opportunity.lossReason,
      notes: opportunity.notes,
    };
  }

  private mapLinkedResources(opportunity: CustomerSuccessOpportunityRecord): CustomerSuccessOpportunityLinkedResources {
    return {
      customer_success_plan: opportunity.customerSuccessPlan ? this.mapPlan(opportunity.customerSuccessPlan) : null,
      customer_success_action: opportunity.customerSuccessAction ? this.mapAction(opportunity.customerSuccessAction) : null,
      delivery_review: opportunity.deliveryReview ? this.mapDeliveryReview(opportunity.deliveryReview) : null,
      delivery_asset: opportunity.deliveryAsset ? this.mapDeliveryAsset(opportunity.deliveryAsset) : null,
      solution_package: opportunity.solutionPackage ? this.mapSolutionPackage(opportunity.solutionPackage) : null,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): CustomerSuccessPlanOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapPlan(plan: NonNullable<CustomerSuccessOpportunityRecord['customerSuccessPlan']>): CustomerSuccessActionPlanSummary {
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

  private mapAction(action: NonNullable<CustomerSuccessOpportunityRecord['customerSuccessAction']>): CustomerSuccessOpportunityActionSummary {
    return {
      id: action.id,
      name: action.name,
      code: action.code,
      customer_name: action.customerName,
      action_type: action.actionType as CustomerSuccessOpportunityActionSummary['action_type'],
      status: action.status as CustomerSuccessOpportunityActionSummary['status'],
      priority: action.priority as CustomerSuccessOpportunityActionSummary['priority'],
      risk_level: action.riskLevel as CustomerSuccessOpportunityActionSummary['risk_level'],
      action_score: action.actionScore,
    };
  }

  private mapActionDetail(action: CustomerSuccessActionRecord): CustomerSuccessActionDetail {
    return {
      ...this.mapActionListItem(action),
      action_summary: action.actionSummary,
      expected_outcome: action.expectedOutcome,
      execution_notes: action.executionNotes,
      blocker_summary: action.blockerSummary,
      completion_evidence: action.completionEvidence,
      next_action: action.nextAction,
      notes: action.notes,
    };
  }

  private mapActionListItem(action: CustomerSuccessActionRecord): CustomerSuccessActionListItem {
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
      linked_resources: {
        customer_success_plan: action.customerSuccessPlan ? this.mapPlan(action.customerSuccessPlan) : null,
        delivery_review: action.deliveryReview ? this.mapDeliveryReview(action.deliveryReview) : null,
        delivery_asset: action.deliveryAsset ? this.mapDeliveryAsset(action.deliveryAsset) : null,
        solution_package: action.solutionPackage ? this.mapSolutionPackage(action.solutionPackage) : null,
      },
      due_at: action.dueAt?.toISOString() ?? null,
      completed_at: action.completedAt?.toISOString() ?? null,
      tags: action.tags,
      created_at: action.createdAt.toISOString(),
      updated_at: action.updatedAt.toISOString(),
    };
  }

  private mapDeliveryReview(review: NonNullable<CustomerSuccessOpportunityRecord['deliveryReview']>): CustomerSuccessPlanReviewSummary {
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

  private mapDeliveryAsset(asset: NonNullable<CustomerSuccessOpportunityRecord['deliveryAsset']>): CustomerSuccessPlanAssetSummary {
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
    solutionPackage: NonNullable<CustomerSuccessOpportunityRecord['solutionPackage']>,
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

function calculateOpportunityScore(input: {
  opportunity_type?: string | null;
  stage?: string | null;
  status?: string | null;
  priority?: string | null;
  confidence_level?: string | null;
  risk_level?: string | null;
  estimated_amount?: number | null;
  probability?: number | null;
  opportunity_summary?: string | null;
  customer_value?: string | null;
  commercial_strategy?: string | null;
  decision_path?: string | null;
  risk_summary?: string | null;
  next_action?: string | null;
  expected_close_at?: string | null;
  closed_at?: string | null;
}) {
  let score = 16;
  if (input.status === 'WON') score += 20;
  else if (input.status === 'OPEN') score += 8;
  else if (input.status === 'AT_RISK') score += 2;
  else if (input.status === 'LOST' || input.status === 'ARCHIVED') score -= 8;

  if (input.stage === 'NEGOTIATION') score += 12;
  else if (input.stage === 'PROPOSAL') score += 11;
  else if (input.stage === 'QUALIFICATION') score += 8;
  else if (input.stage === 'WON') score += 15;

  if (input.priority === 'HIGH') score += 6;
  else if (input.priority === 'MEDIUM') score += 3;

  if (input.confidence_level === 'HIGH') score += 8;
  else if (input.confidence_level === 'MEDIUM') score += 4;

  if (input.risk_level === 'HIGH') score -= 8;
  else if (input.risk_level === 'MEDIUM') score -= 3;

  const amount = Number(input.estimated_amount ?? 0);
  if (amount >= 500000) score += 6;
  else if (amount >= 100000) score += 3;

  const probability = Number(input.probability ?? 0);
  if (probability >= 70) score += 8;
  else if (probability >= 40) score += 4;

  for (const value of [
    input.opportunity_summary,
    input.customer_value,
    input.commercial_strategy,
    input.decision_path,
    input.risk_summary,
    input.next_action,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 5;
  }

  if (input.expected_close_at) score += 2;
  if (input.closed_at) score += 3;

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

function deriveFollowUpDueAt(expectedCloseAt?: Date | null) {
  const baseDate = expectedCloseAt ? new Date(expectedCloseAt) : new Date();
  baseDate.setDate(baseDate.getDate() - 7);

  return baseDate;
}

function calculateFollowUpActionScore(opportunity: Pick<CustomerSuccessOpportunityRecord, 'priority' | 'riskLevel' | 'opportunityScore' | 'probability'>) {
  let score = 45;
  if (opportunity.priority === 'HIGH') score += 10;
  else if (opportunity.priority === 'MEDIUM') score += 6;
  if (opportunity.riskLevel === 'LOW') score += 10;
  else if (opportunity.riskLevel === 'MEDIUM') score += 5;
  else if (opportunity.riskLevel === 'HIGH') score -= 6;
  if (opportunity.probability >= 70) score += 10;
  else if (opportunity.probability >= 40) score += 6;
  score += Math.round(opportunity.opportunityScore * 0.2);

  return Math.max(0, Math.min(100, score));
}

function mapBillingAdjustment(adjustment: BillingAdjustmentRecord): BillingAdjustmentItem {
  const amount = decimalToNumber(adjustment.amount);

  return {
    id: adjustment.id,
    invoice_id: adjustment.invoiceId,
    invoice_no: adjustment.invoice?.invoiceNo ?? null,
    adjustment_no: adjustment.adjustmentNo,
    type: adjustment.type as BillingAdjustmentType,
    status: adjustment.status as BillingAdjustmentStatus,
    currency: adjustment.currency,
    amount,
    signed_amount: signedAdjustmentAmount(adjustment.type, amount),
    reason: adjustment.reason,
    description: adjustment.description,
    effective_at: adjustment.effectiveAt?.toISOString() ?? null,
    approved_at: adjustment.approvedAt?.toISOString() ?? null,
    approved_by: adjustment.approvedBy,
    source_type: adjustment.sourceType,
    source_id: adjustment.sourceId,
    created_at: adjustment.createdAt.toISOString(),
    updated_at: adjustment.updatedAt.toISOString(),
  };
}

function signedAdjustmentAmount(type: string, amount: number) {
  if (type === 'DEBIT') return roundMoney(Math.abs(amount));
  return roundMoney(-Math.abs(amount));
}

function preview(value: string, length = 54) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}

function decimalToNumber(value: Prisma.Decimal | number | string) {
  if (value instanceof Prisma.Decimal) return value.toNumber();

  return Number(value);
}

function sum(values: number[]) {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

function average(values: number[]) {
  if (values.length === 0) return 0;

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function buildBreakdown(
  items: CustomerSuccessOpportunityListItem[],
  keyOf: (item: CustomerSuccessOpportunityListItem) => string,
): CustomerSuccessOpportunityAnalyticsBucket[] {
  const buckets = new Map<string, CustomerSuccessOpportunityAnalyticsBucket>();

  for (const item of items) {
    const key = keyOf(item);
    const current = buckets.get(key) ?? {
      key,
      count: 0,
      amount: 0,
      weighted_amount: 0,
    };
    current.count += 1;
    current.amount = roundMoney(current.amount + item.estimated_amount);
    current.weighted_amount = roundMoney(current.weighted_amount + item.weighted_amount);
    buckets.set(key, current);
  }

  return Array.from(buckets.values()).sort((left, right) => right.weighted_amount - left.weighted_amount || right.count - left.count);
}
