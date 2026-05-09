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

import type { CustomerSuccessPlanDetail, CustomerSuccessPlanListItem, PaginatedResult } from '@aiaget/shared-types';

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
import { CreateCustomerSuccessPlanDto } from './dto/create-customer-success-plan.dto';
import { ListCustomerSuccessPlansDto } from './dto/list-customer-success-plans.dto';
import { UpdateCustomerSuccessPlanDto } from './dto/update-customer-success-plan.dto';
import { CustomerSuccessPlansService } from './customer-success-plans.service';

@ApiTags('customer-success-plans')
@ApiBearerAuth()
@Controller('customer-success-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class CustomerSuccessPlansController {
  constructor(
    @Inject(CustomerSuccessPlansService) private readonly customerSuccessPlansService: CustomerSuccessPlansService,
  ) {}

  @Get()
  @Permissions('customer:success:view')
  @ApiOkResponse({ description: 'Tenant-isolated customer success plan list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListCustomerSuccessPlansDto,
  ): Promise<PaginatedResult<CustomerSuccessPlanListItem>> {
    return this.customerSuccessPlansService.list(currentUser, query);
  }

  @Post()
  @Permissions('customer:success:manage')
  @ApiOkResponse({ description: 'Create customer success plan' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerSuccessPlanDto,
  ): Promise<CustomerSuccessPlanDetail> {
    return this.customerSuccessPlansService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('customer:success:view')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_PLAN' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_PLAN', permissionCode: 'customer:success:view' })
  @ApiOkResponse({ description: 'Get customer success plan detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<CustomerSuccessPlanDetail> {
    return this.customerSuccessPlansService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('customer:success:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_PLAN' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_PLAN', permissionCode: 'customer:success:manage' })
  @ApiOkResponse({ description: 'Update customer success plan' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerSuccessPlanDto,
  ): Promise<CustomerSuccessPlanDetail> {
    return this.customerSuccessPlansService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('customer:success:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_PLAN' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_PLAN', permissionCode: 'customer:success:manage' })
  @ApiOkResponse({ description: 'Archive customer success plan' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.customerSuccessPlansService.remove(currentUser, id);
  }
}
