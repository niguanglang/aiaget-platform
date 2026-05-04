import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformUsageAlertNotificationTaskService } from './platform-usage-alert-notification-task.service';
import { PlatformEventsController } from './platform-events.controller';
import { PlatformEventsService } from './platform-events.service';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [PlatformEventsController],
  providers: [PlatformEventsService, PlatformUsageAlertNotificationTaskService],
  exports: [PlatformEventsService, PlatformUsageAlertNotificationTaskService],
})
export class PlatformEventsModule {}
