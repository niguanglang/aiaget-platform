import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ResourceAclCheckResult,
  ResourceAclEffect,
  ResourceAclItem,
  ResourceAclOptionResult,
  ResourceAclOverview,
  ResourceAclResourceSummary,
  ResourceAclResourceType,
  ResourceAclStatus,
  ResourceAclSubjectSummary,
  ResourceAclSubjectType,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CheckResourceAclDto } from './dto/check-resource-acl.dto';
import type { CreateResourceAclDto } from './dto/create-resource-acl.dto';
import type { ListResourceAclOptionsDto } from './dto/list-resource-acl-options.dto';
import type { ListResourceAclsDto } from './dto/list-resource-acls.dto';
import type { UpdateResourceAclDto } from './dto/update-resource-acl.dto';
import {
  RESOURCE_ACL_RESOURCE_DEFINITIONS,
  RESOURCE_ACL_RESOURCE_LABELS,
  RESOURCE_ACL_RESOURCE_TYPES,
  RESOURCE_ACL_SUBJECT_TYPES,
} from './resource-acl.constants';

type ResourceAclRecord = Prisma.ResourceAclGetPayload<object>;

@Injectable()
export class ResourceAclsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<ResourceAclOverview> {
    const acls = await this.prisma.resourceAcl.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      select: {
        resourceType: true,
        subjectType: true,
        effect: true,
        status: true,
      },
    });

    return {
      total: acls.length,
      active_count: acls.filter((acl) => acl.status === 'ACTIVE').length,
      disabled_count: acls.filter((acl) => acl.status === 'DISABLED').length,
      allow_count: acls.filter((acl) => acl.effect === 'ALLOW').length,
      deny_count: acls.filter((acl) => acl.effect === 'DENY').length,
      resource_types: RESOURCE_ACL_RESOURCE_DEFINITIONS,
      subject_counts: countBy(acls, (acl) => acl.subjectType)
        .map(([subjectType, count]) => ({
          subject_type: normalizeSubjectType(subjectType),
          count,
        })),
      resource_counts: countBy(acls, (acl) => acl.resourceType)
        .map(([resourceType, count]) => ({
          resource_type: normalizeResourceType(resourceType),
          count,
        })),
    };
  }

  async options(currentUser: AuthenticatedUser, query: ListResourceAclOptionsDto = {}): Promise<ResourceAclOptionResult> {
    const resourceType = normalizeResourceType(query.resource_type ?? 'AGENT');
    const subjectType = normalizeSubjectType(query.subject_type ?? 'ROLE');
    const keyword = query.keyword?.trim();
    const resourceDefinition = RESOURCE_ACL_RESOURCE_DEFINITIONS.find(
      (definition) => definition.resource_type === resourceType,
    );

    return {
      resources: await this.listResources(currentUser.tenantId, resourceType, keyword),
      subjects: await this.listSubjects(currentUser.tenantId, subjectType, keyword),
      permissions: resourceDefinition?.permission_codes ?? [],
    };
  }

  async list(currentUser: AuthenticatedUser, query: ListResourceAclsDto = {}): Promise<ResourceAclItem[]> {
    const where: Prisma.ResourceAclWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.resource_type) where.resourceType = normalizeResourceType(query.resource_type);
    if (query.resource_id) where.resourceId = query.resource_id;
    if (query.subject_type) where.subjectType = normalizeSubjectType(query.subject_type);
    if (query.subject_id) where.subjectId = query.subject_id;
    if (query.permission_code) where.permissionCode = normalizePermissionCode(query.permission_code);
    if (query.effect) where.effect = normalizeEffect(query.effect);
    if (query.status) where.status = normalizeStatus(query.status);

    const acls = await this.prisma.resourceAcl.findMany({
      where,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return this.mapAcls(currentUser.tenantId, acls);
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<ResourceAclItem> {
    const acl = await this.ensureAcl(currentUser.tenantId, id);

    return this.mapAcl(currentUser.tenantId, acl);
  }

  async create(currentUser: AuthenticatedUser, dto: CreateResourceAclDto): Promise<ResourceAclItem> {
    const resourceType = normalizeResourceType(dto.resource_type);
    const subjectType = normalizeSubjectType(dto.subject_type);
    const permissionCode = normalizePermissionCode(dto.permission_code);
    validatePermissionForResource(resourceType, permissionCode);
    await this.ensureResourceExists(currentUser.tenantId, resourceType, dto.resource_id);
    await this.ensureSubjectExists(currentUser.tenantId, subjectType, dto.subject_id);

    try {
      const acl = await this.prisma.resourceAcl.upsert({
        where: {
          tenantId_resourceType_resourceId_subjectType_subjectId_permissionCode: {
            tenantId: currentUser.tenantId,
            resourceType,
            resourceId: dto.resource_id,
            subjectType,
            subjectId: dto.subject_id,
            permissionCode,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          resourceType,
          resourceId: dto.resource_id,
          subjectType,
          subjectId: dto.subject_id,
          permissionCode,
          effect: normalizeEffect(dto.effect ?? 'ALLOW'),
          status: normalizeStatus(dto.status ?? 'ACTIVE'),
          conditions: toJsonInput(dto.conditions),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          effect: normalizeEffect(dto.effect ?? 'ALLOW'),
          status: normalizeStatus(dto.status ?? 'ACTIVE'),
          conditions: toJsonInput(dto.conditions),
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });

      return this.mapAcl(currentUser.tenantId, acl);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Invalid tenant or resource ACL reference');
      }

      throw error;
    }
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateResourceAclDto): Promise<ResourceAclItem> {
    const existing = await this.ensureAcl(currentUser.tenantId, id);
    const permissionCode = dto.permission_code === undefined
      ? existing.permissionCode
      : normalizePermissionCode(dto.permission_code);
    const resourceType = normalizeResourceType(existing.resourceType);
    validatePermissionForResource(resourceType, permissionCode);

    const data: Prisma.ResourceAclUncheckedUpdateInput = {
      permissionCode,
      updatedBy: currentUser.id,
    };

    if (dto.effect !== undefined) data.effect = normalizeEffect(dto.effect);
    if (dto.status !== undefined) data.status = normalizeStatus(dto.status);
    if (dto.conditions !== undefined) data.conditions = toJsonInput(dto.conditions);

    try {
      const acl = await this.prisma.resourceAcl.update({
        where: {
          id,
        },
        data,
      });

      return this.mapAcl(currentUser.tenantId, acl);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A Resource ACL rule with the same resource, subject, and permission already exists');
      }

      throw error;
    }
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureAcl(currentUser.tenantId, id);
    await this.prisma.resourceAcl.update({
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

  async check(currentUser: AuthenticatedUser, dto: CheckResourceAclDto): Promise<ResourceAclCheckResult> {
    const resourceType = normalizeResourceType(dto.resource_type);
    const subjectType = normalizeSubjectType(dto.subject_type);
    const permissionCode = normalizePermissionCode(dto.permission_code);
    validatePermissionForResource(resourceType, permissionCode);
    await this.ensureResourceExists(currentUser.tenantId, resourceType, dto.resource_id);
    await this.ensureSubjectExists(currentUser.tenantId, subjectType, dto.subject_id);

    const matches = await this.prisma.resourceAcl.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType,
        resourceId: dto.resource_id,
        subjectType,
        subjectId: dto.subject_id,
        permissionCode,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [
        {
          effect: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });

    const denyMatch = matches.find((acl) => acl.effect === 'DENY');
    const allowMatch = matches.find((acl) => acl.effect === 'ALLOW');
    const matchedAcl = denyMatch ?? allowMatch ?? null;

    if (!matchedAcl) {
      return {
        decision: 'NO_MATCH',
        matched_acl: null,
        checked_count: matches.length,
        reason: '未命中任何生效资源授权规则。',
      };
    }

    return {
      decision: matchedAcl.effect === 'DENY' ? 'DENY' : 'ALLOW',
      matched_acl: await this.mapAcl(currentUser.tenantId, matchedAcl),
      checked_count: matches.length,
      reason: matchedAcl.effect === 'DENY' ? '命中拒绝规则，拒绝优先。' : '命中允许规则。',
    };
  }

  private async ensureAcl(tenantId: string, id: string): Promise<ResourceAclRecord> {
    const acl = await this.prisma.resourceAcl.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
    });

    if (!acl) {
      throw new NotFoundException('Resource ACL not found');
    }

    return acl;
  }

  private async ensureResourceExists(tenantId: string, resourceType: ResourceAclResourceType, resourceId: string) {
    const resource = await this.getResource(tenantId, resourceType, resourceId);
    if (!resource) {
      throw new NotFoundException(`${RESOURCE_ACL_RESOURCE_LABELS[resourceType] ?? resourceType} resource not found`);
    }
  }

  private async ensureSubjectExists(tenantId: string, subjectType: ResourceAclSubjectType, subjectId: string) {
    const subject = await this.getSubject(tenantId, subjectType, subjectId);
    if (!subject) {
      throw new NotFoundException(`${subjectType} subject not found`);
    }
  }

  private async mapAcls(tenantId: string, acls: ResourceAclRecord[]): Promise<ResourceAclItem[]> {
    const [resources, subjects] = await Promise.all([
      this.loadResourceMap(tenantId, acls),
      this.loadSubjectMap(tenantId, acls),
    ]);

    return acls.map((acl) => this.mapAclFromMaps(acl, resources, subjects));
  }

  private async mapAcl(tenantId: string, acl: ResourceAclRecord): Promise<ResourceAclItem> {
    const [resource, subject] = await Promise.all([
      this.getResource(tenantId, normalizeResourceType(acl.resourceType), acl.resourceId),
      this.getSubject(tenantId, normalizeSubjectType(acl.subjectType), acl.subjectId),
    ]);

    return this.mapAclFromMaps(
      acl,
      new Map([[resourceMapKey(acl.resourceType, acl.resourceId), resource ?? missingResource(acl)]]),
      new Map([[subjectMapKey(acl.subjectType, acl.subjectId), subject ?? missingSubject(acl)]]),
    );
  }

  private mapAclFromMaps(
    acl: ResourceAclRecord,
    resources: Map<string, ResourceAclResourceSummary>,
    subjects: Map<string, ResourceAclSubjectSummary>,
  ): ResourceAclItem {
    const resourceType = normalizeResourceType(acl.resourceType);
    const subjectType = normalizeSubjectType(acl.subjectType);

    return {
      id: acl.id,
      tenant_id: acl.tenantId,
      resource_type: resourceType,
      resource_id: acl.resourceId,
      resource: resources.get(resourceMapKey(acl.resourceType, acl.resourceId)) ?? missingResource(acl),
      subject_type: subjectType,
      subject_id: acl.subjectId,
      subject: subjects.get(subjectMapKey(acl.subjectType, acl.subjectId)) ?? missingSubject(acl),
      permission_code: acl.permissionCode,
      effect: normalizeEffect(acl.effect),
      status: normalizeStatus(acl.status),
      condition_count: countConditions(acl.conditions),
      conditions: normalizeJsonObjectOutput(acl.conditions),
      created_at: acl.createdAt.toISOString(),
      updated_at: acl.updatedAt.toISOString(),
    };
  }

  private async loadResourceMap(tenantId: string, acls: ResourceAclRecord[]) {
    const output = new Map<string, ResourceAclResourceSummary>();
    const idsByType = groupIdsByType(acls, (acl) => acl.resourceType, (acl) => acl.resourceId);

    for (const [type, ids] of idsByType.entries()) {
      const resources = await this.listResourcesByIds(tenantId, normalizeResourceType(type), ids);
      for (const resource of resources) {
        output.set(resourceMapKey(resource.type, resource.id), resource);
      }
    }

    return output;
  }

  private async loadSubjectMap(tenantId: string, acls: ResourceAclRecord[]) {
    const output = new Map<string, ResourceAclSubjectSummary>();
    const idsByType = groupIdsByType(acls, (acl) => acl.subjectType, (acl) => acl.subjectId);

    for (const [type, ids] of idsByType.entries()) {
      const subjects = await this.listSubjectsByIds(tenantId, normalizeSubjectType(type), ids);
      for (const subject of subjects) {
        output.set(subjectMapKey(subject.type, subject.id), subject);
      }
    }

    return output;
  }

  private async getResource(
    tenantId: string,
    resourceType: ResourceAclResourceType,
    resourceId: string,
  ): Promise<ResourceAclResourceSummary | null> {
    const resources = await this.listResourcesByIds(tenantId, resourceType, [resourceId]);
    return resources[0] ?? null;
  }

  private async listResources(
    tenantId: string,
    resourceType: ResourceAclResourceType,
    keyword?: string,
  ): Promise<ResourceAclResourceSummary[]> {
    const contains = containsFilter(keyword);
    const take = 100;

    switch (resourceType) {
      case 'AGENT': {
        const items = await this.prisma.agent.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AGENT',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'AGENT_TEAM': {
        const items = await this.prisma.agentTeam.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AGENT_TEAM',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'ROLE_SCENARIO': {
        const items = await this.prisma.roleScenario.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { code: contains },
                    { roleName: contains },
                    { departmentName: contains },
                    { painPoint: contains },
                    { workflowSummary: contains },
                  ],
                }
              : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'ROLE_SCENARIO',
          name: item.name,
          code: item.code,
          description: `${item.roleName} / ${item.departmentName}`,
          status: item.status,
        }));
      }
      case 'SOLUTION_PACKAGE': {
        const items = await this.prisma.solutionPackage.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { code: contains },
                    { customerName: contains },
                    { industry: contains },
                    { executiveSummary: contains },
                    { deliveryRoadmap: contains },
                  ],
                }
              : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'SOLUTION_PACKAGE',
          name: item.name,
          code: item.code,
          description: `${item.customerName} / ${item.industry ?? '未填写行业'}`,
          status: item.status,
        }));
      }
      case 'DELIVERY_REVIEW': {
        const items = await this.prisma.deliveryReview.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { code: contains },
                    { customerName: contains },
                    { acceptanceSummary: contains },
                    { issueSummary: contains },
                    { expansionPlan: contains },
                  ],
                }
              : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DELIVERY_REVIEW',
          name: item.name,
          code: item.code,
          description: `${item.customerName} / ${item.reviewStage}`,
          status: item.status,
        }));
      }
      case 'CUSTOMER_ASSESSMENT': {
        const items = await this.prisma.customerAssessment.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { customerName: contains },
                    { industry: contains },
                    { contactName: contains },
                    { businessGoal: contains },
                    { recommendedStrategy: contains },
                  ],
                }
              : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CUSTOMER_ASSESSMENT',
          name: item.customerName,
          code: item.industry,
          description: item.recommendedStrategy,
          status: item.status,
        }));
      }
      case 'SKILL': {
        const items = await this.prisma.skill.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { code: contains },
                    { description: contains },
                    { triggerScenario: contains },
                    { outputFormat: contains },
                  ],
                }
              : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'SKILL',
          name: item.name,
          code: item.code,
          description: item.description ?? item.triggerScenario,
          status: item.status,
        }));
      }
      case 'CHANNEL': {
        const items = await this.prisma.agentPublishChannel.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { channel: contains },
                    { description: contains },
                    { endpointUrl: contains },
                    { callbackUrl: contains },
                  ],
                }
              : {}),
          },
          include: {
            agent: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CHANNEL',
          name: item.name ?? `${item.agent.name} - ${item.channel}`,
          code: item.channel,
          description: item.description ?? item.agent.name,
          status: item.status,
        }));
      }
      case 'PLUGIN': {
        const items = await this.prisma.plugin.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { provider: contains }, { description: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'PLUGIN',
          name: item.name,
          code: item.code,
          description: item.description ?? item.provider,
          status: item.status,
        }));
      }
      case 'KNOWLEDGE_BASE': {
        const items = await this.prisma.knowledgeBase.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'KNOWLEDGE_BASE',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'DOCUMENT': {
        const items = await this.prisma.knowledgeDocument.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ title: contains }, { fileName: contains }, { storagePath: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DOCUMENT',
          name: item.title,
          code: item.fileName ?? item.sourceType,
          description: item.storagePath,
          status: item.status,
        }));
      }
      case 'TOOL': {
        const items = await this.prisma.tool.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'TOOL',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'MODEL': {
        const [providers, configs] = await Promise.all([
          this.prisma.modelProvider.findMany({
            where: {
              tenantId,
              deletedAt: null,
              ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 40,
          }),
          this.prisma.modelConfig.findMany({
            where: {
              tenantId,
              deletedAt: null,
              ...(contains ? { OR: [{ name: contains }, { model: contains }] } : {}),
            },
            include: {
              provider: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 60,
          }),
        ]);

        return [
          ...providers.map((item) => ({
            id: item.id,
            type: 'MODEL' as const,
            name: item.name,
            code: item.code,
            description: '模型供应商',
            status: item.status,
          })),
          ...configs.map((item) => ({
            id: item.id,
            type: 'MODEL' as const,
            name: item.name,
            code: item.model,
            description: item.provider?.name ?? null,
            status: item.status,
          })),
        ].slice(0, take);
      }
      case 'CONVERSATION': {
        const items = await this.prisma.conversation.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ title: contains }, { lastMessagePreview: contains }] } : {}),
          },
          include: {
            agent: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CONVERSATION',
          name: item.title,
          code: item.agent?.code ?? null,
          description: item.lastMessagePreview,
          status: item.status,
        }));
      }
      case 'AUDIT_LOG': {
        const items = await this.prisma.operationLog.findMany({
          where: {
            tenantId,
            ...(contains ? { OR: [{ module: contains }, { action: contains }, { path: contains }, { requestId: contains }] } : {}),
          },
          orderBy: {
            createdAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AUDIT_LOG',
          name: `${item.module} ${item.action}`,
          code: item.requestId,
          description: `${item.method} ${item.path}`,
          status: String(item.statusCode),
        }));
      }
    }
  }

  private async listResourcesByIds(
    tenantId: string,
    resourceType: ResourceAclResourceType,
    resourceIds: string[],
  ): Promise<ResourceAclResourceSummary[]> {
    if (resourceIds.length === 0) return [];
    const idFilter = { in: resourceIds };

    switch (resourceType) {
      case 'AGENT': {
        const items = await this.prisma.agent.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AGENT',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'AGENT_TEAM': {
        const items = await this.prisma.agentTeam.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AGENT_TEAM',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'ROLE_SCENARIO': {
        const items = await this.prisma.roleScenario.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'ROLE_SCENARIO',
          name: item.name,
          code: item.code,
          description: `${item.roleName} / ${item.departmentName}`,
          status: item.status,
        }));
      }
      case 'SOLUTION_PACKAGE': {
        const items = await this.prisma.solutionPackage.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'SOLUTION_PACKAGE',
          name: item.name,
          code: item.code,
          description: `${item.customerName} / ${item.industry ?? '未填写行业'}`,
          status: item.status,
        }));
      }
      case 'DELIVERY_REVIEW': {
        const items = await this.prisma.deliveryReview.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DELIVERY_REVIEW',
          name: item.name,
          code: item.code,
          description: `${item.customerName} / ${item.reviewStage}`,
          status: item.status,
        }));
      }
      case 'CUSTOMER_ASSESSMENT': {
        const items = await this.prisma.customerAssessment.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CUSTOMER_ASSESSMENT',
          name: item.customerName,
          code: item.industry,
          description: item.recommendedStrategy,
          status: item.status,
        }));
      }
      case 'SKILL': {
        const items = await this.prisma.skill.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'SKILL',
          name: item.name,
          code: item.code,
          description: item.description ?? item.triggerScenario,
          status: item.status,
        }));
      }
      case 'CHANNEL': {
        const items = await this.prisma.agentPublishChannel.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
          include: {
            agent: true,
          },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CHANNEL',
          name: item.name ?? `${item.agent.name} - ${item.channel}`,
          code: item.channel,
          description: item.description ?? item.agent.name,
          status: item.status,
        }));
      }
      case 'PLUGIN': {
        const items = await this.prisma.plugin.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'PLUGIN',
          name: item.name,
          code: item.code,
          description: item.description ?? item.provider,
          status: item.status,
        }));
      }
      case 'KNOWLEDGE_BASE': {
        const items = await this.prisma.knowledgeBase.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'KNOWLEDGE_BASE',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'DOCUMENT': {
        const items = await this.prisma.knowledgeDocument.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DOCUMENT',
          name: item.title,
          code: item.fileName ?? item.sourceType,
          description: item.storagePath,
          status: item.status,
        }));
      }
      case 'TOOL': {
        const items = await this.prisma.tool.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'TOOL',
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
        }));
      }
      case 'MODEL': {
        const [providers, configs] = await Promise.all([
          this.prisma.modelProvider.findMany({
            where: { tenantId, id: idFilter, deletedAt: null },
          }),
          this.prisma.modelConfig.findMany({
            where: { tenantId, id: idFilter, deletedAt: null },
            include: {
              provider: true,
            },
          }),
        ]);

        return [
          ...providers.map((item) => ({
            id: item.id,
            type: 'MODEL' as const,
            name: item.name,
            code: item.code,
            description: '模型供应商',
            status: item.status,
          })),
          ...configs.map((item) => ({
            id: item.id,
            type: 'MODEL' as const,
            name: item.name,
            code: item.model,
            description: item.provider?.name ?? null,
            status: item.status,
          })),
        ];
      }
      case 'CONVERSATION': {
        const items = await this.prisma.conversation.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
          include: {
            agent: true,
          },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'CONVERSATION',
          name: item.title,
          code: item.agent?.code ?? null,
          description: item.lastMessagePreview,
          status: item.status,
        }));
      }
      case 'AUDIT_LOG': {
        const items = await this.prisma.operationLog.findMany({
          where: { tenantId, id: idFilter },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'AUDIT_LOG',
          name: `${item.module} ${item.action}`,
          code: item.requestId,
          description: `${item.method} ${item.path}`,
          status: String(item.statusCode),
        }));
      }
    }
  }

  private async getSubject(
    tenantId: string,
    subjectType: ResourceAclSubjectType,
    subjectId: string,
  ): Promise<ResourceAclSubjectSummary | null> {
    const subjects = await this.listSubjectsByIds(tenantId, subjectType, [subjectId]);
    return subjects[0] ?? null;
  }

  private async listSubjects(
    tenantId: string,
    subjectType: ResourceAclSubjectType,
    keyword?: string,
  ): Promise<ResourceAclSubjectSummary[]> {
    const contains = containsFilter(keyword);
    const take = 100;

    switch (subjectType) {
      case 'USER': {
        const items = await this.prisma.user.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { email: contains }] } : {}),
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'USER',
          name: item.name,
          code: item.email,
          description: item.status,
        }));
      }
      case 'ROLE': {
        const items = await this.prisma.role.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: [
            {
              isSystem: 'desc',
            },
            {
              createdAt: 'asc',
            },
          ],
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'ROLE',
          name: item.name,
          code: item.code,
          description: item.description,
        }));
      }
      case 'DEPARTMENT': {
        const items = await this.prisma.department.findMany({
          where: {
            tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }, { description: contains }] } : {}),
          },
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
          take,
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DEPARTMENT',
          name: item.name,
          code: item.code,
          description: item.description,
        }));
      }
      case 'TENANT': {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            id: tenantId,
            deletedAt: null,
            ...(contains ? { OR: [{ name: contains }, { code: contains }] } : {}),
          },
        });
        return tenant
          ? [
              {
                id: tenant.id,
                type: 'TENANT',
                name: tenant.name,
                code: tenant.code,
                description: tenant.status,
              },
            ]
          : [];
      }
    }
  }

  private async listSubjectsByIds(
    tenantId: string,
    subjectType: ResourceAclSubjectType,
    subjectIds: string[],
  ): Promise<ResourceAclSubjectSummary[]> {
    if (subjectIds.length === 0) return [];
    const idFilter = { in: subjectIds };

    switch (subjectType) {
      case 'USER': {
        const items = await this.prisma.user.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'USER',
          name: item.name,
          code: item.email,
          description: item.status,
        }));
      }
      case 'ROLE': {
        const items = await this.prisma.role.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'ROLE',
          name: item.name,
          code: item.code,
          description: item.description,
        }));
      }
      case 'DEPARTMENT': {
        const items = await this.prisma.department.findMany({
          where: { tenantId, id: idFilter, deletedAt: null },
        });
        return items.map((item) => ({
          id: item.id,
          type: 'DEPARTMENT',
          name: item.name,
          code: item.code,
          description: item.description,
        }));
      }
      case 'TENANT': {
        const items = await this.prisma.tenant.findMany({
          where: { id: idFilter, deletedAt: null },
        });
        return items
          .filter((item) => item.id === tenantId)
          .map((item) => ({
            id: item.id,
            type: 'TENANT',
            name: item.name,
            code: item.code,
            description: item.status,
          }));
      }
    }
  }
}

