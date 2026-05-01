import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  PaginatedResult,
  PermissionCatalogGroup,
  RoleDetail,
  RoleListItem,
  RoleOverview,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesDto } from './dto/list-roles.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get('overview')
  @Permissions('system:role:view')
  @ApiOkResponse({ description: 'Role overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<RoleOverview> {
    return this.rolesService.getOverview(currentUser);
  }

  @Get('permissions/catalog')
  @Permissions('system:role:view')
  @ApiOkResponse({ description: 'Permission catalog grouped by module and resource' })
  async permissionCatalog(@CurrentUser() currentUser: AuthenticatedUser): Promise<PermissionCatalogGroup[]> {
    return this.rolesService.permissionCatalog(currentUser);
  }

  @Get()
  @Permissions('system:role:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated role list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListRolesDto,
  ): Promise<PaginatedResult<RoleListItem>> {
    return this.rolesService.list(currentUser, query);
  }

  @Post()
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Create role' })
  async create(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: CreateRoleDto): Promise<RoleDetail> {
    return this.rolesService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('system:role:view')
  @ApiOkResponse({ description: 'Get role detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<RoleDetail> {
    return this.rolesService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Update role' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleDetail> {
    return this.rolesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Soft delete role' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.rolesService.remove(currentUser, id);
  }

  @Post(':id/enable')
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Enable role' })
  async enable(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<RoleDetail> {
    return this.rolesService.setStatus(currentUser, id, 'ACTIVE');
  }

  @Post(':id/disable')
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Disable role' })
  async disable(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<RoleDetail> {
    return this.rolesService.setStatus(currentUser, id, 'DISABLED');
  }

  @Put(':id/permissions')
  @Permissions('system:role:manage')
  @ApiOkResponse({ description: 'Replace permissions assigned to a role' })
  async updatePermissions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ): Promise<RoleDetail> {
    return this.rolesService.updatePermissions(currentUser, id, dto);
  }
}
