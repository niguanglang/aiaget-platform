import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SolutionPackagesController } from './solution-packages.controller';
import { SolutionPackagesService } from './solution-packages.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SolutionPackagesController],
  providers: [SolutionPackagesService],
})
export class SolutionPackagesModule {}
