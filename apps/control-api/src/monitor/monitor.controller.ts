import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  MonitorEventDetail,
  MonitorEventListItem,
  MonitorObservabilityOverview,
  MonitorOverview,
  MonitorTraceDetail,
  PaginatedResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { GetMonitorOverviewDto } from './dto/get-monitor-overview.dto';
import { ListMonitorEventsDto } from './dto/list-monitor-events.dto';
import { MonitorService } from './monitor.service';

@ApiTags('monitor')
@ApiBearerAuth()
@Controller('monitor')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MonitorController {
  constructor(@Inject(MonitorService) private readonly monitorService: MonitorService) {}

  @Get('overview')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Aggregated monitor overview for current tenant' })
  async getOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetMonitorOverviewDto,
  ): Promise<MonitorOverview> {
    return this.monitorService.getOverview(currentUser, query.window);
  }

  @Get('events')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Unified paginated monitor events' })
  async listEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMonitorEventsDto,
  ): Promise<PaginatedResult<MonitorEventListItem>> {
    return this.monitorService.listEvents(currentUser, query);
  }

  @Get('events/:eventId')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Get monitor event detail' })
  async getEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<MonitorEventDetail> {
    return this.monitorService.getEvent(currentUser, eventId);
  }

  @Get('traces/:traceId')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Get trace timeline and propagation detail' })
  async getTrace(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('traceId') traceId: string,
    @Query() query: GetMonitorOverviewDto,
  ): Promise<MonitorTraceDetail> {
    return this.monitorService.getTrace(currentUser, traceId, query.window);
  }

  @Get('observability')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Get observability quality overview' })
  async getObservabilityOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetMonitorOverviewDto,
  ): Promise<MonitorObservabilityOverview> {
    return this.monitorService.getObservabilityOverview(currentUser, query.window);
  }
}
