import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MenusModule } from '../menus/menus.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PluginsController } from './plugins.controller';
import { PluginsService } from './plugins.service';

@Module({
  imports: [AuthModule, PrismaModule, MenusModule, PlatformEventsModule],
  controllers: [PluginsController],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
