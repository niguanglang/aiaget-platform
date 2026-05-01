import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  ResourceAclCheckResult,
  ResourceAclItem,
  ResourceAclOptionResult,
  ResourceAclOverview,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CheckResourceAclDto } from './dto/check-resource-acl.dto';
import { CreateResourceAclDto } from './dto/create-resource-acl.dto';
import { ListResourceAclOptionsDto } from './dto/list-resource-acl-options.dto';
import { ListResourceAclsDto } from './dto/list-resource-acls.dto';
import { UpdateResourceAclDto } from './dto/update-resource-acl.dto';
import { ResourceAclsService } from './resource-acls.service';

@ApiTags('resource-acls')
@ApiBearerAuth()
@Controller('resource-acls')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourceAclsController {
  constructor(@Inject(ResourceAclsService) private readonly resourceAclsService: ResourceAclsService) {}

  @Get('overview')
  @Permissions('system:resource_acl:view')
  @ApiOkResponse({ description: 'Resource ACL overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<ResourceAclOverview> {
    return this.resourceAclsService.getOverview(currentUser);
  }

  @Get('options')
  @Permissions('system:resource_acl:view')
  @ApiOkResponse({ description: 'Resource and subject options for ACL editor' })
  async options(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListResourceAclOptionsDto,
  ): Promise<ResourceAclOptionResult> {
    return this.resourceAclsService.options(currentUser, query);
  }

  @Get()
  @Permissions('system:resource_acl:view')
  @ApiOkResponse({ description: 'Resource ACL list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListResourceAclsDto,
  ): Promise<ResourceAclItem[]> {
    return this.resourceAclsService.list(currentUser, query);
  }

  @Post()
  @Permissions('system:resource_acl:manage')
  @ApiOkResponse({ description: 'Create Resource ACL rule' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateResourceAclDto,
  ): Promise<ResourceAclItem> {
    return this.resourceAclsService.create(currentUser, dto);
  }

  @Patch(':id')
  @Permissions('system:resource_acl:manage')
  @ApiOkResponse({ description: 'Update Resource ACL rule' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateResourceAclDto,
  ): Promise<ResourceAclItem> {
    return this.resourceAclsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('system:resource_acl:manage')
  @ApiOkResponse({ description: 'Soft delete Resource ACL rule' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.resourceAclsService.remove(currentUser, id);
  }

  @Post('check')
  @Permissions('system:resource_acl:view')
  @ApiOkResponse({ description: 'Check Resource ACL decision' })
  async check(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CheckResourceAclDto,
  ): Promise<ResourceAclCheckResult> {
    return this.resourceAclsService.check(currentUser, dto);
  }
}
