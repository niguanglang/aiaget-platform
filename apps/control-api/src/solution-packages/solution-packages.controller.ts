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

import type { PaginatedResult, SolutionPackageDetail, SolutionPackageListItem } from '@aiaget/shared-types';

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
import { CreateSolutionPackageDto } from './dto/create-solution-package.dto';
import { ListSolutionPackagesDto } from './dto/list-solution-packages.dto';
import { UpdateSolutionPackageDto } from './dto/update-solution-package.dto';
import { SolutionPackagesService } from './solution-packages.service';

@ApiTags('solution-packages')
@ApiBearerAuth()
@Controller('solution-packages')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class SolutionPackagesController {
  constructor(@Inject(SolutionPackagesService) private readonly packagesService: SolutionPackagesService) {}

  @Get()
  @Permissions('solution:package:view')
  @ApiOkResponse({ description: 'Tenant-isolated AI landing solution package list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSolutionPackagesDto,
  ): Promise<PaginatedResult<SolutionPackageListItem>> {
    return this.packagesService.list(currentUser, query);
  }

  @Post()
  @Permissions('solution:package:manage')
  @ApiOkResponse({ description: 'Create AI landing solution package' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSolutionPackageDto,
  ): Promise<SolutionPackageDetail> {
    return this.packagesService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('solution:package:view')
  @RequireDataScope({ resourceType: 'SOLUTION_PACKAGE' })
  @RequireResourceAcl({ resourceType: 'SOLUTION_PACKAGE', permissionCode: 'solution:package:view' })
  @ApiOkResponse({ description: 'Get AI landing solution package detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<SolutionPackageDetail> {
    return this.packagesService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('solution:package:manage')
  @RequireDataScope({ resourceType: 'SOLUTION_PACKAGE' })
  @RequireResourceAcl({ resourceType: 'SOLUTION_PACKAGE', permissionCode: 'solution:package:manage' })
  @ApiOkResponse({ description: 'Update AI landing solution package' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSolutionPackageDto,
  ): Promise<SolutionPackageDetail> {
    return this.packagesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('solution:package:manage')
  @RequireDataScope({ resourceType: 'SOLUTION_PACKAGE' })
  @RequireResourceAcl({ resourceType: 'SOLUTION_PACKAGE', permissionCode: 'solution:package:manage' })
  @ApiOkResponse({ description: 'Archive AI landing solution package' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.packagesService.remove(currentUser, id);
  }
}
