import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  AcceptProductionReadinessCheckInput,
  NotificationPolicyAuditOverview,
  NotificationPolicyApprovalOverview,
  NotificationPolicyChangePreview,
  NotificationPolicySnapshotOverview,
  PaginatedResult,
  ProductionReadinessAcceptance,
  ProductionReadinessOverview,
  SystemSettingItem,
  SystemSettingSnapshotItem,
  SystemSettingOverview,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListNotificationPolicyApprovalsDto } from './dto/list-notification-policy-approvals.dto';
import { ListSystemSettingsDto } from './dto/list-system-settings.dto';
import { ReviewNotificationPolicyApprovalDto } from './dto/review-notification-policy-approval.dto';
import { RollbackSystemSettingSnapshotDto } from './dto/rollback-system-setting-snapshot.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('system-settings')
@ApiBearerAuth()
@Controller('system-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(@Inject(SystemSettingsService) private readonly systemSettingsService: SystemSettingsService) {}

  @Get('overview')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'System setting overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<SystemSettingOverview> {
    return this.systemSettingsService.getOverview(currentUser);
  }

  @Get('production-readiness')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Production rollout readiness checklist for current tenant' })
  async getProductionReadiness(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProductionReadinessOverview> {
    return this.systemSettingsService.getProductionReadinessOverview(currentUser);
  }

  @Post('production-readiness/:checkId/accept')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Record manual production readiness acceptance evidence' })
  async acceptProductionReadinessCheck(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('checkId') checkId: string,
    @Body() input: AcceptProductionReadinessCheckInput,
  ): Promise<ProductionReadinessAcceptance> {
    return this.systemSettingsService.acceptProductionReadinessCheck(currentUser, checkId, input);
  }

  @Get()
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Tenant-scoped system setting list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSystemSettingsDto,
  ): Promise<SystemSettingItem[]> {
    return this.systemSettingsService.list(currentUser, query);
  }

  @Post('notification-policy/preview/:id')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Preview notification policy setting change impact' })
  async previewNotificationPolicyChange(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSystemSettingDto,
  ): Promise<NotificationPolicyChangePreview> {
    return this.systemSettingsService.previewNotificationPolicyChange(currentUser, id, dto);
  }

  @Get('notification-policy/audit')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Recent notification policy setting audit overview' })
  async getNotificationPolicyAudit(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<NotificationPolicyAuditOverview> {
    return this.systemSettingsService.getNotificationPolicyAudit(currentUser);
  }

  @Get('notification-policy/snapshots')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Recent notification policy setting snapshots' })
  async getNotificationPolicySnapshots(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<NotificationPolicySnapshotOverview> {
    return this.systemSettingsService.getNotificationPolicySnapshots(currentUser);
  }

  @Post('notification-policy/snapshots/:snapshotId/rollback')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Rollback notification policy setting to a snapshot previous value' })
  async rollbackNotificationPolicySnapshot(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('snapshotId') snapshotId: string,
    @Body() dto: RollbackSystemSettingSnapshotDto,
  ): Promise<SystemSettingItem> {
    return this.systemSettingsService.rollbackNotificationPolicySnapshot(currentUser, snapshotId, dto);
  }

  @Get('notification-policy/approvals/overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Notification policy approval overview' })
  async getNotificationPolicyApprovalOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<NotificationPolicyApprovalOverview> {
    return this.systemSettingsService.getNotificationPolicyApprovalOverview(currentUser);
  }

  @Get('notification-policy/approvals')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'List notification policy approval requests' })
  async listNotificationPolicyApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListNotificationPolicyApprovalsDto,
  ): Promise<PaginatedResult<SystemSettingSnapshotItem>> {
    return this.systemSettingsService.listNotificationPolicyApprovals(currentUser, query);
  }

  @Get('notification-policy/approvals/:snapshotId')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Get notification policy approval detail' })
  async getNotificationPolicyApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('snapshotId') snapshotId: string,
  ): Promise<SystemSettingSnapshotItem> {
    return this.systemSettingsService.getNotificationPolicyApproval(currentUser, snapshotId);
  }

  @Post('notification-policy/approvals/:snapshotId/approve')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve notification policy change and apply setting' })
  async approveNotificationPolicyApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('snapshotId') snapshotId: string,
    @Body() dto: ReviewNotificationPolicyApprovalDto,
  ): Promise<SystemSettingSnapshotItem> {
    return this.systemSettingsService.approveNotificationPolicyApproval(currentUser, snapshotId, dto);
  }

  @Post('notification-policy/approvals/:snapshotId/reject')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Reject notification policy change without applying setting' })
  async rejectNotificationPolicyApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('snapshotId') snapshotId: string,
    @Body() dto: ReviewNotificationPolicyApprovalDto,
  ): Promise<SystemSettingSnapshotItem> {
    return this.systemSettingsService.rejectNotificationPolicyApproval(currentUser, snapshotId, dto);
  }

  @Patch(':id')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Update one system setting' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSystemSettingDto,
  ): Promise<SystemSettingItem> {
    return this.systemSettingsService.update(currentUser, id, dto);
  }

  @Post(':id/reset')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Reset one system setting to default value' })
  async reset(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SystemSettingItem> {
    return this.systemSettingsService.reset(currentUser, id);
  }
}
