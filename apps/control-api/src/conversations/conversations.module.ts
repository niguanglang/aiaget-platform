import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AuthModule, PrismaModule, ToolsModule, KnowledgeModule, PlatformEventsModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
