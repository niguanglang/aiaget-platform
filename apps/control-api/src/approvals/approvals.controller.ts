import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type {
  ApprovalAuditArchiveApprovalDetail,
  ApprovalAuditArchiveApprovalItem,
  ApprovalAuditArchiveApprovalOverview,
  ApprovalAuditArchiveListResult,
  ApprovalAuditEventItem,
  ApprovalAuditOverview,
  CreateApprovalAuditArchiveResult,
  PaginatedResult,
  StorageDownloadUrlResult,
  ToolApprovalDetail,
  ToolApprovalListItem,
  ToolApprovalOverview,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListApprovalAuditEventsDto } from './dto/list-approval-audit-events.dto';
import { ListToolApprovalsDto } from './dto/list-tool-approvals.dto';
import { ReviewToolApprovalDto } from './dto/review-tool-approval.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('tool-approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(@Inject(ApprovalsService) private readonly approvalsService: ApprovalsService) {}

  @Get('overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Tool approval overview' })
  async overview(@CurrentUser() currentUser: AuthenticatedUser): Promise<ToolApprovalOverview> {
    return this.approvalsService.overview(currentUser);
  }

  @Get('audit-events/overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Approval audit event overview' })
  async auditOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListApprovalAuditEventsDto,
  ): Promise<ApprovalAuditOverview> {
    return this.approvalsService.getAuditOverview(currentUser, query);
  }

  @Get('audit-events')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated approval audit event list' })
  async listAuditEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListApprovalAuditEventsDto,
  ): Promise<PaginatedResult<ApprovalAuditEventItem>> {
    return this.approvalsService.listAuditEvents(currentUser, query);
  }

  @Get('audit-events/export')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Export tenant-isolated approval audit events as CSV' })
  async exportAuditEvents(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListApprovalAuditEventsDto,
    @Res() response: Response,
  ) {
    const csv = await this.approvalsService.exportAuditEvents(currentUser, query);
    const fileName = `approval-audit-events-${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Post('audit-events/archives')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Create approval audit CSV archive in object storage' })
  async createAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListApprovalAuditEventsDto,
  ): Promise<CreateApprovalAuditArchiveResult> {
    return this.approvalsService.createAuditArchive(currentUser, query);
  }

  @Get('audit-events/archives')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'List approval audit CSV archives' })
  async listAuditArchives(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApprovalAuditArchiveListResult> {
    return this.approvalsService.listAuditArchives(currentUser);
  }

  @Get('audit-events/archives/:archiveId/download-url')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Create approval audit archive download URL' })
  async getAuditArchiveDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.approvalsService.getAuditArchiveDownloadUrl(currentUser, archiveId);
  }

  @Delete('audit-events/archives/:archiveId')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Delete approval audit CSV archive' })
  async deleteAuditArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    return this.approvalsService.deleteAuditArchive(currentUser, archiveId);
  }

  @Get('audit-events/archive-approvals/overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Approval audit archive deletion approval overview' })
  async archiveApprovalOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApprovalAuditArchiveApprovalOverview> {
    return this.approvalsService.archiveApprovalOverview(currentUser);
  }

  @Get('audit-events/archive-approvals')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'List approval audit archive deletion approvals' })
  async listArchiveDeleteApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApprovalAuditArchiveApprovalItem[]> {
    return this.approvalsService.listArchiveDeleteApprovals(currentUser);
  }

  @Get('audit-events/archive-approvals/:approvalId')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Get approval audit archive deletion approval detail' })
  async getArchiveDeleteApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    return this.approvalsService.getArchiveDeleteApproval(currentUser, approvalId);
  }

  @Post('audit-events/archive-approvals/:approvalId/approve')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve approval audit archive deletion' })
  async approveArchiveDeleteApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    return this.approvalsService.approveArchiveDeleteApproval(currentUser, approvalId, dto);
  }

  @Post('audit-events/archive-approvals/:approvalId/reject')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Reject approval audit archive deletion' })
  async rejectArchiveDeleteApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ApprovalAuditArchiveApprovalDetail> {
    return this.approvalsService.rejectArchiveDeleteApproval(currentUser, approvalId, dto);
  }

  @Get('audit-events/:eventId')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Get approval audit event detail' })
  async getAuditEvent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ): Promise<ApprovalAuditEventItem> {
    return this.approvalsService.getAuditEvent(currentUser, eventId);
  }

  @Get()
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated tool approval request list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListToolApprovalsDto,
  ): Promise<PaginatedResult<ToolApprovalListItem>> {
    return this.approvalsService.list(currentUser, query);
  }

  @Get(':id')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Get tool approval request detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.get(currentUser, id);
  }

  @Post(':id/approve')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve and execute tool approval request' })
  async approve(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.approve(currentUser, id, dto);
  }

  @Post(':id/reject')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Reject tool approval request' })
  async reject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.reject(currentUser, id, dto);
  }
}
