import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  DataScopeOverview,
  DataScopePreviewResult,
  RoleDataScopeDetail,
  RoleDataScopeItem,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopesService } from './data-scopes.service';
import { ListDataScopesDto } from './dto/list-data-scopes.dto';
import { PreviewDataScopeDto } from './dto/preview-data-scope.dto';
import { ReplaceRoleDataScopesDto } from './dto/replace-role-data-scopes.dto';

@ApiTags('data-scopes')
@ApiBearerAuth()
@Controller('data-scopes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataScopesController {
  constructor(@Inject(DataScopesService) private readonly dataScopesService: DataScopesService) {}

  @Get('overview')
  @Permissions('system:data_scope:view')
  @ApiOkResponse({ description: 'Data scope overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<DataScopeOverview> {
    return this.dataScopesService.getOverview(currentUser);
  }

  @Get()
  @Permissions('system:data_scope:view')
  @ApiOkResponse({ description: 'Role data scope matrix list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListDataScopesDto,
  ): Promise<RoleDataScopeItem[]> {
    return this.dataScopesService.list(currentUser, query);
  }

  @Get('roles/:roleId')
  @Permissions('system:data_scope:view')
  @ApiOkResponse({ description: 'Role data scope detail' })
  async getRoleScopes(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('roleId') roleId: string,
  ): Promise<RoleDataScopeDetail> {
    return this.dataScopesService.getRoleScopes(currentUser, roleId);
  }

  @Put('roles/:roleId')
  @Permissions('system:data_scope:manage')
  @ApiOkResponse({ description: 'Replace data scopes assigned to a role' })
  async replaceRoleScopes(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() dto: ReplaceRoleDataScopesDto,
  ): Promise<RoleDataScopeDetail> {
    return this.dataScopesService.replaceRoleScopes(currentUser, roleId, dto);
  }

  @Post('preview')
  @Permissions('system:data_scope:view')
  @ApiOkResponse({ description: 'Preview effective data scope' })
  async preview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: PreviewDataScopeDto,
  ): Promise<DataScopePreviewResult> {
    return this.dataScopesService.preview(currentUser, dto);
  }
}