function normalizeResourceType(value: string): ResourceAclResourceType {
  if (!RESOURCE_ACL_RESOURCE_TYPES.includes(value as ResourceAclResourceType)) {
    throw new BadRequestException('Invalid resource_type');
  }

  return value as ResourceAclResourceType;
}

function normalizeSubjectType(value: string): ResourceAclSubjectType {
  if (!RESOURCE_ACL_SUBJECT_TYPES.includes(value as ResourceAclSubjectType)) {
    throw new BadRequestException('Invalid subject_type');
  }

  return value as ResourceAclSubjectType;
}

function normalizeEffect(value: string): ResourceAclEffect {
  if (value !== 'ALLOW' && value !== 'DENY') {
    throw new BadRequestException('Invalid effect');
  }

  return value;
}

function normalizeStatus(value: string): ResourceAclStatus {
  if (value !== 'ACTIVE' && value !== 'DISABLED' && value !== 'DELETED') {
    throw new BadRequestException('Invalid status');
  }

  return value;
}

function normalizePermissionCode(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new BadRequestException('permission_code is required');
  }

  return normalized;
}

function validatePermissionForResource(resourceType: ResourceAclResourceType, permissionCode: string) {
  const definition = RESOURCE_ACL_RESOURCE_DEFINITIONS.find((item) => item.resource_type === resourceType);
  if (!definition) {
    throw new BadRequestException('Invalid resource_type');
  }

  if (!definition.permission_codes.includes(permissionCode)) {
    throw new BadRequestException('permission_code is not supported by resource_type');
  }
}

