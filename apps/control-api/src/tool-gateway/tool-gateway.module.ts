import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ToolGatewayService } from './tool-gateway.service';

@Module({
  imports: [PrismaModule],
  providers: [ToolGatewayService],
  exports: [ToolGatewayService],
})
export class ToolGatewayModule {}
