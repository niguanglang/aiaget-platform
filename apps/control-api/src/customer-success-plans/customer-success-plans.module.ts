import { Module } from '@nestjs/common';

import { CustomerSuccessPlansController } from './customer-success-plans.controller';
import { CustomerSuccessPlansService } from './customer-success-plans.service';

@Module({
  controllers: [CustomerSuccessPlansController],
  providers: [CustomerSuccessPlansService],
})
export class CustomerSuccessPlansModule {}
