import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryReviewsController } from './delivery-reviews.controller';
import { DeliveryReviewsService } from './delivery-reviews.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DeliveryReviewsController],
  providers: [DeliveryReviewsService],
})
export class DeliveryReviewsModule {}
