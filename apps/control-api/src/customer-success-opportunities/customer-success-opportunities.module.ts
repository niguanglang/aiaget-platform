import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { CustomerSuccessOpportunitiesController } from './customer-success-opportunities.controller';
import { CustomerSuccessOpportunitiesService } from './customer-success-opportunities.service';

@Module({
  imports: [AuthModule, PlatformEventsModule],
  controllers: [CustomerSuccessOpportunitiesController],
  providers: [CustomerSuccessOpportunitiesService],
})
export class CustomerSuccessOpportunitiesModule {}
