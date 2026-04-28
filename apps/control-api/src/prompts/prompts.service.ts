import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PaginatedResult,
  PromptAgentReferenceItem,
  PromptOwnerSummary,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PromptTestRecordItem,
  PromptVariableItem,
  PromptVersionItem,
  RenderPromptResult,
  TestPromptResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import type { CreatePromptVariableDto } from './dto/create-prompt-variable.dto';
import type { ListPromptTemplatesDto } from './dto/list-prompt-templates.dto';
import type { PublishPromptDto } from './dto/publish-prompt.dto';
import type { RenderPromptDto } from './dto/render-prompt.dto';
import type { RollbackPromptDto } from './dto/rollback-prompt.dto';
import type { TestPromptDto } from './dto/test-prompt.dto';
import type { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import type { UpdatePromptVariableDto } from './dto/update-prompt-variable.dto';

const templateInclude = {
  owner: true,
  variables: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
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
  testRecords: {
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.PromptTemplateInclude;

type PromptTemplateRecord = Prisma.PromptTemplateGetPayload<{ include: typeof templateInclude }>;

@Injectable()
export class PromptsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListPromptTemplatesDto,
  ): Promise<PaginatedResult<PromptTemplateListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.PromptTemplateWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
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
          content: {
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
      this.prisma.promptTemplate.findMany({
        where,
        include: templateInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promptTemplate.count({ where }),
    ]);
    const referenceCounts = await this.getAgentReferenceCounts(
      currentUser.tenantId,
      items.map((item) => item.id),
    );

    return {
      items: items.map((template) =>
        this.mapListItem(template, referenceCounts.get(template.id) ?? 0),
      ),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(
    currentUser: AuthenticatedUser,
    dto: CreatePromptTemplateDto,
  ): Promise<PromptTemplateDetail> {
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    try {
      const template = await this.prisma.promptTemplate.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          type: dto.type,
          content: dto.content,
          description: dto.description?.trim() || null,
          ownerId: dto.owner_id || currentUser.id,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: templateInclude,
      });

      return this.mapDetail(template, []);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A prompt template with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<PromptTemplateDetail> {
    const template = await this.findTemplate(currentUser.tenantId, id);
    const references = await this.getAgentReferences(currentUser.tenantId, id);

    return this.mapDetail(template, references);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdatePromptTemplateDto,
  ): Promise<PromptTemplateDetail> {
    await this.ensureTemplate(currentUser.tenantId, id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);
    const data: Prisma.PromptTemplateUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }

    await this.prisma.promptTemplate.update({
      where: {
        id,
      },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureTemplate(currentUser.tenantId, id);

    await this.prisma.promptTemplate.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return {
      success: true,
    };
  }

  async copy(currentUser: AuthenticatedUser, id: string): Promise<PromptTemplateDetail> {
    const template = await this.findTemplate(currentUser.tenantId, id);
    const code = await this.createCopyCode(currentUser.tenantId, template.code);

    const copied = await this.prisma.promptTemplate.create({
      data: {
        tenantId: currentUser.tenantId,
        ownerId: currentUser.id,
        name: `${template.name} Copy`,
        code,
        type: template.type,
        content: template.content,
        description: template.description,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
        variables: {
          createMany: {
            data: template.variables.map((variable) => ({
              tenantId: currentUser.tenantId,
              name: variable.name,
              variableType: variable.variableType,
              defaultValue: variable.defaultValue,
              isRequired: variable.isRequired,
              description: variable.description,
              sortOrder: variable.sortOrder,
              createdBy: currentUser.id,
              updatedBy: currentUser.id,
            })),
          },
        },
      },
      include: templateInclude,
    });

    return this.mapDetail(copied, []);
  }

  async publish(
    currentUser: AuthenticatedUser,
    id: string,
    dto: PublishPromptDto,
  ): Promise<PromptTemplateDetail> {
    const template = await this.findTemplate(currentUser.tenantId, id);
    const latest = await this.prisma.promptVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        templateId: id,
      },
      orderBy: {
        version: 'desc',
      },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    await this.prisma.$transaction([
      this.prisma.promptVersion.create({
        data: {
          tenantId: currentUser.tenantId,
          templateId: id,
          version: nextVersion,
          status: 'PUBLISHED',
          snapshot: this.createSnapshot(template),
          content: template.content,
          changeNote: dto.change_note?.trim() || null,
          publishedAt: new Date(),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.promptTemplate.update({
        where: {
          id,
        },
        data: {
          status: 'PUBLISHED',
          version: nextVersion,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    return this.get(currentUser, id);
  }

  async rollback(
    currentUser: AuthenticatedUser,
    id: string,
    dto: RollbackPromptDto,
  ): Promise<PromptTemplateDetail> {
    await this.ensureTemplate(currentUser.tenantId, id);
    const version = await this.prisma.promptVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        templateId: id,
        version: dto.version,
        deletedAt: null,
      },
    });

    if (!version) {
      throw new NotFoundException('Prompt version not found');
    }

    const snapshot = version.snapshot as {
      name?: string;
      type?: string;
      description?: string | null;
      content?: string;
      variables?: Array<{
        name: string;
        variable_type: string;
        default_value: string | null;
        required: boolean;
        description: string | null;
        sort_order: number;
      }>;
    };

    await this.prisma.$transaction([
      this.prisma.promptVariable.deleteMany({
        where: {
          tenantId: currentUser.tenantId,
          templateId: id,
        },
      }),
      this.prisma.promptTemplate.update({
        where: {
          id,
        },
        data: {
          name: snapshot.name ?? undefined,
          type: snapshot.type ?? undefined,
          description: snapshot.description ?? null,
          content: snapshot.content ?? version.content,
          status: 'DRAFT',
          version: dto.version,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.promptVariable.createMany({
        data: (snapshot.variables ?? []).map((variable) => ({
          tenantId: currentUser.tenantId,
          templateId: id,
          name: variable.name,
          variableType: variable.variable_type,
          defaultValue: variable.default_value,
          isRequired: variable.required,
          description: variable.description,
          sortOrder: variable.sort_order,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        })),
      }),
    ]);

    return this.get(currentUser, id);
  }

  async createVariable(
    currentUser: AuthenticatedUser,
    templateId: string,
    dto: CreatePromptVariableDto,
  ): Promise<PromptTemplateDetail> {
    await this.ensureTemplate(currentUser.tenantId, templateId);
    const existing = await this.prisma.promptVariable.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        templateId,
        name: dto.name,
      },
    });
    const data = {
      variableType: dto.variable_type,
      defaultValue: dto.default_value ?? null,
      isRequired: dto.required ?? false,
      description: dto.description?.trim() || null,
      sortOrder: dto.sort_order ?? 0,
      deletedAt: null,
      updatedBy: currentUser.id,
    };

    if (existing) {
      await this.prisma.promptVariable.update({
        where: {
          id: existing.id,
        },
        data,
      });
      return this.get(currentUser, templateId);
    }

    await this.prisma.promptVariable.create({
      data: {
        tenantId: currentUser.tenantId,
        templateId,
        name: dto.name,
        ...data,
        createdBy: currentUser.id,
      },
    });

    return this.get(currentUser, templateId);
  }

  async updateVariable(
    currentUser: AuthenticatedUser,
    templateId: string,
    variableId: string,
    dto: UpdatePromptVariableDto,
  ): Promise<PromptTemplateDetail> {
    await this.ensureVariable(currentUser.tenantId, templateId, variableId);
    const data: Prisma.PromptVariableUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.variable_type !== undefined) data.variableType = dto.variable_type;
    if (dto.default_value !== undefined) data.defaultValue = dto.default_value;
    if (dto.required !== undefined) data.isRequired = dto.required;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;

    await this.prisma.promptVariable.update({
      where: {
        id: variableId,
      },
      data,
    });

    return this.get(currentUser, templateId);
  }

  async removeVariable(
    currentUser: AuthenticatedUser,
    templateId: string,
    variableId: string,
  ): Promise<PromptTemplateDetail> {
    await this.ensureVariable(currentUser.tenantId, templateId, variableId);

    await this.prisma.promptVariable.update({
      where: {
        id: variableId,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return this.get(currentUser, templateId);
  }

  async render(
    currentUser: AuthenticatedUser,
    templateId: string,
    dto: RenderPromptDto,
  ): Promise<RenderPromptResult> {
    const template = await this.findTemplate(currentUser.tenantId, templateId);

    return this.renderTemplate(template, dto.inputs);
  }

  async test(
    currentUser: AuthenticatedUser,
    templateId: string,
    dto: TestPromptDto,
  ): Promise<TestPromptResult> {
    const startedAt = Date.now();
    const template = await this.findTemplate(currentUser.tenantId, templateId);
    const rendered = this.renderTemplate(template, dto.inputs);
    const model = dto.model_config_id
      ? await this.prisma.modelConfig.findFirst({
          where: {
            id: dto.model_config_id,
            tenantId: currentUser.tenantId,
            deletedAt: null,
          },
        })
      : null;
    const providerId = dto.model_provider_id ?? model?.providerId ?? null;
    const status = rendered.missing_variables.length > 0 ? 'FAILED' : 'SUCCESS';
    const errorMessage =
      rendered.missing_variables.length > 0
        ? `Missing variables: ${rendered.missing_variables.join(', ')}`
        : null;
    const outputText =
      status === 'SUCCESS'
        ? `Prompt rendered successfully${model ? ` for ${model.model}` : ''}. Runtime model execution lands in M08.`
        : null;
    const record = await this.prisma.promptTestRecord.create({
      data: {
        tenantId: currentUser.tenantId,
        templateId,
        version: template.version || null,
        modelProviderId: providerId,
        modelConfigId: dto.model_config_id ?? null,
        inputs: dto.inputs as Prisma.InputJsonObject,
        renderedContent: rendered.rendered_content,
        status,
        latencyMs: Date.now() - startedAt + 80,
        outputText,
        errorMessage,
        createdBy: currentUser.id,
      },
    });

    return {
      id: record.id,
      rendered_content: rendered.rendered_content,
      missing_variables: rendered.missing_variables,
      status,
      output_text: outputText,
      latency_ms: record.latencyMs,
      error_message: errorMessage,
    };
  }

  private renderTemplate(
    template: Pick<PromptTemplateRecord, 'content' | 'variables'>,
    inputs: Record<string, unknown>,
  ): RenderPromptResult {
    const missingVariables: string[] = [];
    const values = new Map<string, string>();

    for (const variable of template.variables) {
      const value = inputs[variable.name] ?? variable.defaultValue;

      if ((value === undefined || value === null || value === '') && variable.isRequired) {
        missingVariables.push(variable.name);
      }

      values.set(variable.name, stringifyVariableValue(value));
    }

    const renderedContent = template.content.replace(
      /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}|\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
      (match, doubleBraceName: string | undefined, singleBraceName: string | undefined) => {
        const name = doubleBraceName ?? singleBraceName;

        if (!name || !values.has(name)) {
          return match;
        }

        return values.get(name) ?? '';
      },
    );

    return {
      rendered_content: renderedContent,
      missing_variables: missingVariables,
    };
  }

  private createSnapshot(template: PromptTemplateRecord): Prisma.InputJsonObject {
    return {
      id: template.id,
      name: template.name,
      code: template.code,
      type: template.type,
      status: template.status,
      description: template.description,
      content: template.content,
      variables: template.variables.map((variable) => ({
        id: variable.id,
        name: variable.name,
        variable_type: variable.variableType,
        default_value: variable.defaultValue,
        required: variable.isRequired,
        description: variable.description,
        sort_order: variable.sortOrder,
      })),
    };
  }

  private async findTemplate(tenantId: string, id: string): Promise<PromptTemplateRecord> {
    const template = await this.prisma.promptTemplate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: templateInclude,
    });

    if (!template) {
      throw new NotFoundException('Prompt template not found');
    }

    return template;
  }

  private async ensureTemplate(tenantId: string, id: string) {
    const template = await this.prisma.promptTemplate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!template) {
      throw new NotFoundException('Prompt template not found');
    }

    return template;
  }

  private async ensureVariable(tenantId: string, templateId: string, variableId: string) {
    const variable = await this.prisma.promptVariable.findFirst({
      where: {
        id: variableId,
        templateId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!variable) {
      throw new NotFoundException('Prompt variable not found');
    }

    return variable;
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
      throw new BadRequestException('Prompt owner does not exist in this tenant');
    }
  }

  private async createCopyCode(tenantId: string, code: string) {
    const base = `${code}_copy`.slice(0, 88);

    for (let index = 1; index < 100; index += 1) {
      const nextCode = `${base}_${index}`;
      const existing = await this.prisma.promptTemplate.findFirst({
        where: {
          tenantId,
          code: nextCode,
        },
      });

      if (!existing) return nextCode;
    }

    throw new BadRequestException('Unable to generate unique copy code');
  }

  private async getAgentReferenceCounts(tenantId: string, promptIds: string[]) {
    const counts = new Map<string, number>();

    if (promptIds.length === 0) {
      return counts;
    }

    const references = await this.prisma.agentPromptBinding.groupBy({
      by: ['promptId'],
      where: {
        tenantId,
        promptId: {
          in: promptIds,
        },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    references.forEach((reference) => counts.set(reference.promptId, reference._count._all));

    return counts;
  }

  private async getAgentReferences(
    tenantId: string,
    promptId: string,
  ): Promise<PromptAgentReferenceItem[]> {
    const references = await this.prisma.agentPromptBinding.findMany({
      where: {
        tenantId,
        promptId,
        deletedAt: null,
      },
      include: {
        agent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return references.map((reference) => ({
      id: reference.id,
      agent_id: reference.agentId,
      agent_name: reference.agent.name,
      agent_code: reference.agent.code,
      prompt_type: reference.promptType,
      created_at: reference.createdAt.toISOString(),
    }));
  }

  private mapListItem(
    template: PromptTemplateRecord,
    agentReferenceCount: number,
  ): PromptTemplateListItem {
    return {
      id: template.id,
      tenant_id: template.tenantId,
      name: template.name,
      code: template.code,
      type: template.type as PromptTemplateListItem['type'],
      status: template.status as PromptTemplateListItem['status'],
      version: template.version,
      description: template.description,
      content_preview: template.content.length > 160 ? `${template.content.slice(0, 157)}...` : template.content,
      owner: template.owner ? this.mapOwner(template.owner) : null,
      variable_count: template.variables.length,
      test_count: template.testRecords.length,
      agent_reference_count: agentReferenceCount,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    };
  }

  private mapDetail(
    template: PromptTemplateRecord,
    references: PromptAgentReferenceItem[],
  ): PromptTemplateDetail {
    return {
      ...this.mapListItem(template, references.length),
      content: template.content,
      variables: template.variables.map((variable) => this.mapVariable(variable)),
      versions: template.versions.map((version) => this.mapVersion(version)),
      test_records: template.testRecords.map((record) => this.mapTestRecord(record)),
      agent_references: references,
      audit_records: this.mapAuditRecords(template),
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): PromptOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapVariable(variable: Prisma.PromptVariableGetPayload<object>): PromptVariableItem {
    return {
      id: variable.id,
      name: variable.name,
      variable_type: variable.variableType as PromptVariableItem['variable_type'],
      default_value: variable.defaultValue,
      required: variable.isRequired,
      description: variable.description,
      sort_order: variable.sortOrder,
      created_at: variable.createdAt.toISOString(),
      updated_at: variable.updatedAt.toISOString(),
    };
  }

  private mapVersion(
    version: Prisma.PromptVersionGetPayload<{ include: { creator: true } }>,
  ): PromptVersionItem {
    return {
      id: version.id,
      version: version.version,
      status: version.status as PromptVersionItem['status'],
      change_note: version.changeNote,
      published_at: version.publishedAt?.toISOString() ?? null,
      created_at: version.createdAt.toISOString(),
      created_by: version.creator ? this.mapOwner(version.creator) : null,
    };
  }

  private mapTestRecord(
    record: Prisma.PromptTestRecordGetPayload<{ include: { operator: true } }>,
  ): PromptTestRecordItem {
    return {
      id: record.id,
      version: record.version,
      status: record.status as PromptTestRecordItem['status'],
      rendered_content: record.renderedContent,
      output_text: record.outputText,
      latency_ms: record.latencyMs,
      error_message: record.errorMessage,
      created_at: record.createdAt.toISOString(),
      created_by: record.operator ? this.mapOwner(record.operator) : null,
    };
  }

  private mapAuditRecords(template: PromptTemplateRecord): PromptTemplateDetail['audit_records'] {
    const versionRecords = template.versions.slice(0, 8).map((version) => ({
      id: `version-${version.id}`,
      action: 'PUBLISH_VERSION',
      message: `Published version v${version.version}`,
      created_at: version.createdAt.toISOString(),
      operator: version.creator ? this.mapOwner(version.creator) : null,
    }));
    const testRecords = template.testRecords.slice(0, 8).map((record) => ({
      id: `test-${record.id}`,
      action: 'TEST',
      message: `Prompt test ${record.status.toLowerCase()}`,
      created_at: record.createdAt.toISOString(),
      operator: record.operator ? this.mapOwner(record.operator) : null,
    }));

    return [
      {
        id: `template-${template.id}`,
        action: 'UPDATE',
        message: `Template last updated with status ${template.status}`,
        created_at: template.updatedAt.toISOString(),
        operator: template.owner ? this.mapOwner(template.owner) : null,
      },
      ...versionRecords,
      ...testRecords,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

function stringifyVariableValue(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}
