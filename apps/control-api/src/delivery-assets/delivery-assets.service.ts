import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  DeliveryAssetAgentSummary,
  DeliveryAssetDetail,
  DeliveryAssetKnowledgeSummary,
  DeliveryAssetLinkedResources,
  DeliveryAssetListItem,
  DeliveryAssetOwnerSummary,
  DeliveryAssetReviewSummary,
  DeliveryAssetSkillSummary,
  DeliveryAssetSolutionPackageSummary,
  PaginatedResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDeliveryAssetDto } from './dto/create-delivery-asset.dto';
import type { ListDeliveryAssetsDto } from './dto/list-delivery-assets.dto';
import type { UpdateDeliveryAssetDto } from './dto/update-delivery-asset.dto';

const deliveryAssetInclude = {
  owner: true,
  deliveryReview: true,
  solutionPackage: true,
  skill: true,
  agent: true,
  knowledgeBase: true,
} satisfies Prisma.DeliveryAssetInclude;

type DeliveryAssetRecord = Prisma.DeliveryAssetGetPayload<{ include: typeof deliveryAssetInclude }>;
type DeliveryReviewReference = { id: string; solutionPackageId: string };
type DataScopeQueryLike = Pick<DataScopeQueryService, 'buildWhere'>;

@Injectable()
export class DeliveryAssetsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery?: DataScopeQueryLike,
  ) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListDeliveryAssetsDto,
  ): Promise<PaginatedResult<DeliveryAssetListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.DeliveryAssetWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.asset_type) where.assetType = query.asset_type;
    if (query.status) where.status = query.status;
    if (query.visibility) where.visibility = query.visibility;
    if (query.owner_id) where.ownerId = query.owner_id;
    if (query.delivery_review_id) where.deliveryReviewId = query.delivery_review_id;
    if (query.solution_package_id) where.solutionPackageId = query.solution_package_id;
    if (query.skill_id) where.skillId = query.skill_id;
    if (query.agent_id) where.agentId = query.agent_id;
    if (query.knowledge_id) where.knowledgeId = query.knowledge_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { summary: { contains: keyword, mode: 'insensitive' } },
        { businessValue: { contains: keyword, mode: 'insensitive' } },
        { reuseGuidance: { contains: keyword, mode: 'insensitive' } },
        { sourceContext: { contains: keyword, mode: 'insensitive' } },
        { riskNotes: { contains: keyword, mode: 'insensitive' } },
        { nextAction: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    if (this.dataScopeQuery) {
      const dataScope = await this.dataScopeQuery.buildWhere<Prisma.DeliveryAssetWhereInput>(
        currentUser,
        'DELIVERY_ASSET',
      );
      mergeDataScopeWhere(where, dataScope.where);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deliveryAsset.findMany({
        where,
        include: deliveryAssetInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deliveryAsset.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapListItem(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateDeliveryAssetDto): Promise<DeliveryAssetDetail> {
    const review = await this.validateReferences(currentUser.tenantId, dto);
    if (!review) {
      throw new BadRequestException('Delivery asset must be bound to a delivery review');
    }
    const solutionPackageId = dto.solution_package_id || review.solutionPackageId;
    const reuseScore = dto.reuse_score ?? calculateReuseScore({ ...dto, solution_package_id: solutionPackageId });

    try {
      const asset = await this.prisma.deliveryAsset.create({
        data: {
          tenantId: currentUser.tenantId,
          ownerId: dto.owner_id || currentUser.id,
          deliveryReviewId: dto.delivery_review_id,
          solutionPackageId,
          skillId: nullableId(dto.skill_id),
          agentId: nullableId(dto.agent_id),
          knowledgeId: nullableId(dto.knowledge_id),
          name: dto.name.trim(),
          code: dto.code.trim(),
          customerName: dto.customer_name.trim(),
          assetType: dto.asset_type ?? 'SOLUTION_TEMPLATE',
          status: dto.status ?? 'DRAFT',
          visibility: dto.visibility ?? 'PRIVATE',
          reuseScore,
          summary: dto.summary.trim(),
          businessValue: dto.business_value.trim(),
          reuseGuidance: dto.reuse_guidance.trim(),
          sourceContext: dto.source_context.trim(),
          riskNotes: dto.risk_notes.trim(),
          nextAction: dto.next_action.trim(),
          tags: normalizeTags(dto.tags),
          notes: nullableText(dto.notes),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: deliveryAssetInclude,
      });

      return this.mapDetail(asset);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A delivery asset with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<DeliveryAssetDetail> {
    const asset = await this.findAsset(currentUser.tenantId, id);

    return this.mapDetail(asset);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateDeliveryAssetDto): Promise<DeliveryAssetDetail> {
    const existing = await this.ensureAsset(currentUser.tenantId, id);
    const review = await this.validateReferences(currentUser.tenantId, dto, existing.deliveryReviewId);
    const solutionPackageId = dto.solution_package_id === undefined
      ? existing.solutionPackageId
      : dto.solution_package_id || review?.solutionPackageId || null;

    const scoreInput = {
      asset_type: dto.asset_type ?? existing.assetType,
      status: dto.status ?? existing.status,
      visibility: dto.visibility ?? existing.visibility,
      summary: dto.summary ?? existing.summary,
      business_value: dto.business_value ?? existing.businessValue,
      reuse_guidance: dto.reuse_guidance ?? existing.reuseGuidance,
      source_context: dto.source_context ?? existing.sourceContext,
      risk_notes: dto.risk_notes ?? existing.riskNotes,
      next_action: dto.next_action ?? existing.nextAction,
      delivery_review_id: dto.delivery_review_id === undefined ? existing.deliveryReviewId : dto.delivery_review_id,
      solution_package_id: solutionPackageId,
      skill_id: dto.skill_id === undefined ? existing.skillId : dto.skill_id,
      agent_id: dto.agent_id === undefined ? existing.agentId : dto.agent_id,
      knowledge_id: dto.knowledge_id === undefined ? existing.knowledgeId : dto.knowledge_id,
    };

    const data: Prisma.DeliveryAssetUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.customer_name !== undefined) data.customerName = dto.customer_name.trim();
    if (dto.asset_type !== undefined) data.assetType = dto.asset_type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.reuse_score !== undefined) data.reuseScore = dto.reuse_score;
    else data.reuseScore = calculateReuseScore(scoreInput);
    if (dto.summary !== undefined) data.summary = dto.summary.trim();
    if (dto.business_value !== undefined) data.businessValue = dto.business_value.trim();
    if (dto.reuse_guidance !== undefined) data.reuseGuidance = dto.reuse_guidance.trim();
    if (dto.source_context !== undefined) data.sourceContext = dto.source_context.trim();
    if (dto.risk_notes !== undefined) data.riskNotes = dto.risk_notes.trim();
    if (dto.next_action !== undefined) data.nextAction = dto.next_action.trim();
    if (dto.tags !== undefined) data.tags = normalizeTags(dto.tags);
    if (dto.notes !== undefined) data.notes = nullableText(dto.notes);
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }
    if (dto.delivery_review_id !== undefined) {
      if (!dto.delivery_review_id) {
        throw new BadRequestException('Delivery asset must be bound to a delivery review');
      }
      data.deliveryReview = { connect: { id: dto.delivery_review_id } };
    }
    if (dto.solution_package_id !== undefined) {
      data.solutionPackage = solutionPackageId ? { connect: { id: solutionPackageId } } : { disconnect: true };
    }
    if (dto.skill_id !== undefined) {
      data.skill = dto.skill_id ? { connect: { id: dto.skill_id } } : { disconnect: true };
    }
    if (dto.agent_id !== undefined) {
      data.agent = dto.agent_id ? { connect: { id: dto.agent_id } } : { disconnect: true };
    }
    if (dto.knowledge_id !== undefined) {
      data.knowledgeBase = dto.knowledge_id ? { connect: { id: dto.knowledge_id } } : { disconnect: true };
    }

    await this.prisma.deliveryAsset.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureAsset(currentUser.tenantId, id);
    await this.prisma.deliveryAsset.update({
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

  private async findAsset(tenantId: string, id: string): Promise<DeliveryAssetRecord> {
    const asset = await this.prisma.deliveryAsset.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: deliveryAssetInclude,
    });

    if (!asset) {
      throw new NotFoundException('Delivery asset not found');
    }

    return asset;
  }

  private async ensureAsset(tenantId: string, id: string) {
    const asset = await this.prisma.deliveryAsset.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException('Delivery asset not found');
    }

    return asset;
  }

  private async validateReferences(
    tenantId: string,
    dto: {
      owner_id?: string | null;
      delivery_review_id?: string | null;
      solution_package_id?: string | null;
      skill_id?: string | null;
      agent_id?: string | null;
      knowledge_id?: string | null;
    },
    fallbackReviewId?: string | null,
  ): Promise<DeliveryReviewReference | null> {
    const reviewId = dto.delivery_review_id === undefined ? fallbackReviewId : dto.delivery_review_id;
    const [review] = await Promise.all([
      this.ensureDeliveryReview(tenantId, reviewId),
      this.ensureUser(tenantId, dto.owner_id),
      this.ensureSolutionPackage(tenantId, dto.solution_package_id),
      this.ensureSkill(tenantId, dto.skill_id),
      this.ensureAgent(tenantId, dto.agent_id),
      this.ensureKnowledgeBase(tenantId, dto.knowledge_id),
    ]);

    if (dto.solution_package_id && review && dto.solution_package_id !== review.solutionPackageId) {
      throw new BadRequestException('Bound solution package must match the delivery review source package');
    }

    return review;
  }

  private async ensureUser(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Delivery asset owner does not exist in this tenant');
  }

  private async ensureDeliveryReview(tenantId: string, id: string | null | undefined) {
    if (!id) throw new BadRequestException('Delivery asset must be bound to a delivery review');
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

  private async ensureSolutionPackage(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.solutionPackage.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound solution package does not exist in this tenant');
  }

  private async ensureSkill(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.skill.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound skill does not exist in this tenant');
  }

  private async ensureAgent(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.agent.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound agent does not exist in this tenant');
  }

  private async ensureKnowledgeBase(tenantId: string, id: string | null | undefined) {
    if (!id) return;
    const found = await this.prisma.knowledgeBase.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!found) throw new BadRequestException('Bound knowledge base does not exist in this tenant');
  }

  private mapListItem(asset: DeliveryAssetRecord): DeliveryAssetListItem {
    return {
      id: asset.id,
      tenant_id: asset.tenantId,
      name: asset.name,
      code: asset.code,
      customer_name: asset.customerName,
      asset_type: asset.assetType as DeliveryAssetListItem['asset_type'],
      status: asset.status as DeliveryAssetListItem['status'],
      visibility: asset.visibility as DeliveryAssetListItem['visibility'],
      reuse_score: asset.reuseScore,
      summary_preview: preview(asset.summary),
      reuse_guidance_preview: preview(asset.reuseGuidance),
      owner: asset.owner ? this.mapOwner(asset.owner) : null,
      linked_resources: this.mapLinkedResources(asset),
      tags: asset.tags,
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString(),
    };
  }

  private mapDetail(asset: DeliveryAssetRecord): DeliveryAssetDetail {
    return {
      ...this.mapListItem(asset),
      summary: asset.summary,
      business_value: asset.businessValue,
      reuse_guidance: asset.reuseGuidance,
      source_context: asset.sourceContext,
      risk_notes: asset.riskNotes,
      next_action: asset.nextAction,
      notes: asset.notes,
    };
  }

  private mapLinkedResources(asset: DeliveryAssetRecord): DeliveryAssetLinkedResources {
    return {
      delivery_review: asset.deliveryReview ? this.mapDeliveryReview(asset.deliveryReview) : null,
      solution_package: asset.solutionPackage ? this.mapSolutionPackage(asset.solutionPackage) : null,
      skill: asset.skill ? this.mapSkill(asset.skill) : null,
      agent: asset.agent ? this.mapAgent(asset.agent) : null,
      knowledge_base: asset.knowledgeBase ? this.mapKnowledge(asset.knowledgeBase) : null,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): DeliveryAssetOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapDeliveryReview(review: NonNullable<DeliveryAssetRecord['deliveryReview']>): DeliveryAssetReviewSummary {
    return {
      id: review.id,
      name: review.name,
      code: review.code,
      customer_name: review.customerName,
      result: review.result as DeliveryAssetReviewSummary['result'],
      status: review.status as DeliveryAssetReviewSummary['status'],
      acceptance_score: review.acceptanceScore,
    };
  }

  private mapSolutionPackage(
    solutionPackage: NonNullable<DeliveryAssetRecord['solutionPackage']>,
  ): DeliveryAssetSolutionPackageSummary {
    return {
      id: solutionPackage.id,
      name: solutionPackage.name,
      code: solutionPackage.code,
      customer_name: solutionPackage.customerName,
      package_stage: solutionPackage.packageStage as DeliveryAssetSolutionPackageSummary['package_stage'],
      status: solutionPackage.status as DeliveryAssetSolutionPackageSummary['status'],
      package_score: solutionPackage.packageScore,
    };
  }

  private mapSkill(skill: NonNullable<DeliveryAssetRecord['skill']>): DeliveryAssetSkillSummary {
    return {
      id: skill.id,
      name: skill.name,
      code: skill.code,
      category: skill.category,
      status: skill.status,
    };
  }

  private mapAgent(agent: NonNullable<DeliveryAssetRecord['agent']>): DeliveryAssetAgentSummary {
    return {
      id: agent.id,
      name: agent.name,
      code: agent.code,
      status: agent.status,
    };
  }

  private mapKnowledge(knowledge: NonNullable<DeliveryAssetRecord['knowledgeBase']>): DeliveryAssetKnowledgeSummary {
    return {
      id: knowledge.id,
      name: knowledge.name,
      code: knowledge.code,
      status: knowledge.status,
      visibility: knowledge.visibility,
    };
  }
}

function calculateReuseScore(input: {
  asset_type?: string | null;
  status?: string | null;
  visibility?: string | null;
  summary?: string | null;
  business_value?: string | null;
  reuse_guidance?: string | null;
  source_context?: string | null;
  risk_notes?: string | null;
  next_action?: string | null;
  delivery_review_id?: string | null;
  solution_package_id?: string | null;
  skill_id?: string | null;
  agent_id?: string | null;
  knowledge_id?: string | null;
}) {
  let score = 12;
  if (input.status === 'PUBLISHED') score += 12;
  else if (input.status === 'REVIEWING') score += 7;

  if (input.visibility === 'TENANT') score += 7;
  else if (input.visibility === 'PUBLIC') score += 9;
  else if (input.visibility === 'TEAM') score += 5;

  if (input.asset_type && input.asset_type !== 'REPORT_ARCHIVE') score += 3;

  for (const value of [
    input.summary,
    input.business_value,
    input.reuse_guidance,
    input.source_context,
    input.risk_notes,
    input.next_action,
  ]) {
    if (String(value ?? '').trim().length >= 10) score += 7;
  }

  if (input.delivery_review_id) score += 5;
  if (input.solution_package_id) score += 4;
  if (input.skill_id) score += 3;
  if (input.agent_id) score += 2;
  if (input.knowledge_id) score += 2;

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
