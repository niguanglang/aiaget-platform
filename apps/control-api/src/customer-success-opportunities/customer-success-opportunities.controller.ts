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
  CustomerSuccessOpportunityAnalytics,
  CustomerSuccessOpportunityDetail,
  CustomerSuccessOpportunityListItem,
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
import { CustomerSuccessOpportunitiesService } from './customer-success-opportunities.service';
import { CreateCustomerSuccessOpportunityDto } from './dto/create-customer-success-opportunity.dto';
import { ListCustomerSuccessOpportunitiesDto } from './dto/list-customer-success-opportunities.dto';
import { UpdateCustomerSuccessOpportunityDto } from './dto/update-customer-success-opportunity.dto';

@ApiTags('customer-success-opportunities')
@ApiBearerAuth()
@Controller('customer-success-opportunities')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class CustomerSuccessOpportunitiesController {
  constructor(
    @Inject(CustomerSuccessOpportunitiesService)
    private readonly customerSuccessOpportunitiesService: CustomerSuccessOpportunitiesService,
  ) {}

  @Get()
  @Permissions('customer:success_opportunity:view')
  @ApiOkResponse({ description: 'Tenant-isolated customer success opportunity list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListCustomerSuccessOpportunitiesDto,
  ): Promise<PaginatedResult<CustomerSuccessOpportunityListItem>> {
    return this.customerSuccessOpportunitiesService.list(currentUser, query);
  }

  @Get('analytics')
  @Permissions('customer:success_opportunity:view')
  @ApiOkResponse({ description: 'Tenant-isolated customer success opportunity analytics' })
  async analytics(@CurrentUser() currentUser: AuthenticatedUser): Promise<CustomerSuccessOpportunityAnalytics> {
    return this.customerSuccessOpportunitiesService.analytics(currentUser);
  }

  @Post()
  @Permissions('customer:success_opportunity:manage')
  @ApiOkResponse({ description: 'Create customer success opportunity' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerSuccessOpportunityDto,
  ): Promise<CustomerSuccessOpportunityDetail> {
    return this.customerSuccessOpportunitiesService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('customer:success_opportunity:view')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY' })
  @RequireResourceAcl({
    resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
    permissionCode: 'customer:success_opportunity:view',
  })
  @ApiOkResponse({ description: 'Get customer success opportunity detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CustomerSuccessOpportunityDetail> {
    return this.customerSuccessOpportunitiesService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('customer:success_opportunity:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY' })
  @RequireResourceAcl({
    resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
    permissionCode: 'customer:success_opportunity:manage',
  })
  @ApiOkResponse({ description: 'Update customer success opportunity' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerSuccessOpportunityDto,
  ): Promise<CustomerSuccessOpportunityDetail> {
    return this.customerSuccessOpportunitiesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('customer:success_opportunity:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY' })
  @RequireResourceAcl({
    resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
    permissionCode: 'customer:success_opportunity:manage',
  })
  @ApiOkResponse({ description: 'Archive customer success opportunity' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.customerSuccessOpportunitiesService.remove(currentUser, id);
  }
}
