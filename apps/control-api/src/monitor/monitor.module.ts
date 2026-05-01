import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
