import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerSuccessActionsController } from './customer-success-actions.controller';
import { CustomerSuccessActionsService } from './customer-success-actions.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CustomerSuccessActionsController],
  providers: [CustomerSuccessActionsService],
})
export class CustomerSuccessActionsModule {}
