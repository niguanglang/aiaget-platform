import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SolutionPackagesController } from './solution-packages.controller';
import { SolutionPackagesService } from './solution-packages.service';

@Module({
  imports: [PrismaModule],
  controllers: [SolutionPackagesController],
  providers: [SolutionPackagesService],
})
export class SolutionPackagesModule {}
