import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { RuntimeWorkflowRetryResult, RuntimeWorkflowStatusOverview } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { RuntimeWorkflowRetryDto } from './dto/runtime-workflow-retry.dto';
import { RuntimeExecutionService } from './runtime-execution.service';

@ApiTags('runtime-workflows')
@ApiBearerAuth()
@Controller('runtime/workflows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RuntimeWorkflowController {
  constructor(@Inject(RuntimeExecutionService) private readonly runtimeExecutionService: RuntimeExecutionService) {}

  @Get('status')
  @Permissions('monitor:log:view')
  @ApiOkResponse({ description: 'Get workflow backend status and recoverable failed tasks' })
  async getStatus(@CurrentUser() currentUser: AuthenticatedUser): Promise<RuntimeWorkflowStatusOverview> {
    return this.runtimeExecutionService.getWorkflowStatus(currentUser);
  }

  @Post('retry')
  @Permissions('knowledge:base:manage')
  @ApiOkResponse({ description: 'Retry a known recoverable workflow task type' })
  async retry(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: RuntimeWorkflowRetryDto,
  ): Promise<RuntimeWorkflowRetryResult> {
    return this.runtimeExecutionService.retryWorkflowTask(currentUser, dto.task_id, dto.task_type);
  }
}
