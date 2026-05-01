import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiKeyService } from './external-api-key.service';
import { ExternalApiService } from './external-api.service';

@Module({
  imports: [AuthModule, ConversationsModule, PrismaModule],
  controllers: [ExternalApiController],
  providers: [ExternalApiKeyService, ExternalApiService],
})
export class ExternalApiModule {}
