import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  AuditEventDetail,
  AuditEventListItem,
  AuditOverview,
  PaginatedResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { AuditService } from './audit.service';
import { GetAuditOverviewDto } from './dto/get-audit-overview.dto';
import { ListAuditEventsDto } from './dto/list-audit-events.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @Get('overview')
  @Permissions('security:audit:view')
  @ApiOkResponse({ description: 'Audit overview for current tenant' })
  async getOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetAuditOverviewDto,
  ): Promise<AuditOverview> {
    return this.auditService.getOverview(currentUser, query.window);
  }

  @Get('events')
  @Permissions('security:audit:view')
  @ApiOkResponse({ description: 'Unified paginated audit events' })
  async listEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListAuditEventsDto,
  ): Promise<PaginatedResult<AuditEventListItem>> {
    return this.auditService.listEvents(currentUser, query);
  }

  @Get('events/:eventId')
  @Permissions('security:audit:view')
  @ApiOkResponse({ description: 'Get audit event detail' })
  async getEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<AuditEventDetail> {
    return this.auditService.getEvent(currentUser, eventId);
  }
}
