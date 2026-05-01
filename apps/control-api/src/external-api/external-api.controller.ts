import { Body, Controller, Inject, Param, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { ExternalAgentChatResponse } from '@aiaget/shared-types';

import type { RequestWithContext } from '../common/types/request-context';
import { ExternalAgentChatDto } from './dto/external-agent-chat.dto';
import { ExternalApiKeyService } from './external-api-key.service';
import { ExternalApiService } from './external-api.service';

@ApiTags('external-api')
@ApiSecurity('x-api-key')
@Controller('external')
export class ExternalApiController {
  constructor(
    @Inject(ExternalApiKeyService) private readonly externalApiKeys: ExternalApiKeyService,
    @Inject(ExternalApiService) private readonly externalApi: ExternalApiService,
  ) {}

  @Post('agents/:agentId/chat')
  @ApiOkResponse({ description: 'Call an Agent from an external system with a tenant API key' })
  async chat(
    @Req() request: Request,
    @Param('agentId') agentId: string,
    @Body() dto: ExternalAgentChatDto,
  ): Promise<ExternalAgentChatResponse> {
    const principal = await this.externalApiKeys.authenticate(request as RequestWithContext, agentId, {
      stream: false,
    });

    return this.externalApi.chat(principal, agentId, dto);
  }
}
