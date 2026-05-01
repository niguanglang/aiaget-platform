import { Inject, Injectable } from '@nestjs/common';

import type { DataScopeResourceType } from '@aiaget/shared-types';

import { PrismaService } from '../../prisma/prisma.service';

export interface ResourceAccessInfo {
  resourceId: string;
  resourceType: DataScopeResourceType;
  userIds: string[];
  departmentIds: string[];
}

@Injectable()
export class ResourceAccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getResourceAccessInfo(
    tenantId: string,
    resourceType: DataScopeResourceType,
    resourceId: string,
  ): Promise<ResourceAccessInfo | null> {
    const userIds = new Set<string>();
    const departmentIds = new Set<string>();

    const addUsers = async (ids: Array<string | null | undefined>) => {
      const normalizedIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
      normalizedIds.forEach((id) => userIds.add(id));

      if (normalizedIds.length === 0) return;

      const users = await this.prisma.user.findMany({
        where: {
          tenantId,
          id: {
            in: normalizedIds,
          },
          deletedAt: null,
        },
        select: {
          departmentId: true,
        },
      });

      users.forEach((user) => {
        if (user.departmentId) departmentIds.add(user.departmentId);
      });
    };

    switch (resourceType) {
      case 'AGENT': {
        const agent = await this.prisma.agent.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!agent) return null;
        await addUsers([agent.ownerId, agent.createdBy, agent.updatedBy]);
        break;
      }
      case 'KNOWLEDGE_BASE': {
        const base = await this.prisma.knowledgeBase.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!base) return null;
        await addUsers([base.ownerId, base.createdBy, base.updatedBy]);
        break;
      }
      case 'DOCUMENT': {
        const document = await this.prisma.knowledgeDocument.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            uploadedBy: true,
            createdBy: true,
            updatedBy: true,
            knowledge: {
              select: {
                ownerId: true,
                createdBy: true,
              },
            },
          },
        });
        if (!document) return null;
        await addUsers([
          document.uploadedBy,
          document.createdBy,
          document.updatedBy,
          document.knowledge.ownerId,
          document.knowledge.createdBy,
        ]);
        break;
      }
      case 'TOOL': {
        const tool = await this.prisma.tool.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!tool) return null;
        await addUsers([tool.createdBy, tool.updatedBy]);
        break;
      }
      case 'MODEL': {
        const model = await this.prisma.modelConfig.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            createdBy: true,
            updatedBy: true,
            provider: {
              select: {
                createdBy: true,
                updatedBy: true,
              },
            },
          },
        });
        if (model) {
          await addUsers([model.createdBy, model.updatedBy, model.provider.createdBy, model.provider.updatedBy]);
          break;
        }

        const provider = await this.prisma.modelProvider.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!provider) return null;
        await addUsers([provider.createdBy, provider.updatedBy]);
        break;
      }
      case 'CONVERSATION': {
        const conversation = await this.prisma.conversation.findFirst({
          where: {
            tenantId,
            id: resourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            userId: true,
            createdBy: true,
            updatedBy: true,
            agent: {
              select: {
                ownerId: true,
                createdBy: true,
              },
            },
          },
        });
        if (!conversation) return null;
        await addUsers([
          conversation.userId,
          conversation.createdBy,
          conversation.updatedBy,
          conversation.agent.ownerId,
          conversation.agent.createdBy,
        ]);
        break;
      }
      case 'AUDIT_LOG': {
        const log = await this.prisma.operationLog.findFirst({
          where: {
            tenantId,
            id: resourceId,
          },
          select: {
            id: true,
            userId: true,
          },
        });
        if (!log) return null;
        await addUsers([log.userId]);
        break;
      }
    }

    return {
      resourceId,
      resourceType,
      userIds: Array.from(userIds),
      departmentIds: Array.from(departmentIds),
    };
  }

  async expandDepartmentIds(tenantId: string, departmentIds: string[]) {
    if (departmentIds.length === 0) return [];

    const departments = await this.prisma.department.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        parentId: true,
      },
    });
    const childrenByParent = new Map<string, string[]>();
    for (const department of departments) {
      if (!department.parentId) continue;
      childrenByParent.set(department.parentId, [
        ...(childrenByParent.get(department.parentId) ?? []),
        department.id,
      ]);
    }

    const output = new Set<string>();
    const visit = (id: string) => {
      output.add(id);
      for (const childId of childrenByParent.get(id) ?? []) {
        visit(childId);
      }
    };
    departmentIds.forEach(visit);

    return Array.from(output);
  }
}
