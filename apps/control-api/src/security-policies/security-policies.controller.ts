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
  SecurityPolicyDetail,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyOverview,
  SimulateSecurityPolicyResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateSecurityPolicyDto } from './dto/create-security-policy.dto';
import { ListSecurityPoliciesDto } from './dto/list-security-policies.dto';
import { ListSecurityPolicyEvaluationsDto } from './dto/list-security-policy-evaluations.dto';
import { SimulateSecurityPolicyDto } from './dto/simulate-security-policy.dto';
import { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';
import { SecurityPoliciesService } from './security-policies.service';

@ApiTags('security-policies')
@ApiBearerAuth()
@Controller('security-policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityPoliciesController {
  constructor(@Inject(SecurityPoliciesService) private readonly securityPoliciesService: SecurityPoliciesService) {}

  @Get('overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Security policy overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<SecurityPolicyOverview> {
    return this.securityPoliciesService.getOverview(currentUser);
  }

  @Get()
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated security policy list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityPoliciesDto,
  ): Promise<PaginatedResult<SecurityPolicyListItem>> {
    return this.securityPoliciesService.list(currentUser, query);
  }

  @Get('evaluations')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Paginated security policy evaluation logs' })
  async listEvaluations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityPolicyEvaluationsDto,
  ): Promise<PaginatedResult<SecurityPolicyEvaluationItem>> {
    return this.securityPoliciesService.listEvaluations(currentUser, query);
  }

  @Post('simulate')
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Simulate ABAC policy evaluation and persist evaluation log' })
  async simulate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SimulateSecurityPolicyDto,
  ): Promise<SimulateSecurityPolicyResult> {
    return this.securityPoliciesService.simulate(currentUser, dto);
  }

  @Post()
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Create security policy' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSecurityPolicyDto,
  ): Promise<SecurityPolicyDetail> {
    return this.securityPoliciesService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get security policy detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SecurityPolicyDetail> {
    return this.securityPoliciesService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Update security policy' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSecurityPolicyDto,
  ): Promise<SecurityPolicyDetail> {
    return this.securityPoliciesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Soft delete security policy' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.securityPoliciesService.remove(currentUser, id);
  }

  @Post(':id/enable')
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Enable security policy' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SecurityPolicyDetail> {
    return this.securityPoliciesService.setStatus(currentUser, id, 'ACTIVE');
  }

  @Post(':id/disable')
  @Permissions('security:rule:manage')
  @ApiOkResponse({ description: 'Disable security policy' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SecurityPolicyDetail> {
    return this.securityPoliciesService.setStatus(currentUser, id, 'DISABLED');
  }
}
