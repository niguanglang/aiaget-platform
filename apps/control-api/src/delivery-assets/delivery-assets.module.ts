import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryAssetsController } from './delivery-assets.controller';
import { DeliveryAssetsService } from './delivery-assets.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryAssetsController],
  providers: [DeliveryAssetsService],
})
export class DeliveryAssetsModule {}
