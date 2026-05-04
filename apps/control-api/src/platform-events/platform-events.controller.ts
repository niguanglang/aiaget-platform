import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  PaginatedResult,
  PlatformEventDetail,
  PlatformEventListItem,
  PlatformEventRelationItem,
  PlatformEventUsageOverview,
  PlatformUsageAnomalyOverview,
  PlatformUsageAlertItem,
  PlatformUsageAlertNotificationOverview,
  PlatformUsageAlertNotificationResult,
  PlatformUsageAlertNotificationTaskOverview,
  PlatformUsageAlertNotificationTaskRunResult,
  PlatformUsageAlertOverview,
  PlatformUsageLedgerItem,
  PlatformUsageRollupItem,
  PlatformUsageTrendPoint,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { DetectPlatformUsageAnomaliesDto } from './dto/detect-platform-usage-anomalies.dto';
import { GetPlatformUsageOverviewDto } from './dto/get-platform-usage-overview.dto';
import { ListPlatformEventsDto } from './dto/list-platform-events.dto';
import { ListPlatformUsageAlertNotificationsDto } from './dto/list-platform-usage-alert-notifications.dto';
import { ListPlatformUsageAlertsDto } from './dto/list-platform-usage-alerts.dto';
import { ListPlatformUsageDto } from './dto/list-platform-usage.dto';
import { ListPlatformUsageTrendsDto } from './dto/list-platform-usage-trends.dto';
import { NotifyPlatformUsageAlertDto } from './dto/notify-platform-usage-alert.dto';
import { PlatformUsageAlertNotificationTaskService } from './platform-usage-alert-notification-task.service';
import { PlatformEventsService } from './platform-events.service';
import { RebuildPlatformUsageRollupsDto } from './dto/rebuild-platform-usage-rollups.dto';
import { UpdatePlatformUsageAlertDto } from './dto/update-platform-usage-alert.dto';

@ApiTags('platform-events')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlatformEventsController {
  constructor(
    @Inject(PlatformEventsService) private readonly platformEventsService: PlatformEventsService,
    @Inject(PlatformUsageAlertNotificationTaskService)
    private readonly alertNotificationTaskService: PlatformUsageAlertNotificationTaskService,
  ) {}

  @Get('platform-events')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform events list' })
  async listEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPlatformEventsDto,
  ): Promise<PaginatedResult<PlatformEventListItem>> {
    return this.platformEventsService.listEvents(currentUser, query);
  }

  @Get('platform-events/:eventId')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform event detail' })
  async getEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<PlatformEventDetail> {
    return this.platformEventsService.getEvent(currentUser, eventId);
  }

  @Get('platform-events/:eventId/relations')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform event relations' })
  async listRelations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<PlatformEventRelationItem[]> {
    return this.platformEventsService.listRelations(currentUser, eventId);
  }

  @Get('platform-usage/overview')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform usage overview' })
  async getUsageOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetPlatformUsageOverviewDto,
  ): Promise<PlatformEventUsageOverview> {
    return this.platformEventsService.getUsageOverview(currentUser, query.window);
  }

  @Get('platform-usage/trends')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform usage trends' })
  async listUsageTrends(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPlatformUsageTrendsDto,
  ): Promise<PlatformUsageTrendPoint[]> {
    return this.platformEventsService.listUsageTrends(currentUser, query);
  }

  @Get('platform-usage/ledger')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified platform usage ledger' })
  async listUsageLedger(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPlatformUsageDto,
  ): Promise<PaginatedResult<PlatformUsageLedgerItem>> {
    return this.platformEventsService.listUsageLedger(currentUser, query);
  }

  @Post('platform-usage/rollups/rebuild')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Rebuild unified platform usage rollups' })
  async rebuildUsageRollups(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: RebuildPlatformUsageRollupsDto,
  ): Promise<{ rebuilt_count: number; items: PlatformUsageRollupItem[] }> {
    return this.platformEventsService.rebuildUsageRollups(currentUser, query.window);
  }

  @Post('platform-usage/anomalies/detect')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Detect unified platform usage anomalies' })
  async detectUsageAnomalies(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DetectPlatformUsageAnomaliesDto,
  ): Promise<PlatformUsageAnomalyOverview> {
    return this.platformEventsService.detectUsageAnomalies(currentUser, query.window);
  }

  @Get('platform-usage/alerts')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'List unified platform usage alerts' })
  async listUsageAlerts(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPlatformUsageAlertsDto,
  ): Promise<PlatformUsageAlertOverview> {
    return this.platformEventsService.listUsageAlerts(currentUser, query.window);
  }

  @Post('platform-usage/alerts/:alertId/actions')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Update unified platform usage alert lifecycle' })
  async updateUsageAlert(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('alertId') alertId: string,
    @Body() body: UpdatePlatformUsageAlertDto,
  ): Promise<PlatformUsageAlertItem> {
    return this.platformEventsService.updateUsageAlert(currentUser, alertId, body);
  }

  @Post('platform-usage/alerts/:alertId/notify')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Notify unified platform usage alert targets' })
  async notifyUsageAlert(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('alertId') alertId: string,
    @Body() body: NotifyPlatformUsageAlertDto,
  ): Promise<PlatformUsageAlertNotificationResult> {
    return this.platformEventsService.notifyUsageAlert(currentUser, alertId, body);
  }

  @Get('platform-usage/alert-notifications')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'List unified platform usage alert notification deliveries' })
  async listUsageAlertNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPlatformUsageAlertNotificationsDto,
  ): Promise<PlatformUsageAlertNotificationOverview> {
    return this.platformEventsService.listUsageAlertNotifications(currentUser, query);
  }

  @Post('platform-usage/alert-notifications/:notificationEventId/retry')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Retry unified platform usage alert notification delivery' })
  async retryUsageAlertNotification(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationEventId') notificationEventId: string,
  ): Promise<PlatformUsageAlertNotificationResult> {
    return this.platformEventsService.retryUsageAlertNotification(currentUser, notificationEventId);
  }

  @Get('platform-usage/alert-notification-tasks/overview')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Get unified platform usage alert notification task overview' })
  async getUsageAlertNotificationTaskOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PlatformUsageAlertNotificationTaskOverview> {
    return this.alertNotificationTaskService.getOverview(currentUser);
  }

  @Post('platform-usage/alert-notification-tasks/run-auto-retry')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Run unified platform usage alert notification auto retry task once' })
  async runUsageAlertNotificationAutoRetry(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PlatformUsageAlertNotificationTaskRunResult> {
    return this.alertNotificationTaskService.runAutoRetry(currentUser);
  }
}
