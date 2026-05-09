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

import type { PaginatedResult, SkillDetail, SkillListItem } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ListSkillsDto } from './dto/list-skills.dto';
import { PublishSkillDto } from './dto/publish-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@ApiBearerAuth()
@Controller('skills')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SkillsController {
  constructor(@Inject(SkillsService) private readonly skillsService: SkillsService) {}

  @Get()
  @Permissions('skill:hub:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated skill list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSkillsDto,
  ): Promise<PaginatedResult<SkillListItem>> {
    return this.skillsService.list(currentUser, query);
  }

  @Post()
  @Permissions('skill:hub:manage')
  @ApiOkResponse({ description: 'Create reusable business skill' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSkillDto,
  ): Promise<SkillDetail> {
    return this.skillsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('skill:hub:view')
  @ApiOkResponse({ description: 'Get skill detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<SkillDetail> {
    return this.skillsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('skill:hub:manage')
  @ApiOkResponse({ description: 'Update reusable business skill' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillDetail> {
    return this.skillsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('skill:hub:manage')
  @ApiOkResponse({ description: 'Archive skill' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.skillsService.remove(currentUser, id);
  }

  @Post(':id/copy')
  @Permissions('skill:hub:manage')
  @ApiOkResponse({ description: 'Copy skill' })
  async copy(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<SkillDetail> {
    return this.skillsService.copy(currentUser, id);
  }

  @Post(':id/publish')
  @Permissions('skill:hub:manage')
  @ApiOkResponse({ description: 'Publish skill version snapshot' })
  async publish(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PublishSkillDto,
  ): Promise<SkillDetail> {
    return this.skillsService.publish(currentUser, id, dto);
  }
}
