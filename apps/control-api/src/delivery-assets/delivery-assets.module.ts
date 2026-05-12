import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryAssetsController } from './delivery-assets.controller';
import { DeliveryAssetsService } from './delivery-assets.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DeliveryAssetsController],
  providers: [DeliveryAssetsService],
})
export class DeliveryAssetsModule {}
