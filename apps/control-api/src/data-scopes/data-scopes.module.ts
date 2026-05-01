import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DataScopesController } from './data-scopes.controller';
import { DataScopesService } from './data-scopes.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DataScopesController],
  providers: [DataScopesService],
  exports: [DataScopesService],
})
export class DataScopesModule {}
