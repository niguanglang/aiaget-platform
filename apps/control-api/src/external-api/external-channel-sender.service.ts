import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import type {
  ChannelCallbackProvider,
  ChannelSenderDeliveryDetail,
  ChannelSenderDeliveryListItem,
  ChannelSenderDeliveryStatus,
  ChannelSenderPolicy,
  ChannelSenderTaskRunResult,
  ListChannelSenderDeliveriesResult,
  PublishChannelType,
  RetryChannelSenderDeliveryResult,
} from '@aiaget/shared-types';

import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser, RequestWithContext } from '../common/types/request-context';
import { decryptSecret } from '../models/model-secrets';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';

const DELIVERY_LIST_LIMIT = 30;
const RESPONSE_BODY_LIMIT = 2000;

const channelInclude = {
  agent: true,
} satisfies Prisma.AgentPublishChannelInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;
type DeliveryRecord = Prisma.ChannelSenderDeliveryGetPayload<{ include: { channel: { include: { agent: true } }; agent: true } }>;

export interface ChannelSenderMessage {
  provider: ChannelCallbackProvider;
  text: string | null;
  externalConversationId: string | null;
  externalMessageId: string | null;
  senderId: string | null;
  responseUrl: string | null;
}

export interface ChannelSenderResult {
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  provider: ChannelCallbackProvider;
  target: string | null;
  responseStatus: number | null;
  responseBody: unknown;
  errorMessage: string | null;
}

interface DispatchPlan {
  provider: ChannelCallbackProvider;
  target: string | null;
  requestUrl: string | null;
  requestBody: unknown;
  requestHeaders: Record<string, string>;
  timeoutMs: number;
  skipReason: string | null;
  successAssertion?: {
    codeKey: string;
    successValue: unknown;
    errorKey: string;
  };
}

export interface ListChannelSenderDeliveriesQuery {
  channel_id?: string;
  status?: string;
  provider?: string;
}

