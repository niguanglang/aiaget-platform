import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { SecurityCenterOverview } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { SecurityCenterService } from './security-center.service';

@ApiTags('security-center')
@ApiBearerAuth()
@Controller('security-center')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityCenterController {
  constructor(@Inject(SecurityCenterService) private readonly securityCenterService: SecurityCenterService) {}

  @Get('overview')
  @Permissions('security:rule:view')
  @ApiOkResponse({ description: 'Integrated security center overview for current tenant' })
  async getOverview(@CurrentUser() currentUser: AuthenticatedUser): Promise<SecurityCenterOverview> {
    return this.securityCenterService.getOverview(currentUser);
  }
}
