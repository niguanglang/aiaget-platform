import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CustomerAssessmentDetail,
  CustomerAssessmentListItem,
  CustomerAssessmentOwnerSummary,
  CustomerAssessmentSixQuestionScores,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerAssessmentDto } from './dto/create-customer-assessment.dto';
import type { ListCustomerAssessmentsDto } from './dto/list-customer-assessments.dto';
import type { UpdateCustomerAssessmentDto } from './dto/update-customer-assessment.dto';

const assessmentInclude = {
  owner: true,
} satisfies Prisma.CustomerAssessmentInclude;

type CustomerAssessmentRecord = Prisma.CustomerAssessmentGetPayload<{ include: typeof assessmentInclude }>;
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class CustomerAssessmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListCustomerAssessmentsDto,
  ): Promise<PaginatedResult<CustomerAssessmentListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.CustomerAssessmentWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.customer_type) where.customerType = query.customer_type;
    if (query.decision_stage) where.decisionStage = query.decision_stage;
    if (query.status) where.status = query.status;
    if (query.owner_id) where.ownerId = query.owner_id;

    if (keyword) {
      where.OR = [
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { industry: { contains: keyword, mode: 'insensitive' } },
        { contactName: { contains: keyword, mode: 'insensitive' } },
        { businessGoal: { contains: keyword, mode: 'insensitive' } },
        { processMaturity: { contains: keyword, mode: 'insensitive' } },
        { dataAssetStatus: { contains: keyword, mode: 'insensitive' } },
        { recommendedStrategy: { contains: keyword, mode: 'insensitive' } },
        { riskSummary: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.CustomerAssessmentWhereInput>(
        currentUser,
        'CUSTOMER_ASSESSMENT',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerAssessment.findMany({
        where,
        include: assessmentInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customerAssessment.count({ where }),
    ]);

    return {
      items: items.map((assessment) => this.mapListItem(assessment)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateCustomerAssessmentDto): Promise<CustomerAssessmentDetail> {
    await this.validateOwner(currentUser.tenantId, dto.owner_id);
    const scores = normalizeScores(dto.six_question_scores);
    const customerType = dto.customer_type ?? 'UNKNOWN';
    const readinessScore = calculateReadinessScore(scores);

    const assessment = await this.prisma.customerAssessment.create({
      data: {
        tenantId: currentUser.tenantId,
        ownerId: dto.owner_id || currentUser.id,
        customerName: dto.customer_name.trim(),
        customerType,
        decisionStage: dto.decision_stage ?? 'LEARNING',
        status: dto.status ?? 'DISCOVERY',
        industry: nullableText(dto.industry),
        contactName: nullableText(dto.contact_name),
        contactInfo: nullableText(dto.contact_info),
        businessGoal: dto.business_goal.trim(),
        processMaturity: dto.process_maturity.trim(),
        dataAssetStatus: dto.data_asset_status.trim(),
        managementSupport: dto.management_support.trim(),
        budgetSignal: dto.budget_signal.trim(),
        sixQuestionScores: scores as unknown as Prisma.InputJsonValue,
        readinessScore,
        recommendedStrategy: buildRecommendedStrategy(customerType, readinessScore),
        riskSummary: dto.risk_summary.trim(),
        nextAction: dto.next_action.trim(),
        notes: nullableText(dto.notes),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: assessmentInclude,
    });

    return this.mapDetail(assessment);
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<CustomerAssessmentDetail> {
    const assessment = await this.findAssessment(currentUser.tenantId, id);

    return this.mapDetail(assessment);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateCustomerAssessmentDto,
  ): Promise<CustomerAssessmentDetail> {
    const existing = await this.ensureAssessment(currentUser.tenantId, id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    const customerType = dto.customer_type ?? existing.customerType;
    const scores = dto.six_question_scores ? normalizeScores(dto.six_question_scores) : null;
    const data: Prisma.CustomerAssessmentUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.customer_type !== undefined) data.customerType = dto.customer_type;
    if (dto.decision_stage !== undefined) data.decisionStage = dto.decision_stage;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.industry !== undefined) data.industry = nullableText(dto.industry);
    if (dto.contact_name !== undefined) data.contactName = nullableText(dto.contact_name);
    if (dto.contact_info !== undefined) data.contactInfo = nullableText(dto.contact_info);
    if (dto.business_goal !== undefined) data.businessGoal = dto.business_goal.trim();
    if (dto.process_maturity !== undefined) data.processMaturity = dto.process_maturity.trim();
    if (dto.data_asset_status !== undefined) data.dataAssetStatus = dto.data_asset_status.trim();
    if (dto.management_support !== undefined) data.managementSupport = dto.management_support.trim();
    if (dto.budget_signal !== undefined) data.budgetSignal = dto.budget_signal.trim();
    if (dto.risk_summary !== undefined) data.riskSummary = dto.risk_summary.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (scores) {
      const readinessScore = calculateReadinessScore(scores);
      data.sixQuestionScores = scores as unknown as Prisma.InputJsonValue;
      data.readinessScore = readinessScore;
      data.recommendedStrategy = buildRecommendedStrategy(customerType, readinessScore);
    } else if (dto.customer_type !== undefined) {
      data.recommendedStrategy = buildRecommendedStrategy(customerType, existing.readinessScore);
    }

    await this.prisma.customerAssessment.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureAssessment(currentUser.tenantId, id);
    await this.prisma.customerAssessment.update({
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

  private async findAssessment(tenantId: string, id: string): Promise<CustomerAssessmentRecord> {
    const assessment = await this.prisma.customerAssessment.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: assessmentInclude,
    });

    if (!assessment) {
      throw new NotFoundException('Customer assessment not found');
    }

    return assessment;
  }

  private async ensureAssessment(tenantId: string, id: string) {
    const assessment = await this.prisma.customerAssessment.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Customer assessment not found');
    }

    return assessment;
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
      throw new BadRequestException('Customer assessment owner does not exist in this tenant');
    }
  }

  private mapListItem(assessment: CustomerAssessmentRecord): CustomerAssessmentListItem {
    return {
      id: assessment.id,
      tenant_id: assessment.tenantId,
      customer_name: assessment.customerName,
      customer_type: assessment.customerType as CustomerAssessmentListItem['customer_type'],
      decision_stage: assessment.decisionStage as CustomerAssessmentListItem['decision_stage'],
      status: assessment.status as CustomerAssessmentListItem['status'],
      industry: assessment.industry,
      contact_name: assessment.contactName,
      readiness_score: assessment.readinessScore,
      business_goal_preview: preview(assessment.businessGoal),
      recommended_strategy_preview: preview(assessment.recommendedStrategy),
      owner: assessment.owner ? this.mapOwner(assessment.owner) : null,
      created_at: assessment.createdAt.toISOString(),
      updated_at: assessment.updatedAt.toISOString(),
    };
  }

  private mapDetail(assessment: CustomerAssessmentRecord): CustomerAssessmentDetail {
    return {
      ...this.mapListItem(assessment),
      contact_info: assessment.contactInfo,
      business_goal: assessment.businessGoal,
      process_maturity: assessment.processMaturity,
      data_asset_status: assessment.dataAssetStatus,
      management_support: assessment.managementSupport,
      budget_signal: assessment.budgetSignal,
      six_question_scores: normalizeScores(assessment.sixQuestionScores),
      recommended_strategy: assessment.recommendedStrategy,
      risk_summary: assessment.riskSummary,
      next_action: assessment.nextAction,
      notes: assessment.notes,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): CustomerAssessmentOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }
}

function normalizeScores(value: unknown): CustomerAssessmentSixQuestionScores {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('six_question_scores must be an object');
  }
  const record = value as Partial<Record<keyof CustomerAssessmentSixQuestionScores, unknown>>;

  return {
    customer_type_clarity: normalizeScore(record.customer_type_clarity, 'customer_type_clarity'),
    decision_intent: normalizeScore(record.decision_intent, 'decision_intent'),
    business_goal: normalizeScore(record.business_goal, 'business_goal'),
    process_maturity: normalizeScore(record.process_maturity, 'process_maturity'),
    data_assets: normalizeScore(record.data_assets, 'data_assets'),
    management_budget: normalizeScore(record.management_budget, 'management_budget'),
  };
}

function normalizeScore(value: unknown, field: string) {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new BadRequestException(`${field} score must be an integer between 1 and 5`);
  }

  return score;
}

function calculateReadinessScore(scores: CustomerAssessmentSixQuestionScores) {
  const sum = Object.values(scores).reduce((total, value) => total + value, 0);

  return Math.round((sum / 30) * 100);
}

function buildRecommendedStrategy(customerType: string, readinessScore: number) {
  const readinessHint = readinessScore >= 80
    ? '当前准备度较高，可以围绕样板成果和验收口径推进。'
    : readinessScore >= 60
      ? '当前准备度中等，需要补齐流程、数据或预算信号后再扩大投入。'
      : '当前准备度偏低，建议先做认知对齐和轻量样板。';

  switch (customerType) {
    case 'ANXIOUS':
      return `焦虑型客户：先培训、轻咨询和样板成果，不要过早投入大项目资源。${readinessHint}`;
    case 'TASK_DRIVEN':
      return `任务型客户：优先准备安全、合规、交付和验收材料，快速进入样板成果。${readinessHint}`;
    case 'CLEAR':
      return `清醒型客户：少讲概念，尽快拿出可信结果，并围绕样板成果推进试点。${readinessHint}`;
    default:
      return `未判断客户：先补齐客户画像和六问判断，再决定沟通深度和资源投入。${readinessHint}`;
  }
}

function nullableText(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function preview(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}
