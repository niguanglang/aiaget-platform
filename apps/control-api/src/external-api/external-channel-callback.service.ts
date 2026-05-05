import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createDecipheriv, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { expandPermissionCodes } from '@aiaget/shared-types';
import type {
  ChannelCallbackProvider,
  ChannelCallbackResult,
  ConversationDetail,
  ConversationRunItem,
  ExternalAgentChatResponse,
  PublishChannelType,
} from '@aiaget/shared-types';

import type { AuthenticatedUser, RequestWithContext } from '../common/types/request-context';
import { redactChannelAuditValue } from '../channels/channel-audit-redaction';
import { ConversationsService } from '../conversations/conversations.service';
import { decryptSecret } from '../models/model-secrets';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalChannelRolloutGateService } from './external-channel-rollout-gate.service';
import { ExternalChannelSenderService } from './external-channel-sender.service';

const callbackChannelTypes = new Set<PublishChannelType>([
  'WECHAT_WORK',
  'DINGTALK',
  'FEISHU',
  'SLACK',
  'CUSTOM_WEBHOOK',
]);

const DEFAULT_PENDING_ASYNC_CALLBACK_REPLY_LIMIT = 20;
const MAX_PENDING_ASYNC_CALLBACK_REPLY_LIMIT = 100;

const channelInclude = {
  agent: true,
  account: {
    include: {
      provider: true,
    },
  },
} satisfies Prisma.AgentPublishChannelInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;
const asyncCallbackReplyInclude = {
  publishChannel: {
    include: channelInclude,
  },
} satisfies Prisma.ChannelReplyInclude;

type AsyncCallbackReplyRecord = Prisma.ChannelReplyGetPayload<{ include: typeof asyncCallbackReplyInclude }>;
type CallbackUserRecord = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

interface ParsedCallbackMessage {
  provider: ChannelCallbackProvider;
  text: string | null;
  externalConversationId: string | null;
  externalMessageId: string | null;
  senderId: string | null;
  responseUrl: string | null;
  eventType: string | null;
}

interface CallbackHandleResult {
  result: ChannelCallbackResult;
  response: unknown;
}

interface CallbackExecutionContext {
  request: RequestWithContext;
  channel: ChannelRecord;
  operator: AuthenticatedUser;
  parsed: ParsedCallbackMessage;
  receivedEventId: string;
  replyId: string;
}

export interface ProcessPendingAsyncCallbackRepliesOptions {
  limit?: number;
  replyId?: string;
  requestId?: string;
  traceId?: string;
}

export interface ProcessPendingAsyncCallbackRepliesResult {
  scanned_count: number;
  processed_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
}