@Injectable()
export class ExternalChannelSenderService {
  private readonly wechatAccessTokens = new Map<string, { token: string; expiresAt: number }>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
  ) {}

  async sendReply(input: {
    request: RequestWithContext;
    channel: ChannelRecord;
    operator: AuthenticatedUser;
    message: ChannelSenderMessage;
    answer: string | null;
    conversationId: string | null;
    runId: string | null;
    traceId: string | null;
  }): Promise<ChannelSenderResult> {
    const answer = input.answer?.trim();
    const plan = answer
      ? await this.buildPlan({ ...input, answer })
      : {
          provider: input.message.provider,
          target: null,
          requestUrl: null,
          requestBody: null,
          requestHeaders: {},
          timeoutMs: senderTimeoutMs(input.channel),
          skipReason: '回复内容为空，跳过主动发送。',
        } satisfies DispatchPlan;

    const delivery = await this.createDeliveryRecord(input, plan, null, 0);

    if (plan.skipReason || !plan.requestUrl) {
      const result = skipped(plan.provider, plan.skipReason ?? '渠道主动回复目标未配置。', plan.target);
      await this.updateDeliveryRecord(delivery.id, result, null);
      await this.recordResult(input, result, delivery.deliveryId);

      return result;
    }

    const startedAt = Date.now();
    let result: ChannelSenderResult;
    try {
      result = await this.executePlan(plan);
    } catch (error) {
      result = {
        status: 'FAILED',
        provider: plan.provider,
        target: plan.target,
        responseStatus: null,
        responseBody: null,
        errorMessage: error instanceof Error ? error.message : '渠道主动回复失败。',
      };
    }

    await this.updateDeliveryRecord(delivery.id, result, Date.now() - startedAt);
    await this.recordResult(input, result, delivery.deliveryId);

    return result;
  }

  async listDeliveries(
    currentUser: AuthenticatedUser,
    query: ListChannelSenderDeliveriesQuery = {},
  ): Promise<ListChannelSenderDeliveriesResult> {
    const where = await this.buildDeliveryWhere(currentUser, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.channelSenderDelivery.findMany({
        where,
        include: {
          channel: {
            include: {
              agent: true,
            },
          },
          agent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: DELIVERY_LIST_LIMIT,
      }),
      this.prisma.channelSenderDelivery.count({ where }),
    ]);

    return {
      items: items.map(mapDeliveryListItem),
      total,
    };
  }

  async getDeliveryDetail(currentUser: AuthenticatedUser, deliveryId: string): Promise<ChannelSenderDeliveryDetail> {
    const delivery = await this.findTenantDelivery(currentUser, deliveryId);
    return mapDeliveryDetail(delivery);
  }

  async retryDelivery(currentUser: AuthenticatedUser, deliveryId: string): Promise<RetryChannelSenderDeliveryResult> {
    const delivery = await this.findTenantDelivery(currentUser, deliveryId);
    if (delivery.status !== 'FAILED') {
      throw new BadRequestException('Only failed channel sender deliveries can be retried');
    }
    if (!delivery.requestUrl) {
      throw new BadRequestException('Channel sender delivery request URL is unavailable');
    }
    const policy = readSenderPolicy(delivery.channel.config);
    if (!policy.manual_retry_enabled) {
      throw new BadRequestException('当前渠道策略已关闭手动重试');
    }
    if (delivery.retryCount >= policy.max_retry_count) {
      throw new BadRequestException(`当前投递已达到最大重试次数 ${policy.max_retry_count}`);
    }
    if (
      delivery.responseStatus !== null
      && policy.retry_on_statuses.length > 0
      && !policy.retry_on_statuses.includes(delivery.responseStatus)
    ) {
      throw new BadRequestException(`响应状态码 ${delivery.responseStatus} 不在当前渠道允许重试范围内`);
    }

    const retryDeliveryId = `csd_${randomUUID().replaceAll('-', '')}`;
    const requestHeaders = parseHeaders(delivery.requestHeaders);
    const requestBody = normalizeJson(delivery.requestBody);
    const retry = await this.prisma.channelSenderDelivery.create({
      data: {
        tenantId: currentUser.tenantId,
        channelId: delivery.channelId,
        agentId: delivery.agentId,
        deliveryId: retryDeliveryId,
        parentDeliveryId: delivery.id,
        provider: delivery.provider,
        target: delivery.target,
        requestUrl: delivery.requestUrl,
        requestBody: toNullableJsonInput(requestBody),
        requestHeaders: requestHeaders as Prisma.InputJsonValue,
        status: 'RETRYING',
        retryCount: delivery.retryCount + 1,
        conversationId: delivery.conversationId,
        runId: delivery.runId,
        traceId: delivery.traceId,
        externalConversationId: delivery.externalConversationId,
        externalMessageId: delivery.externalMessageId,
      },
      include: {
        channel: {
          include: {
            agent: true,
          },
        },
        agent: true,
      },
    });

    const startedAt = Date.now();
    let result: ChannelSenderResult;
    try {
      const response = await postJson(delivery.requestUrl, requestBody, requestHeaders, senderTimeoutMs(delivery.channel));
      assertRetryProviderSuccess(delivery.provider, delivery.requestUrl, response.body);
      result = sent(delivery.provider as ChannelCallbackProvider, delivery.target, response.status, response.body);
    } catch (error) {
      result = {
        status: 'FAILED',
        provider: delivery.provider as ChannelCallbackProvider,
        target: delivery.target,
        responseStatus: null,
        responseBody: null,
        errorMessage: error instanceof Error ? error.message : '渠道主动回复重试失败。',
      };
    }

    const updated = await this.updateDeliveryRecord(retry.id, result, Date.now() - startedAt);
    await this.recordRetryOperation(currentUser, updated, result);

    return {
      item: mapDeliveryDetail(updated),
    };
  }

  async retryDeliveryForTask(delivery: DeliveryRecord, requestId: string): Promise<ChannelSenderTaskRunResult> {
    const startedAt = new Date();
    if (delivery.status !== 'FAILED' || !delivery.requestUrl) {
      return buildTaskResult('AUTO_RETRY', startedAt, {
        scanned_count: 1,
        skipped_count: 1,
        error_message: '投递记录状态或请求地址不满足自动重试条件。',
      });
    }

    const retryDeliveryId = `csd_${randomUUID().replaceAll('-', '')}`;
    const requestHeaders = parseHeaders(delivery.requestHeaders);
    const requestBody = normalizeJson(delivery.requestBody);
    const retry = await this.prisma.channelSenderDelivery.create({
      data: {
        tenantId: delivery.tenantId,
        channelId: delivery.channelId,
        agentId: delivery.agentId,
        deliveryId: retryDeliveryId,
        parentDeliveryId: delivery.id,
        provider: delivery.provider,
        target: delivery.target,
        requestUrl: delivery.requestUrl,
        requestBody: toNullableJsonInput(requestBody),
        requestHeaders: requestHeaders as Prisma.InputJsonValue,
        status: 'RETRYING',
        retryCount: delivery.retryCount + 1,
        conversationId: delivery.conversationId,
        runId: delivery.runId,
        traceId: delivery.traceId,
        externalConversationId: delivery.externalConversationId,
        externalMessageId: delivery.externalMessageId,
      },
      include: {
        channel: {
          include: {
            agent: true,
          },
        },
        agent: true,
      },
    });

    const executeStartedAt = Date.now();
    let result: ChannelSenderResult;
    try {
      const response = await postJson(delivery.requestUrl, requestBody, requestHeaders, senderTimeoutMs(delivery.channel));
      assertRetryProviderSuccess(delivery.provider, delivery.requestUrl, response.body);
      result = sent(delivery.provider as ChannelCallbackProvider, delivery.target, response.status, response.body);
    } catch (error) {
      result = {
        status: 'FAILED',
        provider: delivery.provider as ChannelCallbackProvider,
        target: delivery.target,
        responseStatus: null,
        responseBody: null,
        errorMessage: error instanceof Error ? error.message : '渠道主动回复自动重试失败。',
      };
    }

    const updated = await this.updateDeliveryRecord(retry.id, result, Date.now() - executeStartedAt);
    await this.recordTaskRetryResult(updated, result, requestId);

    return buildTaskResult('AUTO_RETRY', startedAt, {
      scanned_count: 1,
      retried_count: 1,
      success_count: result.status === 'SENT' ? 1 : 0,
      failed_count: result.status === 'SENT' ? 0 : 1,
      error_message: result.status === 'SENT' ? null : result.errorMessage,
    });
  }

  private async buildDeliveryWhere(
    currentUser: AuthenticatedUser,
    query: ListChannelSenderDeliveriesQuery,
  ): Promise<Prisma.ChannelSenderDeliveryWhereInput> {
    const channelWhere: Prisma.AgentPublishChannelWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    const agentScope = await this.dataScopeQuery.buildWhere<Prisma.AgentWhereInput>(currentUser, 'AGENT');
    const agentWhere: Prisma.AgentWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    mergeDataScopeWhere(agentWhere, agentScope.where);
    channelWhere.agent = agentWhere;

    const where: Prisma.ChannelSenderDeliveryWhereInput = {
      tenantId: currentUser.tenantId,
      channel: channelWhere,
    };
    if (query.channel_id) where.channelId = query.channel_id;
    if (isDeliveryStatus(query.status)) where.status = query.status;
    if (isProvider(query.provider)) where.provider = query.provider;

    return where;
  }

  private async findTenantDelivery(currentUser: AuthenticatedUser, deliveryId: string): Promise<DeliveryRecord> {
    const where = await this.buildDeliveryWhere(currentUser, {});
    const delivery = await this.prisma.channelSenderDelivery.findFirst({
      where: {
        ...where,
        deliveryId,
      },
      include: {
        channel: {
          include: {
            agent: true,
          },
        },
        agent: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Channel sender delivery not found');
    }

    return delivery;
  }

  private async buildPlan(input: SenderInput): Promise<DispatchPlan> {
    if (readConfigBoolean(input.channel.config, 'sender_disabled')) {
      return skippedPlan(input.message.provider, '渠道已配置 sender_disabled，跳过主动发送。');
    }

    switch (input.message.provider) {
      case 'WECHAT_WORK':
        return this.buildWechatWorkPlan(input);
      case 'DINGTALK':
        return this.buildDingTalkPlan(input);
      case 'FEISHU':
        return this.buildFeishuPlan(input);
      case 'SLACK':
        return this.buildSlackPlan(input);
      case 'CUSTOM_WEBHOOK':
      default:
        return this.buildCustomWebhookPlan(input);
    }
  }

  private async buildWechatWorkPlan(input: SenderInput): Promise<DispatchPlan> {
    const credential = readChannelCredential(input.channel);
    const accessToken = await this.resolveWechatWorkAccessToken(input.channel, credential);
    const agentId = credential.wechat_work_agent_id ?? readConfigString(input.channel.config, 'wechat_work_agent_id');
    const toUser = input.message.senderId ?? readConfigString(input.channel.config, 'wechat_work_default_touser') ?? '@all';
    if (!accessToken || !agentId) {
      return skippedPlan(input.message.provider, '企业微信 access_token 或 agent_id 未配置。');
    }

    return {
      provider: input.message.provider,
      target: toUser,
      requestUrl: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${encodeURIComponent(accessToken)}`,
      requestBody: {
        touser: toUser,
        msgtype: 'text',
        agentid: Number(agentId),
        text: {
          content: input.answer,
        },
        safe: 0,
      },
      requestHeaders: {},
      timeoutMs: senderTimeoutMs(input.channel),
      skipReason: null,
      successAssertion: {
        codeKey: 'errcode',
        successValue: 0,
        errorKey: 'errmsg',
      },
    };
  }

  private buildDingTalkPlan(input: SenderInput): DispatchPlan {
    const credential = readChannelCredential(input.channel);
    const webhook = input.message.responseUrl
      ?? readConfigString(input.channel.config, 'dingtalk_session_webhook')
      ?? readConfigString(input.channel.config, 'sender_webhook_url')
      ?? readConfigString(input.channel.config, 'webhook_url');
    if (!webhook) {
      return skippedPlan(input.message.provider, '钉钉 sessionWebhook 或 sender_webhook_url 未配置。');
    }

    return {
      provider: input.message.provider,
      target: redactUrl(webhook),
      requestUrl: appendDingTalkSign(webhook, credential.dingtalk_sign_secret ?? readConfigString(input.channel.config, 'dingtalk_sign_secret')),
      requestBody: {
        msgtype: 'text',
        text: {
          content: input.answer,
        },
      },
      requestHeaders: {},
      timeoutMs: senderTimeoutMs(input.channel),
      skipReason: null,
      successAssertion: {
        codeKey: 'errcode',
        successValue: 0,
        errorKey: 'errmsg',
      },
    };
  }

  private buildFeishuPlan(input: SenderInput): DispatchPlan {
    const webhook = input.message.responseUrl
      ?? readConfigString(input.channel.config, 'sender_webhook_url')
      ?? readConfigString(input.channel.config, 'webhook_url');
    if (webhook) {
      return {
        provider: input.message.provider,
        target: redactUrl(webhook),
        requestUrl: webhook,
        requestBody: {
          msg_type: 'text',
          content: {
            text: input.answer,
          },
        },
        requestHeaders: {},
        timeoutMs: senderTimeoutMs(input.channel),
        skipReason: null,
      };
    }

    const credential = readChannelCredential(input.channel);
    const token = credential.feishu_tenant_access_token
      ?? credential.feishu_bot_access_token
      ?? readConfigString(input.channel.config, 'feishu_tenant_access_token')
      ?? readConfigString(input.channel.config, 'feishu_bot_access_token');
    const receiveId = input.message.externalConversationId ?? input.message.senderId ?? readConfigString(input.channel.config, 'feishu_default_receive_id');
    const receiveIdType = input.message.externalConversationId
      ? readConfigString(input.channel.config, 'feishu_receive_id_type') ?? 'chat_id'
      : readConfigString(input.channel.config, 'feishu_receive_id_type') ?? 'open_id';
    if (!token || !receiveId) {
      return skippedPlan(input.message.provider, '飞书 token 或 receive_id 未配置。');
    }

    return {
      provider: input.message.provider,
      target: `${receiveIdType}:${receiveId}`,
      requestUrl: `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${encodeURIComponent(receiveIdType)}`,
      requestBody: {
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text: input.answer }),
      },
      requestHeaders: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: senderTimeoutMs(input.channel),
      skipReason: null,
      successAssertion: {
        codeKey: 'code',
        successValue: 0,
        errorKey: 'msg',
      },
    };
  }

  private buildSlackPlan(input: SenderInput): DispatchPlan {
    const webhook = input.message.responseUrl
      ?? readConfigString(input.channel.config, 'sender_webhook_url')
      ?? readConfigString(input.channel.config, 'webhook_url');
    if (webhook) {
      return {
        provider: input.message.provider,
        target: redactUrl(webhook),
        requestUrl: webhook,
        requestBody: {
          text: input.answer,
        },
        requestHeaders: {},
        timeoutMs: senderTimeoutMs(input.channel),
        skipReason: null,
      };
    }

    const credential = readChannelCredential(input.channel);
    const token = credential.slack_bot_token ?? readConfigString(input.channel.config, 'slack_bot_token');
    const channelId = input.message.externalConversationId ?? readConfigString(input.channel.config, 'slack_default_channel_id');
    if (!token || !channelId) {
      return skippedPlan(input.message.provider, 'Slack bot token 或 channel 未配置。');
    }

    return {
      provider: input.message.provider,
      target: channelId,
      requestUrl: 'https://slack.com/api/chat.postMessage',
      requestBody: {
        channel: channelId,
        text: input.answer,
        thread_ts: input.message.externalMessageId ?? undefined,
      },
      requestHeaders: {
        Authorization: `Bearer ${token}`,
      },
      timeoutMs: senderTimeoutMs(input.channel),
      skipReason: null,
      successAssertion: {
        codeKey: 'ok',
        successValue: true,
        errorKey: 'error',
      },
    };
  }

  private buildCustomWebhookPlan(input: SenderInput): DispatchPlan {
    const webhook = input.message.responseUrl
      ?? readConfigString(input.channel.config, 'sender_webhook_url')
      ?? readConfigString(input.channel.config, 'webhook_url')
      ?? input.channel.callbackUrl;
    if (!webhook) {
      return skippedPlan(input.message.provider, '自定义 sender_webhook_url 或 callback_url 未配置。');
    }

    const body = {
      channel_id: input.channel.id,
      agent_id: input.channel.agentId,
      conversation_id: input.conversationId,
      run_id: input.runId,
      trace_id: input.traceId,
      external_conversation_id: input.message.externalConversationId,
      external_message_id: input.message.externalMessageId,
      text: input.answer,
    };

    return {
      provider: input.message.provider,
      target: redactUrl(webhook),
      requestUrl: webhook,
      requestBody: body,
      requestHeaders: buildCustomWebhookHeaders(input.channel, body),
      timeoutMs: senderTimeoutMs(input.channel),
      skipReason: null,
    };
  }

  private async executePlan(plan: DispatchPlan): Promise<ChannelSenderResult> {
    if (!plan.requestUrl) {
      return skipped(plan.provider, plan.skipReason ?? '渠道主动回复目标未配置。', plan.target);
    }

    const response = await postJson(plan.requestUrl, plan.requestBody, plan.requestHeaders, plan.timeoutMs);
    if (plan.successAssertion) {
      assertProviderSuccess(
        response.body,
        plan.successAssertion.codeKey,
        plan.successAssertion.successValue,
        plan.successAssertion.errorKey,
      );
    }

    return sent(plan.provider, plan.target, response.status, response.body);
  }

  private async resolveWechatWorkAccessToken(channel: ChannelRecord, credential: Record<string, string>) {
    const configured = credential.wechat_work_access_token ?? readConfigString(channel.config, 'wechat_work_access_token');
    if (configured) return configured;

    const corpId = credential.wechat_work_corp_id ?? readConfigString(channel.config, 'wechat_work_corp_id');
    const corpSecret = credential.wechat_work_corp_secret ?? readConfigString(channel.config, 'wechat_work_corp_secret');
    if (!corpId || !corpSecret) return null;

    const cacheKey = `${channel.id}:${corpId}`;
    const cached = this.wechatAccessTokens.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

    const response = await fetchJson(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpId)}&corpsecret=${encodeURIComponent(corpSecret)}`,
      {
        method: 'GET',
      },
      senderTimeoutMs(channel),
    );
    assertProviderSuccess(response.body, 'errcode', 0, 'errmsg');
    const body = asRecord(response.body);
    const token = pickFirstString(body.access_token);
    const expiresIn = Number(body.expires_in ?? 7200);
    if (!token) return null;

    this.wechatAccessTokens.set(cacheKey, {
      token,
      expiresAt: Date.now() + Math.max(300, expiresIn - 120) * 1000,
    });

    return token;
  }

  private async createDeliveryRecord(
    input: {
      request: RequestWithContext;
      channel: ChannelRecord;
      operator: AuthenticatedUser;
      message: ChannelSenderMessage;
      conversationId: string | null;
      runId: string | null;
      traceId: string | null;
    },
    plan: DispatchPlan,
    parentDeliveryId: string | null,
    retryCount: number,
  ) {
    return this.prisma.channelSenderDelivery.create({
      data: {
        tenantId: input.operator.tenantId,
        channelId: input.channel.id,
        agentId: input.channel.agentId,
        deliveryId: `csd_${randomUUID().replaceAll('-', '')}`,
        parentDeliveryId,
        provider: plan.provider,
        target: plan.target,
        requestUrl: plan.requestUrl,
        status: 'PENDING',
        requestBody: plan.requestBody === null ? Prisma.JsonNull : toJsonValue(plan.requestBody),
        requestHeaders: plan.requestHeaders as Prisma.InputJsonValue,
        retryCount,
        conversationId: input.conversationId,
        runId: input.runId,
        traceId: input.traceId ?? input.request.traceId ?? null,
        externalConversationId: input.message.externalConversationId,
        externalMessageId: input.message.externalMessageId,
      },
    });
  }

  private async updateDeliveryRecord(
    id: string,
    result: ChannelSenderResult,
    latencyMs: number | null,
  ): Promise<DeliveryRecord> {
    return this.prisma.channelSenderDelivery.update({
      where: { id },
      data: {
        status: toDeliveryStatus(result.status),
        responseStatus: result.responseStatus,
        responseBody: result.responseBody === null ? null : truncateResponse(result.responseBody),
        latencyMs,
        errorMessage: result.errorMessage,
        deliveredAt: new Date(),
      },
      include: {
        channel: {
          include: {
            agent: true,
          },
        },
        agent: true,
      },
    });
  }

  private async recordResult(
    input: {
      request: RequestWithContext;
      channel: ChannelRecord;
      operator: AuthenticatedUser;
      message: ChannelSenderMessage;
      answer: string | null;
      conversationId: string | null;
      runId: string | null;
      traceId: string | null;
    },
    result: ChannelSenderResult,
    deliveryId: string,
  ) {
    const event = await this.platformEvents.recordEvent({
      tenantId: input.operator.tenantId,
      departmentId: input.operator.departmentId ?? null,
      userId: input.operator.id,
      actorType: 'CHANNEL',
      resourceType: 'CHANNEL',
      resourceId: input.channel.id,
      agentId: input.channel.agentId,
      channelId: input.channel.id,
      conversationId: input.conversationId,
      runId: input.runId,
      requestId: input.request.requestId ?? null,
      traceId: input.traceId ?? input.request.traceId ?? null,
      eventSource: 'CHANNEL_SENDER',
      eventType: result.status === 'SENT'
        ? 'channel.sender.sent'
        : result.status === 'SKIPPED'
          ? 'channel.sender.skipped'
          : 'channel.sender.failed',
      status: result.status === 'SENT' || result.status === 'SKIPPED' ? 'SUCCESS' : 'FAILED',
      severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
      billable: false,
      summary: senderSummary(result),
      payloadJson: {
        delivery_id: deliveryId,
        provider: result.provider,
        target: result.target,
        response_status: result.responseStatus,
        response_body: result.responseBody === null ? null : toJsonValue(sanitizeResponse(result.responseBody)),
        error_message: result.errorMessage,
        external_conversation_id: input.message.externalConversationId,
        external_message_id: input.message.externalMessageId,
      },
      sourceSystem: 'channel_sender',
      sourceId: deliveryId,
    });

    await this.platformEvents.recordUsage({
      tenantId: input.operator.tenantId,
      departmentId: input.operator.departmentId ?? null,
      userId: input.operator.id,
      subjectType: 'CHANNEL',
      subjectId: input.channel.id,
      resourceType: 'CHANNEL',
      resourceId: input.channel.id,
      metricType: result.status === 'SENT'
        ? 'channel_sender_messages'
        : result.status === 'SKIPPED'
          ? 'channel_sender_skipped'
          : 'channel_sender_failed',
      unit: 'message',
      quantity: 1,
      billable: false,
      costSource: result.status === 'FAILED' ? 'FAILED' : 'CHANNEL_SENDER',
      traceId: input.traceId ?? input.request.traceId ?? null,
      requestId: input.request.requestId ?? null,
      eventId: event.id,
      sourceSystem: 'channel_sender',
      sourceId: deliveryId,
    });

    return result;
  }

  private async recordRetryOperation(
    currentUser: AuthenticatedUser,
    delivery: DeliveryRecord,
    result: ChannelSenderResult,
  ) {
    const event = await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'CHANNEL',
      resourceId: delivery.channelId,
      agentId: delivery.agentId,
      channelId: delivery.channelId,
      conversationId: delivery.conversationId,
      runId: delivery.runId,
      requestId: currentUser.requestId ?? null,
      traceId: delivery.traceId ?? currentUser.traceId ?? null,
      eventSource: 'CHANNEL_SENDER',
      eventType: result.status === 'SENT' ? 'channel.sender.retry_sent' : 'channel.sender.retry_failed',
      status: result.status === 'SENT' ? 'SUCCESS' : 'FAILED',
      severity: result.status === 'SENT' ? 'INFO' : 'WARN',
      billable: false,
      summary: result.status === 'SENT'
        ? `渠道主动回复重试成功：${providerLabel(result.provider)}`
        : `渠道主动回复重试失败：${result.errorMessage ?? providerLabel(result.provider)}`,
      payloadJson: {
        delivery_id: delivery.deliveryId,
        parent_delivery_id: delivery.parentDeliveryId,
        provider: delivery.provider,
        target: delivery.target,
        response_status: delivery.responseStatus,
        error_message: result.errorMessage,
      },
      sourceSystem: 'channel_sender',
      sourceId: delivery.deliveryId,
    });

    await this.platformEvents.recordUsage({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      subjectType: 'CHANNEL',
      subjectId: delivery.channelId,
      resourceType: 'CHANNEL',
      resourceId: delivery.channelId,
      metricType: result.status === 'SENT' ? 'channel_sender_retry_messages' : 'channel_sender_retry_failed',
      unit: 'message',
      quantity: 1,
      billable: false,
      costSource: result.status === 'SENT' ? 'CHANNEL_SENDER' : 'FAILED',
      traceId: delivery.traceId ?? currentUser.traceId ?? null,
      requestId: currentUser.requestId ?? null,
      eventId: event.id,
      sourceSystem: 'channel_sender',
      sourceId: delivery.deliveryId,
    });

    await this.prisma.operationLog.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: currentUser.id,
        module: 'channel_sender',
        action: 'retry',
        method: 'POST',
        path: `/channels/sender-deliveries/${delivery.deliveryId}/retry`,
        statusCode: result.status === 'SENT' ? 200 : 502,
        requestId: currentUser.requestId ?? delivery.deliveryId,
        requestSummary: {
          delivery_id: delivery.deliveryId,
          parent_delivery_id: delivery.parentDeliveryId,
          channel_id: delivery.channelId,
          agent_id: delivery.agentId,
          provider: delivery.provider,
          status: delivery.status,
          response_status: delivery.responseStatus,
          latency_ms: delivery.latencyMs,
          trace_id: delivery.traceId,
          run_id: delivery.runId,
          platform_event_id: event.id,
        } as Prisma.InputJsonObject,
        errorMessage: result.errorMessage,
      },
    });
  }

  private async recordTaskRetryResult(delivery: DeliveryRecord, result: ChannelSenderResult, requestId: string) {
    const event = await this.platformEvents.recordEvent({
      tenantId: delivery.tenantId,
      actorType: 'SYSTEM',
      resourceType: 'CHANNEL',
      resourceId: delivery.channelId,
      agentId: delivery.agentId,
      channelId: delivery.channelId,
      conversationId: delivery.conversationId,
      runId: delivery.runId,
      requestId,
      traceId: delivery.traceId,
      eventSource: 'CHANNEL_SENDER_TASK',
      eventType: result.status === 'SENT' ? 'channel.sender.auto_retry_sent' : 'channel.sender.auto_retry_failed',
      status: result.status === 'SENT' ? 'SUCCESS' : 'FAILED',
      severity: result.status === 'SENT' ? 'INFO' : 'WARN',
      billable: false,
      summary: result.status === 'SENT'
        ? `渠道主动回复自动重试成功：${providerLabel(result.provider)}`
        : `渠道主动回复自动重试失败：${result.errorMessage ?? providerLabel(result.provider)}`,
      payloadJson: {
        delivery_id: delivery.deliveryId,
        parent_delivery_id: delivery.parentDeliveryId,
        provider: delivery.provider,
        target: delivery.target,
        response_status: delivery.responseStatus,
        error_message: result.errorMessage,
      },
      sourceSystem: 'channel_sender_task',
      sourceId: delivery.deliveryId,
    });

    await this.platformEvents.recordUsage({
      tenantId: delivery.tenantId,
      subjectType: 'CHANNEL',
      subjectId: delivery.channelId,
      resourceType: 'CHANNEL',
      resourceId: delivery.channelId,
      metricType: result.status === 'SENT' ? 'channel_sender_auto_retry_messages' : 'channel_sender_auto_retry_failed',
      unit: 'message',
      quantity: 1,
      billable: false,
      costSource: result.status === 'SENT' ? 'CHANNEL_SENDER_TASK' : 'FAILED',
      traceId: delivery.traceId,
      requestId,
      eventId: event.id,
      sourceSystem: 'channel_sender_task',
      sourceId: delivery.deliveryId,
    });
  }
}

