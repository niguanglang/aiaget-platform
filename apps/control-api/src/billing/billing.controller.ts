import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { BillingOverview } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { BillingService } from './billing.service';
import { GetBillingOverviewDto } from './dto/get-billing-overview.dto';

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
}
