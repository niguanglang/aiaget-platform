import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAssessmentsController } from './customer-assessments.controller';
import { CustomerAssessmentsService } from './customer-assessments.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CustomerAssessmentsController],
  providers: [CustomerAssessmentsService],
})
export class CustomerAssessmentsModule {}
