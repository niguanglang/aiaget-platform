import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityCenterController } from './security-center.controller';
import { SecurityCenterService } from './security-center.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SecurityCenterController],
  providers: [SecurityCenterService],
})
export class SecurityCenterModule {}
