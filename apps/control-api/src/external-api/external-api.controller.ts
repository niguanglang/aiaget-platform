import { Body, Controller, Get, Headers, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import type { ExternalAgentChatResponse } from '@aiaget/shared-types';

import type { RequestWithContext } from '../common/types/request-context';
import { ExternalAgentChatDto } from './dto/external-agent-chat.dto';
import { ExternalChannelCallbackService } from './external-channel-callback.service';
import { ExternalApiKeyService } from './external-api-key.service';
import { ExternalApiService } from './external-api.service';

@ApiTags('external-api')
@ApiSecurity('x-api-key')
@Controller('external')
export class ExternalApiController {
  constructor(
    @Inject(ExternalApiKeyService) private readonly externalApiKeys: ExternalApiKeyService,
    @Inject(ExternalApiService) private readonly externalApi: ExternalApiService,
    @Inject(ExternalChannelCallbackService) private readonly channelCallbacks: ExternalChannelCallbackService,
  ) {}

  @Get('channels/:channelId/callback')
  @ApiOkResponse({ description: 'Verify a publish channel callback URL for enterprise IM integrations' })
  async verifyChannelCallback(
    @Param('channelId') channelId: string,
    @Query() query: Record<string, unknown>,
  ): Promise<unknown> {
    return this.channelCallbacks.verify(channelId, query);
  }

  @Post('channels/:channelId/callback')
  @ApiOkResponse({ description: 'Receive an enterprise IM or webhook callback through a publish channel' })
  async channelCallback(
    @Req() request: Request,
    @Param('channelId') channelId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const result = await this.channelCallbacks.handle(request as RequestWithContext, channelId, body);
    const requestContext = request as RequestWithContext;

    requestContext.externalConversationId = result.result.conversation_id ?? undefined;
    requestContext.externalRunId = result.result.run_id ?? undefined;
    requestContext.externalTraceId = result.result.trace_id ?? undefined;

    return result.response;
  }

  @Post('agents/:agentId/chat')
  @ApiOkResponse({ description: 'Call an Agent from an external system with a tenant API key' })
  async chat(
    @Req() request: Request,
    @Param('agentId') agentId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const principal = await this.externalApiKeys.authenticate(request as RequestWithContext, agentId, {
      stream: false,
    });

    const result = await this.externalApi.chat(principal, agentId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey));
    const requestContext = request as RequestWithContext;
    requestContext.externalConversationId = result.conversation_id;
    requestContext.externalRunId = result.run_id ?? undefined;
    requestContext.externalTraceId = result.trace_id ?? undefined;

    return result;
  }

  @Post('agents/:agentId/chat/stream')
  @ApiOkResponse({ description: 'Stream an Agent response from an external system with a tenant API key' })
  async streamChat(
    @Req() request: Request,
    @Res() response: Response,
    @Param('agentId') agentId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<void> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticate(requestContext, agentId, {
      stream: true,
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const writeEvent = (eventName: string, payload: unknown) => {
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.externalApi.streamChat(principal, agentId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey), writeEvent);
      requestContext.externalConversationId = result.conversation_id;
      requestContext.externalRunId = result.run_id ?? undefined;
      requestContext.externalTraceId = result.trace_id ?? undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'External Agent stream failed';
      writeEvent('error', {
        type: 'error',
        message,
      });
    } finally {
      response.end();
    }
  }

  @Post('channels/:channelId/chat')
  @ApiOkResponse({ description: 'Call an Agent through a publish channel with a tenant API key' })
  async channelChat(
    @Req() request: Request,
    @Param('channelId') channelId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateChannel(requestContext, channelId, {
      stream: false,
    });

    const result = await this.externalApi.channelChat(principal, channelId, principal.agentId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey));
    requestContext.externalConversationId = result.conversation_id;
    requestContext.externalRunId = result.run_id ?? undefined;
    requestContext.externalTraceId = result.trace_id ?? undefined;

    return result;
  }

  @Post('channels/:channelId/chat/stream')
  @ApiOkResponse({ description: 'Stream an Agent response through a publish channel with a tenant API key' })
  async streamChannelChat(
    @Req() request: Request,
    @Res() response: Response,
    @Param('channelId') channelId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<void> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateChannel(requestContext, channelId, {
      stream: true,
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const writeEvent = (eventName: string, payload: unknown) => {
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.externalApi.streamChannelChat(principal, channelId, principal.agentId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey), writeEvent);
      requestContext.externalConversationId = result.conversation_id;
      requestContext.externalRunId = result.run_id ?? undefined;
      requestContext.externalTraceId = result.trace_id ?? undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'External channel stream failed';
      writeEvent('error', {
        type: 'error',
        message,
      });
    } finally {
      response.end();
    }
  }

  @Post('agents/:agentId/conversations/:conversationId/messages')
  @ApiOkResponse({ description: 'Continue an external Agent conversation with a tenant API key' })
  async continueChat(
    @Req() request: Request,
    @Param('agentId') agentId: string,
    @Param('conversationId') conversationId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateConversation(requestContext, agentId, conversationId, {
      stream: false,
    });
    const result = await this.externalApi.continueChat(principal, conversationId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey));
    requestContext.externalConversationId = result.conversation_id;
    requestContext.externalRunId = result.run_id ?? undefined;
    requestContext.externalTraceId = result.trace_id ?? undefined;

    return result;
  }

  @Post('channels/:channelId/conversations/:conversationId/messages')
  @ApiOkResponse({ description: 'Continue an external channel conversation with a tenant API key' })
  async continueChannelChat(
    @Req() request: Request,
    @Param('channelId') channelId: string,
    @Param('conversationId') conversationId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateChannelConversation(requestContext, channelId, conversationId, {
      stream: false,
    });
    const result = await this.externalApi.channelContinueChat(principal, channelId, conversationId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey));
    requestContext.externalConversationId = result.conversation_id;
    requestContext.externalRunId = result.run_id ?? undefined;
    requestContext.externalTraceId = result.trace_id ?? undefined;

    return result;
  }

  @Post('channels/:channelId/conversations/:conversationId/messages/stream')
  @ApiOkResponse({ description: 'Stream a continuation of an external channel conversation with a tenant API key' })
  async streamContinueChannelChat(
    @Req() request: Request,
    @Res() response: Response,
    @Param('channelId') channelId: string,
    @Param('conversationId') conversationId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<void> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateChannelConversation(requestContext, channelId, conversationId, {
      stream: true,
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const writeEvent = (eventName: string, payload: unknown) => {
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.externalApi.streamChannelContinueChat(principal, channelId, conversationId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey), writeEvent);
      requestContext.externalConversationId = result.conversation_id;
      requestContext.externalRunId = result.run_id ?? undefined;
      requestContext.externalTraceId = result.trace_id ?? undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'External channel conversation stream failed';
      writeEvent('error', {
        type: 'error',
        message,
      });
    } finally {
      response.end();
    }
  }

  @Post('agents/:agentId/conversations/:conversationId/messages/stream')
  @ApiOkResponse({ description: 'Stream a continuation of an external Agent conversation with a tenant API key' })
  async streamContinueChat(
    @Req() request: Request,
    @Res() response: Response,
    @Param('agentId') agentId: string,
    @Param('conversationId') conversationId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-idempotency-key') xIdempotencyKey: string | undefined,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<void> {
    const requestContext = request as RequestWithContext;
    const principal = await this.externalApiKeys.authenticateConversation(requestContext, agentId, conversationId, {
      stream: true,
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const writeEvent = (eventName: string, payload: unknown) => {
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.externalApi.streamContinueChat(principal, conversationId, withIdempotencyKey(dto, idempotencyKey, xIdempotencyKey), writeEvent);
      requestContext.externalConversationId = result.conversation_id;
      requestContext.externalRunId = result.run_id ?? undefined;
      requestContext.externalTraceId = result.trace_id ?? undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'External Agent conversation stream failed';
      writeEvent('error', {
        type: 'error',
        message,
      });
    } finally {
      response.end();
    }
  }
}

function withIdempotencyKey(dto: ExternalAgentChatDto, ...headerValues: Array<string | undefined>): ExternalAgentChatDto {
  const headerKey = headerValues.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
  const bodyKey = typeof dto.idempotency_key === 'string' ? dto.idempotency_key.trim() : '';

  return {
    ...dto,
    idempotency_key: headerKey || bodyKey || null,
  };
}
