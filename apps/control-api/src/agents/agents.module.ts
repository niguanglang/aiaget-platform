import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentCategoriesController } from './agent-categories.controller';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AgentsController, AgentCategoriesController],
  providers: [AgentsService],
})
export class AgentsModule {}
