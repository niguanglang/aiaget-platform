import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeTaskDispatcherService } from './knowledge-task-dispatcher.service';
import { OpenSearchService } from './opensearch.service';
import { QdrantService } from './qdrant.service';

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeTaskDispatcherService, OpenSearchService, QdrantService],
  exports: [KnowledgeService, KnowledgeTaskDispatcherService],
})
export class KnowledgeModule {}
