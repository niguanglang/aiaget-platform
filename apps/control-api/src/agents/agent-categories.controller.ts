import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AgentCategoryItem } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { AgentsService } from './agents.service';

@ApiTags('agent-categories')
@ApiBearerAuth()
@Controller('agent-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgentCategoriesController {
  constructor(@Inject(AgentsService) private readonly agentsService: AgentsService) {}

  @Get()
  @Permissions('agent:agent:view')
  @ApiOkResponse({ description: 'Tenant-scoped agent categories' })
  async list(@CurrentUser() currentUser: AuthenticatedUser): Promise<AgentCategoryItem[]> {
    return this.agentsService.listCategories(currentUser);
  }
}
