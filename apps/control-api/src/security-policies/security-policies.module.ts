import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityPoliciesController } from './security-policies.controller';
import { SecurityPoliciesService } from './security-policies.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SecurityPoliciesController],
  providers: [SecurityPoliciesService],
  exports: [SecurityPoliciesService],
})
export class SecurityPoliciesModule {}
