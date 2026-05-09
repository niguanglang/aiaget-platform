import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  PluginInstallationDetail,
  PluginInstallationItem,
  PluginHookExecutionResult,
  PluginManifestValidationResult,
  PluginMarketItem,
  PluginOverview,
  PluginUninstallResult,
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
import { CreatePluginInstallationDto } from './dto/create-plugin-installation.dto';
import { QueuePluginHookExecutionDto } from './dto/queue-plugin-hook-execution.dto';
import { RollbackPluginDto } from './dto/rollback-plugin.dto';
import { UpdatePluginHookDto } from './dto/update-plugin-hook.dto';
import { UpdatePluginInstallationDto } from './dto/update-plugin-installation.dto';
import { UpdatePluginMenuBindingDto } from './dto/update-plugin-menu-binding.dto';
import { PluginHookExecutionService } from './plugin-hook-execution.service';
import { PluginsService } from './plugins.service';

@ApiTags('plugins')
@ApiBearerAuth()
@Controller('plugins')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class PluginsController {
  constructor(
    @Inject(PluginsService) private readonly pluginsService: PluginsService,
    @Inject(PluginHookExecutionService) private readonly hookExecutionService: PluginHookExecutionService,
  ) {}

  @Get('overview')
  @Permissions('plugin:center:view')
  @ApiOkResponse({ description: 'Plugin overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<PluginOverview> {
    return this.pluginsService.getOverview(currentUser);
  }

  @Get('market')
  @Permissions('plugin:center:view')
  @ApiOkResponse({ description: 'Plugin market items for current tenant' })
  async listMarket(@CurrentUser() currentUser: AuthenticatedUser): Promise<PluginMarketItem[]> {
    return this.pluginsService.listMarket(currentUser);
  }

  @Get('installations')
  @Permissions('plugin:center:view')
  @ApiOkResponse({ description: 'Installed plugins for current tenant' })
  async listInstallations(@CurrentUser() currentUser: AuthenticatedUser): Promise<PluginInstallationItem[]> {
    return this.pluginsService.listInstallations(currentUser);
  }

  @Get(':pluginId')
  @Permissions('plugin:center:view')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:view' })
  @ApiOkResponse({ description: 'Plugin installation detail' })
  async getInstallation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.getInstallation(currentUser, pluginId);
  }

  @Post('install')
  @Permissions('plugin:center:install')
  @ApiOkResponse({ description: 'Install plugin into tenant workspace' })
  async install(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePluginInstallationDto,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.install(currentUser, dto);
  }

  @Post('manifest/validate')
  @Permissions('plugin:center:install')
  @ApiOkResponse({ description: 'Validate plugin manifest and preview generated tool/menu bindings' })
  async validateManifest(@Body() dto: CreatePluginInstallationDto): Promise<PluginManifestValidationResult> {
    return this.pluginsService.validateManifest(dto);
  }

  @Patch(':pluginId')
  @Permissions('plugin:center:manage')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:manage' })
  @ApiOkResponse({ description: 'Update plugin installation' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
    @Body() dto: UpdatePluginInstallationDto,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.update(currentUser, pluginId, dto);
  }

  @Post(':pluginId/enable')
  @Permissions('plugin:center:enable')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:enable' })
  @ApiOkResponse({ description: 'Enable plugin runtime' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.enable(currentUser, pluginId);
  }

  @Post(':pluginId/disable')
  @Permissions('plugin:center:disable')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:disable' })
  @ApiOkResponse({ description: 'Disable plugin runtime' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.disable(currentUser, pluginId);
  }

  @Post(':pluginId/upgrade')
  @Permissions('plugin:center:upgrade')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:upgrade' })
  @ApiOkResponse({ description: 'Upgrade plugin version' })
  async upgrade(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.upgrade(currentUser, pluginId);
  }

  @Post(':pluginId/rollback')
  @Permissions('plugin:center:upgrade')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:upgrade' })
  @ApiOkResponse({ description: 'Rollback plugin to a published version snapshot' })
  async rollback(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
    @Body() dto: RollbackPluginDto,
  ): Promise<PluginInstallationDetail> {
    return this.pluginsService.rollback(currentUser, pluginId, dto);
  }

  @Delete(':pluginId')
  @Permissions('plugin:center:uninstall')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:uninstall' })
  @ApiOkResponse({ description: 'Uninstall plugin and clean generated control-plane artifacts' })
  async uninstall(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginUninstallResult> {
    return this.pluginsService.uninstall(currentUser, pluginId);
  }

  @Patch(':pluginId/hooks/:hookId')
  @Permissions('plugin:center:manage')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:manage' })
  @ApiOkResponse({ description: 'Update plugin hook' })
  async updateHook(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
    @Param('hookId') hookId: string,
    @Body() dto: UpdatePluginHookDto,
  ) {
    return this.pluginsService.updateHook(currentUser, pluginId, hookId, dto);
  }

  @Post(':pluginId/hooks/:hookId/execute')
  @Permissions('plugin:center:manage')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:manage' })
  @ApiOkResponse({ description: 'Queue plugin hook execution as a controlled platform event' })
  async queueHookExecution(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
    @Param('hookId') hookId: string,
    @Body() dto: QueuePluginHookExecutionDto,
  ): Promise<PluginHookExecutionResult> {
    return this.hookExecutionService.queueHookExecution(currentUser, pluginId, hookId, dto);
  }

  @Patch(':pluginId/menu-bindings/:bindingId')
  @Permissions('plugin:center:manage')
  @RequireDataScope({ resourceType: 'PLUGIN', idParam: 'pluginId' })
  @RequireResourceAcl({ resourceType: 'PLUGIN', idParam: 'pluginId', permissionCode: 'plugin:center:manage' })
  @ApiOkResponse({ description: 'Update plugin menu binding' })
  async updateMenuBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('pluginId') pluginId: string,
    @Param('bindingId') bindingId: string,
    @Body() dto: UpdatePluginMenuBindingDto,
  ) {
    return this.pluginsService.updateMenuBinding(currentUser, pluginId, bindingId, dto);
  }
}
