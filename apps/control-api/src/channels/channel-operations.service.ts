import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ChannelAccountItem,
  ChannelDeliveryItem,
  ChannelOperationsListResult,
  ChannelProviderItem,
  ChannelPublishJobActionResult,
  ChannelPublishJobDetail,
  ChannelPublishJobItem,
  ChannelPublishJobStatus,
  ChannelPublishJobTimelineItem,
  ChannelReplyItem,
  ChannelRouteRuleItem,
  ChannelTemplateItem,
} from '@aiaget/shared-types';

import { encryptSecret, maskApiKey } from '../models/model-secrets';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import type {
  CreateChannelAccountDto,
  CreateChannelProviderDto,
  CreateChannelRouteRuleDto,
  CreateChannelTemplateDto,
  ListChannelOperationsDto,
  UpdateChannelAccountDto,
  UpdateChannelProviderDto,
  UpdateChannelRouteRuleDto,
  UpdateChannelTemplateDto,
} from './dto/channel-operations.dto';

const DEFAULT_LIST_LIMIT = 50;

const providerInclude = {
  accounts: {
    where: {
      deletedAt: null,
    },
  },
  templates: {
    where: {
      deletedAt: null,
    },
  },
  routeRules: {
    where: {
      deletedAt: null,
    },
  },
} satisfies Prisma.ChannelProviderInclude;

const accountInclude = {
  provider: true,
  publishChannels: {
    where: {
      deletedAt: null,
    },
    include: {
      agent: true,
    },
    take: 1,
  },
} satisfies Prisma.ChannelAccountInclude;

const templateInclude = {
  provider: true,
  account: true,
} satisfies Prisma.ChannelTemplateInclude;

const routeRuleInclude = {
  provider: true,
  account: true,
  agent: true,
  publishChannels: {
    where: {
      deletedAt: null,
    },
    take: 1,
  },
} satisfies Prisma.ChannelRouteRuleInclude;

const publishJobInclude = {
  provider: true,
  account: true,
  template: true,
  publishChannel: true,
} satisfies Prisma.ChannelPublishJobInclude;

const publishJobDetailInclude = {
  ...publishJobInclude,
  agent: true,
} satisfies Prisma.ChannelPublishJobInclude;

const deliveryInclude = {
  provider: true,
  account: true,
  publishChannel: true,
} satisfies Prisma.ChannelDeliveryInclude;

const replyInclude = {
  provider: true,
  account: true,
  publishChannel: true,
  delivery: true,
} satisfies Prisma.ChannelReplyInclude;

type ProviderRecord = Prisma.ChannelProviderGetPayload<{ include: typeof providerInclude }>;
type AccountRecord = Prisma.ChannelAccountGetPayload<{ include: typeof accountInclude }>;
type TemplateRecord = Prisma.ChannelTemplateGetPayload<{ include: typeof templateInclude }>;
type RouteRuleRecord = Prisma.ChannelRouteRuleGetPayload<{ include: typeof routeRuleInclude }>;
type PublishJobRecord = Prisma.ChannelPublishJobGetPayload<{ include: typeof publishJobInclude }>;
type PublishJobDetailRecord = Prisma.ChannelPublishJobGetPayload<{ include: typeof publishJobDetailInclude }>;
type DeliveryRecord = Prisma.ChannelDeliveryGetPayload<{ include: typeof deliveryInclude }>;
type ReplyRecord = Prisma.ChannelReplyGetPayload<{ include: typeof replyInclude }>;

