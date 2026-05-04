import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ExternalApiModule } from '../external-api/external-api.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [AuthModule, PrismaModule, ExternalApiModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
