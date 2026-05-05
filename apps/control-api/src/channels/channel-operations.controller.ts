import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  ChannelAccountItem,
  ChannelDeliveryItem,
  ChannelOperationsListResult,
  ChannelProviderItem,
  ChannelPublishJobActionResult,
  ChannelPublishJobDetail,
  ChannelPublishJobItem,
  ChannelReplyItem,
  ChannelRouteRuleItem,
  ChannelTemplateItem,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ChannelOperationsService } from './channel-operations.service';
import {
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

@ApiTags('channel-operations')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class ChannelOperationsController {
  constructor(@Inject(ChannelOperationsService) private readonly operations: ChannelOperationsService) {}

  @Get('providers')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel providers' })
  async listProviders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelProviderItem>> {
    return this.operations.listProviders(currentUser, query);
  }

  @Post('providers')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Create channel provider' })
  async createProvider(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateChannelProviderDto,
  ): Promise<ChannelProviderItem> {
    return this.operations.createProvider(currentUser, dto);
  }

  @Patch('providers/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Update channel provider' })
  async updateProvider(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelProviderDto,
  ): Promise<ChannelProviderItem> {
    return this.operations.updateProvider(currentUser, id, dto);
  }

  @Post('providers/:id/enable')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Enable channel provider' })
  async enableProvider(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelProviderItem> {
    return this.operations.setProviderStatus(currentUser, id, 'ACTIVE');
  }

  @Post('providers/:id/disable')
  @Permissions('channel:publish:disable')
  @ApiOkResponse({ description: 'Disable channel provider' })
  async disableProvider(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelProviderItem> {
    return this.operations.setProviderStatus(currentUser, id, 'DISABLED');
  }

  @Delete('providers/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Soft delete channel provider' })
  async removeProvider(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.operations.removeProvider(currentUser, id);
  }

  @Get('accounts')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel accounts' })
  async listAccounts(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelAccountItem>> {
    return this.operations.listAccounts(currentUser, query);
  }

  @Post('accounts')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Create channel account' })
  async createAccount(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateChannelAccountDto,
  ): Promise<ChannelAccountItem> {
    return this.operations.createAccount(currentUser, dto);
  }

  @Patch('accounts/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Update channel account' })
  async updateAccount(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelAccountDto,
  ): Promise<ChannelAccountItem> {
    return this.operations.updateAccount(currentUser, id, dto);
  }

  @Post('accounts/:id/enable')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Enable channel account' })
  async enableAccount(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelAccountItem> {
    return this.operations.setAccountStatus(currentUser, id, 'ACTIVE');
  }

  @Post('accounts/:id/disable')
  @Permissions('channel:publish:disable')
  @ApiOkResponse({ description: 'Disable channel account' })
  async disableAccount(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelAccountItem> {
    return this.operations.setAccountStatus(currentUser, id, 'DISABLED');
  }

  @Delete('accounts/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Soft delete channel account' })
  async removeAccount(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.operations.removeAccount(currentUser, id);
  }

  @Get('templates')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel templates' })
  async listTemplates(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelTemplateItem>> {
    return this.operations.listTemplates(currentUser, query);
  }

  @Post('templates')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Create channel template' })
  async createTemplate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateChannelTemplateDto,
  ): Promise<ChannelTemplateItem> {
    return this.operations.createTemplate(currentUser, dto);
  }

  @Patch('templates/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Update channel template' })
  async updateTemplate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelTemplateDto,
  ): Promise<ChannelTemplateItem> {
    return this.operations.updateTemplate(currentUser, id, dto);
  }

  @Post('templates/:id/enable')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Enable channel template' })
  async enableTemplate(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelTemplateItem> {
    return this.operations.setTemplateStatus(currentUser, id, 'ACTIVE');
  }

  @Post('templates/:id/disable')
  @Permissions('channel:publish:disable')
  @ApiOkResponse({ description: 'Disable channel template' })
  async disableTemplate(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelTemplateItem> {
    return this.operations.setTemplateStatus(currentUser, id, 'DISABLED');
  }

  @Delete('templates/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Soft delete channel template' })
  async removeTemplate(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.operations.removeTemplate(currentUser, id);
  }

  @Get('route-rules')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel route rules' })
  async listRouteRules(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelRouteRuleItem>> {
    return this.operations.listRouteRules(currentUser, query);
  }

  @Post('route-rules')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Create channel route rule' })
  async createRouteRule(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateChannelRouteRuleDto,
  ): Promise<ChannelRouteRuleItem> {
    return this.operations.createRouteRule(currentUser, dto);
  }

  @Patch('route-rules/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Update channel route rule' })
  async updateRouteRule(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelRouteRuleDto,
  ): Promise<ChannelRouteRuleItem> {
    return this.operations.updateRouteRule(currentUser, id, dto);
  }

  @Post('route-rules/:id/enable')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Enable channel route rule' })
  async enableRouteRule(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelRouteRuleItem> {
    return this.operations.setRouteRuleStatus(currentUser, id, 'ACTIVE');
  }

  @Post('route-rules/:id/disable')
  @Permissions('channel:publish:disable')
  @ApiOkResponse({ description: 'Disable channel route rule' })
  async disableRouteRule(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<ChannelRouteRuleItem> {
    return this.operations.setRouteRuleStatus(currentUser, id, 'DISABLED');
  }

  @Delete('route-rules/:id')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Soft delete channel route rule' })
  async removeRouteRule(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.operations.removeRouteRule(currentUser, id);
  }

  @Get('publish-jobs')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel publish jobs' })
  async listPublishJobs(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelPublishJobItem>> {
    return this.operations.listPublishJobs(currentUser, query);
  }

  @Get('publish-jobs/:id')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'Get normalized channel publish job detail' })
  async getPublishJob(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ChannelPublishJobDetail> {
    return this.operations.getPublishJob(currentUser, id);
  }

  @Post('publish-jobs/:id/cancel')
  @Permissions('channel:publish:disable')
  @ApiOkResponse({ description: 'Cancel channel publish job' })
  async cancelPublishJob(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ChannelPublishJobActionResult> {
    return this.operations.cancelPublishJob(currentUser, id);
  }

  @Post('publish-jobs/:id/retry')
  @Permissions('channel:publish:manage')
  @ApiOkResponse({ description: 'Retry channel publish job' })
  async retryPublishJob(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ChannelPublishJobActionResult> {
    return this.operations.retryPublishJob(currentUser, id);
  }

  @Get('deliveries')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel deliveries' })
  async listDeliveries(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelDeliveryItem>> {
    return this.operations.listDeliveries(currentUser, query);
  }

  @Get('replies')
  @Permissions('channel:publish:view')
  @ApiOkResponse({ description: 'List normalized channel replies' })
  async listReplies(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListChannelOperationsDto,
  ): Promise<ChannelOperationsListResult<ChannelReplyItem>> {
    return this.operations.listReplies(currentUser, query);
  }
}
