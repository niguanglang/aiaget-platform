import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { SystemSettingItem, SystemSettingOverview } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListSystemSettingsDto } from './dto/list-system-settings.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('system-settings')
@ApiBearerAuth()
@Controller('system-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(@Inject(SystemSettingsService) private readonly systemSettingsService: SystemSettingsService) {}

  @Get('overview')
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'System setting overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<SystemSettingOverview> {
    return this.systemSettingsService.getOverview(currentUser);
  }

  @Get()
  @Permissions('system:settings:view')
  @ApiOkResponse({ description: 'Tenant-scoped system setting list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListSystemSettingsDto,
  ): Promise<SystemSettingItem[]> {
    return this.systemSettingsService.list(currentUser, query);
  }

  @Patch(':id')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Update one system setting' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSystemSettingDto,
  ): Promise<SystemSettingItem> {
    return this.systemSettingsService.update(currentUser, id, dto);
  }

  @Post(':id/reset')
  @Permissions('system:settings:manage')
  @ApiOkResponse({ description: 'Reset one system setting to default value' })
  async reset(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SystemSettingItem> {
    return this.systemSettingsService.reset(currentUser, id);
  }
}
