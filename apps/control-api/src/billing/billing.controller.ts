import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  BillingAdjustmentItem,
  BillingInvoiceItem,
  BillingOverview,
  BillingQuotaEnforcementResult,
  BillingQuotaPolicyItem,
  BillingSubscriptionItem,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { BillingService } from './billing.service';
import { BillingAdjustmentActionDto, VoidBillingAdjustmentDto } from './dto/billing-adjustment-action.dto';
import { CreateBillingAdjustmentDto } from './dto/create-billing-adjustment.dto';
import { EnforceBillingQuotaDto } from './dto/enforce-billing-quota.dto';
import { GetBillingOverviewDto } from './dto/get-billing-overview.dto';
import { UpdateBillingInvoiceStatusDto } from './dto/update-billing-invoice-status.dto';
import { UpdateBillingQuotaPolicyDto } from './dto/update-billing-quota-policy.dto';
import { UpdateBillingSubscriptionDto } from './dto/update-billing-subscription.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('overview')
  @Permissions('billing:center:view')
  @ApiOkResponse({ description: 'Tenant cost and quota overview' })
  async getOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetBillingOverviewDto,
  ): Promise<BillingOverview> {
    return this.billingService.getOverview(currentUser, query.window);
  }

  @Post('adjustments')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Create one billing adjustment' })
  async createAdjustment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateBillingAdjustmentDto,
  ): Promise<BillingAdjustmentItem> {
    return this.billingService.createAdjustment(currentUser, dto);
  }

  @Post('adjustments/:id/approve')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Approve one pending billing adjustment' })
  async approveAdjustment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BillingAdjustmentActionDto,
  ): Promise<BillingAdjustmentItem> {
    return this.billingService.approveAdjustment(currentUser, id, dto);
  }

  @Post('adjustments/:id/apply')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Apply one approved billing adjustment to invoice calculation' })
  async applyAdjustment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BillingAdjustmentActionDto,
  ): Promise<BillingAdjustmentItem> {
    return this.billingService.applyAdjustment(currentUser, id, dto);
  }

  @Post('adjustments/:id/void')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Void one billing adjustment' })
  async voidAdjustment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VoidBillingAdjustmentDto,
  ): Promise<BillingAdjustmentItem> {
    return this.billingService.voidAdjustment(currentUser, id, dto);
  }

  @Post('invoices/current/recalculate')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Recalculate current billing period invoice' })
  async recalculateCurrentInvoice(@CurrentUser() currentUser: AuthenticatedUser): Promise<BillingInvoiceItem> {
    return this.billingService.recalculateCurrentInvoice(currentUser);
  }

  @Post('invoices/:id/lock')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Lock one draft invoice as open' })
  async lockInvoice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillingInvoiceStatusDto,
  ): Promise<BillingInvoiceItem> {
    return this.billingService.lockInvoice(currentUser, id, dto);
  }

  @Post('invoices/:id/mark-paid')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Mark one invoice as paid' })
  async markInvoicePaid(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillingInvoiceStatusDto,
  ): Promise<BillingInvoiceItem> {
    return this.billingService.markInvoicePaid(currentUser, id, dto);
  }

  @Post('invoices/:id/void')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Void one invoice' })
  async voidInvoice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillingInvoiceStatusDto,
  ): Promise<BillingInvoiceItem> {
    return this.billingService.voidInvoice(currentUser, id, dto);
  }

  @Post('invoices/:id/mark-overdue')
  @Permissions('billing:adjustment:manage')
  @ApiOkResponse({ description: 'Mark one invoice as overdue' })
  async markInvoiceOverdue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBillingInvoiceStatusDto,
  ): Promise<BillingInvoiceItem> {
    return this.billingService.markInvoiceOverdue(currentUser, id, dto);
  }

  @Post('quota/enforce')
  @Permissions('billing:center:view')
  @ApiOkResponse({ description: 'Evaluate tenant billing quota enforcement decision' })
  async enforceQuota(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: EnforceBillingQuotaDto,
  ): Promise<BillingQuotaEnforcementResult> {
    return this.billingService.enforceQuota(currentUser, dto);
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
