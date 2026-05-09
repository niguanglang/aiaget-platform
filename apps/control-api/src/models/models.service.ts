import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ModelApiKeyItem,
  ModelCallLogItem,
  ModelConfigItem,
  ModelCostRuleItem,
  ModelProviderDetail,
  ModelProviderListItem,
  PaginatedResult,
  TestModelProviderResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateModelApiKeyDto } from './dto/create-model-api-key.dto';
import type { CreateModelConfigDto } from './dto/create-model-config.dto';
import type { CreateModelProviderDto } from './dto/create-model-provider.dto';
import type { ListModelProvidersDto } from './dto/list-model-providers.dto';
import type { TestModelProviderDto } from './dto/test-model-provider.dto';
import type { UpdateModelConfigDto } from './dto/update-model-config.dto';
import type { UpdateModelProviderDto } from './dto/update-model-provider.dto';
import { decryptSecret, encryptSecret, getKeyPrefix, hashSecret, maskApiKey } from './model-secrets';
import { executeOpenAiCompatibleChat } from './openai-compatible-client';

const providerListInclude = {
  models: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  },
  apiKeys: {
    where: {
      deletedAt: null,
    },
  },
  callLogs: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} satisfies Prisma.ModelProviderInclude;

const providerDetailInclude = {
  models: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  },
  apiKeys: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
  costRules: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      effectiveFrom: 'desc',
    },
  },
  callLogs: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.ModelProviderInclude;

type ProviderListRecord = Prisma.ModelProviderGetPayload<{ include: typeof providerListInclude }>;
type ProviderDetailRecord = Prisma.ModelProviderGetPayload<{ include: typeof providerDetailInclude }>;

