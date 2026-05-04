import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import { DataScopeQueryService } from '../common/services/data-scope-query.service';
import { ResourceAccessService } from '../common/services/resource-access.service';
import { SecurityEventService } from '../common/services/security-event.service';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule, forwardRef(() => PlatformEventsModule), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard, ResourceAccessService, DataScopeQueryService, SecurityEventService],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard, ResourceAccessService, DataScopeQueryService, SecurityEventService, JwtModule],
})
export class AuthModule {}
