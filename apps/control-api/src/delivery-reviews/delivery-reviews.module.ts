import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryReviewsController } from './delivery-reviews.controller';
import { DeliveryReviewsService } from './delivery-reviews.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryReviewsController],
  providers: [DeliveryReviewsService],
})
export class DeliveryReviewsModule {}
