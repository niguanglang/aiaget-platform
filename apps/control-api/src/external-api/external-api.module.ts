import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalApiController } from './external-api.controller';
import { ExternalChannelCallbackService } from './external-channel-callback.service';
import { ExternalChannelRolloutGateService } from './external-channel-rollout-gate.service';
import { ExternalChannelSenderService } from './external-channel-sender.service';
import { ExternalApiKeyService } from './external-api-key.service';
import { ExternalApiService } from './external-api.service';
import { ExternalWebhookService } from './external-webhook.service';

@Module({
  imports: [AuthModule, ConversationsModule, PlatformEventsModule, PrismaModule],
  controllers: [ExternalApiController],
  providers: [ExternalApiKeyService, ExternalApiService, ExternalWebhookService, ExternalChannelCallbackService, ExternalChannelSenderService, ExternalChannelRolloutGateService],
  exports: [ExternalWebhookService, ExternalChannelSenderService, ExternalChannelRolloutGateService],
})
export class ExternalApiModule {}