type SenderInput = {
  request: RequestWithContext;
  channel: ChannelRecord;
  operator: AuthenticatedUser;
  message: ChannelSenderMessage;
  answer: string;
  conversationId: string | null;
  runId: string | null;
  traceId: string | null;
};

function sent(provider: ChannelCallbackProvider, target: string | null, responseStatus: number, responseBody: unknown): ChannelSenderResult {
  return {
    status: 'SENT',
    provider,
    target,
    responseStatus,
    responseBody,
    errorMessage: null,
  };
}

function skipped(provider: ChannelCallbackProvider, reason: string, target: string | null = null): ChannelSenderResult {
  return {
    status: 'SKIPPED',
    provider,
    target,
    responseStatus: null,
    responseBody: null,
    errorMessage: reason,
  };
}

function skippedPlan(provider: ChannelCallbackProvider, reason: string): DispatchPlan {
  return {
    provider,
    target: null,
    requestUrl: null,
    requestBody: null,
    requestHeaders: {},
    timeoutMs: 15000,
    skipReason: reason,
  };
}

function senderSummary(result: ChannelSenderResult) {
  if (result.status === 'SENT') return `渠道主动回复已发送：${providerLabel(result.provider)}`;
  if (result.status === 'SKIPPED') return `渠道主动回复已跳过：${result.errorMessage}`;

  return `渠道主动回复失败：${result.errorMessage ?? providerLabel(result.provider)}`;
}

