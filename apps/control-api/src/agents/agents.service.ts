import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AgentAuditLogItem,
  AgentCategoryItem,
  AgentDetail,
  AgentListItem,
  AgentVersionItem,
  PaginatedResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAgentDto } from './dto/create-agent.dto';
import type { CreateAgentVersionDto } from './dto/create-agent-version.dto';
import type { ListAgentsDto } from './dto/list-agents.dto';
import type { RollbackAgentDto } from './dto/rollback-agent.dto';
import type { UpdateAgentDto } from './dto/update-agent.dto';

type AgentWithRelations = Prisma.AgentGetPayload<{
  include: typeof agentInclude;
}>;

const agentInclude = {
  category: true,
  owner: true,
  modelBindings: {
    where: {
      deletedAt: null,
    },
  },
  promptBindings: {
    where: {
      deletedAt: null,
    },
  },
  knowledgeBindings: {
    where: {
      deletedAt: null,
    },
  },
  toolBindings: {
    where: {
      deletedAt: null,
    },
  },
  versions: {
    where: {
      deletedAt: null,
    },
    include: {
      creator: true,
    },
    orderBy: {
      version: 'desc',
    },
  },
  auditLogs: {
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.AgentInclude;

@Injectable()
export class AgentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories(currentUser: AuthenticatedUser): Promise<AgentCategoryItem[]> {
    const categories = await this.prisma.agentCategory.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      tenant_id: category.tenantId,
      name: category.name,
      code: category.code,
      description: category.description,
    }));
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListAgentsDto,
  ): Promise<PaginatedResult<AgentListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.AgentWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category_id) {
      where.categoryId = query.category_id;
    }

    if (query.owner_id) {
      where.ownerId = query.owner_id;
    }

    if (keyword) {
      where.OR = [
        {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          owner: true,
          modelBindings: {
            where: {
              deletedAt: null,
              bindingType: 'DEFAULT',
            },
            take: 1,
          },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      items: items.map((agent) => this.mapAgentListItem(agent)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateAgentDto): Promise<AgentDetail> {
    await this.validateCategory(currentUser.tenantId, dto.category_id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    try {
      const agent = await this.prisma.agent.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          description: dto.description?.trim() || null,
          avatarUrl: dto.avatar_url?.trim() || null,
          categoryId: dto.category_id || null,
          ownerId: dto.owner_id || currentUser.id,
          temperature: dto.temperature ?? 0.7,
          maxContextTokens: dto.max_context_tokens ?? 4096,
          enableStream: dto.enable_stream ?? true,
          enableLog: dto.enable_log ?? true,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: agentInclude,
      });

      await this.writeAudit(currentUser, agent.id, 'CREATE', `Created agent ${agent.name}`);

      return this.get(currentUser, agent.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('An agent with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<AgentDetail> {
    const agent = await this.findAgent(currentUser.tenantId, id);

    return this.mapAgentDetail(agent);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateAgentDto): Promise<AgentDetail> {
    await this.ensureAgentExists(currentUser.tenantId, id);
    await this.validateCategory(currentUser.tenantId, dto.category_id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    const data: Prisma.AgentUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.avatar_url !== undefined) data.avatarUrl = dto.avatar_url?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.temperature !== undefined) data.temperature = dto.temperature;
    if (dto.max_context_tokens !== undefined) data.maxContextTokens = dto.max_context_tokens;
    if (dto.enable_stream !== undefined) data.enableStream = dto.enable_stream;
    if (dto.enable_log !== undefined) data.enableLog = dto.enable_log;
    if (dto.category_id !== undefined) {
      data.category = dto.category_id ? { connect: { id: dto.category_id } } : { disconnect: true };
    }
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }

    const agent = await this.prisma.agent.update({
      where: {
        id,
      },
      data,
      include: agentInclude,
    });

    await this.writeAudit(currentUser, agent.id, 'UPDATE', `Updated agent ${agent.name}`);

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    const agent = await this.ensureAgentExists(currentUser.tenantId, id);

    await this.prisma.agent.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });
    await this.writeAudit(currentUser, id, 'DELETE', `Soft deleted agent ${agent.name}`);

    return {
      success: true,
    };
  }

  async createVersion(
    currentUser: AuthenticatedUser,
    id: string,
    dto: CreateAgentVersionDto,
  ): Promise<AgentDetail> {
    const agent = await this.findAgent(currentUser.tenantId, id);
    const nextVersion = (await this.prisma.agentVersion.count({
      where: {
        tenantId: currentUser.tenantId,
        agentId: id,
      },
    })) + 1;

    await this.prisma.agentVersion.create({
      data: {
        tenantId: currentUser.tenantId,
        agentId: id,
        version: nextVersion,
        status: 'DRAFT',
        snapshot: this.createSnapshot(agent),
        changeNote: dto.change_note,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });
    await this.prisma.agent.update({
      where: {
        id,
      },
      data: {
        version: nextVersion,
        updatedBy: currentUser.id,
      },
    });
    await this.writeAudit(currentUser, id, 'CREATE_VERSION', `Created version v${nextVersion}`);

    return this.get(currentUser, id);
  }

  async publish(currentUser: AuthenticatedUser, id: string): Promise<AgentDetail> {
    const latestVersion = await this.prisma.agentVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        agentId: id,
        deletedAt: null,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!latestVersion) {
      throw new BadRequestException('Create a version before publishing the agent');
    }

    await this.prisma.$transaction([
      this.prisma.agentVersion.update({
        where: {
          id: latestVersion.id,
        },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.agent.update({
        where: {
          id,
        },
        data: {
          status: 'PUBLISHED',
          version: latestVersion.version,
          updatedBy: currentUser.id,
        },
      }),
    ]);
    await this.writeAudit(currentUser, id, 'PUBLISH', `Published version v${latestVersion.version}`);

    return this.get(currentUser, id);
  }

  async rollback(
    currentUser: AuthenticatedUser,
    id: string,
    dto: RollbackAgentDto,
  ): Promise<AgentDetail> {
    const targetVersion = await this.prisma.agentVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        agentId: id,
        version: dto.version,
        deletedAt: null,
      },
    });

    if (!targetVersion) {
      throw new NotFoundException('Agent version not found');
    }

    const snapshot = targetVersion.snapshot as Record<string, unknown>;

    await this.prisma.agent.update({
      where: {
        id,
      },
      data: {
        name: String(snapshot.name),
        description: snapshot.description?.toString() ?? null,
        avatarUrl: snapshot.avatar_url?.toString() ?? null,
        categoryId: snapshot.category_id?.toString() ?? null,
        ownerId: snapshot.owner_id?.toString() ?? null,
        temperature: Number(snapshot.temperature ?? 0.7),
        maxContextTokens: Number(snapshot.max_context_tokens ?? 4096),
        enableStream: Boolean(snapshot.enable_stream ?? true),
        enableLog: Boolean(snapshot.enable_log ?? true),
        status: 'DRAFT',
        version: targetVersion.version,
        updatedBy: currentUser.id,
      },
    });
    await this.writeAudit(currentUser, id, 'ROLLBACK', `Rolled back to version v${dto.version}`);

    return this.get(currentUser, id);
  }

  async disable(currentUser: AuthenticatedUser, id: string): Promise<AgentDetail> {
    await this.ensureAgentExists(currentUser.tenantId, id);
    await this.prisma.agent.update({
      where: {
        id,
      },
      data: {
        status: 'DISABLED',
        updatedBy: currentUser.id,
      },
    });
    await this.writeAudit(currentUser, id, 'DISABLE', 'Disabled agent');

    return this.get(currentUser, id);
  }

  async archive(currentUser: AuthenticatedUser, id: string): Promise<AgentDetail> {
    await this.ensureAgentExists(currentUser.tenantId, id);
    await this.prisma.agent.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        updatedBy: currentUser.id,
      },
    });
    await this.writeAudit(currentUser, id, 'ARCHIVE', 'Archived agent');

    return this.get(currentUser, id);
  }

  private async ensureAgentExists(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  private async findAgent(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: agentInclude,
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  private async validateCategory(tenantId: string, categoryId?: string | null) {
    if (!categoryId) return;

    const category = await this.prisma.agentCategory.findFirst({
      where: {
        tenantId,
        id: categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new BadRequestException('Agent category does not exist in this tenant');
    }
  }

  private async validateOwner(tenantId: string, ownerId?: string | null) {
    if (!ownerId) return;

    const owner = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id: ownerId,
        deletedAt: null,
      },
    });

    if (!owner) {
      throw new BadRequestException('Agent owner does not exist in this tenant');
    }
  }

  private createSnapshot(agent: AgentWithRelations): Prisma.InputJsonObject {
    return {
      id: agent.id,
      name: agent.name,
      code: agent.code,
      description: agent.description,
      avatar_url: agent.avatarUrl,
      category_id: agent.categoryId,
      owner_id: agent.ownerId,
      status: agent.status,
      temperature: Number(agent.temperature),
      max_context_tokens: agent.maxContextTokens,
      enable_stream: agent.enableStream,
      enable_log: agent.enableLog,
    };
  }

  private async writeAudit(
    currentUser: AuthenticatedUser,
    agentId: string,
    action: string,
    message: string,
    metadata?: Prisma.InputJsonObject,
  ) {
    await this.prisma.agentAuditLog.create({
      data: {
        tenantId: currentUser.tenantId,
        agentId,
        action,
        message,
        metadata,
        createdBy: currentUser.id,
      },
    });
  }

  private mapAgentListItem(
    agent: Prisma.AgentGetPayload<{
      include: {
        category: true;
        owner: true;
        modelBindings: true;
      };
    }>,
  ): AgentListItem {
    return {
      id: agent.id,
      tenant_id: agent.tenantId,
      name: agent.name,
      code: agent.code,
      description: agent.description,
      avatar_url: agent.avatarUrl,
      status: agent.status as AgentListItem['status'],
      version: agent.version,
      category: agent.category ? this.mapCategory(agent.category) : null,
      owner: agent.owner ? this.mapOwner(agent.owner) : null,
      default_model: agent.modelBindings[0]?.modelId ?? null,
      created_at: agent.createdAt.toISOString(),
      updated_at: agent.updatedAt.toISOString(),
    };
  }

  private mapAgentDetail(agent: AgentWithRelations): AgentDetail {
    return {
      ...this.mapAgentListItem(agent),
      temperature: Number(agent.temperature),
      max_context_tokens: agent.maxContextTokens,
      enable_stream: agent.enableStream,
      enable_log: agent.enableLog,
      versions: agent.versions.map((version) => this.mapVersion(version)),
      audit_logs: agent.auditLogs.map((auditLog) => this.mapAudit(auditLog)),
      bindings: {
        models: agent.modelBindings,
        prompts: agent.promptBindings,
        knowledge: agent.knowledgeBindings,
        tools: agent.toolBindings,
      },
    };
  }

  private mapCategory(category: { id: string; tenantId: string; name: string; code: string; description: string | null }) {
    return {
      id: category.id,
      tenant_id: category.tenantId,
      name: category.name,
      code: category.code,
      description: category.description,
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }) {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapVersion(
    version: Prisma.AgentVersionGetPayload<{
      include: {
        creator: true;
      };
    }>,
  ): AgentVersionItem {
    return {
      id: version.id,
      version: version.version,
      status: version.status,
      change_note: version.changeNote,
      published_at: version.publishedAt?.toISOString() ?? null,
      created_at: version.createdAt.toISOString(),
      created_by: version.creator ? this.mapOwner(version.creator) : null,
    };
  }

  private mapAudit(
    auditLog: Prisma.AgentAuditLogGetPayload<{
      include: {
        operator: true;
      };
    }>,
  ): AgentAuditLogItem {
    return {
      id: auditLog.id,
      action: auditLog.action,
      message: auditLog.message,
      created_at: auditLog.createdAt.toISOString(),
      operator: auditLog.operator ? this.mapOwner(auditLog.operator) : null,
    };
  }
}

