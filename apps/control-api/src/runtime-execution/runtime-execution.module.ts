import { Module } from '@nestjs/common';

import { AgentTeamsModule } from '../agent-teams/agent-teams.module';
import { AuthModule } from '../auth/auth.module';
import { ChannelsModule } from '../channels/channels.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { RuntimeExecutionController } from './runtime-execution.controller';
import { RuntimeExecutionService } from './runtime-execution.service';
import { RuntimeInternalGuard } from './runtime-internal.guard';
import { RuntimeWorkflowController } from './runtime-workflow.controller';

@Module({
  imports: [AuthModule, PrismaModule, KnowledgeModule, ToolsModule, AgentTeamsModule, ChannelsModule, PlatformEventsModule],
  controllers: [RuntimeExecutionController, RuntimeWorkflowController],
  providers: [RuntimeExecutionService, RuntimeInternalGuard],
  exports: [RuntimeExecutionService],
})
export class RuntimeExecutionModule {}
