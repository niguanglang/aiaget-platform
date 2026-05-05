import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ExternalApiModule } from '../external-api/external-api.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChannelReleaseAutomationWorkflowService } from './channel-release-automation-workflow.service';
import { ChannelReleaseSchedulerService } from './channel-release-scheduler.service';
import { ChannelReleaseSelfHealingWorkflowService } from './channel-release-self-healing-workflow.service';
import { ChannelSenderTaskService } from './channel-sender-task.service';
import { ChannelOperationsController } from './channel-operations.controller';
import { ChannelOperationsService } from './channel-operations.service';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [AuthModule, PrismaModule, PlatformEventsModule, ExternalApiModule],
  controllers: [ChannelsController, ChannelOperationsController],
  providers: [
    ChannelsService,
    ChannelOperationsService,
    ChannelSenderTaskService,
    ChannelReleaseAutomationWorkflowService,
    ChannelReleaseSelfHealingWorkflowService,
    ChannelReleaseSchedulerService,
  ],
  exports: [ChannelsService, ChannelReleaseAutomationWorkflowService, ChannelReleaseSelfHealingWorkflowService],
})
export class ChannelsModule {}
