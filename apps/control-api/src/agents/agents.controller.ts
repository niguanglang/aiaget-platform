import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AgentDetail, AgentListItem, PaginatedResult } from '@aiaget/shared-types';

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
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateAgentKnowledgeBindingDto } from './dto/create-agent-knowledge-binding.dto';
import { CreateAgentModelBindingDto } from './dto/create-agent-model-binding.dto';
import { CreateAgentPromptBindingDto } from './dto/create-agent-prompt-binding.dto';
import { CreateAgentToolBindingDto } from './dto/create-agent-tool-binding.dto';
import { CreateAgentVersionDto } from './dto/create-agent-version.dto';
import { ListAgentsDto } from './dto/list-agents.dto';
import { RollbackAgentDto } from './dto/rollback-agent.dto';
import { UpdateAgentKnowledgeBindingDto } from './dto/update-agent-knowledge-binding.dto';
import { UpdateAgentToolBindingDto } from './dto/update-agent-tool-binding.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class AgentsController {
  constructor(@Inject(AgentsService) private readonly agentsService: AgentsService) {}

  @Get()
  @Permissions('agent:agent:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated agent list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListAgentsDto,
  ): Promise<PaginatedResult<AgentListItem>> {
    return this.agentsService.list(currentUser, query);
  }

  @Post()
  @Permissions('agent:agent:manage')
  @ApiOkResponse({ description: 'Create tenant agent' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('agent:agent:view')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:view' })
  @ApiOkResponse({ description: 'Get tenant agent detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Update tenant agent' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Soft delete tenant agent' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.agentsService.remove(currentUser, id);
  }

  @Post(':id/versions')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Create immutable agent version snapshot' })
  async createVersion(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentVersionDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createVersion(currentUser, id, dto);
  }

  @Post(':id/publish')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Publish latest agent version' })
  async publish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.publish(currentUser, id);
  }

  @Post(':id/rollback')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Rollback agent to a previous version snapshot' })
  async rollback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RollbackAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.rollback(currentUser, id, dto);
  }

  @Post(':id/disable')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Disable tenant agent' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.disable(currentUser, id);
  }

  @Post(':id/archive')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  @ApiOkResponse({ description: 'Archive tenant agent' })
  async archive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.archive(currentUser, id);
  }

  @Post(':id/bindings/models')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async createModelBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentModelBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createModelBinding(currentUser, id, dto);
  }

  @Delete(':id/bindings/models/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async removeModelBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
  ): Promise<AgentDetail> {
    return this.agentsService.removeModelBinding(currentUser, id, bindingId);
  }

  @Post(':id/bindings/prompts')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async createPromptBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentPromptBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createPromptBinding(currentUser, id, dto);
  }

  @Delete(':id/bindings/prompts/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async removePromptBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
  ): Promise<AgentDetail> {
    return this.agentsService.removePromptBinding(currentUser, id, bindingId);
  }

  @Post(':id/bindings/knowledge')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async createKnowledgeBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentKnowledgeBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createKnowledgeBinding(currentUser, id, dto);
  }

  @Patch(':id/bindings/knowledge/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async updateKnowledgeBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
    @Body() dto: UpdateAgentKnowledgeBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.updateKnowledgeBinding(currentUser, id, bindingId, dto);
  }

  @Delete(':id/bindings/knowledge/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async removeKnowledgeBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
  ): Promise<AgentDetail> {
    return this.agentsService.removeKnowledgeBinding(currentUser, id, bindingId);
  }

  @Post(':id/bindings/tools')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async createToolBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentToolBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createToolBinding(currentUser, id, dto);
  }

  @Patch(':id/bindings/tools/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async updateToolBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
    @Body() dto: UpdateAgentToolBindingDto,
  ): Promise<AgentDetail> {
    return this.agentsService.updateToolBinding(currentUser, id, bindingId, dto);
  }

  @Delete(':id/bindings/tools/:bindingId')
  @Permissions('agent:agent:manage')
  @RequireDataScope({ resourceType: 'AGENT' })
  @RequireResourceAcl({ resourceType: 'AGENT', permissionCode: 'agent:agent:manage' })
  async removeToolBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('bindingId') bindingId: string,
  ): Promise<AgentDetail> {
    return this.agentsService.removeToolBinding(currentUser, id, bindingId);
  }
}
