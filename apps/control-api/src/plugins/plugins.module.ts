import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MenusModule } from '../menus/menus.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PluginsController } from './plugins.controller';
import { PluginHookExecutionService } from './plugin-hook-execution.service';
import { PluginHookWorkflowService } from './plugin-hook-workflow.service';
import { PluginPackageIntegrityService } from './plugin-package-integrity.service';
import { PluginRollbackWorkflowService } from './plugin-rollback-workflow.service';
import { PluginsService } from './plugins.service';

@Module({
  imports: [AuthModule, PrismaModule, MenusModule, PlatformEventsModule],
  controllers: [PluginsController],
  providers: [PluginHookExecutionService, PluginHookWorkflowService, PluginPackageIntegrityService, PluginRollbackWorkflowService, PluginsService],
  exports: [PluginHookExecutionService, PluginHookWorkflowService, PluginRollbackWorkflowService, PluginsService],
})
export class PluginsModule {}
