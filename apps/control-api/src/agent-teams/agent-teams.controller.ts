import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  AgentTeamDetail,
  AgentTeamFeedbackItem,
  AgentTeamListItem,
  AgentTeamOverview,
  PaginatedResult,
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
  async createHandoff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() dto: CreateAgentTeamHandoffDto,
  ): Promise<AgentTeamDetail> {
    return this.agentTeamsService.createHandoff(currentUser, runId, dto);
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
  async createFeedback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() dto: CreateAgentTeamFeedbackDto,
  ): Promise<AgentTeamFeedbackItem> {
    return this.agentTeamsService.createFeedback(currentUser, runId, dto);
  }
}
