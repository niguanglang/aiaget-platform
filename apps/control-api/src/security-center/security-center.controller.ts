import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type {
  PaginatedResult,
  SecurityCenterEventDetail,
  SecurityCenterEventListItem,
  SecurityCenterOverview,
  SecurityApprovalWorkbenchDetail,
  SecurityApprovalWorkbenchItem,
  SecurityApprovalWorkbenchOverview,
  CreateSecurityOperationAlertNotificationArchiveResult,
  CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult,
  CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult,
  SecurityOperationAlertActionResult,
  SecurityOperationAlertNotificationArchiveApprovalDetail,
  SecurityOperationAlertNotificationArchiveApprovalItem,
  SecurityOperationAlertNotificationArchiveApprovalOverview,
  SecurityOperationAlertNotificationArchiveListResult,
  SecurityOperationAlertNotificationOverview,
  SecurityOperationAlertNotificationResult,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult,
  SecurityOperationAlertNotificationTaskRecoveryAuditOverview,
  SecurityOperationAlertNotificationTaskRecoveryActionResult,
  SecurityOperationAlertNotificationTaskOverview,
  SecurityOperationAlertNotificationTaskRunOverview,
  SecurityOperationAlertNotificationTaskRunResult,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  SecurityOperationAlertSlaDeadLetterAuditArchiveListResult,
  SecurityOperationAlertSlaDeadLetterAuditItem,
  SecurityOperationAlertSlaDeadLetterActionResult,
  SecurityOperationAlertSlaDeadLetterOverview,
  SecurityOperationAlertSlaNotificationOverview,
  SecurityOperationAlertSlaNotificationItem,
  SecurityOperationAlertSlaNotificationRetryOverview,
  SecurityOperationAlertSlaNotificationRetryTaskRunResult,
  SecurityOperationAlertSlaNotificationResult,
  SecurityOperationAlertSlaOverview,
  SecurityOperationAlertSlaTaskRunResult,
  StorageDownloadUrlResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListSecurityApprovalWorkbenchDto } from './dto/list-security-approval-workbench.dto';
import { ListSecurityCenterEventsDto } from './dto/list-security-center-events.dto';
import { ListSecurityOperationAlertNotificationsDto } from './dto/list-security-operation-alert-notifications.dto';
import { ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto } from './dto/list-security-operation-alert-notification-task-recovery-audits.dto';
import { ListSecurityOperationAlertNotificationTaskRunsDto } from './dto/list-security-operation-alert-notification-task-runs.dto';
import { ListSecurityOperationAlertSlaDeadLetterAuditsDto } from './dto/list-security-operation-alert-sla-dead-letter-audits.dto';
import { HandleSecurityOperationAlertSlaDeadLetterDto } from './dto/handle-security-operation-alert-sla-dead-letter.dto';
import { NotifySecurityOperationAlertDto } from './dto/notify-security-operation-alert.dto';
import { ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto } from './dto/review-security-operation-alert-sla-dead-letter-audit-archive-approval.dto';
import { ReviewSecurityApprovalWorkbenchDto } from './dto/review-security-approval-workbench.dto';
import { UpdateSecurityOperationAlertNotificationTaskRecoverySuggestionDto } from './dto/update-security-operation-alert-notification-task-recovery-suggestion.dto';
import { UpdateSecurityOperationAlertDto } from './dto/update-security-operation-alert.dto';
import { SecurityApprovalWorkbenchService } from './security-approval-workbench.service';
import { SecurityOperationAlertNotificationTaskService } from './security-operation-alert-notification-task.service';
import { SecurityOperationAlertSlaService } from './security-operation-alert-sla.service';
import { SecurityCenterService } from './security-center.service';