@Injectable()
export class ModelsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
  ) {}

  async listProviders(
    currentUser: AuthenticatedUser,
    query: ListModelProvidersDto,
  ): Promise<PaginatedResult<ModelProviderListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.ModelProviderWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') {
      where.status = query.status;
    }

    if (query.provider_type) {
      where.providerType = query.provider_type;
    }

    if (query.capability) {
      where.models = {
        some: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          capabilities: {
            has: query.capability,
          },
        },
      };
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
          baseUrl: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          models: {
            some: {
              OR: [
                {
                  name: {
                    contains: keyword,
                    mode: 'insensitive',
                  },
                },
                {
                  model: {
                    contains: keyword,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.ModelProviderWhereInput>(currentUser, 'MODEL');
    mergeDataScopeWhere(where, dataScope.where);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.modelProvider.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: providerListInclude,
      }),
      this.prisma.modelProvider.count({ where }),
    ]);

    return {
      items: items.map((provider) => this.mapProviderListItem(provider)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async createProvider(
    currentUser: AuthenticatedUser,
    dto: CreateModelProviderDto,
  ): Promise<ModelProviderDetail> {
    try {
      if (dto.is_default) {
        await this.clearDefaultProviders(currentUser.tenantId);
      }

      const provider = await this.prisma.modelProvider.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          providerType: dto.provider_type,
          baseUrl: dto.base_url.trim(),
          description: dto.description?.trim() || null,
          isDefault: dto.is_default ?? false,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: providerDetailInclude,
      });

      return this.mapProviderDetail(provider);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A model provider with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async getProvider(currentUser: AuthenticatedUser, id: string): Promise<ModelProviderDetail> {
    const provider = await this.findProvider(currentUser.tenantId, id);

    return this.mapProviderDetail(provider);
  }

  async updateProvider(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateModelProviderDto,
  ): Promise<ModelProviderDetail> {
    await this.ensureProvider(currentUser.tenantId, id);

    if (dto.is_default) {
      await this.clearDefaultProviders(currentUser.tenantId, id);
    }

    const data: Prisma.ModelProviderUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.provider_type !== undefined) data.providerType = dto.provider_type;
    if (dto.base_url !== undefined) data.baseUrl = dto.base_url.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.is_default !== undefined) data.isDefault = dto.is_default;

    await this.prisma.modelProvider.update({
      where: {
        id,
      },
      data,
    });

    return this.getProvider(currentUser, id);
  }

  async removeProvider(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureProvider(currentUser.tenantId, id);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.modelProvider.update({
        where: {
          id,
        },
        data: {
          status: 'DELETED',
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.modelConfig.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          providerId: id,
          deletedAt: null,
        },
        data: {
          status: 'DELETED',
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.modelApiKey.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          providerId: id,
          deletedAt: null,
        },
        data: {
          status: 'DELETED',
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    return {
      success: true,
    };
  }

  async setProviderStatus(
    currentUser: AuthenticatedUser,
    id: string,
    status: 'ACTIVE' | 'DISABLED',
  ): Promise<ModelProviderDetail> {
    await this.ensureProvider(currentUser.tenantId, id);
    await this.prisma.modelProvider.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
    });

    return this.getProvider(currentUser, id);
  }

  async createModel(currentUser: AuthenticatedUser, dto: CreateModelConfigDto): Promise<ModelProviderDetail> {
    await this.ensureProvider(currentUser.tenantId, dto.provider_id);

    try {
      if (dto.is_default) {
        await this.clearDefaultModels(currentUser.tenantId, dto.provider_id);
      }

      const model = await this.prisma.modelConfig.create({
        data: {
          tenantId: currentUser.tenantId,
          providerId: dto.provider_id,
          name: dto.name.trim(),
          model: dto.model.trim(),
          capabilities: dto.capabilities,
          contextLength: dto.context_length,
          maxOutputTokens: dto.max_output_tokens ?? null,
          apiVersion: normalizeOptionalText(dto.api_version),
          inputPrice: dto.input_price ?? 0,
          outputPrice: dto.output_price ?? 0,
          rateLimitRpm: dto.rate_limit_rpm ?? null,
          status: dto.status ?? 'ACTIVE',
          isDefault: dto.is_default ?? false,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      });

      await this.upsertCostRule(currentUser, dto.provider_id, model.id, {
        inputPrice: dto.input_price ?? 0,
        outputPrice: dto.output_price ?? 0,
      });

      return this.getProvider(currentUser, dto.provider_id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This model already exists under the provider');
      }

      throw error;
    }
  }

  async updateModel(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateModelConfigDto,
  ): Promise<ModelProviderDetail> {
    const model = await this.ensureModel(currentUser.tenantId, id);

    if (dto.is_default) {
      await this.clearDefaultModels(currentUser.tenantId, model.providerId, id);
    }

    const data: Prisma.ModelConfigUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.capabilities !== undefined) data.capabilities = dto.capabilities;
    if (dto.context_length !== undefined) data.contextLength = dto.context_length;
    if (dto.max_output_tokens !== undefined) data.maxOutputTokens = dto.max_output_tokens;
    if (dto.api_version !== undefined) data.apiVersion = normalizeOptionalText(dto.api_version);
    if (dto.input_price !== undefined) data.inputPrice = dto.input_price;
    if (dto.output_price !== undefined) data.outputPrice = dto.output_price;
    if (dto.rate_limit_rpm !== undefined) data.rateLimitRpm = dto.rate_limit_rpm;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.is_default !== undefined) data.isDefault = dto.is_default;

    await this.prisma.modelConfig.update({
      where: {
        id,
      },
      data,
    });

    if (dto.input_price !== undefined || dto.output_price !== undefined) {
      await this.upsertCostRule(currentUser, model.providerId, id, {
        inputPrice: dto.input_price ?? Number(model.inputPrice),
        outputPrice: dto.output_price ?? Number(model.outputPrice),
      });
    }

    return this.getProvider(currentUser, model.providerId);
  }

  async removeModel(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureModel(currentUser.tenantId, id);

    await this.prisma.modelConfig.update({
      where: {
        id,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return {
      success: true,
    };
  }

  async setModelStatus(
    currentUser: AuthenticatedUser,
    id: string,
    status: 'ACTIVE' | 'DISABLED',
  ): Promise<ModelProviderDetail> {
    const model = await this.ensureModel(currentUser.tenantId, id);

    await this.prisma.modelConfig.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
    });

    return this.getProvider(currentUser, model.providerId);
  }

  async createApiKey(
    currentUser: AuthenticatedUser,
    providerId: string,
    dto: CreateModelApiKeyDto,
  ): Promise<ModelProviderDetail> {
    await this.ensureProvider(currentUser.tenantId, providerId);
    const trimmedKey = dto.api_key.trim();

    await this.prisma.modelApiKey.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId,
        name: dto.name.trim(),
        keyPrefix: getKeyPrefix(trimmedKey),
        maskedKey: maskApiKey(trimmedKey),
        encryptedKey: encryptSecret(trimmedKey),
        keyHash: hashSecret(trimmedKey),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });

    return this.getProvider(currentUser, providerId);
  }

  async removeApiKey(
    currentUser: AuthenticatedUser,
    providerId: string,
    keyId: string,
  ): Promise<ModelProviderDetail> {
    await this.ensureProvider(currentUser.tenantId, providerId);
    const key = await this.prisma.modelApiKey.findFirst({
      where: {
        id: keyId,
        providerId,
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
    });

    if (!key) {
      throw new NotFoundException('Model API key not found');
    }

    await this.prisma.modelApiKey.update({
      where: {
        id: keyId,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return this.getProvider(currentUser, providerId);
  }

  async testProvider(
    currentUser: AuthenticatedUser,
    providerId: string,
    dto: TestModelProviderDto,
  ): Promise<TestModelProviderResult> {
    const provider = await this.findProvider(currentUser.tenantId, providerId);
    const model = dto.model_config_id
      ? provider.models.find((item) => item.id === dto.model_config_id)
      : provider.models.find((item) => item.isDefault && item.status === 'ACTIVE') ??
        provider.models.find((item) => item.status === 'ACTIVE');

    if (!model) {
      throw new BadRequestException('Create an active model config before testing this provider');
    }

    const activeKey = provider.apiKeys.find((apiKey) => apiKey.status === 'ACTIVE');
    if (!activeKey) {
      throw new BadRequestException('No active API key configured for this provider');
    }

    if (provider.providerType !== 'OPENAI_COMPATIBLE') {
      throw new BadRequestException('Only OPENAI_COMPATIBLE providers are executable in M17');
    }

    const execution = await executeOpenAiCompatibleChat({
      apiKey: decryptSecret(activeKey.encryptedKey),
      baseUrl: provider.baseUrl,
      model: model.model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: '你正在执行企业智能体平台的模型兼容性检查。请用一句简短中文确认调用结果。',
        },
        {
          role: 'user',
          content: dto.prompt,
        },
      ],
    });
    const status = execution.errorMessage ? 'FAILED' : 'SUCCESS';
    const inputCost = (execution.promptTokens / 1000) * Number(model.inputPrice);
    const outputCost = (execution.completionTokens / 1000) * Number(model.outputPrice);
    const totalCost = inputCost + outputCost;

    await this.prisma.modelCallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId,
        modelConfigId: model.id,
        traceId: execution.traceId,
        requestModel: execution.requestModel,
        status,
        promptTokens: execution.promptTokens,
        completionTokens: execution.completionTokens,
        totalTokens: execution.totalTokens,
        inputCost,
        outputCost,
        totalCost,
        latencyMs: execution.latencyMs,
        errorMessage: execution.errorMessage,
        requestSummary: execution.requestSummary as unknown as Prisma.InputJsonValue,
        responseSummary: execution.responseSummary as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.modelApiKey.update({
      where: {
        id: activeKey.id,
      },
      data: {
        lastUsedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return {
      trace_id: execution.traceId,
      status,
      request_model: execution.requestModel,
      latency_ms: execution.latencyMs,
      prompt_tokens: execution.promptTokens,
      completion_tokens: execution.completionTokens,
      total_tokens: execution.totalTokens,
      total_cost: Number(totalCost.toFixed(6)),
      output_text: execution.outputText,
      error_message: execution.errorMessage,
    };
  }

  private async clearDefaultProviders(tenantId: string, exceptId?: string) {
    await this.prisma.modelProvider.updateMany({
      where: {
        tenantId,
        deletedAt: null,
        id: exceptId ? { not: exceptId } : undefined,
      },
      data: {
        isDefault: false,
      },
    });
  }

  private async clearDefaultModels(tenantId: string, providerId: string, exceptId?: string) {
    await this.prisma.modelConfig.updateMany({
      where: {
        tenantId,
        providerId,
        deletedAt: null,
        id: exceptId ? { not: exceptId } : undefined,
      },
      data: {
        isDefault: false,
      },
    });
  }

  private async upsertCostRule(
    currentUser: AuthenticatedUser,
    providerId: string,
    modelConfigId: string,
    prices: { inputPrice: number; outputPrice: number },
  ) {
    const existing = await this.prisma.modelCostRule.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        providerId,
        modelConfigId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      await this.prisma.modelCostRule.update({
        where: {
          id: existing.id,
        },
        data: {
          inputPrice: prices.inputPrice,
          outputPrice: prices.outputPrice,
          updatedBy: currentUser.id,
        },
      });
      return;
    }

    await this.prisma.modelCostRule.create({
      data: {
        tenantId: currentUser.tenantId,
        providerId,
        modelConfigId,
        inputPrice: prices.inputPrice,
        outputPrice: prices.outputPrice,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });
  }

  private async ensureProvider(tenantId: string, id: string) {
    const provider = await this.prisma.modelProvider.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!provider) {
      throw new NotFoundException('Model provider not found');
    }

    return provider;
  }

  private async findProvider(tenantId: string, id: string): Promise<ProviderDetailRecord> {
    const provider = await this.prisma.modelProvider.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: providerDetailInclude,
    });

    if (!provider) {
      throw new NotFoundException('Model provider not found');
    }

    return provider;
  }

  private async ensureModel(tenantId: string, id: string) {
    const model = await this.prisma.modelConfig.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!model) {
      throw new NotFoundException('Model config not found');
    }

    return model;
  }

  private mapProviderListItem(provider: ProviderListRecord): ModelProviderListItem {
    return {
      id: provider.id,
      tenant_id: provider.tenantId,
      name: provider.name,
      code: provider.code,
      provider_type: provider.providerType as ModelProviderListItem['provider_type'],
      base_url: provider.baseUrl,
      status: provider.status as ModelProviderListItem['status'],
      is_default: provider.isDefault,
      description: provider.description,
      model_count: provider.models.length,
      enabled_model_count: provider.models.filter((model) => model.status === 'ACTIVE').length,
      api_key_count: provider.apiKeys.filter((apiKey) => apiKey.status === 'ACTIVE').length,
      last_call_at: provider.callLogs[0]?.createdAt.toISOString() ?? null,
      created_at: provider.createdAt.toISOString(),
      updated_at: provider.updatedAt.toISOString(),
    };
  }

  private mapProviderDetail(provider: ProviderDetailRecord): ModelProviderDetail {
    return {
      ...this.mapProviderListItem(provider),
      models: provider.models.map((model) => this.mapModel(model)),
      api_keys: provider.apiKeys.map((apiKey) => this.mapApiKey(apiKey)),
      cost_rules: provider.costRules.map((costRule) => this.mapCostRule(costRule)),
      call_logs: provider.callLogs.map((callLog) => this.mapCallLog(callLog)),
    };
  }

  private mapModel(model: Prisma.ModelConfigGetPayload<object>): ModelConfigItem {
    return {
      id: model.id,
      tenant_id: model.tenantId,
      provider_id: model.providerId,
      name: model.name,
      model: model.model,
      capabilities: model.capabilities as ModelConfigItem['capabilities'],
      context_length: model.contextLength,
      max_output_tokens: model.maxOutputTokens,
      api_version: model.apiVersion,
      input_price: Number(model.inputPrice),
      output_price: Number(model.outputPrice),
      rate_limit_rpm: model.rateLimitRpm,
      status: model.status as ModelConfigItem['status'],
      is_default: model.isDefault,
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt.toISOString(),
    };
  }

  private mapApiKey(apiKey: Prisma.ModelApiKeyGetPayload<object>): ModelApiKeyItem {
    return {
      id: apiKey.id,
      name: apiKey.name,
      key_prefix: apiKey.keyPrefix,
      masked_key: apiKey.maskedKey,
      status: apiKey.status as ModelApiKeyItem['status'],
      last_used_at: apiKey.lastUsedAt?.toISOString() ?? null,
      created_at: apiKey.createdAt.toISOString(),
    };
  }

  private mapCostRule(costRule: Prisma.ModelCostRuleGetPayload<object>): ModelCostRuleItem {
    return {
      id: costRule.id,
      model_config_id: costRule.modelConfigId,
      currency: costRule.currency,
      input_price: Number(costRule.inputPrice),
      output_price: Number(costRule.outputPrice),
      unit: costRule.unit,
      status: costRule.status as ModelCostRuleItem['status'],
      effective_from: costRule.effectiveFrom.toISOString(),
    };
  }

  private mapCallLog(callLog: Prisma.ModelCallLogGetPayload<object>): ModelCallLogItem {
    return {
      id: callLog.id,
      trace_id: callLog.traceId,
      request_model: callLog.requestModel,
      status: callLog.status as ModelCallLogItem['status'],
      prompt_tokens: callLog.promptTokens,
      completion_tokens: callLog.completionTokens,
      total_tokens: callLog.totalTokens,
      total_cost: Number(callLog.totalCost),
      latency_ms: callLog.latencyMs,
      error_message: callLog.errorMessage,
      created_at: callLog.createdAt.toISOString(),
    };
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
