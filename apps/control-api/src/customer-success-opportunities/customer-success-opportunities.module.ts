import { Module } from '@nestjs/common';

import { CustomerSuccessOpportunitiesController } from './customer-success-opportunities.controller';
import { CustomerSuccessOpportunitiesService } from './customer-success-opportunities.service';

@Module({
  controllers: [CustomerSuccessOpportunitiesController],
  providers: [CustomerSuccessOpportunitiesService],
})
export class CustomerSuccessOpportunitiesModule {}
