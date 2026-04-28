import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ModelConfigsController } from './model-configs.controller';
import { ModelProvidersController } from './models.controller';
import { ModelsService } from './models.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ModelProvidersController, ModelConfigsController],
  providers: [ModelsService],
})
export class ModelsModule {}
