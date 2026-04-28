import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { PaginatedResult, UserListItem } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user.read')
  @ApiOkResponse({ description: 'Tenant-isolated paginated user list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListUsersDto,
  ): Promise<PaginatedResult<UserListItem>> {
    return this.usersService.list(currentUser, query);
  }

  @Post()
  @Permissions('user.write')
  @ApiOkResponse({ description: 'Create tenant user' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ): Promise<UserListItem> {
    return this.usersService.create(currentUser, dto);
  }

  @Patch(':id')
  @Permissions('user.write')
  @ApiOkResponse({ description: 'Update tenant user' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserListItem> {
    return this.usersService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('user.write')
  @ApiOkResponse({ description: 'Soft delete tenant user' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.usersService.remove(currentUser, id);
  }
}
