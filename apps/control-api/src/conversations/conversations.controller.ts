import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type {
  ConversationDetail,
  ConversationFeedbackItem,
  ConversationListItem,
  PaginatedResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireDataScope } from '../common/decorators/data-scope.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequireResourceAcl } from '../common/decorators/resource-acl.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateConversationFeedbackDto } from './dto/create-conversation-feedback.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class ConversationsController {
  constructor(@Inject(ConversationsService) private readonly conversationsService: ConversationsService) {}

  @Get()
  @Permissions('conversation:history:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated conversation list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListConversationsDto,
  ): Promise<PaginatedResult<ConversationListItem>> {
    return this.conversationsService.list(currentUser, query);
  }

  @Post()
  @Permissions('conversation:chat:manage')
  @ApiOkResponse({ description: 'Create conversation and generate first assistant reply' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationDetail> {
    return this.conversationsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('conversation:history:view')
  @RequireDataScope({ resourceType: 'CONVERSATION' })
  @RequireResourceAcl({ resourceType: 'CONVERSATION', permissionCode: 'conversation:history:view' })
  @ApiOkResponse({ description: 'Get conversation detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ConversationDetail> {
    return this.conversationsService.get(currentUser, id);
  }

  @Delete(':id')
  @Permissions('conversation:chat:manage')
  @RequireDataScope({ resourceType: 'CONVERSATION' })
  @RequireResourceAcl({ resourceType: 'CONVERSATION', permissionCode: 'conversation:chat:manage' })
  @ApiOkResponse({ description: 'Archive conversation' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.conversationsService.remove(currentUser, id);
  }

  @Post(':id/messages')
  @Permissions('conversation:chat:manage')
  @RequireDataScope({ resourceType: 'CONVERSATION' })
  @RequireResourceAcl({ resourceType: 'CONVERSATION', permissionCode: 'conversation:chat:manage' })
  @ApiOkResponse({ description: 'Append user message and generate assistant reply' })
  async sendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendConversationMessageDto,
  ): Promise<ConversationDetail> {
    return this.conversationsService.sendMessage(currentUser, id, dto);
  }

  @Post(':id/messages/stream')
  @Permissions('conversation:chat:manage')
  @RequireDataScope({ resourceType: 'CONVERSATION' })
  @RequireResourceAcl({ resourceType: 'CONVERSATION', permissionCode: 'conversation:chat:manage' })
  async streamMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendConversationMessageDto,
    @Res() response: Response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const writeEvent = (eventName: string, payload: unknown) => {
      response.write(`event: ${eventName}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      await this.conversationsService.streamMessage(currentUser, id, dto, writeEvent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversation stream failed';
      writeEvent('error', {
        type: 'error',
        message,
      });
    } finally {
      response.end();
    }
  }

  @Post(':id/feedback')
  @Permissions('conversation:chat:manage')
  @RequireDataScope({ resourceType: 'CONVERSATION' })
  @RequireResourceAcl({ resourceType: 'CONVERSATION', permissionCode: 'conversation:chat:manage' })
  @ApiOkResponse({ description: 'Create conversation feedback' })
  async createFeedback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateConversationFeedbackDto,
  ): Promise<ConversationFeedbackItem> {
    return this.conversationsService.createFeedback(currentUser, id, dto);
  }
}