function containsFilter(keyword: string | undefined) {
  const trimmed = keyword?.trim();
  if (!trimmed) return undefined;

  return {
    contains: trimmed,
    mode: 'insensitive' as const,
  };
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) return Prisma.JsonNull;
  if (!isPlainObject(value)) {
    throw new BadRequestException('conditions must be a JSON object');
  }

  return value as Prisma.InputJsonValue;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function countConditions(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all)) return record.all.length;
  if (Array.isArray(record.any)) return record.any.length;
  if (Array.isArray(record.conditions)) return record.conditions.length;

  return Object.keys(record).length;
}

function normalizeJsonObjectOutput(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function resourceMapKey(resourceType: string, resourceId: string) {
  return `${resourceType}:${resourceId}`;
}

function subjectMapKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
}

function missingResource(acl: ResourceAclRecord): ResourceAclResourceSummary {
  return {
    id: acl.resourceId,
    type: normalizeResourceType(acl.resourceType),
    name: '资源已删除或不可见',
    code: null,
    description: null,
    status: 'MISSING',
  };
}

function missingSubject(acl: ResourceAclRecord): ResourceAclSubjectSummary {
  return {
    id: acl.subjectId,
    type: normalizeSubjectType(acl.subjectType),
    name: '主体已删除或不可见',
    code: null,
    description: null,
  };
}

function groupIdsByType<T>(items: T[], getType: (item: T) => string, getId: (item: T) => string) {
  const output = new Map<string, string[]>();
  for (const item of items) {
    const type = getType(item);
    const ids = output.get(type) ?? [];
    ids.push(getId(item));
    output.set(type, Array.from(new Set(ids)));
  }

  return output;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const output = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, (output.get(key) ?? 0) + 1);
  }

  return Array.from(output.entries());
}
