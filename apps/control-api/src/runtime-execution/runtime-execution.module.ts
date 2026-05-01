import { Module } from '@nestjs/common';

import { KnowledgeModule } from '../knowledge/knowledge.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { RuntimeExecutionController } from './runtime-execution.controller';
import { RuntimeExecutionService } from './runtime-execution.service';
import { RuntimeInternalGuard } from './runtime-internal.guard';

@Module({
  imports: [PrismaModule, KnowledgeModule, ToolsModule],
  controllers: [RuntimeExecutionController],
  providers: [RuntimeExecutionService, RuntimeInternalGuard],
})
export class RuntimeExecutionModule {}