@Injectable()
export class ExternalChannelCallbackService {
  private readonly asyncCallbackContextOverrides = new Map<string, CallbackExecutionContext>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConversationsService) private readonly conversations: ConversationsService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(ExternalChannelRolloutGateService) private readonly rolloutGate: ExternalChannelRolloutGateService,
    @Inject(ExternalChannelSenderService) private readonly channelSender: ExternalChannelSenderService,
  ) {}

  async verify(channelId: string, query: Record<string, unknown>) {
    const channel = await this.findChannel(channelId);
    const provider = normalizeProvider(channel.channel);
    const queryRecord = asRecord(query);
    const challenge = pickFirstString(query.challenge, query.echostr, query.echo);
    if (provider === 'WECHAT_WORK' && challenge) {
      const decrypted = this.verifyAndDecryptWechatWorkEcho(channel, queryRecord);
      return decrypted ?? challenge;
    }

    return {
      success: true,
      channel_id: channel.id,
      channel: channel.channel,
      challenge: challenge ?? null,
    };
  }

  async handle(
    request: RequestWithContext,
    channelId: string,
    body: unknown,
  ): Promise<CallbackHandleResult> {
    const channel = await this.findChannel(channelId);
    const provider = normalizeProvider(channel.channel);
    request.externalChannelId = channel.id;
    const normalizedBody = this.normalizeIncomingBody(provider, channel, request, body);

    this.ensureCallbackAvailable(channel);
    this.verifySignatureIfRequired(channel, request, normalizedBody);

    const challengeResponse = buildChallengeResponse(provider, normalizedBody);
    if (challengeResponse) {
      return {
        result: {
          success: true,
          ignored: true,
          provider,
          channel_id: channel.id,
          agent_id: channel.agentId,
          conversation_id: null,
          run_id: null,
          trace_id: request.traceId ?? null,
          answer: null,
          message: '渠道 URL 校验已响应。',
          external_message_id: null,
        },
        response: challengeResponse,
      };
    }

    const operator = await this.resolveCallbackUser(channel, request);
    request.user = operator;

    const parsed = parseCallbackMessage(provider, normalizedBody);
    const reply = await this.createReplyRecord(request, channel, parsed, normalizedBody, 'RECEIVED');
    const gateDecision = await this.rolloutGate.evaluateForCallback(request, operator, channel, {
      source: 'channel_callback',
      stableKey: callbackStableKey(parsed),
    });
    const receivedEvent = await this.recordCallbackEvent(request, operator, channel, parsed, {
      eventType: 'channel.callback.received',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: `收到${callbackProviderLabel(provider)}渠道回调`,
    });

    if (!parsed.text) {
      const result: ChannelCallbackResult = {
        success: true,
        ignored: true,
        provider,
        channel_id: channel.id,
        agent_id: channel.agentId,
        conversation_id: null,
        run_id: null,
        trace_id: request.traceId ?? null,
        answer: null,
        message: '已忽略非文本或空消息。',
        external_message_id: parsed.externalMessageId,
      };

      await this.recordCallbackUsage(request, operator, channel, receivedEvent.id, result, 1, 'channel_callback_ignored');
      await this.updateReplyRecord(reply.id, {
        status: 'IGNORED',
        conversationId: null,
        messageId: null,
        traceId: result.trace_id ?? request.traceId ?? null,
      });
      return {
        result,
        response: buildProviderResponse(provider, result),
      };
    }

    if (!gateDecision.allowed) {
      const result: ChannelCallbackResult = {
        success: true,
        ignored: true,
        provider,
        channel_id: channel.id,
        agent_id: channel.agentId,
        conversation_id: null,
        run_id: null,
        trace_id: gateDecision.trace_id ?? request.traceId ?? null,
        answer: null,
        message: `当前消息未命中 ${gateDecision.rollout_percentage}% 灰度范围，已由渠道门控忽略。`,
        external_message_id: parsed.externalMessageId,
      };

      await this.recordCallbackUsage(request, operator, channel, receivedEvent.id, result, 1, 'channel_callback_rollout_blocked');
      await this.updateReplyRecord(reply.id, {
        status: 'IGNORED',
        conversationId: null,
        messageId: null,
        traceId: result.trace_id ?? request.traceId ?? null,
      });
      return {
        result,
        response: buildProviderResponse(provider, result),
      };
    }

    if (shouldAckImmediately(channel)) {
      const result: ChannelCallbackResult = {
        success: true,
        ignored: false,
        async_accepted: true,
        provider,
        channel_id: channel.id,
        agent_id: channel.agentId,
        conversation_id: null,
        run_id: null,
        trace_id: request.traceId ?? null,
        answer: null,
        message: '渠道回调已接收，Agent 将在后台执行。',
        external_message_id: parsed.externalMessageId,
      };

      this.asyncCallbackContextOverrides.set(reply.id, {
        request: cloneRequestContext(request),
        channel,
        operator,
        parsed,
        receivedEventId: receivedEvent.id,
        replyId: reply.id,
      });
      await this.recordCallbackUsage(request, operator, channel, receivedEvent.id, result, 1, 'channel_callback_async_accepted');
      void this.processPendingAsyncCallbackReplies({
        replyId: reply.id,
        limit: 1,
        requestId: request.requestId,
        traceId: request.traceId,
      })
        .catch(() => undefined)
        .finally(() => {
          this.asyncCallbackContextOverrides.delete(reply.id);
        });

      return {
        result,
        response: buildAckResponse(provider, result),
      };
    }

    try {
      const result = await this.executeCallbackTurn({
        request,
        channel,
        operator,
        parsed,
        receivedEventId: receivedEvent.id,
        replyId: reply.id,
      });

      return {
        result,
        response: buildProviderResponse(provider, result),
      };
    } catch (error) {
      await this.recordCallbackTurnFailure({
        request,
        channel,
        operator,
        parsed,
        receivedEventId: receivedEvent.id,
        replyId: reply.id,
      }, error, 'channel.callback.failed');

      throw error;
    }
  }

  async processPendingAsyncCallbackReplies(
    input: ProcessPendingAsyncCallbackRepliesOptions = {},
  ): Promise<ProcessPendingAsyncCallbackRepliesResult> {
    const replies = await this.prisma.channelReply.findMany({
      where: {
        ...(input.replyId ? { id: input.replyId } : {}),
        status: 'RECEIVED',
        direction: 'INBOUND',
        processedAt: null,
        deletedAt: null,
        publishChannel: {
          is: pendingAsyncCallbackChannelWhere(),
        },
      },
      include: asyncCallbackReplyInclude,
      orderBy: [
        { receivedAt: 'asc' },
        { createdAt: 'asc' },
      ],
      take: normalizePendingAsyncCallbackReplyLimit(input.limit),
    });

    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorMessage: string | null = null;

    for (const reply of replies) {
      const outcome = await this.processPendingAsyncCallbackReply(reply, input);
      if (outcome.status === 'processed') processedCount += 1;
      if (outcome.status === 'failed') failedCount += 1;
      if (outcome.status === 'skipped') skippedCount += 1;
      errorMessage ??= outcome.errorMessage ?? null;
    }

    return {
      scanned_count: replies.length,
      processed_count: processedCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
    };
  }

  private async processPendingAsyncCallbackReply(
    reply: AsyncCallbackReplyRecord,
    input: ProcessPendingAsyncCallbackRepliesOptions,
  ): Promise<{ status: 'processed' | 'failed' | 'skipped'; errorMessage?: string | null }> {
    const override = this.asyncCallbackContextOverrides.get(reply.id);
    if (override) {
      try {
        await this.executeCallbackTurn(override);
        return { status: 'processed' };
      } catch (error) {
        const result = await this.recordCallbackTurnFailure(override, error, 'channel.callback.async_failed');
        return { status: 'failed', errorMessage: result.message };
      } finally {
        this.asyncCallbackContextOverrides.delete(reply.id);
      }
    }

    const channel = reply.publishChannel;
    if (!channel || !shouldAckImmediately(channel)) {
      return { status: 'skipped' };
    }

    const request = buildRecoveredRequestContext(reply, input);
    request.externalChannelId = channel.id;
    const provider = normalizeProvider(channel.channel);
    const parsed = parsePersistedCallbackReply(provider, reply);
    if (!parsed.text) {
      await this.updateReplyRecord(reply.id, {
        status: 'IGNORED',
        conversationId: null,
        messageId: null,
        traceId: request.traceId ?? null,
      });
      return { status: 'skipped' };
    }

    let operator: AuthenticatedUser | null = null;
    let recoveredEventId: string | null = null;
    try {
      this.ensureCallbackAvailable(channel);
      operator = await this.resolveCallbackUser(channel, request);
      request.user = operator;
      const recoveredEvent = await this.recordCallbackEvent(request, operator, channel, parsed, {
        eventType: 'channel.callback.async_recovered',
        status: 'SUCCESS',
        severity: 'INFO',
        summary: `恢复${callbackProviderLabel(provider)}渠道异步回调`,
        payload: {
          reply_id: reply.id,
          reply_key: reply.replyKey,
        },
      });
      recoveredEventId = recoveredEvent.id;
      await this.executeCallbackTurn({
        request,
        channel,
        operator,
        parsed,
        receivedEventId: recoveredEvent.id,
        replyId: reply.id,
      });

      return { status: 'processed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : '渠道异步回调恢复执行失败。';
      if (operator && recoveredEventId) {
        const result = await this.recordCallbackTurnFailure({
          request,
          channel,
          operator,
          parsed,
          receivedEventId: recoveredEventId,
          replyId: reply.id,
        }, error, 'channel.callback.async_failed');
        return { status: 'failed', errorMessage: result.message };
      }

      await this.updateReplyRecord(reply.id, {
        status: 'FAILED',
        conversationId: null,
        messageId: null,
        traceId: request.traceId ?? null,
      });
      await this.updateChannelHealth(channel.id, false, `最近回调失败：${message}`);

      return { status: 'failed', errorMessage: message };
    }
  }

  private async recordCallbackTurnFailure(
    context: CallbackExecutionContext,
    error: unknown,
    eventType: string,
  ): Promise<ChannelCallbackResult> {
    const { request, channel, operator, parsed, receivedEventId, replyId } = context;
    const message = error instanceof Error ? error.message : '渠道回调执行失败。';
    const result: ChannelCallbackResult = {
      success: false,
      ignored: false,
      provider: parsed.provider,
      channel_id: channel.id,
      agent_id: channel.agentId,
      conversation_id: null,
      run_id: null,
      trace_id: request.traceId ?? null,
      answer: null,
      message,
      external_message_id: parsed.externalMessageId,
    };

    await this.recordCallbackEvent(request, operator, channel, parsed, {
      eventType,
      status: 'FAILED',
      severity: 'WARN',
      summary: `渠道回调失败：${message}`,
      payload: {
        error_message: message,
      },
    });
    await this.recordCallbackUsage(request, operator, channel, receivedEventId, result, 1, 'channel_callback_failed');
    await this.updateReplyRecord(replyId, {
      status: 'FAILED',
      conversationId: null,
      messageId: null,
      traceId: request.traceId ?? null,
    });
    await this.updateChannelHealth(channel.id, false, `最近回调失败：${message}`);

    return result;
  }

  private async executeCallbackTurn(context: CallbackExecutionContext): Promise<ChannelCallbackResult> {
    const { request, channel, operator, parsed, receivedEventId, replyId } = context;
    if (!parsed.text) {
      throw new BadRequestException('Channel callback text is empty');
    }

    const conversation = await this.conversations.create(operator, {
      agent_id: channel.agentId,
      message: parsed.text,
      title: buildConversationTitle(channel, parsed),
    });
    const response = withChannel(mapExternalResponse(conversation), channel.id);
    const result: ChannelCallbackResult = {
      success: response.status !== 'FAILED',
      ignored: false,
      provider: parsed.provider,
      channel_id: channel.id,
      agent_id: response.agent_id,
      conversation_id: response.conversation_id,
      run_id: response.run_id,
      trace_id: response.trace_id ?? request.traceId ?? null,
      answer: response.answer,
      message: response.status === 'FAILED' ? '渠道回调执行失败。' : '渠道回调执行完成。',
      external_message_id: parsed.externalMessageId,
    };

    request.externalConversationId = response.conversation_id;
    request.externalRunId = response.run_id ?? undefined;
    request.externalTraceId = response.trace_id ?? undefined;

    await this.recordCallbackEvent(request, operator, channel, parsed, {
      eventType: shouldAckImmediately(channel) ? 'channel.callback.async_completed' : 'channel.callback.completed',
      status: result.success ? 'SUCCESS' : 'FAILED',
      severity: result.success ? 'INFO' : 'WARN',
      summary: `完成${callbackProviderLabel(parsed.provider)}渠道回调：${response.agent_name}`,
      conversationId: response.conversation_id,
      runId: response.run_id,
      traceId: result.trace_id,
      payload: {
        status: response.status,
        usage: response.usage,
        async_accepted: shouldAckImmediately(channel),
      },
    });
    await this.recordCallbackUsage(request, operator, channel, receivedEventId, result, 1, 'channel_callback_messages');
    if (response.usage?.total_tokens) {
      await this.recordCallbackUsage(
        request,
        operator,
        channel,
        receivedEventId,
        result,
        response.usage.total_tokens,
        'channel_callback_tokens',
        response.usage.cost_total ?? 0,
      );
    }
    await this.updateChannelHealth(channel.id, true, `最近回调成功：${callbackProviderLabel(parsed.provider)}`);
    if (shouldAckImmediately(channel) || shouldSendSyncReply(channel)) {
      await this.channelSender.sendReply({
        request,
        channel,
        operator,
        message: parsed,
        answer: result.answer,
        conversationId: result.conversation_id,
        runId: result.run_id,
        traceId: result.trace_id,
      });
    }

    await this.updateReplyRecord(replyId, {
      status: 'PROCESSED',
      conversationId: response.conversation_id,
      messageId: response.message_id,
      traceId: result.trace_id,
    });

    return result;
  }

  private async findChannel(channelId: string): Promise<ChannelRecord> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        deletedAt: null,
      },
      include: channelInclude,
    });

    if (!channel) {
      throw new NotFoundException('Publish channel not found');
    }

    return channel;
  }

  private ensureCallbackAvailable(channel: ChannelRecord) {
    if (!callbackChannelTypes.has(channel.channel as PublishChannelType)) {
      throw new BadRequestException('Publish channel does not support inbound callback');
    }
    if (channel.status !== 'ACTIVE' || channel.agent.deletedAt) {
      throw new ForbiddenException('Publish channel is unavailable');
    }
    if (channel.agent.status !== 'PUBLISHED') {
      throw new ForbiddenException('Publish channel agent is unavailable');
    }
  }

  private normalizeIncomingBody(
    provider: ChannelCallbackProvider,
    channel: ChannelRecord,
    request: RequestWithContext,
    body: unknown,
  ) {
    const rawBody = request.rawBody ?? (typeof body === 'string' ? body : null);
    const record = typeof body === 'string' ? parseBodyText(body) : asRecord(body);

    if (provider === 'WECHAT_WORK') {
      const encrypted = pickFirstString(record.Encrypt, nested(record, 'xml.Encrypt'), extractXmlTag(rawBody, 'Encrypt'));
      if (!encrypted) {
        return Object.keys(record).length > 0 ? record : rawBody ?? body;
      }

      this.verifyWechatWorkSignature(channel, request, encrypted);
      const decrypted = this.decryptWechatWorkMessage(channel, encrypted);

      return parseBodyText(decrypted);
    }

    if (provider === 'FEISHU') {
      this.verifyFeishuSignatureIfConfigured(channel, request);
      const encrypted = pickFirstString(record.encrypt);
      if (!encrypted) {
        this.verifyFeishuTokenIfConfigured(channel, record);
        return Object.keys(record).length > 0 ? record : body;
      }

      const decrypted = this.decryptFeishuPayload(channel, encrypted);
      this.verifyFeishuTokenIfConfigured(channel, decrypted);

      return decrypted;
    }

    return Object.keys(record).length > 0 ? record : rawBody ?? body;
  }

  private verifySignatureIfRequired(channel: ChannelRecord, request: RequestWithContext, body: unknown) {
    const provider = normalizeProvider(channel.channel);
    const requireAiagetSignature = provider === 'CUSTOM_WEBHOOK' || readConfigBoolean(channel.config, 'require_aiaget_signature');
    if (provider === 'DINGTALK') {
      this.verifyDingTalkSignature(channel, request);
    }
    if (provider === 'SLACK') {
      this.verifySlackSignature(channel, request);
    }

    if (!requireAiagetSignature) return;
    if (!channel.secretEncrypted) {
      throw new UnauthorizedException('Channel callback secret is not configured');
    }

    const signature = pickFirstString(request.headers['x-aiaget-signature']);
    if (!signature) {
      throw new UnauthorizedException('Missing channel callback signature');
    }

    const secret = decryptSecret(channel.secretEncrypted);
    const timestamp = pickFirstString(request.headers['x-aiaget-timestamp']);
    const canonicalBody = request.rawBody ?? canonicalizeBody(body);
    const candidates = [
      createHmac('sha256', secret).update(canonicalBody).digest('hex'),
      ...(timestamp ? [createHmac('sha256', secret).update(`${timestamp}.${canonicalBody}`).digest('hex')] : []),
    ];
    const normalizedSignature = signature.replace(/^sha256=/, '').trim();
    const valid = candidates.some((candidate) => timingSafeCompare(candidate, normalizedSignature));

    if (!valid) {
      throw new UnauthorizedException('Invalid channel callback signature');
    }
  }

  private verifyWechatWorkSignature(channel: ChannelRecord, request: RequestWithContext, encrypted: string) {
    const credential = readChannelCredential(channel);
    const token = credential.wechat_work_token ?? readConfigString(channel.config, 'wechat_work_token');
    if (!token) {
      throw new UnauthorizedException('WeChat Work callback token is not configured');
    }

    const signature = pickFirstString(request.query.msg_signature, request.query.signature);
    const timestamp = pickFirstString(request.query.timestamp);
    const nonce = pickFirstString(request.query.nonce);
    if (!signature || !timestamp || !nonce) {
      throw new UnauthorizedException('Missing WeChat Work callback signature params');
    }

    const expected = sha1Sorted([token, timestamp, nonce, encrypted]);
    if (!timingSafeCompare(expected, signature)) {
      throw new UnauthorizedException('Invalid WeChat Work callback signature');
    }
  }

  private verifyAndDecryptWechatWorkEcho(channel: ChannelRecord, query: Record<string, unknown>) {
    const challenge = pickFirstString(query.echostr, query.challenge, query.echo);
    if (!challenge) return null;

    const requestLike = {
      query,
      headers: {},
    } as RequestWithContext;

    this.verifyWechatWorkSignature(channel, requestLike, challenge);
    try {
      return this.decryptWechatWorkMessage(channel, challenge);
    } catch {
      return challenge;
    }
  }

  private decryptWechatWorkMessage(channel: ChannelRecord, encrypted: string) {
    const credential = readChannelCredential(channel);
    const encodingAesKey = credential.wechat_work_encoding_aes_key ?? readConfigString(channel.config, 'wechat_work_encoding_aes_key');
    if (!encodingAesKey) {
      throw new UnauthorizedException('WeChat Work EncodingAESKey is not configured');
    }

    const aesKey = Buffer.from(`${encodingAesKey}=`, 'base64');
    if (aesKey.length !== 32) {
      throw new BadRequestException('Invalid WeChat Work EncodingAESKey');
    }

    const decipher = createDecipheriv('aes-256-cbc', aesKey, aesKey.subarray(0, 16));
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()]);
    const unpadded = pkcs7Unpad(decrypted);
    const messageLength = unpadded.readUInt32BE(16);

    return unpadded.subarray(20, 20 + messageLength).toString('utf8');
  }

  private verifyFeishuTokenIfConfigured(channel: ChannelRecord, body: Record<string, unknown>) {
    const credential = readChannelCredential(channel);
    const verificationToken = credential.feishu_verification_token ?? readConfigString(channel.config, 'feishu_verification_token');
    const encryptKey = credential.feishu_encrypt_key ?? readConfigString(channel.config, 'feishu_encrypt_key');
    if (!verificationToken && !encryptKey) {
      throw new UnauthorizedException('Feishu callback verification token or encrypt key is not configured');
    }
    if (!verificationToken) return;

    const token = pickFirstString(body.token, nested(body, 'header.token'));
    if (!token || !timingSafeCompare(token, verificationToken)) {
      throw new UnauthorizedException('Invalid Feishu callback token');
    }
  }

  private verifyFeishuSignatureIfConfigured(channel: ChannelRecord, request: RequestWithContext) {
    const credential = readChannelCredential(channel);
    const encryptKey = credential.feishu_encrypt_key ?? readConfigString(channel.config, 'feishu_encrypt_key');
    const signature = pickFirstString(request.headers['x-lark-signature']);
    if (!encryptKey) return;
    if (!signature) {
      throw new UnauthorizedException('Missing Feishu callback signature');
    }

    const timestamp = pickFirstString(request.headers['x-lark-request-timestamp']);
    const nonce = pickFirstString(request.headers['x-lark-request-nonce']);
    const rawBody = request.rawBody;
    if (!timestamp || !nonce || !rawBody) {
      throw new UnauthorizedException('Missing Feishu callback signature context');
    }

    const expected = createHash('sha256').update(`${timestamp}${nonce}${encryptKey}${rawBody}`).digest('hex');
    if (!timingSafeCompare(expected, signature)) {
      throw new UnauthorizedException('Invalid Feishu callback signature');
    }
  }

  private decryptFeishuPayload(channel: ChannelRecord, encrypted: string) {
    const credential = readChannelCredential(channel);
    const encryptKey = credential.feishu_encrypt_key ?? readConfigString(channel.config, 'feishu_encrypt_key');
    if (!encryptKey) {
      throw new UnauthorizedException('Feishu Encrypt Key is not configured');
    }

    const key = createHash('sha256').update(encryptKey).digest();
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    const iv = encryptedBuffer.subarray(0, 16);
    const payload = encryptedBuffer.subarray(16);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
    const parsed = parseMaybeJsonObject(decrypted);
    if (!parsed) {
      throw new BadRequestException('Invalid Feishu encrypted callback payload');
    }

    return parsed;
  }

  private verifyDingTalkSignature(channel: ChannelRecord, request: RequestWithContext) {
    const credential = readChannelCredential(channel);
    const secret = credential.dingtalk_sign_secret ?? readConfigString(channel.config, 'dingtalk_sign_secret');
    if (!secret) {
      throw new UnauthorizedException('DingTalk callback signing secret is not configured');
    }

    const timestamp = pickFirstString(request.query.timestamp, request.headers.timestamp, request.headers['x-dingtalk-timestamp']);
    const signature = pickFirstString(request.query.sign, request.headers.sign, request.headers['x-dingtalk-signature']);
    if (!timestamp || !signature) {
      throw new UnauthorizedException('Missing DingTalk callback signature params');
    }

    const expected = createHmac('sha256', secret).update(`${timestamp}\n${secret}`).digest('base64');
    const decodedSignature = decodeURIComponent(signature);
    if (!timingSafeCompare(expected, decodedSignature)) {
      throw new UnauthorizedException('Invalid DingTalk callback signature');
    }
  }

  private verifySlackSignature(channel: ChannelRecord, request: RequestWithContext) {
    const credential = readChannelCredential(channel);
    const secret = credential.slack_signing_secret ?? readConfigString(channel.config, 'slack_signing_secret');
    if (!secret) {
      throw new UnauthorizedException('Slack callback signing secret is not configured');
    }

    const timestamp = pickFirstString(request.headers['x-slack-request-timestamp']);
    const signature = pickFirstString(request.headers['x-slack-signature']);
    const rawBody = request.rawBody;
    if (!timestamp || !signature || !rawBody) {
      throw new UnauthorizedException('Missing Slack callback signature context');
    }

    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds) || Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300) {
      throw new UnauthorizedException('Invalid Slack callback timestamp');
    }

    const expected = `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`;
    if (!timingSafeCompare(expected, signature)) {
      throw new UnauthorizedException('Invalid Slack callback signature');
    }
  }

  private async resolveCallbackUser(channel: ChannelRecord, request: RequestWithContext): Promise<AuthenticatedUser> {
    const userId = channel.createdBy ?? channel.agent.ownerId ?? channel.agent.createdBy;
    if (!userId) {
      throw new UnauthorizedException('Channel callback owner is unavailable');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: channel.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userRoles: {
          where: {
            deletedAt: null,
            role: {
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: {
                    deletedAt: null,
                  },
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Channel callback owner is unavailable');
    }

    return mapCallbackUser(user, request);
  }

  private async recordCallbackEvent(
    request: RequestWithContext,
    operator: AuthenticatedUser,
    channel: ChannelRecord,
    message: ParsedCallbackMessage,
    input: {
      eventType: string;
      status: string;
      severity: string;
      summary: string;
      conversationId?: string | null;
      runId?: string | null;
      traceId?: string | null;
      payload?: Record<string, unknown>;
    },
  ) {
    return this.platformEvents.recordEvent({
      tenantId: operator.tenantId,
      departmentId: operator.departmentId ?? null,
      userId: operator.id,
      actorType: 'CHANNEL',
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      agentId: channel.agentId,
      channelId: channel.id,
      conversationId: input.conversationId ?? null,
      runId: input.runId ?? null,
      requestId: request.requestId ?? null,
      traceId: input.traceId ?? request.traceId ?? null,
      eventSource: 'CHANNEL_CALLBACK',
      eventType: input.eventType,
      status: input.status,
      severity: input.severity,
      billable: false,
      summary: input.summary,
      payloadJson: {
        provider: message.provider,
        event_type: message.eventType,
        sender_id: message.senderId,
        external_conversation_id: message.externalConversationId,
        external_message_id: message.externalMessageId,
        has_text: Boolean(message.text),
        text_length: message.text?.length ?? 0,
        ...(input.payload ?? {}),
      },
      sourceSystem: 'channel_callback',
      sourceId: message.externalMessageId ?? channel.id,
    });
  }

  private async recordCallbackUsage(
    request: RequestWithContext,
    operator: AuthenticatedUser,
    channel: ChannelRecord,
    eventId: string,
    result: ChannelCallbackResult,
    quantity: number,
    metricType: string,
    amount = 0,
  ) {
    await this.platformEvents.recordUsage({
      tenantId: operator.tenantId,
      departmentId: operator.departmentId ?? null,
      userId: operator.id,
      subjectType: 'CHANNEL',
      subjectId: channel.id,
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      metricType,
      unit: metricType.endsWith('_tokens') ? 'token' : 'message',
      quantity,
      amount,
      billable: false,
      costSource: result.success ? 'CHANNEL_CALLBACK' : 'FAILED',
      traceId: result.trace_id ?? request.traceId ?? null,
      requestId: request.requestId ?? null,
      eventId,
      sourceSystem: 'channel_callback',
      sourceId: result.run_id ?? result.conversation_id ?? channel.id,
    });
  }

  private async createReplyRecord(
    request: RequestWithContext,
    channel: ChannelRecord,
    parsed: ParsedCallbackMessage,
    payload: unknown,
    status: 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED',
  ) {
    return this.prisma.channelReply.create({
      data: {
        tenantId: channel.tenantId,
        agentId: channel.agentId,
        publishChannelId: channel.id,
        providerId: channel.account?.providerId ?? null,
        accountId: channel.accountId,
        deliveryId: null,
        replyKey: `cr_${request.requestId ?? request.traceId ?? `${channel.id}_${Date.now()}`}_${parsed.externalMessageId ?? parsed.externalConversationId ?? parsed.senderId ?? 'inbound'}`,
        direction: 'INBOUND',
        sender: parsed.senderId,
        recipient: channel.name ?? channel.channel,
        contentType: parsed.text ? 'TEXT' : 'EVENT',
        content: parsed.text,
        payload: payload === null ? Prisma.JsonNull : toJsonValue(redactChannelAuditValue(payload)),
        status,
        conversationId: null,
        messageId: null,
        traceId: request.traceId ?? null,
        externalConversationId: parsed.externalConversationId,
        externalMessageId: parsed.externalMessageId,
        receivedAt: new Date(),
        processedAt: status === 'RECEIVED' ? null : new Date(),
        createdBy: request.user?.id ?? null,
        updatedBy: request.user?.id ?? null,
      },
    });
  }

  private async updateReplyRecord(
    replyId: string,
    input: {
      status: 'PROCESSED' | 'IGNORED' | 'FAILED';
      conversationId: string | null;
      messageId: string | null;
      traceId: string | null;
    },
  ) {
    await this.prisma.channelReply.update({
      where: {
        id: replyId,
      },
      data: {
        status: input.status,
        conversationId: input.conversationId,
        messageId: input.messageId,
        traceId: input.traceId,
        processedAt: new Date(),
      },
    });
  }

  private async updateChannelHealth(channelId: string, success: boolean, message: string) {
    await this.prisma.agentPublishChannel.update({
      where: {
        id: channelId,
      },
      data: {
        healthStatus: success ? 'HEALTHY' : 'DEGRADED',
        healthMessage: message,
        lastCheckedAt: new Date(),
      },
    });
  }
}

function normalizeProvider(channel: string): ChannelCallbackProvider {
  if (channel === 'WECHAT_WORK' || channel === 'DINGTALK' || channel === 'FEISHU' || channel === 'SLACK') {
    return channel;
  }

  return 'CUSTOM_WEBHOOK';
}

function parseCallbackMessage(provider: ChannelCallbackProvider, body: unknown): ParsedCallbackMessage {
  const record = typeof body === 'string' ? parseBodyText(body) : asRecord(body);
  const base = {
    provider,
    text: null,
    externalConversationId: null,
    externalMessageId: null,
    senderId: null,
    responseUrl: null,
    eventType: pickFirstString(record.type, record.event, record.event_type, nested(record, 'header.event_type')),
  };

  switch (provider) {
    case 'DINGTALK':
      return {
        ...base,
        text: normalizeMessage(pickFirstString(nested(record, 'text.content'), record.content, record.message, nested(record, 'msg.text'))),
        externalConversationId: pickFirstString(record.conversationId, record.conversation_id, nested(record, 'conversation.id')),
        externalMessageId: pickFirstString(record.msgId, record.msg_id, record.messageId),
        senderId: pickFirstString(record.senderStaffId, record.senderId, record.senderNick),
        responseUrl: pickFirstString(record.sessionWebhook, record.session_webhook, record.webhook),
      };
    case 'FEISHU':
      return parseFeishuMessage(record, base);
    case 'WECHAT_WORK':
      return {
        ...base,
        text: normalizeMessage(
          pickFirstString(
            nested(record, 'text.content'),
            record.Content,
            record.content,
            nested(record, 'xml.Content'),
            extractXmlTag(record.xml, 'Content'),
            extractXmlTag(record.raw_xml, 'Content'),
          ),
        ),
        externalConversationId: pickFirstString(record.FromUserName, record.from_user_name, nested(record, 'xml.FromUserName')),
        externalMessageId: pickFirstString(record.MsgId, record.msg_id, nested(record, 'xml.MsgId')),
        senderId: pickFirstString(record.FromUserName, record.from_user_name, record.UserID, nested(record, 'xml.FromUserName')),
        responseUrl: null,
      };
    case 'SLACK':
      return {
        ...base,
        text: normalizeMessage(pickFirstString(nested(record, 'event.text'), record.text, nested(record, 'payload.text'))),
        externalConversationId: pickFirstString(nested(record, 'event.channel'), record.channel_id, record.channel),
        externalMessageId: pickFirstString(nested(record, 'event.client_msg_id'), nested(record, 'event.ts'), record.event_id),
        senderId: pickFirstString(nested(record, 'event.user'), record.user_id, nested(record, 'user.id')),
        responseUrl: pickFirstString(record.response_url, nested(record, 'payload.response_url')),
      };
    case 'CUSTOM_WEBHOOK':
    default:
      return {
        ...base,
        text: normalizeMessage(
          pickFirstString(
            record.message,
            record.text,
            record.content,
            nested(record, 'payload.message'),
            nested(record, 'payload.text'),
            nested(record, 'payload.content'),
            nested(record, 'data.message'),
            nested(record, 'data.text'),
          ),
        ),
        externalConversationId: pickFirstString(record.conversation_id, record.conversationId, nested(record, 'payload.conversation_id')),
        externalMessageId: pickFirstString(record.message_id, record.messageId, record.id, nested(record, 'payload.message_id')),
        senderId: pickFirstString(record.sender_id, record.senderId, record.user_id, nested(record, 'payload.sender_id')),
        responseUrl: pickFirstString(record.response_url, record.reply_url, nested(record, 'payload.response_url'), nested(record, 'payload.reply_url')),
      };
  }
}

function parseFeishuMessage(
  record: Record<string, unknown>,
  base: Omit<ParsedCallbackMessage, 'text' | 'externalConversationId' | 'externalMessageId' | 'senderId'>,
): ParsedCallbackMessage {
  const content = nested(record, 'event.message.content') ?? record.content;
  const parsedContent = parseMaybeJsonObject(content);
  const text = pickFirstString(
    parsedContent?.text,
    parsedContent?.message,
    content,
    nested(record, 'event.message.text'),
    nested(record, 'message.text'),
  );

  return {
    ...base,
    text: normalizeMessage(text),
    externalConversationId: pickFirstString(nested(record, 'event.message.chat_id'), record.chat_id, record.open_chat_id),
    externalMessageId: pickFirstString(nested(record, 'event.message.message_id'), record.message_id, nested(record, 'header.event_id')),
    senderId: pickFirstString(
      nested(record, 'event.sender.sender_id.open_id'),
      nested(record, 'event.sender.sender_id.user_id'),
      record.open_id,
      record.user_id,
    ),
    responseUrl: pickFirstString(record.response_url, nested(record, 'event.response_url')),
  };
}

function buildChallengeResponse(provider: ChannelCallbackProvider, body: unknown) {
  const record = asRecord(body);
  const challenge = pickFirstString(record.challenge, nested(record, 'payload.challenge'));
  if (!challenge) return null;

  if (provider === 'FEISHU' || provider === 'SLACK') {
    return {
      challenge,
    };
  }

  return challenge;
}

function buildProviderResponse(provider: ChannelCallbackProvider, result: ChannelCallbackResult) {
  const answer = result.answer ?? result.message;

  if (provider === 'DINGTALK') {
    return {
      msgtype: 'text',
      text: {
        content: answer,
      },
    };
  }

  if (provider === 'FEISHU') {
    return {
      msg_type: 'text',
      content: {
        text: answer,
      },
    };
  }

  if (provider === 'WECHAT_WORK') {
    return {
      msgtype: 'text',
      text: {
        content: answer,
      },
    };
  }

  if (provider === 'SLACK') {
    return {
      ok: result.success,
      text: answer,
    };
  }

  return result;
}

function buildAckResponse(provider: ChannelCallbackProvider, result: ChannelCallbackResult) {
  if (provider === 'DINGTALK') {
    return {
      msgtype: 'text',
      text: {
        content: result.message,
      },
    };
  }

  if (provider === 'FEISHU') {
    return {
      msg_type: 'text',
      content: {
        text: result.message,
      },
    };
  }

  if (provider === 'WECHAT_WORK') {
    return {
      msgtype: 'text',
      text: {
        content: result.message,
      },
    };
  }

  if (provider === 'SLACK') {
    return {
      ok: true,
      text: result.message,
    };
  }

  return result;
}

function parsePersistedCallbackReply(provider: ChannelCallbackProvider, reply: AsyncCallbackReplyRecord): ParsedCallbackMessage {
  const payload = normalizePersistedJson(reply.payload);
  const parsed = parseCallbackMessage(provider, payload);

  return {
    provider,
    text: parsed.text ?? normalizeMessage(reply.content),
    externalConversationId: parsed.externalConversationId ?? reply.externalConversationId,
    externalMessageId: parsed.externalMessageId ?? reply.externalMessageId,
    senderId: parsed.senderId ?? reply.sender,
    responseUrl: parsed.responseUrl,
    eventType: parsed.eventType,
  };
}

function buildRecoveredRequestContext(
  reply: AsyncCallbackReplyRecord,
  input: ProcessPendingAsyncCallbackRepliesOptions,
): RequestWithContext {
  return {
    requestId: input.requestId ?? `channel-callback-recovery:${reply.id}`,
    traceId: input.traceId ?? reply.traceId ?? undefined,
    headers: {},
    query: {},
  } as RequestWithContext;
}

function pendingAsyncCallbackChannelWhere(): Prisma.AgentPublishChannelWhereInput {
  return {
    deletedAt: null,
    status: 'ACTIVE',
    channel: {
      in: Array.from(callbackChannelTypes),
    },
    agent: {
      status: 'PUBLISHED',
      deletedAt: null,
    },
    OR: [
      {
        config: {
          path: ['ack_immediately'],
          equals: true,
        },
      },
      {
        config: {
          path: ['reply_mode'],
          equals: 'ASYNC',
        },
      },
    ],
  };
}

function normalizePendingAsyncCallbackReplyLimit(value: number | undefined) {
  const limit = Math.trunc(Number(value ?? DEFAULT_PENDING_ASYNC_CALLBACK_REPLY_LIMIT));
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_PENDING_ASYNC_CALLBACK_REPLY_LIMIT;

  return Math.min(limit, MAX_PENDING_ASYNC_CALLBACK_REPLY_LIMIT);
}

function normalizePersistedJson(value: Prisma.JsonValue | null) {
  if (value === null) return null;

  return value;
}

function buildConversationTitle(channel: ChannelRecord, message: ParsedCallbackMessage) {
  const label = channel.name ?? callbackProviderLabel(message.provider);
  const sender = message.senderId ? ` / ${message.senderId}` : '';

  return `${label} 回调${sender}`;
}

function callbackStableKey(message: ParsedCallbackMessage) {
  return [
    message.provider,
    message.externalConversationId,
    message.senderId,
    message.externalMessageId,
    message.text?.slice(0, 128),
  ].filter(Boolean).join(':');
}

function mapCallbackUser(user: CallbackUserRecord, request: RequestWithContext): AuthenticatedUser {
  const activeRoles = user.userRoles.filter((userRole) => userRole.role);
  const permissions = expandPermissionCodes(
    Array.from(
      new Set(
        activeRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
        ),
      ),
    ),
  );

  return {
    id: user.id,
    tenantId: user.tenantId,
    departmentId: user.departmentId,
    email: user.email,
    roles: activeRoles.map((userRole) => userRole.role.code),
    roleIds: activeRoles.map((userRole) => userRole.role.id),
    permissions,
    requestId: request.requestId,
    traceId: request.traceId,
    spanId: request.spanId,
    parentSpanId: request.parentSpanId,
    traceparent: request.traceparent,
  };
}

function mapExternalResponse(conversation: ConversationDetail): ExternalAgentChatResponse {
  const assistantMessage = [...conversation.messages].reverse().find((message) => message.role === 'ASSISTANT') ?? null;
  const latestRun = conversation.runs[0] ?? null;

  if (!assistantMessage) {
    throw new BadRequestException('Channel callback completed without assistant message');
  }

  return {
    conversation_id: conversation.id,
    agent_id: conversation.agent_id,
    agent_name: conversation.agent_name,
    agent_code: conversation.agent_code,
    message_id: assistantMessage.id,
    run_id: latestRun?.id ?? null,
    trace_id: latestRun?.trace_id ?? null,
    status: latestRun?.status ?? null,
    answer: assistantMessage.content,
    references: assistantMessage.references,
    tool_calls: assistantMessage.tool_calls,
    usage: latestRun ? mapUsage(latestRun) : null,
    created_at: assistantMessage.created_at ?? latestRun?.created_at ?? null,
  };
}

function mapUsage(run: ConversationRunItem): ExternalAgentChatResponse['usage'] {
  return {
    prompt_tokens: run.prompt_tokens,
    completion_tokens: run.completion_tokens,
    total_tokens: run.total_tokens,
    latency_ms: run.latency_ms,
    cost_total: run.cost_total ?? null,
  };
}

function withChannel(result: ExternalAgentChatResponse, channelId: string): ExternalAgentChatResponse {
  return {
    ...result,
    channel_id: channelId,
  };
}

function normalizeMessage(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, 4000);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function parseBodyText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    const parsed = parseMaybeJsonObject(trimmed);
    if (parsed) return parsed;
  }

  if (trimmed.startsWith('<')) {
    return {
      xml: xmlToFlatRecord(trimmed),
      raw_xml: trimmed,
      ...xmlToFlatRecord(trimmed),
    };
  }

  return {
    text: trimmed,
  };
}

