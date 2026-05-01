import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  PaginatedResult,
  TestToolResult,
  ToolDetail,
  ToolListItem,
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
import { CreateToolDto } from './dto/create-tool.dto';
import { ListToolsDto } from './dto/list-tools.dto';
import { TestToolDto } from './dto/test-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolsService } from './tools.service';

@ApiTags('tools')
@ApiBearerAuth()
@Controller('tools')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class ToolsController {
  constructor(@Inject(ToolsService) private readonly toolsService: ToolsService) {}

  @Get()
  @Permissions('tool:definition:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated tool list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListToolsDto,
  ): Promise<PaginatedResult<ToolListItem>> {
    return this.toolsService.list(currentUser, query);
  }

  @Post()
  @Permissions('tool:definition:manage')
  @ApiOkResponse({ description: 'Create tool' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateToolDto,
  ): Promise<ToolDetail> {
    return this.toolsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('tool:definition:view')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:view' })
  @ApiOkResponse({ description: 'Get tool detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolDetail> {
    return this.toolsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('tool:definition:manage')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:manage' })
  @ApiOkResponse({ description: 'Update tool' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateToolDto,
  ): Promise<ToolDetail> {
    return this.toolsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('tool:definition:manage')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:manage' })
  @ApiOkResponse({ description: 'Soft delete tool' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.toolsService.remove(currentUser, id);
  }

  @Post(':id/copy')
  @Permissions('tool:definition:manage')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:manage' })
  @ApiOkResponse({ description: 'Copy tool configuration' })
  async copy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolDetail> {
    return this.toolsService.copy(currentUser, id);
  }

  @Post(':id/disable')
  @Permissions('tool:definition:manage')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:manage' })
  @ApiOkResponse({ description: 'Disable tool' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolDetail> {
    return this.toolsService.setStatus(currentUser, id, 'DISABLED');
  }

  @Post(':id/enable')
  @Permissions('tool:definition:manage')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:definition:manage' })
  @ApiOkResponse({ description: 'Enable tool' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolDetail> {
    return this.toolsService.setStatus(currentUser, id, 'ACTIVE');
  }

  @Post(':id/test')
  @Permissions('tool:call:execute')
  @RequireDataScope({ resourceType: 'TOOL' })
  @RequireResourceAcl({ resourceType: 'TOOL', permissionCode: 'tool:call:execute' })
  @ApiOkResponse({ description: 'Run tool through Tool Gateway and record call log' })
  async test(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TestToolDto,
  ): Promise<TestToolResult> {
    return this.toolsService.test(currentUser, id, dto);
  }
}
