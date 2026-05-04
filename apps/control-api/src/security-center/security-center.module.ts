import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SecurityCenterController } from './security-center.controller';
import { SecurityOperationAlertNotificationTaskService } from './security-operation-alert-notification-task.service';
import { SecurityOperationAlertSlaService } from './security-operation-alert-sla.service';
import { SecurityCenterService } from './security-center.service';

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [SecurityCenterController],
  providers: [SecurityCenterService, SecurityOperationAlertNotificationTaskService, SecurityOperationAlertSlaService],
  exports: [SecurityCenterService, SecurityOperationAlertNotificationTaskService, SecurityOperationAlertSlaService],
})
export class SecurityCenterModule {}
