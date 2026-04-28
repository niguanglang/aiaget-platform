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
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateAgentVersionDto } from './dto/create-agent-version.dto';
import { ListAgentsDto } from './dto/list-agents.dto';
import { RollbackAgentDto } from './dto/rollback-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgentsController {
  constructor(@Inject(AgentsService) private readonly agentsService: AgentsService) {}

  @Get()
  @Permissions('agent.read')
  @ApiOkResponse({ description: 'Tenant-isolated paginated agent list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListAgentsDto,
  ): Promise<PaginatedResult<AgentListItem>> {
    return this.agentsService.list(currentUser, query);
  }

  @Post()
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Create tenant agent' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('agent.read')
  @ApiOkResponse({ description: 'Get tenant agent detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Update tenant agent' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Soft delete tenant agent' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.agentsService.remove(currentUser, id);
  }

  @Post(':id/versions')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Create immutable agent version snapshot' })
  async createVersion(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateAgentVersionDto,
  ): Promise<AgentDetail> {
    return this.agentsService.createVersion(currentUser, id, dto);
  }

  @Post(':id/publish')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Publish latest agent version' })
  async publish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.publish(currentUser, id);
  }

  @Post(':id/rollback')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Rollback agent to a previous version snapshot' })
  async rollback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RollbackAgentDto,
  ): Promise<AgentDetail> {
    return this.agentsService.rollback(currentUser, id, dto);
  }

  @Post(':id/disable')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Disable tenant agent' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.disable(currentUser, id);
  }

  @Post(':id/archive')
  @Permissions('agent.write')
  @ApiOkResponse({ description: 'Archive tenant agent' })
  async archive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AgentDetail> {
    return this.agentsService.archive(currentUser, id);
  }
}