async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs: number) {
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  }, timeoutMs);
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseMaybeJsonObject(text) ?? text;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${truncate(String(text), 500)}`);
    }

    return {
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

function assertProviderSuccess(body: unknown, codeKey: string, successValue: unknown, errorKey: string) {
  const record = asRecord(body);
  if (record[codeKey] === successValue) return;

  throw new Error(pickFirstString(record[errorKey], record.error, record.message) ?? `Provider response ${codeKey}=${String(record[codeKey])}`);
}

function assertRetryProviderSuccess(provider: string, requestUrl: string, body: unknown) {
  if (provider === 'WECHAT_WORK') {
    assertProviderSuccess(body, 'errcode', 0, 'errmsg');
    return;
  }
  if (provider === 'DINGTALK') {
    assertProviderSuccess(body, 'errcode', 0, 'errmsg');
    return;
  }
  if (provider === 'FEISHU' && requestUrl.includes('/im/v1/messages')) {
    assertProviderSuccess(body, 'code', 0, 'msg');
    return;
  }
  if (provider === 'SLACK' && requestUrl.includes('/chat.postMessage')) {
    assertProviderSuccess(body, 'ok', true, 'error');
  }
}

function appendDingTalkSign(url: string, secret: string | null) {
  if (!secret) return url;
  const timestamp = Date.now().toString();
  const sign = encodeURIComponent(createHmac('sha256', secret).update(`${timestamp}\n${secret}`).digest('base64'));
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}timestamp=${timestamp}&sign=${sign}`;
}

