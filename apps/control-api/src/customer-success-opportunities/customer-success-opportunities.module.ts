import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlatformEventsModule } from '../platform-events/platform-events.module';
import { StorageModule } from '../storage/storage.module';
import { CustomerSuccessOpportunitiesController } from './customer-success-opportunities.controller';
import { CustomerSuccessOpportunitiesService } from './customer-success-opportunities.service';

@Module({
  imports: [AuthModule, PlatformEventsModule, StorageModule],
  controllers: [CustomerSuccessOpportunitiesController],
  providers: [CustomerSuccessOpportunitiesService],
  exports: [CustomerSuccessOpportunitiesService],
})
export class CustomerSuccessOpportunitiesModule {}