function nested(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, record);
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return null;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as Prisma.InputJsonValue;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
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

function extractXmlTag(value: unknown, tag: string) {
  if (typeof value !== 'string') return null;
  const match = value.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>|<${tag}>(.*?)</${tag}>`, 's'));

  return match?.[1] ?? match?.[2] ?? null;
}

function canonicalizeBody(body: unknown) {
  if (typeof body === 'string') return body;

  return JSON.stringify(body ?? {});
}

function timingSafeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readConfigBoolean(config: Prisma.JsonValue | null, key: string) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;

  return (config as Record<string, unknown>)[key] === true;
}

function shouldAckImmediately(channel: ChannelRecord) {
  return readConfigBoolean(channel.config, 'ack_immediately') || readConfigString(channel.config, 'reply_mode') === 'ASYNC';
}

function shouldSendSyncReply(channel: ChannelRecord) {
  return readConfigBoolean(channel.config, 'send_sync_reply');
}

function cloneRequestContext(request: RequestWithContext): RequestWithContext {
  return {
    ...request,
    headers: { ...request.headers },
    query: { ...request.query },
  } as RequestWithContext;
}

function readConfigString(config: Prisma.JsonValue | null, key: string) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const value = (config as Record<string, unknown>)[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
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

function sha1Sorted(parts: string[]) {
  return createHash('sha1').update([...parts].sort().join('')).digest('hex');
}

function pkcs7Unpad(buffer: Buffer) {
  if (buffer.length === 0) {
    throw new BadRequestException('Invalid encrypted callback payload');
  }
  const padding = buffer[buffer.length - 1] ?? 0;
  if (padding < 1 || padding > 32 || padding > buffer.length) {
    throw new BadRequestException('Invalid encrypted callback padding');
  }

  return buffer.subarray(0, buffer.length - padding);
}

function xmlToFlatRecord(xml: string) {
  const output: Record<string, string> = {};
  const pattern = /<([A-Za-z0-9_:-]+)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(xml))) {
    const tag = match[1];
    if (tag && tag !== 'xml') {
      output[tag] = match[2] ?? match[3] ?? '';
    }
  }

  return output;
}

function callbackProviderLabel(provider: ChannelCallbackProvider) {
  const labels: Record<ChannelCallbackProvider, string> = {
    WECHAT_WORK: '企业微信',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return labels[provider];
}
