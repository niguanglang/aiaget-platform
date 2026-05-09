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

import type { CustomerAssessmentDetail, CustomerAssessmentListItem, PaginatedResult } from '@aiaget/shared-types';

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
import { CustomerAssessmentsService } from './customer-assessments.service';
import { CreateCustomerAssessmentDto } from './dto/create-customer-assessment.dto';
import { ListCustomerAssessmentsDto } from './dto/list-customer-assessments.dto';
import { UpdateCustomerAssessmentDto } from './dto/update-customer-assessment.dto';

@ApiTags('customer-assessments')
@ApiBearerAuth()
@Controller('customer-assessments')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class CustomerAssessmentsController {
  constructor(@Inject(CustomerAssessmentsService) private readonly assessmentsService: CustomerAssessmentsService) {}

  @Get()
  @Permissions('customer:assessment:view')
  @ApiOkResponse({ description: 'Tenant-isolated customer assessment list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListCustomerAssessmentsDto,
  ): Promise<PaginatedResult<CustomerAssessmentListItem>> {
    return this.assessmentsService.list(currentUser, query);
  }

  @Post()
  @Permissions('customer:assessment:manage')
  @ApiOkResponse({ description: 'Create customer qualification assessment' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCustomerAssessmentDto,
  ): Promise<CustomerAssessmentDetail> {
    return this.assessmentsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('customer:assessment:view')
  @RequireDataScope({ resourceType: 'CUSTOMER_ASSESSMENT' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_ASSESSMENT', permissionCode: 'customer:assessment:view' })
  @ApiOkResponse({ description: 'Get customer assessment detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<CustomerAssessmentDetail> {
    return this.assessmentsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('customer:assessment:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_ASSESSMENT' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_ASSESSMENT', permissionCode: 'customer:assessment:manage' })
  @ApiOkResponse({ description: 'Update customer assessment' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerAssessmentDto,
  ): Promise<CustomerAssessmentDetail> {
    return this.assessmentsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('customer:assessment:manage')
  @RequireDataScope({ resourceType: 'CUSTOMER_ASSESSMENT' })
  @RequireResourceAcl({ resourceType: 'CUSTOMER_ASSESSMENT', permissionCode: 'customer:assessment:manage' })
  @ApiOkResponse({ description: 'Archive customer assessment' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.assessmentsService.remove(currentUser, id);
  }
}
