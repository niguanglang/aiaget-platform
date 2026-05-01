import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  PaginatedResult,
  ToolApprovalDetail,
  ToolApprovalListItem,
  ToolApprovalOverview,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListToolApprovalsDto } from './dto/list-tool-approvals.dto';
import { ReviewToolApprovalDto } from './dto/review-tool-approval.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('tool-approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(@Inject(ApprovalsService) private readonly approvalsService: ApprovalsService) {}

  @Get('overview')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Tool approval overview' })
  async overview(@CurrentUser() currentUser: AuthenticatedUser): Promise<ToolApprovalOverview> {
    return this.approvalsService.overview(currentUser);
  }

  @Get()
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated tool approval request list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListToolApprovalsDto,
  ): Promise<PaginatedResult<ToolApprovalListItem>> {
    return this.approvalsService.list(currentUser, query);
  }

  @Get(':id')
  @Permissions('security:approval:view')
  @ApiOkResponse({ description: 'Get tool approval request detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.get(currentUser, id);
  }

  @Post(':id/approve')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Approve and execute tool approval request' })
  async approve(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.approve(currentUser, id, dto);
  }

  @Post(':id/reject')
  @Permissions('security:approval:handle')
  @ApiOkResponse({ description: 'Reject tool approval request' })
  async reject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewToolApprovalDto,
  ): Promise<ToolApprovalDetail> {
    return this.approvalsService.reject(currentUser, id, dto);
  }
}
