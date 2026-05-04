import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { BillingOverview, BillingQuotaPolicyItem, BillingSubscriptionItem } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { BillingService } from './billing.service';
import { GetBillingOverviewDto } from './dto/get-billing-overview.dto';
import { UpdateBillingQuotaPolicyDto } from './dto/update-billing-quota-policy.dto';
import { UpdateBillingSubscriptionDto } from './dto/update-billing-subscription.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('overview')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Tenant cost and quota overview' })
  async getOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetBillingOverviewDto,
  ): Promise<BillingOverview> {
    return this.billingService.getOverview(currentUser, query.window);
  }

  @Patch('subscription')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Update tenant billing subscription' })
  async updateSubscription(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateBillingSubscriptionDto,
  ): Promise<BillingSubscriptionItem> {
    return this.billingService.updateSubscription(currentUser, dto);
  }

  @Patch('quota-policies/:id')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Update billing quota policy' })
  async updateQuotaPolicy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillingQuotaPolicyDto,
  ): Promise<BillingQuotaPolicyItem> {
    return this.billingService.updateQuotaPolicy(currentUser, id, dto);
  }
}
