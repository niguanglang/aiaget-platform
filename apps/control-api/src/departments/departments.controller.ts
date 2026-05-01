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
  DepartmentDetail,
  DepartmentListItem,
  DepartmentOverview,
  DepartmentTreeItem,
  PaginatedResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ListDepartmentsDto } from './dto/list-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(@Inject(DepartmentsService) private readonly departmentsService: DepartmentsService) {}

  @Get('overview')
  @Permissions('system:department:view')
  @ApiOkResponse({ description: 'Department overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<DepartmentOverview> {
    return this.departmentsService.getOverview(currentUser);
  }

  @Get('tree')
  @Permissions('system:department:view')
  @ApiOkResponse({ description: 'Full department tree for current tenant' })
  async tree(@CurrentUser() currentUser: AuthenticatedUser): Promise<DepartmentTreeItem[]> {
    return this.departmentsService.tree(currentUser);
  }

  @Get()
  @Permissions('system:department:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated department list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListDepartmentsDto,
  ): Promise<PaginatedResult<DepartmentListItem>> {
    return this.departmentsService.list(currentUser, query);
  }

  @Post()
  @Permissions('system:department:manage')
  @ApiOkResponse({ description: 'Create department' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentDetail> {
    return this.departmentsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('system:department:view')
  @ApiOkResponse({ description: 'Get department detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DepartmentDetail> {
    return this.departmentsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('system:department:manage')
  @ApiOkResponse({ description: 'Update department' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentDetail> {
    return this.departmentsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('system:department:manage')
  @ApiOkResponse({ description: 'Soft delete department' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.departmentsService.remove(currentUser, id);
  }

  @Post(':id/enable')
  @Permissions('system:department:manage')
  @ApiOkResponse({ description: 'Enable department' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DepartmentDetail> {
    return this.departmentsService.setStatus(currentUser, id, 'ACTIVE');
  }

  @Post(':id/disable')
  @Permissions('system:department:manage')
  @ApiOkResponse({ description: 'Disable department' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DepartmentDetail> {
    return this.departmentsService.setStatus(currentUser, id, 'DISABLED');
  }
}
