import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AgentTeamsController } from './agent-teams.controller';
import { AgentTeamsService } from './agent-teams.service';

@Module({
  imports: [AuthModule, PrismaModule, PlatformEventsModule, StorageModule],
  controllers: [AgentTeamsController],
  providers: [AgentTeamsService],
  exports: [AgentTeamsService],
})
export class AgentTeamsModule {}
