import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  MenuDetail,
  MenuListItem,
  MenuOverview,
  MenuRoleBindingItem,
  MenuTreeItem,
  PaginatedResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateMenuDto } from './dto/create-menu.dto';
import { ListMenusDto } from './dto/list-menus.dto';
import { UpdateMenuRoleBindingDto } from './dto/update-menu-role-binding.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenusService } from './menus.service';

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusController {
  constructor(@Inject(MenusService) private readonly menusService: MenusService) {}

  @Get('overview')
  @Permissions('system:menu:view')
  @ApiOkResponse({ description: 'Menu overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<MenuOverview> {
    return this.menusService.getOverview(currentUser);
  }

  @Get('tree')
  @Permissions('system:menu:view')
  @ApiOkResponse({ description: 'Full menu tree for current tenant' })
  async tree(@CurrentUser() currentUser: AuthenticatedUser): Promise<MenuTreeItem[]> {
    return this.menusService.tree(currentUser);
  }

  @Get('role-bindings')
  @Permissions('system:menu:view')
  @ApiOkResponse({ description: 'Role menu binding list' })
  async listRoleBindings(@CurrentUser() currentUser: AuthenticatedUser): Promise<MenuRoleBindingItem[]> {
    return this.menusService.listRoleBindings(currentUser);
  }

  @Put('role-bindings/:roleId')
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Replace menus assigned to a role' })
  async updateRoleBinding(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateMenuRoleBindingDto,
  ): Promise<MenuRoleBindingItem> {
    return this.menusService.updateRoleBinding(currentUser, roleId, dto);
  }

  @Get()
  @Permissions('system:menu:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated menu list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMenusDto,
  ): Promise<PaginatedResult<MenuListItem>> {
    return this.menusService.list(currentUser, query);
  }

  @Post()
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Create menu' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateMenuDto,
  ): Promise<MenuDetail> {
    return this.menusService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('system:menu:view')
  @ApiOkResponse({ description: 'Get menu detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MenuDetail> {
    return this.menusService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Update menu' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
  ): Promise<MenuDetail> {
    return this.menusService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Soft delete menu' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.menusService.remove(currentUser, id);
  }

  @Post(':id/enable')
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Enable menu' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MenuDetail> {
    return this.menusService.setEnabled(currentUser, id, true);
  }

  @Post(':id/disable')
  @Permissions('system:menu:manage')
  @ApiOkResponse({ description: 'Disable menu' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MenuDetail> {
    return this.menusService.setEnabled(currentUser, id, false);
  }
}
