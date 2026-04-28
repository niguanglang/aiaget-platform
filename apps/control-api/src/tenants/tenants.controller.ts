import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { PaginatedResult, TenantListItem } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly tenantsService: TenantsService) {}

  @Get()
  @Permissions('tenant.read')
  @ApiOkResponse({ description: 'Tenant list scoped to the current tenant context' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListTenantsDto,
  ): Promise<PaginatedResult<TenantListItem>> {
    return this.tenantsService.list(currentUser, query);
  }
}