function buildCustomWebhookHeaders(channel: ChannelRecord, body: unknown) {
  const credential = readChannelCredential(channel);
  const secret = credential.sender_secret ?? credential.secret ?? readConfigString(channel.config, 'sender_secret');
  if (!secret) return {} as Record<string, string>;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify(body);

  return {
    'x-aiaget-timestamp': timestamp,
    'x-aiaget-signature': `sha256=${createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')}`,
  };
}

function senderTimeoutMs(channel: ChannelRecord) {
  const value = readConfigNumber(channel.config, 'sender_timeout_ms');

  return Math.min(Math.max(value ?? 15000, 1000), 60000);
}

function readConfigString(config: Prisma.JsonValue | null, key: string) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const value = (config as Record<string, unknown>)[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readConfigNumber(config: Prisma.JsonValue | null, key: string) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const value = (config as Record<string, unknown>)[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readConfigBoolean(config: Prisma.JsonValue | null, key: string) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;

  return (config as Record<string, unknown>)[key] === true;
}

function readSenderPolicy(config: Prisma.JsonValue | null): Omit<ChannelSenderPolicy, 'updated_at'> {
  const configObject = asRecord(config);
  const policy = asRecord(configObject.sender_policy);

  return {
    auto_retry_enabled: typeof policy.auto_retry_enabled === 'boolean' ? policy.auto_retry_enabled : false,
    manual_retry_enabled: typeof policy.manual_retry_enabled === 'boolean' ? policy.manual_retry_enabled : true,
    max_retry_count: clampInteger(policy.max_retry_count, 0, 10, 3),
    retry_backoff_seconds: clampInteger(policy.retry_backoff_seconds, 1, 3600, 60),
    retry_on_statuses: normalizeStatusCodes(policy.retry_on_statuses),
    alert_on_failure: typeof policy.alert_on_failure === 'boolean' ? policy.alert_on_failure : true,
    retention_days: clampInteger(policy.retention_days, 1, 365, 30),
  };
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return fallback;

  return Math.min(Math.max(numberValue, min), max);
}

function normalizeStatusCodes(value: unknown) {
  if (!Array.isArray(value)) return [408, 429, 500, 502, 503, 504];

  return Array.from(new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 400 && item <= 599),
  )).slice(0, 20);
}