@Injectable()
export class ChannelOperationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listProviders(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelProviderItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelProviderWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.provider) where.OR = [{ code: query.provider }, { providerType: query.provider }];
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { providerType: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelProvider.findMany({
        where,
        include: providerInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelProvider.count({ where }),
    ]);

    const deliveryCounts = await this.countDeliveries24h(currentUser.tenantId, items.map((item) => item.id), 'providerId');

    return listResult(items.map((item) => mapProvider(item, deliveryCounts.get(item.id) ?? 0)), page, pageSize, total);
  }

  async createProvider(currentUser: AuthenticatedUser, dto: CreateChannelProviderDto): Promise<ChannelProviderItem> {
    try {
      const provider = await this.prisma.channelProvider.create({
        data: {
          tenantId: currentUser.tenantId,
          code: dto.code.trim(),
          name: dto.name.trim(),
          providerType: dto.provider_type?.trim() || 'CUSTOM',
          status: dto.status ?? 'ACTIVE',
          endpointUrl: nullableText(dto.endpoint_url),
          callbackUrl: nullableText(dto.callback_url),
          capabilities: normalizeStringArray(dto.capabilities),
          authType: nullableText(dto.auth_type),
          config: dto.config === undefined ? undefined : toJsonInput(dto.config),
          description: nullableText(dto.description),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: providerInclude,
      });

      return mapProvider(provider, 0);
    } catch (error) {
      if (isUniqueError(error)) throw new BadRequestException('渠道提供方编码已存在。');
      throw error;
    }
  }

  async updateProvider(currentUser: AuthenticatedUser, id: string, dto: UpdateChannelProviderDto): Promise<ChannelProviderItem> {
    await this.ensureProvider(currentUser.tenantId, id);
    const provider = await this.prisma.channelProvider.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.provider_type !== undefined ? { providerType: dto.provider_type.trim() } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.endpoint_url !== undefined ? { endpointUrl: nullableText(dto.endpoint_url) } : {}),
        ...(dto.callback_url !== undefined ? { callbackUrl: nullableText(dto.callback_url) } : {}),
        ...(dto.capabilities !== undefined ? { capabilities: normalizeStringArray(dto.capabilities) } : {}),
        ...(dto.auth_type !== undefined ? { authType: nullableText(dto.auth_type) } : {}),
        ...(dto.config !== undefined ? { config: toJsonInput(dto.config) } : {}),
        ...(dto.description !== undefined ? { description: nullableText(dto.description) } : {}),
        updatedBy: currentUser.id,
      },
      include: providerInclude,
    });

    return mapProvider(provider, 0);
  }

  async setProviderStatus(currentUser: AuthenticatedUser, id: string, status: string): Promise<ChannelProviderItem> {
    return this.updateProvider(currentUser, id, { status });
  }

  async removeProvider(currentUser: AuthenticatedUser, id: string) {
    await this.ensureProvider(currentUser.tenantId, id);
    await this.prisma.channelProvider.update({
      where: { id },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async listAccounts(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelAccountItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelAccountWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.id = query.account_id;
    if (query.provider) {
      where.provider = {
        OR: [{ code: query.provider }, { providerType: query.provider }],
      };
    }
    if (query.channel_id) {
      where.publishChannels = {
        some: {
          id: query.channel_id,
          deletedAt: null,
        },
      };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { externalAccountId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelAccount.findMany({
        where,
        include: accountInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelAccount.count({ where }),
    ]);

    return listResult(items.map(mapAccount), page, pageSize, total);
  }

  async createAccount(currentUser: AuthenticatedUser, dto: CreateChannelAccountDto): Promise<ChannelAccountItem> {
    await this.ensureProvider(currentUser.tenantId, dto.provider_id);
    try {
      const secret = dto.secret?.trim();
      const account = await this.prisma.channelAccount.create({
        data: {
          tenantId: currentUser.tenantId,
          providerId: dto.provider_id,
          code: dto.code.trim(),
          name: dto.name.trim(),
          status: dto.status ?? 'ACTIVE',
          externalAccountId: nullableText(dto.external_account_id),
          ...(secret ? { secretEncrypted: encryptSecret(secret), secretMasked: maskApiKey(secret) } : {}),
          config: dto.config === undefined ? undefined : toJsonInput(dto.config),
          description: nullableText(dto.description),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: accountInclude,
      });

      return mapAccount(account);
    } catch (error) {
      if (isUniqueError(error)) throw new BadRequestException('渠道账号编码或外部账号已存在。');
      throw error;
    }
  }

  async updateAccount(currentUser: AuthenticatedUser, id: string, dto: UpdateChannelAccountDto): Promise<ChannelAccountItem> {
    await this.ensureAccount(currentUser.tenantId, id);
    const secret = dto.secret?.trim();
    const account = await this.prisma.channelAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.external_account_id !== undefined ? { externalAccountId: nullableText(dto.external_account_id) } : {}),
        ...(secret ? { secretEncrypted: encryptSecret(secret), secretMasked: maskApiKey(secret) } : {}),
        ...(dto.config !== undefined ? { config: toJsonInput(dto.config) } : {}),
        ...(dto.description !== undefined ? { description: nullableText(dto.description) } : {}),
        updatedBy: currentUser.id,
      },
      include: accountInclude,
    });

    return mapAccount(account);
  }

  async setAccountStatus(currentUser: AuthenticatedUser, id: string, status: string): Promise<ChannelAccountItem> {
    return this.updateAccount(currentUser, id, { status });
  }

  async removeAccount(currentUser: AuthenticatedUser, id: string) {
    await this.ensureAccount(currentUser.tenantId, id);
    await this.prisma.channelAccount.update({
      where: { id },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async listTemplates(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelTemplateItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelTemplateWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.accountId = query.account_id;
    if (query.provider) where.provider = { OR: [{ code: query.provider }, { providerType: query.provider }] };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { subject: { contains: keyword, mode: 'insensitive' } },
        { externalTemplateId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelTemplate.findMany({
        where,
        include: templateInclude,
        orderBy: [{ updatedAt: 'desc' }, { version: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelTemplate.count({ where }),
    ]);

    return listResult(items.map(mapTemplate), page, pageSize, total);
  }

  async createTemplate(currentUser: AuthenticatedUser, dto: CreateChannelTemplateDto): Promise<ChannelTemplateItem> {
    if (dto.provider_id) await this.ensureProvider(currentUser.tenantId, dto.provider_id);
    if (dto.account_id) await this.ensureAccount(currentUser.tenantId, dto.account_id);
    try {
      const template = await this.prisma.channelTemplate.create({
        data: {
          tenantId: currentUser.tenantId,
          providerId: dto.provider_id ?? null,
          accountId: dto.account_id ?? null,
          code: dto.code.trim(),
          name: dto.name.trim(),
          templateType: dto.template_type?.trim() || 'MESSAGE',
          locale: nullableText(dto.locale),
          status: dto.status ?? 'DRAFT',
          subject: nullableText(dto.subject),
          body: nullableText(dto.body),
          variables: dto.variables === undefined ? undefined : toJsonInput(dto.variables),
          contentSchema: dto.content_schema === undefined ? undefined : toJsonInput(dto.content_schema),
          externalTemplateId: nullableText(dto.external_template_id),
          version: dto.version ?? 1,
          approvedAt: dto.status === 'APPROVED' || dto.status === 'ACTIVE' ? new Date() : null,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: templateInclude,
      });

      return mapTemplate(template);
    } catch (error) {
      if (isUniqueError(error)) throw new BadRequestException('渠道模板编码、版本或外部模板 ID 已存在。');
      throw error;
    }
  }

  async updateTemplate(currentUser: AuthenticatedUser, id: string, dto: UpdateChannelTemplateDto): Promise<ChannelTemplateItem> {
    await this.ensureTemplate(currentUser.tenantId, id);
    if (dto.provider_id) await this.ensureProvider(currentUser.tenantId, dto.provider_id);
    if (dto.account_id) await this.ensureAccount(currentUser.tenantId, dto.account_id);
    const template = await this.prisma.channelTemplate.update({
      where: { id },
      data: {
        ...(dto.provider_id !== undefined ? { providerId: dto.provider_id } : {}),
        ...(dto.account_id !== undefined ? { accountId: dto.account_id } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.template_type !== undefined ? { templateType: dto.template_type.trim() } : {}),
        ...(dto.locale !== undefined ? { locale: nullableText(dto.locale) } : {}),
        ...(dto.status !== undefined ? { status: dto.status, approvedAt: dto.status === 'APPROVED' || dto.status === 'ACTIVE' ? new Date() : undefined } : {}),
        ...(dto.subject !== undefined ? { subject: nullableText(dto.subject) } : {}),
        ...(dto.body !== undefined ? { body: nullableText(dto.body) } : {}),
        ...(dto.variables !== undefined ? { variables: toJsonInput(dto.variables) } : {}),
        ...(dto.content_schema !== undefined ? { contentSchema: toJsonInput(dto.content_schema) } : {}),
        ...(dto.external_template_id !== undefined ? { externalTemplateId: nullableText(dto.external_template_id) } : {}),
        updatedBy: currentUser.id,
      },
      include: templateInclude,
    });

    return mapTemplate(template);
  }

  async setTemplateStatus(currentUser: AuthenticatedUser, id: string, status: string): Promise<ChannelTemplateItem> {
    return this.updateTemplate(currentUser, id, { status });
  }

  async removeTemplate(currentUser: AuthenticatedUser, id: string) {
    await this.ensureTemplate(currentUser.tenantId, id);
    await this.prisma.channelTemplate.update({
      where: { id },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async listRouteRules(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelRouteRuleItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelRouteRuleWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.accountId = query.account_id;
    if (query.channel_id) where.publishChannels = { some: { id: query.channel_id, deletedAt: null } };
    if (query.provider) where.provider = { OR: [{ code: query.provider }, { providerType: query.provider }] };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { matchType: { contains: keyword, mode: 'insensitive' } },
        { targetType: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelRouteRule.findMany({
        where,
        include: routeRuleInclude,
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelRouteRule.count({ where }),
    ]);

    return listResult(items.map(mapRouteRule), page, pageSize, total);
  }

  async createRouteRule(currentUser: AuthenticatedUser, dto: CreateChannelRouteRuleDto): Promise<ChannelRouteRuleItem> {
    await this.ensureRouteRelations(currentUser.tenantId, dto);
    try {
      const rule = await this.prisma.channelRouteRule.create({
        data: {
          tenantId: currentUser.tenantId,
          agentId: dto.agent_id ?? null,
          providerId: dto.provider_id ?? null,
          accountId: dto.account_id ?? null,
          code: dto.code.trim(),
          name: dto.name.trim(),
          priority: dto.priority ?? 100,
          status: dto.status ?? 'ACTIVE',
          direction: dto.direction ?? 'INBOUND',
          matchType: dto.match_type?.trim() || 'JSON',
          matchConfig: dto.match_config === undefined ? undefined : toJsonInput(dto.match_config),
          targetType: dto.target_type?.trim() || 'AGENT',
          targetConfig: dto.target_config === undefined ? undefined : toJsonInput(dto.target_config),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: routeRuleInclude,
      });

      return mapRouteRule(rule);
    } catch (error) {
      if (isUniqueError(error)) throw new BadRequestException('路由规则编码已存在。');
      throw error;
    }
  }

  async updateRouteRule(currentUser: AuthenticatedUser, id: string, dto: UpdateChannelRouteRuleDto): Promise<ChannelRouteRuleItem> {
    await this.ensureRouteRule(currentUser.tenantId, id);
    await this.ensureRouteRelations(currentUser.tenantId, dto);
    const rule = await this.prisma.channelRouteRule.update({
      where: { id },
      data: {
        ...(dto.clear_agent ? { agentId: null } : dto.agent_id !== undefined ? { agentId: dto.agent_id } : {}),
        ...(dto.provider_id !== undefined ? { providerId: dto.provider_id } : {}),
        ...(dto.account_id !== undefined ? { accountId: dto.account_id } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
        ...(dto.match_type !== undefined ? { matchType: dto.match_type.trim() } : {}),
        ...(dto.match_config !== undefined ? { matchConfig: toJsonInput(dto.match_config) } : {}),
        ...(dto.target_type !== undefined ? { targetType: dto.target_type.trim() } : {}),
        ...(dto.target_config !== undefined ? { targetConfig: toJsonInput(dto.target_config) } : {}),
        updatedBy: currentUser.id,
      },
      include: routeRuleInclude,
    });

    return mapRouteRule(rule);
  }

  async setRouteRuleStatus(currentUser: AuthenticatedUser, id: string, status: string): Promise<ChannelRouteRuleItem> {
    return this.updateRouteRule(currentUser, id, { status });
  }

  async removeRouteRule(currentUser: AuthenticatedUser, id: string) {
    await this.ensureRouteRule(currentUser.tenantId, id);
    await this.prisma.channelRouteRule.update({
      where: { id },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async listPublishJobs(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelPublishJobItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelPublishJobWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.accountId = query.account_id;
    if (query.channel_id) where.publishChannelId = query.channel_id;
    if (query.provider) where.provider = { OR: [{ code: query.provider }, { providerType: query.provider }] };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { jobKey: { contains: keyword, mode: 'insensitive' } },
        { jobType: { contains: keyword, mode: 'insensitive' } },
        { errorMessage: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelPublishJob.findMany({
        where,
        include: publishJobInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelPublishJob.count({ where }),
    ]);

    return listResult(items.map(mapPublishJob), page, pageSize, total);
  }

  async getPublishJob(currentUser: AuthenticatedUser, id: string): Promise<ChannelPublishJobDetail> {
    const job = await this.prisma.channelPublishJob.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
      include: publishJobDetailInclude,
    });

    if (!job) throw new NotFoundException('渠道发布任务不存在。');

    return mapPublishJobDetail(job);
  }

  async cancelPublishJob(currentUser: AuthenticatedUser, id: string): Promise<ChannelPublishJobActionResult> {
    const job = await this.prisma.channelPublishJob.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
      include: publishJobDetailInclude,
    });

    if (!job) throw new NotFoundException('渠道发布任务不存在。');
    if (!['PENDING', 'RUNNING', 'RETRYING'].includes(job.status)) {
      throw new BadRequestException('仅待处理、运行中或重试中的发布任务可以取消。');
    }

    const updated = await this.prisma.channelPublishJob.update({
      where: { id },
      data: {
        status: 'CANCELED',
        finishedAt: new Date(),
        errorMessage: job.errorMessage ?? '用户取消任务。',
        updatedBy: currentUser.id,
      },
      include: publishJobDetailInclude,
    });

    return {
      action: 'CANCEL',
      message: '发布任务已取消。',
      job: mapPublishJobDetail(updated),
    };
  }

  async retryPublishJob(currentUser: AuthenticatedUser, id: string): Promise<ChannelPublishJobActionResult> {
    const job = await this.prisma.channelPublishJob.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
      include: publishJobDetailInclude,
    });

    if (!job) throw new NotFoundException('渠道发布任务不存在。');
    if (!['FAILED', 'CANCELED', 'CANCELLED'].includes(job.status)) {
      throw new BadRequestException('仅失败或已取消的发布任务可以重试。');
    }

    const retryCount = (job.retryCount ?? 0) + 1;
    const retryJobKey = `${job.jobKey}:retry:${retryCount}`;
    const retryPayload = mergeJsonRecord(job.payload, {
      retry_of: job.id,
      retry_job_key: job.jobKey,
      retry_count: retryCount,
      retry_requested_at: new Date().toISOString(),
    });
    const retryResult = mergeJsonRecord(job.result, {
      retry_of: job.id,
      retry_job_key: job.jobKey,
      retry_count: retryCount,
      retry_requested_at: new Date().toISOString(),
    });

    const retryJob = await this.prisma.channelPublishJob.upsert({
      where: {
        tenantId_jobKey: {
          tenantId: currentUser.tenantId,
          jobKey: retryJobKey,
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        agentId: job.agentId,
        publishChannelId: job.publishChannelId,
        providerId: job.providerId,
        accountId: job.accountId,
        templateId: job.templateId,
        jobKey: retryJobKey,
        jobType: 'RETRY',
        status: 'RETRYING',
        payload: toJsonInput(retryPayload),
        result: toJsonInput(retryResult),
        errorMessage: null,
        retryCount,
        scheduledAt: new Date(),
        startedAt: null,
        finishedAt: null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        status: 'RETRYING',
        payload: toJsonInput(retryPayload),
        result: toJsonInput(retryResult),
        errorMessage: null,
        retryCount,
        scheduledAt: new Date(),
        startedAt: null,
        finishedAt: null,
        updatedBy: currentUser.id,
      },
      include: publishJobDetailInclude,
    });

    return {
      action: 'RETRY',
      message: '发布任务已重新排队。',
      job: mapPublishJobDetail(retryJob),
    };
  }

  async listDeliveries(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelDeliveryItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelDeliveryWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.accountId = query.account_id;
    if (query.channel_id) where.publishChannelId = query.channel_id;
    if (query.provider) where.provider = { OR: [{ code: query.provider }, { providerType: query.provider }] };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { deliveryKey: { contains: keyword, mode: 'insensitive' } },
        { target: { contains: keyword, mode: 'insensitive' } },
        { traceId: { contains: keyword, mode: 'insensitive' } },
        { externalConversationId: { contains: keyword, mode: 'insensitive' } },
        { externalMessageId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelDelivery.findMany({
        where,
        include: deliveryInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelDelivery.count({ where }),
    ]);

    return listResult(items.map(mapDelivery), page, pageSize, total);
  }

  async listReplies(currentUser: AuthenticatedUser, query: ListChannelOperationsDto): Promise<ChannelOperationsListResult<ChannelReplyItem>> {
    const { page, pageSize } = getPagination(query);
    const where: Prisma.ChannelReplyWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.account_id) where.accountId = query.account_id;
    if (query.channel_id) where.publishChannelId = query.channel_id;
    if (query.provider) where.provider = { OR: [{ code: query.provider }, { providerType: query.provider }] };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { replyKey: { contains: keyword, mode: 'insensitive' } },
        { sender: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
        { traceId: { contains: keyword, mode: 'insensitive' } },
        { externalConversationId: { contains: keyword, mode: 'insensitive' } },
        { externalMessageId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelReply.findMany({
        where,
        include: replyInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.channelReply.count({ where }),
    ]);

    return listResult(items.map(mapReply), page, pageSize, total);
  }

  private async ensureProvider(tenantId: string, id: string) {
    const provider = await this.prisma.channelProvider.findFirst({ where: { tenantId, id, deletedAt: null } });
    if (!provider) throw new NotFoundException('渠道提供方不存在。');
    return provider;
  }

  private async ensureAccount(tenantId: string, id: string) {
    const account = await this.prisma.channelAccount.findFirst({ where: { tenantId, id, deletedAt: null } });
    if (!account) throw new NotFoundException('渠道账号不存在。');
    return account;
  }

  private async ensureTemplate(tenantId: string, id: string) {
    const template = await this.prisma.channelTemplate.findFirst({ where: { tenantId, id, deletedAt: null } });
    if (!template) throw new NotFoundException('渠道模板不存在。');
    return template;
  }

  private async ensureRouteRule(tenantId: string, id: string) {
    const rule = await this.prisma.channelRouteRule.findFirst({ where: { tenantId, id, deletedAt: null } });
    if (!rule) throw new NotFoundException('渠道路由规则不存在。');
    return rule;
  }

  private async ensureRouteRelations(tenantId: string, dto: { agent_id?: string | null; provider_id?: string | null; account_id?: string | null }) {
    if (dto.provider_id) await this.ensureProvider(tenantId, dto.provider_id);
    if (dto.account_id) await this.ensureAccount(tenantId, dto.account_id);
    if (dto.agent_id) {
      const agent = await this.prisma.agent.findFirst({ where: { tenantId, id: dto.agent_id, deletedAt: null } });
      if (!agent) throw new NotFoundException('路由规则关联的 Agent 不存在。');
    }
  }

  private async countDeliveries24h(tenantId: string, ids: string[], field: 'providerId') {
    const result = new Map<string, number>();
    if (ids.length === 0) return result;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const groups = await this.prisma.channelDelivery.groupBy({
      by: [field],
      where: {
        tenantId,
        [field]: { in: ids },
        createdAt: { gte: since },
      },
      _count: {
        _all: true,
      },
    });

    for (const group of groups) {
      const key = group[field];
      if (key) result.set(key, group._count._all);
    }

    return result;
  }
}

function mapProvider(provider: ProviderRecord, deliveryCount24h: number): ChannelProviderItem {
  return {
    id: provider.id,
    code: provider.code,
    name: provider.name,
    type: provider.providerType,
    status: provider.status,
    health_status: provider.status === 'ACTIVE' ? 'HEALTHY' : provider.status === 'ERROR' ? 'UNAVAILABLE' : 'UNKNOWN',
    account_count: provider.accounts.length,
    template_count: provider.templates.length,
    route_rule_count: provider.routeRules.length,
    delivery_count_24h: deliveryCount24h,
    success_rate_24h: 0,
    last_checked_at: null,
    created_at: provider.createdAt.toISOString(),
    updated_at: provider.updatedAt.toISOString(),
    metadata: {
      provider_type: provider.providerType,
      endpoint_url: provider.endpointUrl,
      callback_url: provider.callbackUrl,
      capabilities: provider.capabilities,
      auth_type: provider.authType,
      description: provider.description,
      config: normalizeJson(provider.config),
    },
  };
}

function mapAccount(account: AccountRecord): ChannelAccountItem {
  const channel = account.publishChannels[0];
  return {
    id: account.id,
    provider_id: account.providerId,
    provider_code: account.provider.code,
    provider_name: account.provider.name,
    channel_id: channel?.id ?? null,
    channel_name: channel?.name ?? null,
    account_name: account.name,
    account_key: account.code,
    status: account.status,
    owner: channel?.agent?.name ?? null,
    environment: readConfigString(account.config, 'environment') ?? readConfigString(account.config, 'env') ?? '默认环境',
    last_used_at: account.lastVerifiedAt?.toISOString() ?? null,
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
    metadata: {
      code: account.code,
      external_account_id: account.externalAccountId,
      secret_masked: account.secretMasked,
      description: account.description,
      config: normalizeJson(account.config),
    },
  };
}

function mapTemplate(template: TemplateRecord): ChannelTemplateItem {
  return {
    id: template.id,
    provider_id: template.providerId,
    provider_code: template.provider?.code ?? null,
    provider_name: template.provider?.name ?? null,
    channel_id: null,
    channel_name: null,
    name: template.name,
    template_code: template.code,
    template_type: template.templateType,
    language: template.locale,
    version: template.version,
    status: template.status,
    updated_at: template.updatedAt.toISOString(),
    created_at: template.createdAt.toISOString(),
    metadata: {
      account_id: template.accountId,
      account_name: template.account?.name ?? null,
      subject: template.subject,
      body: template.body,
      variables: normalizeJson(template.variables),
      content_schema: normalizeJson(template.contentSchema),
      external_template_id: template.externalTemplateId,
      approved_at: template.approvedAt?.toISOString() ?? null,
    },
  };
}

function mapRouteRule(rule: RouteRuleRecord): ChannelRouteRuleItem {
  const matchConfig = normalizeRecord(rule.matchConfig);
  const targetConfig = normalizeRecord(rule.targetConfig);
  const channel = rule.publishChannels[0];
  return {
    id: rule.id,
    name: rule.name,
    status: rule.status,
    priority: rule.priority,
    provider_id: rule.providerId,
    provider_name: rule.provider?.name ?? null,
    channel_id: channel?.id ?? null,
    channel_name: channel?.name ?? null,
    match_type: rule.matchType,
    match_value: stringifyCompact(matchConfig?.value ?? matchConfig?.path ?? matchConfig),
    target_type: rule.targetType,
    target_id: stringifyCompact(targetConfig?.id ?? targetConfig?.agent_id ?? rule.agentId),
    fallback_target: stringifyCompact(targetConfig?.fallback ?? targetConfig?.fallback_target),
    updated_at: rule.updatedAt.toISOString(),
    created_at: rule.createdAt.toISOString(),
    metadata: {
      code: rule.code,
      direction: rule.direction,
      agent_id: rule.agentId,
      agent_name: rule.agent?.name ?? null,
      provider_code: rule.provider?.code ?? null,
      account_id: rule.accountId,
      account_name: rule.account?.name ?? null,
      match_config: matchConfig,
      target_config: targetConfig,
    },
  };
}

function mapPublishJob(job: PublishJobRecord): ChannelPublishJobItem {
  return mapPublishJobBase(job);
}

function mapPublishJobDetail(job: PublishJobDetailRecord): ChannelPublishJobDetail {
  const base = mapPublishJobBase(job);
  const payload = normalizeJson(job.payload);
  const result = normalizeJson(job.result);

  return {
    ...base,
    payload,
    result,
    timeline: buildPublishJobTimeline(job),
    metadata: {
      ...(base.metadata ?? {}),
      provider_code: job.provider?.code ?? null,
      provider_name: job.provider?.name ?? null,
      provider_type: job.provider?.providerType ?? null,
      account_code: job.account?.code ?? null,
      account_name: job.account?.name ?? null,
      template_code: job.template?.code ?? null,
      template_name: job.template?.name ?? null,
      channel_name: job.publishChannel?.name ?? null,
      agent_id: job.agentId,
      agent_name: job.agent?.name ?? null,
      error: job.errorMessage,
    },
  };
}

function mapPublishJobBase(job: PublishJobRecord | PublishJobDetailRecord): ChannelPublishJobItem {
  const payloadRecord = normalizeRecord(job.payload);
  const progress = readJsonNumber(job.payload, 'progress_percent')
    ?? readJsonNumber(job.payload, 'progress')
    ?? readJsonNumber(job.result, 'progress_percent')
    ?? readJsonNumber(job.result, 'progress');

  return {
    id: job.id,
    job_no: job.jobKey,
    title: readJsonString(job.payload, 'title') ?? `${job.jobType} ${job.jobKey}`,
    status: normalizePublishJobStatus(job.status),
    job_type: job.jobType,
    progress,
    progress_percent: progress,
    completed_count: readJsonNumber(job.payload, 'completed_count') ?? readJsonNumber(job.result, 'completed_count'),
    total_count: readJsonNumber(job.payload, 'total_count') ?? readJsonNumber(job.result, 'total_count'),
    provider_id: job.providerId,
    provider_name: job.provider?.name ?? null,
    channel_id: job.publishChannelId,
    channel_name: job.publishChannel?.name ?? null,
    account_id: job.accountId,
    account_name: job.account?.name ?? null,
    template_id: job.templateId,
    template_name: job.template?.name ?? null,
    retry_count: job.retryCount,
    scheduled_at: job.scheduledAt?.toISOString() ?? null,
    started_at: job.startedAt?.toISOString() ?? null,
    finished_at: job.finishedAt?.toISOString() ?? null,
    error_message: job.errorMessage,
    payload: normalizeJson(job.payload),
    result: normalizeJson(job.result),
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
    metadata: {
      job_type: job.jobType,
      retry_count: job.retryCount,
      progress_percent: progress,
      completed_count: readJsonNumber(job.payload, 'completed_count') ?? readJsonNumber(job.result, 'completed_count'),
      total_count: readJsonNumber(job.payload, 'total_count') ?? readJsonNumber(job.result, 'total_count'),
      request_payload: payloadRecord?.requestPayload ?? payloadRecord?.request_payload ?? null,
      payload: normalizeJson(job.payload),
      result: normalizeJson(job.result),
    },
  };
}

function mapDelivery(delivery: DeliveryRecord): ChannelDeliveryItem {
  return {
    id: delivery.id,
    delivery_id: delivery.deliveryKey,
    status: delivery.status,
    provider: delivery.provider?.code ?? null,
    provider_name: delivery.provider?.name ?? null,
    channel_id: delivery.publishChannelId,
    channel_name: delivery.publishChannel?.name ?? null,
    account_id: delivery.accountId,
    account_name: delivery.account?.name ?? null,
    target: delivery.target,
    response_status: delivery.responseStatus,
    latency_ms: delivery.latencyMs,
    retry_count: delivery.retryCount,
    trace_id: delivery.traceId,
    error_message: delivery.errorMessage,
    delivered_at: delivery.deliveredAt?.toISOString() ?? null,
    created_at: delivery.createdAt.toISOString(),
    updated_at: delivery.updatedAt.toISOString(),
    metadata: {
      agent_id: delivery.agentId,
      template_id: delivery.templateId,
      publish_job_id: delivery.publishJobId,
      direction: delivery.direction,
      request_url: delivery.requestUrl,
      request_body: normalizeJson(delivery.requestBody),
      request_headers: normalizeJson(delivery.requestHeaders),
      response_body: delivery.responseBody,
      conversation_id: delivery.conversationId,
      run_id: delivery.runId,
      external_conversation_id: delivery.externalConversationId,
      external_message_id: delivery.externalMessageId,
    },
  };
}

function mapReply(reply: ReplyRecord): ChannelReplyItem {
  return {
    id: reply.id,
    reply_id: reply.replyKey,
    status: reply.status,
    provider: reply.provider?.code ?? null,
    channel_id: reply.publishChannelId,
    channel_name: reply.publishChannel?.name ?? null,
    delivery_id: reply.delivery?.deliveryKey ?? reply.deliveryId,
    external_conversation_id: reply.externalConversationId,
    external_message_id: reply.externalMessageId,
    conversation_id: reply.conversationId,
    run_id: null,
    trace_id: reply.traceId,
    reply_type: reply.contentType,
    content_preview: preview(reply.content),
    error_message: null,
    replied_at: reply.processedAt?.toISOString() ?? reply.receivedAt?.toISOString() ?? null,
    created_at: reply.createdAt.toISOString(),
    updated_at: reply.updatedAt.toISOString(),
    metadata: {
      agent_id: reply.agentId,
      account_id: reply.accountId,
      account_name: reply.account?.name ?? null,
      provider_name: reply.provider?.name ?? null,
      direction: reply.direction,
      sender: reply.sender,
      recipient: reply.recipient,
      content: reply.content,
      payload: normalizeJson(reply.payload),
      message_id: reply.messageId,
      received_at: reply.receivedAt?.toISOString() ?? null,
      processed_at: reply.processedAt?.toISOString() ?? null,
    },
  };
}

function listResult<T>(items: T[], page: number, pageSize: number, total: number): ChannelOperationsListResult<T> {
  return {
    generated_at: new Date().toISOString(),
    items,
    page,
    page_size: pageSize,
    total,
  };
}

function getPagination(query: ListChannelOperationsDto) {
  const page = Number(query.page ?? 1);
  const pageSize = Math.min(Math.max(Number(query.page_size ?? DEFAULT_LIST_LIMIT), 1), 100);

  return { page, pageSize };
}

function nullableText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();

  return trimmed || null;
}

function normalizeStringArray(value: string[] | undefined) {
  return Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean))).slice(0, 30);
}

function normalizeJson(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | unknown[] | string | number | boolean | null {
  if (value === undefined || value === null) return null;

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function normalizeRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  const normalized = normalizeJson(value);

  return normalized && typeof normalized === 'object' && !Array.isArray(normalized) ? normalized as Record<string, unknown> : null;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null || value === Prisma.JsonNull) return Prisma.JsonNull;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readConfigString(config: Prisma.JsonValue | null, key: string) {
  const record = normalizeRecord(config);
  const value = record?.[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readJsonString(value: Prisma.JsonValue | null, key: string) {
  const record = normalizeRecord(value);
  const text = record?.[key];

  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

function readJsonNumber(value: Prisma.JsonValue | null, key: string) {
  const record = normalizeRecord(value);
  const number = Number(record?.[key]);

  return Number.isFinite(number) ? number : null;
}

function stringifyCompact(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

function normalizePublishJobStatus(status: string): ChannelPublishJobStatus | string {
  return status === 'CANCELLED' ? 'CANCELED' : status;
}

function buildPublishJobTimeline(job: PublishJobDetailRecord): ChannelPublishJobTimelineItem[] {
  return [
    {
      label: '创建任务',
      status: normalizePublishJobStatus(job.status),
      occurred_at: job.createdAt.toISOString(),
      description: `任务 ${job.jobKey} 已创建。`,
    },
    {
      label: '计划执行',
      status: normalizePublishJobStatus(job.status),
      occurred_at: job.scheduledAt?.toISOString() ?? null,
      description: job.scheduledAt ? '任务已进入计划队列。' : '任务未设置计划执行时间。',
    },
    {
      label: '开始执行',
      status: normalizePublishJobStatus(job.status),
      occurred_at: job.startedAt?.toISOString() ?? null,
      description: job.startedAt ? '任务已开始执行。' : '任务尚未开始执行。',
    },
    {
      label: job.status === 'FAILED' ? '执行失败' : job.status === 'CANCELED' || job.status === 'CANCELLED' ? '任务取消' : '执行完成',
      status: normalizePublishJobStatus(job.status),
      occurred_at: job.finishedAt?.toISOString() ?? null,
      description: job.errorMessage ?? (job.finishedAt ? '任务已结束。' : '任务仍在等待最终结果。'),
    },
  ];
}

function mergeJsonRecord(base: Prisma.JsonValue | null | undefined, patch: Record<string, unknown>) {
  const normalized = normalizeJson(base);
  const record = normalized && typeof normalized === 'object' && !Array.isArray(normalized) ? normalized as Record<string, unknown> : {};

  return {
    ...record,
    ...patch,
  };
}

function preview(value: string | null) {
  if (!value) return null;
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
