import { Module } from '@nestjs/common';

import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolGatewayService } from './tool-gateway.service';

@Module({
  imports: [PrismaModule, PlatformEventsModule],
  providers: [ToolGatewayService],
  exports: [ToolGatewayService],
})
export class ToolGatewayModule {}
