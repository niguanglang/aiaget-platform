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

import type { PaginatedResult, RoleScenarioDetail, RoleScenarioListItem } from '@aiaget/shared-types';

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
import { CreateRoleScenarioDto } from './dto/create-role-scenario.dto';
import { ListRoleScenariosDto } from './dto/list-role-scenarios.dto';
import { UpdateRoleScenarioDto } from './dto/update-role-scenario.dto';
import { RoleScenariosService } from './role-scenarios.service';

@ApiTags('role-scenarios')
@ApiBearerAuth()
@Controller('role-scenarios')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class RoleScenariosController {
  constructor(@Inject(RoleScenariosService) private readonly scenariosService: RoleScenariosService) {}

  @Get()
  @Permissions('scenario:package:view')
  @ApiOkResponse({ description: 'Tenant-isolated role scenario package list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListRoleScenariosDto,
  ): Promise<PaginatedResult<RoleScenarioListItem>> {
    return this.scenariosService.list(currentUser, query);
  }

  @Post()
  @Permissions('scenario:package:manage')
  @ApiOkResponse({ description: 'Create role scenario package' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateRoleScenarioDto,
  ): Promise<RoleScenarioDetail> {
    return this.scenariosService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('scenario:package:view')
  @RequireDataScope({ resourceType: 'ROLE_SCENARIO' })
  @RequireResourceAcl({ resourceType: 'ROLE_SCENARIO', permissionCode: 'scenario:package:view' })
  @ApiOkResponse({ description: 'Get role scenario package detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<RoleScenarioDetail> {
    return this.scenariosService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('scenario:package:manage')
  @RequireDataScope({ resourceType: 'ROLE_SCENARIO' })
  @RequireResourceAcl({ resourceType: 'ROLE_SCENARIO', permissionCode: 'scenario:package:manage' })
  @ApiOkResponse({ description: 'Update role scenario package' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleScenarioDto,
  ): Promise<RoleScenarioDetail> {
    return this.scenariosService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('scenario:package:manage')
  @RequireDataScope({ resourceType: 'ROLE_SCENARIO' })
  @RequireResourceAcl({ resourceType: 'ROLE_SCENARIO', permissionCode: 'scenario:package:manage' })
  @ApiOkResponse({ description: 'Archive role scenario package' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.scenariosService.remove(currentUser, id);
  }
}
