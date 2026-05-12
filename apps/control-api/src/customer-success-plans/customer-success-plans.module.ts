import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerSuccessPlansController } from './customer-success-plans.controller';
import { CustomerSuccessPlansService } from './customer-success-plans.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CustomerSuccessPlansController],
  providers: [CustomerSuccessPlansService],
})
export class CustomerSuccessPlansModule {}