@ApiTags('security-center')
@ApiBearerAuth()
@Controller('security-center')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityCenterController {
  constructor(
    @Inject(SecurityCenterService) private readonly securityCenterService: SecurityCenterService,
    @Inject(SecurityApprovalWorkbenchService)
    private readonly securityApprovalWorkbenchService: SecurityApprovalWorkbenchService,
    @Inject(SecurityOperationAlertNotificationTaskService)
    private readonly operationAlertNotificationTaskService: SecurityOperationAlertNotificationTaskService,
    @Inject(SecurityOperationAlertSlaService)
    private readonly operationAlertSlaService: SecurityOperationAlertSlaService,
  ) {}

  @Get('overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Integrated security center overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<SecurityCenterOverview> {
    return this.securityCenterService.getOverview(currentUser);
  }

  @Get('approval-workbench/overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Unified security approval workbench overview' })
  async getApprovalWorkbenchOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityApprovalWorkbenchOverview> {
    return this.securityApprovalWorkbenchService.overview(currentUser);
  }

  @Get('approval-workbench')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Unified security approval workbench queue' })
  async listApprovalWorkbenchItems(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityApprovalWorkbenchDto,
  ): Promise<PaginatedResult<SecurityApprovalWorkbenchItem>> {
    return this.securityApprovalWorkbenchService.list(currentUser, query);
  }

  @Get('approval-workbench/export')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Export unified security approval workbench queue as CSV' })
  async exportApprovalWorkbenchItems(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityApprovalWorkbenchDto,
    @Res() response: Response,
  ) {
    const csv = await this.securityApprovalWorkbenchService.exportCsv(currentUser, query);
    const fileName = `security-approval-workbench-${new Date().toISOString().slice(0, 10)}.csv`;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Get('approval-workbench/:approvalId')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Unified security approval workbench detail' })
  async getApprovalWorkbenchItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
  ): Promise<SecurityApprovalWorkbenchDetail> {
    return this.securityApprovalWorkbenchService.get(currentUser, approvalId);
  }

  @Post('approval-workbench/:approvalId/review')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve or reject one unified security approval workbench item' })
  async reviewApprovalWorkbenchItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityApprovalWorkbenchDto,
  ): Promise<SecurityApprovalWorkbenchDetail> {
    return this.securityApprovalWorkbenchService.review(currentUser, approvalId, body);
  }

  @Post('operation-alerts/:alertId/notify')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Notify a derived approval/archive operation alert' })
  async notifyOperationAlert(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('alertId') alertId: string,
    @Body() body: NotifySecurityOperationAlertDto,
  ): Promise<SecurityOperationAlertNotificationResult> {
    return this.securityCenterService.notifyOperationAlert(currentUser, alertId, body);
  }

  @Post('operation-alerts/:alertId/actions')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Update derived approval/archive operation alert lifecycle' })
  async updateOperationAlert(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('alertId') alertId: string,
    @Body() body: UpdateSecurityOperationAlertDto,
  ): Promise<SecurityOperationAlertActionResult> {
    return this.securityCenterService.updateOperationAlert(currentUser, alertId, body);
  }

  @Get('operation-alert-notifications')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert notification delivery events' })
  async listOperationAlertNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationsDto,
  ): Promise<SecurityOperationAlertNotificationOverview> {
    return this.securityCenterService.listOperationAlertNotifications(currentUser, query);
  }

  @Get('operation-alert-notifications/export')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Export approval/archive operation alert notification delivery events as CSV' })
  async exportOperationAlertNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationsDto,
    @Res() response: Response,
  ) {
    const csv = await this.securityCenterService.exportOperationAlertNotifications(currentUser, query);
    const fileName = `operation-alert-notifications-${new Date().toISOString().slice(0, 10)}.csv`;
    response.setHeader('content-type', 'text/csv; charset=utf-8');
    response.setHeader('content-disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Post('operation-alert-notifications/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create approval/archive operation alert notification delivery CSV archive' })
  async createOperationAlertNotificationArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationsDto,
  ): Promise<CreateSecurityOperationAlertNotificationArchiveResult> {
    return this.securityCenterService.createOperationAlertNotificationArchive(currentUser, query);
  }

  @Get('operation-alert-notifications/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert notification delivery CSV archives' })
  async listOperationAlertNotificationArchives(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveListResult> {
    return this.securityCenterService.listOperationAlertNotificationArchives(currentUser);
  }

  @Get('operation-alert-notifications/archives/:archiveId/download-url')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create approval/archive operation alert notification archive download URL' })
  async getOperationAlertNotificationArchiveDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.securityCenterService.getOperationAlertNotificationArchiveDownloadUrl(currentUser, archiveId);
  }

  @Delete('operation-alert-notifications/archives/:archiveId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Request approval to delete operation alert notification audit archive' })
  async deleteOperationAlertNotificationArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    return this.securityCenterService.deleteOperationAlertNotificationArchive(currentUser, archiveId);
  }

  @Get('operation-alert-notifications/archive-approvals/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get operation alert notification audit archive deletion approval overview' })
  async getOperationAlertNotificationArchiveApprovalOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalOverview> {
    return this.securityCenterService.getOperationAlertNotificationArchiveApprovalOverview(currentUser);
  }

  @Get('operation-alert-notifications/archive-approvals')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List operation alert notification audit archive deletion approvals' })
  async listOperationAlertNotificationArchiveApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalItem[]> {
    return this.securityCenterService.listOperationAlertNotificationArchiveApprovals(currentUser);
  }

  @Get('operation-alert-notifications/archive-approvals/:approvalId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get operation alert notification audit archive deletion approval detail' })
  async getOperationAlertNotificationArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    return this.securityCenterService.getOperationAlertNotificationArchiveApproval(currentUser, approvalId);
  }

  @Post('operation-alert-notifications/archive-approvals/:approvalId/approve')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Approve operation alert notification audit archive deletion' })
  async approveOperationAlertNotificationArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    return this.securityCenterService.approveOperationAlertNotificationArchiveApproval(currentUser, approvalId, body);
  }

  @Post('operation-alert-notifications/archive-approvals/:approvalId/reject')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Reject operation alert notification audit archive deletion' })
  async rejectOperationAlertNotificationArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    return this.securityCenterService.rejectOperationAlertNotificationArchiveApproval(currentUser, approvalId, body);
  }

  @Post('operation-alert-notifications/:notificationEventId/retry')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Retry approval/archive operation alert notification delivery' })
  async retryOperationAlertNotification(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationEventId') notificationEventId: string,
  ): Promise<SecurityOperationAlertNotificationResult> {
    return this.securityCenterService.retryOperationAlertNotification(currentUser, notificationEventId);
  }

  @Get('operation-alert-notification-tasks/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert notification task overview' })
  async getOperationAlertNotificationTaskOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskOverview> {
    return this.operationAlertNotificationTaskService.getOverview(currentUser);
  }

  @Get('operation-alert-notification-tasks/runs')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert notification task run history' })
  async listOperationAlertNotificationTaskRuns(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationTaskRunsDto,
  ): Promise<SecurityOperationAlertNotificationTaskRunOverview> {
    return this.operationAlertNotificationTaskService.listRuns(currentUser, query);
  }

  @Post('operation-alert-notification-tasks/run-auto-notify')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Run approval/archive operation alert notification auto notify task once' })
  async runOperationAlertNotificationAutoNotify(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    return this.operationAlertNotificationTaskService.runAutoNotify(currentUser);
  }

  @Post('operation-alert-notification-tasks/run-auto-retry')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Run approval/archive operation alert notification auto retry task once' })
  async runOperationAlertNotificationAutoRetry(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    return this.operationAlertNotificationTaskService.runAutoRetry(currentUser);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List notification task recovery suggestion lifecycle audit events' })
  async listOperationAlertNotificationTaskRecoveryAudits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditOverview> {
    return this.securityCenterService.listNotificationTaskRecoveryAudits(currentUser, query);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/export')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Export notification task recovery suggestion lifecycle audit events as CSV' })
  async exportOperationAlertNotificationTaskRecoveryAudits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
    @Res() response: Response,
  ) {
    const csv = await this.securityCenterService.exportNotificationTaskRecoveryAudits(currentUser, query);
    const fileName = `notification-task-recovery-audits-${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Post('operation-alert-notification-task-recovery-suggestions/audits/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create notification task recovery suggestion lifecycle audit CSV archive' })
  async createOperationAlertNotificationTaskRecoveryAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ): Promise<CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult> {
    return this.securityCenterService.createNotificationTaskRecoveryAuditArchive(currentUser, query);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List notification task recovery suggestion lifecycle audit CSV archives' })
  async listOperationAlertNotificationTaskRecoveryAuditArchives(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult> {
    return this.securityCenterService.listNotificationTaskRecoveryAuditArchives(currentUser);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/archives/:archiveId/download-url')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create notification task recovery suggestion lifecycle audit archive download URL' })
  async getOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.securityCenterService.getNotificationTaskRecoveryAuditArchiveDownloadUrl(currentUser, archiveId);
  }

  @Delete('operation-alert-notification-task-recovery-suggestions/audits/archives/:archiveId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Request approval to delete notification task recovery audit archive' })
  async deleteOperationAlertNotificationTaskRecoveryAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    return this.securityCenterService.deleteNotificationTaskRecoveryAuditArchive(currentUser, archiveId);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get notification task recovery audit archive deletion approval overview' })
  async getOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview> {
    return this.securityCenterService.getNotificationTaskRecoveryAuditArchiveApprovalOverview(currentUser);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/archive-approvals')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List notification task recovery audit archive deletion approvals' })
  async listOperationAlertNotificationTaskRecoveryAuditArchiveApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[]> {
    return this.securityCenterService.listNotificationTaskRecoveryAuditArchiveApprovals(currentUser);
  }

  @Get('operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get notification task recovery audit archive deletion approval detail' })
  async getOperationAlertNotificationTaskRecoveryAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    return this.securityCenterService.getNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId);
  }

  @Post('operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/approve')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Approve notification task recovery audit archive deletion' })
  async approveOperationAlertNotificationTaskRecoveryAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    return this.securityCenterService.approveNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId, body);
  }

  @Post('operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/reject')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Reject notification task recovery audit archive deletion' })
  async rejectOperationAlertNotificationTaskRecoveryAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    return this.securityCenterService.rejectNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId, body);
  }

  @Post('operation-alert-notification-task-recovery-suggestions/:suggestionId/actions')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Update notification task recovery suggestion lifecycle' })
  async updateOperationAlertNotificationTaskRecoverySuggestion(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('suggestionId') suggestionId: string,
    @Body() body: UpdateSecurityOperationAlertNotificationTaskRecoverySuggestionDto,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryActionResult> {
    return this.securityCenterService.updateNotificationTaskRecoverySuggestion(currentUser, suggestionId, body);
  }

  @Get('operation-alert-sla/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA overview' })
  async getOperationAlertSlaOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaOverview> {
    return this.operationAlertSlaService.getOverview(currentUser);
  }

  @Post('operation-alert-sla/run-escalation')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Run approval/archive operation alert SLA escalation once' })
  async runOperationAlertSlaEscalation(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaTaskRunResult> {
    return this.operationAlertSlaService.runEscalation(currentUser);
  }

  @Get('operation-alert-sla/notifications/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA notification overview' })
  async getOperationAlertSlaNotificationOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationOverview> {
    return this.operationAlertSlaService.getNotificationOverview(currentUser);
  }

  @Post('operation-alert-sla/notify-overdue')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Notify overdue approval/archive operation alert SLA subscribers' })
  async notifyOperationAlertSlaOverdue(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationResult> {
    return this.operationAlertSlaService.notifyOverdue(currentUser);
  }

  @Get('operation-alert-sla/notification-retry/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA notification retry overview' })
  async getOperationAlertSlaNotificationRetryOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationRetryOverview> {
    return this.operationAlertSlaService.getNotificationRetryOverview(currentUser);
  }

  @Post('operation-alert-sla/notification-retry/run')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Run approval/archive operation alert SLA notification retry task once' })
  async runOperationAlertSlaNotificationRetry(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationRetryTaskRunResult> {
    return this.operationAlertSlaService.runNotificationAutoRetry(currentUser);
  }

  @Post('operation-alert-sla/notifications/:notificationEventId/retry')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Retry approval/archive operation alert SLA notification delivery' })
  async retryOperationAlertSlaNotification(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationEventId') notificationEventId: string,
  ): Promise<SecurityOperationAlertSlaNotificationItem> {
    return this.operationAlertSlaService.retryNotification(currentUser, notificationEventId);
  }

  @Get('operation-alert-sla/dead-letters/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA notification dead letter overview' })
  async getOperationAlertSlaDeadLetterOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterOverview> {
    return this.operationAlertSlaService.getDeadLetterOverview(currentUser);
  }

  @Post('operation-alert-sla/dead-letters/:notificationEventId/actions')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Handle approval/archive operation alert SLA notification dead letter' })
  async handleOperationAlertSlaDeadLetter(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationEventId') notificationEventId: string,
    @Body() body: HandleSecurityOperationAlertSlaDeadLetterDto,
  ): Promise<SecurityOperationAlertSlaDeadLetterActionResult> {
    return this.operationAlertSlaService.handleDeadLetter(currentUser, notificationEventId, body);
  }

  @Get('operation-alert-sla/dead-letter-audits')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert SLA notification dead letter audit events' })
  async listOperationAlertSlaDeadLetterAudits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ): Promise<PaginatedResult<SecurityOperationAlertSlaDeadLetterAuditItem>> {
    return this.operationAlertSlaService.listDeadLetterAudits(currentUser, query);
  }

  @Get('operation-alert-sla/dead-letter-audits/export')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Export approval/archive operation alert SLA notification dead letter audit events as CSV' })
  async exportOperationAlertSlaDeadLetterAudits(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
    @Res() response: Response,
  ) {
    const csv = await this.operationAlertSlaService.exportDeadLetterAudits(currentUser, query);
    const fileName = `sla-dead-letter-audits-${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Post('operation-alert-sla/dead-letter-audits/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create approval/archive operation alert SLA dead letter audit CSV archive' })
  async createOperationAlertSlaDeadLetterAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ): Promise<CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult> {
    return this.operationAlertSlaService.createDeadLetterAuditArchive(currentUser, query);
  }

  @Get('operation-alert-sla/dead-letter-audits/archives')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert SLA dead letter audit CSV archives' })
  async listOperationAlertSlaDeadLetterAuditArchives(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveListResult> {
    return this.operationAlertSlaService.listDeadLetterAuditArchives(currentUser);
  }

  @Get('operation-alert-sla/dead-letter-audits/archives/:archiveId/download-url')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Create approval/archive operation alert SLA dead letter audit archive download URL' })
  async getOperationAlertSlaDeadLetterAuditArchiveDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.operationAlertSlaService.getDeadLetterAuditArchiveDownloadUrl(currentUser, archiveId);
  }

  @Delete('operation-alert-sla/dead-letter-audits/archives/:archiveId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Request approval to delete approval/archive operation alert SLA dead letter audit archive' })
  async deleteOperationAlertSlaDeadLetterAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    return this.operationAlertSlaService.deleteDeadLetterAuditArchive(currentUser, archiveId);
  }

  @Get('operation-alert-sla/dead-letter-audits/archive-approvals/overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA dead letter audit archive deletion approval overview' })
  async getOperationAlertSlaDeadLetterAuditArchiveApprovalOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview> {
    return this.operationAlertSlaService.getDeadLetterAuditArchiveApprovalOverview(currentUser);
  }

  @Get('operation-alert-sla/dead-letter-audits/archive-approvals')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'List approval/archive operation alert SLA dead letter audit archive deletion approvals' })
  async listOperationAlertSlaDeadLetterAuditArchiveApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]> {
    return this.operationAlertSlaService.listDeadLetterAuditArchiveApprovals(currentUser);
  }

  @Get('operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Get approval/archive operation alert SLA dead letter audit archive deletion approval detail' })
  async getOperationAlertSlaDeadLetterAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    return this.operationAlertSlaService.getDeadLetterAuditArchiveApproval(currentUser, approvalId);
  }

  @Post('operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/approve')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Approve approval/archive operation alert SLA dead letter audit archive deletion' })
  async approveOperationAlertSlaDeadLetterAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    return this.operationAlertSlaService.approveDeadLetterAuditArchiveApproval(currentUser, approvalId, body);
  }

  @Post('operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/reject')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Reject approval/archive operation alert SLA dead letter audit archive deletion' })
  async rejectOperationAlertSlaDeadLetterAuditArchiveApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() body: ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    return this.operationAlertSlaService.rejectDeadLetterAuditArchiveApproval(currentUser, approvalId, body);
  }

  @Get('events')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Paginated security deny events for current tenant' })
  async listEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSecurityCenterEventsDto,
  ): Promise<PaginatedResult<SecurityCenterEventListItem>> {
    return this.securityCenterService.listEvents(currentUser, query);
  }

  @Get('events/:eventId')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Security deny event detail' })
  async getEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<SecurityCenterEventDetail> {
    return this.securityCenterService.getEvent(currentUser, eventId);
  }
}
