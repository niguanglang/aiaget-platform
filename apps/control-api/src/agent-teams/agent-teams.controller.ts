import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type {
  AgentTeamDetail,
  AgentTeamFeedbackItem,
  AgentTeamListItem,
  AgentTeamOverview,
  AgentTeamRunReportArchiveApprovalItem,
  AgentTeamRunReportArchiveListResult,
  CreateAgentTeamRunReportArchiveResult,
  PaginatedResult,
  StorageDownloadUrlResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireDataScope } from '../common/decorators/data-scope.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequireResourceAcl } from '../common/decorators/resource-acl.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { AgentTeamsService } from './agent-teams.service';
import { CreateAgentTeamDto } from './dto/create-agent-team.dto';
import { CreateAgentTeamFeedbackDto } from './dto/create-agent-team-feedback.dto';
import { CreateAgentTeamHandoffDto } from './dto/create-agent-team-handoff.dto';
import { CreateAgentTeamMemberDto } from './dto/create-agent-team-member.dto';
import { ListAgentTeamsDto } from './dto/list-agent-teams.dto';
import { ReviewAgentTeamHandoffDto } from './dto/review-agent-team-handoff.dto';
import { StartAgentTeamRunDto } from './dto/start-agent-team-run.dto';
import { UpdateAgentTeamDto } from './dto/update-agent-team.dto';
import { UpdateAgentTeamMemberDto } from './dto/update-agent-team-member.dto';

