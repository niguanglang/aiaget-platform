import { Module } from '@nestjs/common';

import { CustomerSuccessActionsController } from './customer-success-actions.controller';
import { CustomerSuccessActionsService } from './customer-success-actions.service';

@Module({
  controllers: [CustomerSuccessActionsController],
  providers: [CustomerSuccessActionsService],
})
export class CustomerSuccessActionsModule {}
