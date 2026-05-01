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

import type {
  PaginatedResult,
  PromptTemplateDetail,
  PromptTemplateListItem,
  RenderPromptResult,
  TestPromptResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { CreatePromptVariableDto } from './dto/create-prompt-variable.dto';
import { ListPromptTemplatesDto } from './dto/list-prompt-templates.dto';
import { PublishPromptDto } from './dto/publish-prompt.dto';
import { RenderPromptDto } from './dto/render-prompt.dto';
import { RollbackPromptDto } from './dto/rollback-prompt.dto';
import { TestPromptDto } from './dto/test-prompt.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { UpdatePromptVariableDto } from './dto/update-prompt-variable.dto';
import { PromptsService } from './prompts.service';

@ApiTags('prompt-templates')
@ApiBearerAuth()
@Controller('prompt-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromptsController {
  constructor(@Inject(PromptsService) private readonly promptsService: PromptsService) {}

  @Get()
  @Permissions('prompt:template:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated prompt template list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListPromptTemplatesDto,
  ): Promise<PaginatedResult<PromptTemplateListItem>> {
    return this.promptsService.list(currentUser, query);
  }

  @Post()
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Create prompt template' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePromptTemplateDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('prompt:template:view')
  @ApiOkResponse({ description: 'Get prompt template detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Update prompt template' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePromptTemplateDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Soft delete prompt template' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.promptsService.remove(currentUser, id);
  }

  @Post(':id/copy')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Copy prompt template and variables' })
  async copy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.copy(currentUser, id);
  }

  @Post(':id/publish')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Publish immutable prompt version' })
  async publish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PublishPromptDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.publish(currentUser, id, dto);
  }

  @Post(':id/rollback')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Rollback prompt template to version snapshot' })
  async rollback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RollbackPromptDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.rollback(currentUser, id, dto);
  }

  @Post(':id/render')
  @Permissions('prompt:template:view')
  @ApiOkResponse({ description: 'Render prompt with variables' })
  async render(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RenderPromptDto,
  ): Promise<RenderPromptResult> {
    return this.promptsService.render(currentUser, id, dto);
  }

  @Post(':id/test')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Render and record prompt test' })
  async test(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TestPromptDto,
  ): Promise<TestPromptResult> {
    return this.promptsService.test(currentUser, id, dto);
  }

  @Post(':id/variables')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Create prompt variable' })
  async createVariable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreatePromptVariableDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.createVariable(currentUser, id, dto);
  }

  @Patch(':id/variables/:variableId')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Update prompt variable' })
  async updateVariable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('variableId') variableId: string,
    @Body() dto: UpdatePromptVariableDto,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.updateVariable(currentUser, id, variableId, dto);
  }

  @Delete(':id/variables/:variableId')
  @Permissions('prompt:template:manage')
  @ApiOkResponse({ description: 'Soft delete prompt variable' })
  async removeVariable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('variableId') variableId: string,
  ): Promise<PromptTemplateDetail> {
    return this.promptsService.removeVariable(currentUser, id, variableId);
  }
}