@ApiTags('agent-teams')
@ApiBearerAuth()
@Controller('agent-teams')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class AgentTeamsController {
  constructor(@Inject(AgentTeamsService) private readonly agentTeamsService: AgentTeamsService) {}

  @Get('overview')
  @Permissions('agent:team:view')
  @ApiOkResponse({ description: 'Agent team overview' })
  async overview(@CurrentUser() currentUser: AuthenticatedUser): Promise<AgentTeamOverview> {
    return this.agentTeamsService.overview(currentUser);
  }

  @Get()
  @Permissions('agent:team:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated agent team list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListAgentTeamsDto,
  ): Promise<PaginatedResult<AgentTeamListItem>> {
    return this.agentTeamsService.list(currentUser, query);
  }

  @Post()
  @Permissions('agent:team:manage')
  @ApiOkResponse({ description: 'Create agent team' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateAgentTeamDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('agent:team:view')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:view' })
  @ApiOkResponse({ description: 'Get agent team detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<AgentTeamDetail> {
    return this.agentTeamsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('agent:team:manage')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:manage' })
  @ApiOkResponse({ description: 'Update agent team' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAgentTeamDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('agent:team:manage')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:manage' })
  @ApiOkResponse({ description: 'Archive agent team' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.agentTeamsService.remove(currentUser, id);
  }

  @Post(':id/members')
  @Permissions('agent:team:manage')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:manage' })
  async addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentTeamMemberDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.addMember(currentUser, id, dto);
  }

  @Patch(':id/members/:memberId')
  @Permissions('agent:team:manage')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:manage' })
  async updateMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateAgentTeamMemberDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.updateMember(currentUser, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @Permissions('agent:team:manage')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:manage' })
  async removeMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.removeMember(currentUser, id, memberId);
  }

  @Post(':id/runs')
  @Permissions('agent:team:run')
  @RequireDataScope({ resourceType: 'AGENT_TEAM' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', permissionCode: 'agent:team:run' })
  async startRun(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StartAgentTeamRunDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.startRun(currentUser, id, dto);
  }

  @Post('runs/:runId/handoff')
  @Permissions('agent:team:run')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'runId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'runId', permissionCode: 'agent:team:run' })
  async createHandoff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() dto: CreateAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.createHandoff(currentUser, runId, dto);
  }

  @Get('runs/:runId/report/export')
  @Permissions('agent:team:view')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'runId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'runId', permissionCode: 'agent:team:view' })
  @ApiOkResponse({ description: 'Export agent team run audit report as CSV' })
  async exportRunReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
    @Res() response: Response,
  ) {
    const csv = await this.agentTeamsService.exportRunReport(currentUser, runId);
    const fileName = `agent-team-run-report-${runId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(`\uFEFF${csv}`);
  }

  @Post('runs/:runId/report/archives')
  @Permissions('agent:team:view')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'runId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'runId', permissionCode: 'agent:team:view' })
  @ApiOkResponse({ description: 'Create agent team run report archive' })
  async createRunReportArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
  ): Promise<CreateAgentTeamRunReportArchiveResult> {
    return this.agentTeamsService.createRunReportArchive(currentUser, runId);
  }

  @Get('report/archives')
  @Permissions('agent:team:view')
  @ApiOkResponse({ description: 'List agent team run report archives' })
  async listRunReportArchives(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AgentTeamRunReportArchiveListResult> {
    return this.agentTeamsService.listRunReportArchives(currentUser);
  }

  @Get('report/archives/:archiveId/download-url')
  @Permissions('agent:team:view')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'archiveId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'archiveId', permissionCode: 'agent:team:view' })
  @ApiOkResponse({ description: 'Create agent team run report archive download URL' })
  async getRunReportArchiveDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.agentTeamsService.getRunReportArchiveDownloadUrl(currentUser, archiveId);
  }

  @Delete('report/archives/:archiveId')
  @Permissions('agent:team:view')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'archiveId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'archiveId', permissionCode: 'agent:team:view' })
  @ApiOkResponse({ description: 'Request agent team run report archive deletion approval' })
  async requestDeleteRunReportArchive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('archiveId') archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    return this.agentTeamsService.requestDeleteRunReportArchive(currentUser, archiveId);
  }

  @Get('report/archive-approvals')
  @Permissions('agent:team:view')
  @ApiOkResponse({ description: 'List agent team run report archive delete approvals' })
  async listRunReportArchiveDeleteApprovals(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AgentTeamRunReportArchiveApprovalItem[]> {
    return this.agentTeamsService.listRunReportArchiveDeleteApprovals(currentUser);
  }

  @Post('report/archive-approvals/:approvalId/approve')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve agent team run report archive deletion' })
  async approveRunReportArchiveDeleteApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamRunReportArchiveApprovalItem> {
    return this.agentTeamsService.approveRunReportArchiveDeleteApproval(currentUser, approvalId, dto);
  }

  @Post('report/archive-approvals/:approvalId/reject')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Reject agent team run report archive deletion' })
  async rejectRunReportArchiveDeleteApproval(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('approvalId') approvalId: string,
    @Body() dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamRunReportArchiveApprovalItem> {
    return this.agentTeamsService.rejectRunReportArchiveDeleteApproval(currentUser, approvalId, dto);
  }

  @Post('handoffs/:handoffId/approve')
  @Permissions('security:approval:handle')
  async approveHandoff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('handoffId') handoffId: string,
    @Body() dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.approveHandoff(currentUser, handoffId, dto);
  }

  @Post('handoffs/:handoffId/reject')
  @Permissions('security:approval:handle')
  async rejectHandoff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('handoffId') handoffId: string,
    @Body() dto: ReviewAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.rejectHandoff(currentUser, handoffId, dto);
  }

  @Post('runs/:runId/feedback')
  @Permissions('agent:team:run')
  @RequireDataScope({ resourceType: 'AGENT_TEAM', idParam: 'runId' })
  @RequireResourceAcl({ resourceType: 'AGENT_TEAM', idParam: 'runId', permissionCode: 'agent:team:run' })
  async createFeedback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() dto: CreateAgentTeamFeedbackDto,
  ): Promise<AgentTeamFeedbackItem> {
    return this.agentTeamsService.createFeedback(currentUser, runId, dto);
  }
}