function readChannelCredential(channel: ChannelRecord): Record<string, string> {
  const output: Record<string, string> = {};
  if (!channel.secretEncrypted) return output;

  const decrypted = decryptSecret(channel.secretEncrypted).trim();
  if (!decrypted) return output;
  if (!decrypted.startsWith('{')) {
    output.secret = decrypted;
    return output;
  }

  const parsed = parseMaybeJsonObject(decrypted);
  if (!parsed) return output;

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string' && value.trim()) {
      output[key] = value.trim();
    }
  }

  return output;
}

function parseMaybeJsonObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return null;
}

function sanitizeResponse(value: unknown) {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) return value;

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : entry,
    ]),
  );
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as Prisma.InputJsonValue;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toNullableJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull;

  return toJsonValue(value);
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (value === null) return null;

  return JSON.parse(JSON.stringify(value)) as unknown;
}

function truncate(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit)}...`;
}

function truncateResponse(value: unknown) {
  if (typeof value === 'string') return truncate(value, RESPONSE_BODY_LIMIT);

  return truncate(JSON.stringify(sanitizeResponse(value)), RESPONSE_BODY_LIMIT);
}

function redactUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    for (const key of Array.from(url.searchParams.keys())) {
      if (isSensitiveKey(key)) {
        url.searchParams.set(key, '***');
      }
    }

    return url.toString();
  } catch {
    return value;
  }
}

function maskHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, isSensitiveKey(key) ? '[REDACTED]' : value]),
  );
}

function parseHeaders(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, typeof entry === 'string' ? entry : JSON.stringify(entry)]),
  );
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();

  return normalized.includes('token') || normalized.includes('key') || normalized.includes('secret') || normalized.includes('authorization') || normalized.includes('sign');
}

function toDeliveryStatus(status: ChannelSenderResult['status']): ChannelSenderDeliveryStatus {
  if (status === 'SENT') return 'SUCCESS';
  if (status === 'SKIPPED') return 'SKIPPED';

  return 'FAILED';
}

function mapDeliveryListItem(delivery: DeliveryRecord): ChannelSenderDeliveryListItem {
  return {
    id: delivery.id,
    delivery_id: delivery.deliveryId,
    parent_delivery_id: delivery.parentDeliveryId,
    tenant_id: delivery.tenantId,
    channel_id: delivery.channelId,
    channel_name: delivery.channel.name ?? delivery.channel.channel,
    channel_type: delivery.channel.channel as PublishChannelType,
    agent_id: delivery.agentId,
    agent_name: delivery.agent?.name ?? delivery.channel.agent?.name ?? null,
    provider: delivery.provider as ChannelCallbackProvider,
    target: delivery.target ?? redactUrl(delivery.requestUrl),
    status: delivery.status as ChannelSenderDeliveryStatus,
    response_status: delivery.responseStatus,
    latency_ms: delivery.latencyMs,
    retry_count: delivery.retryCount,
    conversation_id: delivery.conversationId,
    run_id: delivery.runId,
    trace_id: delivery.traceId,
    external_conversation_id: delivery.externalConversationId,
    external_message_id: delivery.externalMessageId,
    error_message: delivery.errorMessage,
    delivered_at: delivery.deliveredAt?.toISOString() ?? null,
    created_at: delivery.createdAt.toISOString(),
  };
}

function mapDeliveryDetail(delivery: DeliveryRecord): ChannelSenderDeliveryDetail {
  return {
    ...mapDeliveryListItem(delivery),
    request_body: normalizeJson(delivery.requestBody),
    request_headers: maskHeaders(parseHeaders(delivery.requestHeaders)),
    response_body: delivery.responseBody,
    updated_at: delivery.updatedAt.toISOString(),
  };
}

function isDeliveryStatus(value: unknown): value is ChannelSenderDeliveryStatus {
  return value === 'PENDING' || value === 'SUCCESS' || value === 'FAILED' || value === 'SKIPPED' || value === 'RETRYING';
}

function isProvider(value: unknown): value is ChannelCallbackProvider {
  return value === 'WECHAT_WORK' || value === 'DINGTALK' || value === 'FEISHU' || value === 'SLACK' || value === 'CUSTOM_WEBHOOK';
}

function providerLabel(provider: ChannelCallbackProvider) {
  const labels: Record<ChannelCallbackProvider, string> = {
    WECHAT_WORK: '企业微信',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return labels[provider];
}

function buildTaskResult(
  task: ChannelSenderTaskRunResult['task'],
  startedAt: Date,
  input: Partial<Omit<ChannelSenderTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>>,
): ChannelSenderTaskRunResult {
  const failedCount = input.failed_count ?? 0;

  return {
    task,
    status: failedCount > 0 ? 'FAILED' : input.retried_count || input.deleted_count || input.skipped_count || input.scanned_count ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    retried_count: input.retried_count ?? 0,
    success_count: input.success_count ?? 0,
    failed_count: failedCount,
    skipped_count: input.skipped_count ?? 0,
    deleted_count: input.deleted_count ?? 0,
    error_message: input.error_message ?? null,
  };
}
