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

import type { CustomerSuccessActionDetail, CustomerSuccessActionListItem, PaginatedResult } from '@aiaget/shared-types';

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
import { CustomerSuccessActionsService } from './customer-success-actions.service';
import { CreateCustomerSuccessActionDto } from './dto/create-customer-success-action.dto';
import { ListCustomerSuccessActionsDto } from './dto/list-customer-success-actions.dto';
import { UpdateCustomerSuccessActionDto } from './dto/update-customer-success-action.dto';

@ApiTags('customer-success-actions')
@ApiBearerAuth()
@Controller('customer-success-actions')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class CustomerSuccessActionsController {
  constructor(
    @Inject(CustomerSuccessActionsService) private readonly customerSuccessActionsService: CustomerSuccessActionsService,
  ) {}

  @Get()
  @Permissions('customer:success_action:view')
  @ApiOkResponse({ description: 'Tenant-isolated customer success action list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListCustomerSuccessActionsDto,
  ): Promise<PaginatedResult<CustomerSuccessActionListItem>> {
    return this.customerSuccessActionsService.list(currentUser, query);
  }

  @Post()
  @Permissions('customer:success_action:manage')
  @ApiOkResponse({ description: 'Create customer success action' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerSuccessActionDto,
  ): Promise<CustomerSuccessActionDetail> {
    return this.customerSuccessActionsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('customer:success_action:view')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_ACTION' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_ACTION', permissionCode: 'customer:success_action:view' })
  @ApiOkResponse({ description: 'Get customer success action detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<CustomerSuccessActionDetail> {
    return this.customerSuccessActionsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('customer:success_action:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_ACTION' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_ACTION', permissionCode: 'customer:success_action:manage' })
  @ApiOkResponse({ description: 'Update customer success action' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerSuccessActionDto,
  ): Promise<CustomerSuccessActionDetail> {
    return this.customerSuccessActionsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('customer:success_action:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_SUCCESS_ACTION' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_SUCCESS_ACTION', permissionCode: 'customer:success_action:manage' })
  @ApiOkResponse({ description: 'Archive customer success action' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.customerSuccessActionsService.remove(currentUser, id);
  }
}
