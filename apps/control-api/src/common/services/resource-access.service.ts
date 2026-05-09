import { Inject, Injectable } from '@nestjs/common';

import type { DataScopeResourceType } from '@aiaget/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../types/request-context';

export interface ResourceAccessInfo {
  resourceId: string;
  resourceType: DataScopeResourceType;
  userIds: string[];
  departmentIds: string[];
}

@Injectable()
export class ResourceAccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async resolveCanonicalResourceId(
    tenantId: string,
    resourceType: DataScopeResourceType,
    resourceId: string,
  ): Promise<string | null> {
    if (resourceType !== 'AGENT_TEAM') {
      return resourceId;
    }

    const team = await this.prisma.agentTeam.findFirst({
      where: {
        tenantId,
        id: resourceId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    if (team) return team.id;

    const run = await this.prisma.agentTeamRun.findFirst({
      where: {
        tenantId,
        id: resourceId,
        deletedAt: null,
        team: {
          deletedAt: null,
        },
      },
      select: {
        teamId: true,
      },
    });

    return run?.teamId ?? null;
  }

  async getResourceAccessInfo(
    tenantId: string,
    resourceType: DataScopeResourceType,
    resourceId: string,
  ): Promise<ResourceAccessInfo | null> {
    const canonicalResourceId = await this.resolveCanonicalResourceId(tenantId, resourceType, resourceId);
    if (!canonicalResourceId) return null;

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
            id: canonicalResourceId,
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
      case 'AGENT_TEAM': {
        const team = await this.prisma.agentTeam.findFirst({
          where: {
            tenantId,
            id: canonicalResourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!team) return null;
        await addUsers([team.ownerId, team.createdBy, team.updatedBy]);
        break;
      }
      case 'CUSTOMER_ASSESSMENT': {
        const assessment = await this.prisma.customerAssessment.findFirst({
          where: {
            tenantId,
            id: canonicalResourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!assessment) return null;
        await addUsers([assessment.ownerId, assessment.createdBy, assessment.updatedBy]);
        break;
      }
      case 'CHANNEL': {
        const channel = await this.prisma.agentPublishChannel.findFirst({
          where: {
            tenantId,
            id: canonicalResourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            createdBy: true,
            updatedBy: true,
            agent: {
              select: {
                ownerId: true,
                createdBy: true,
                updatedBy: true,
              },
            },
          },
        });
        if (!channel) return null;
        await addUsers([
          channel.createdBy,
          channel.updatedBy,
          channel.agent.ownerId,
          channel.agent.createdBy,
          channel.agent.updatedBy,
        ]);
        break;
      }
      case 'PLUGIN': {
        const plugin = await this.prisma.plugin.findFirst({
          where: {
            tenantId,
            id: canonicalResourceId,
            deletedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdBy: true,
            updatedBy: true,
          },
        });
        if (!plugin) return null;
        await addUsers([plugin.ownerId, plugin.createdBy, plugin.updatedBy]);
        break;
      }
      case 'KNOWLEDGE_BASE': {
        const base = await this.prisma.knowledgeBase.findFirst({
          where: {
            tenantId,
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
            id: canonicalResourceId,
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
      resourceId: canonicalResourceId,
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

  async buildResourceAclSubjectKeys(user: Pick<AuthenticatedUser, 'id' | 'tenantId' | 'departmentId' | 'roleIds'>) {
    const output = new Set<string>();
    output.add(resourceAclSubjectKey('USER', user.id));
    output.add(resourceAclSubjectKey('TENANT', user.tenantId));

    for (const roleId of user.roleIds ?? []) {
      output.add(resourceAclSubjectKey('ROLE', roleId));
    }

    if (user.departmentId) {
      const departmentIds = await this.getDepartmentLineageIds(user.tenantId, user.departmentId);
      for (const departmentId of departmentIds) {
        output.add(resourceAclSubjectKey('DEPARTMENT', departmentId));
      }
    }

    return output;
  }

  private async getDepartmentLineageIds(tenantId: string, departmentId: string) {
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
    const byId = new Map(departments.map((department) => [department.id, department]));
    const output: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = departmentId;

    while (currentId && !visited.has(currentId)) {
      output.push(currentId);
      visited.add(currentId);
      currentId = byId.get(currentId)?.parentId ?? null;
    }

    return output;
  }
}

function resourceAclSubjectKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
}
