import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthController } from './health.controller';
import { ModelsModule } from './models/models.module';
import { PrismaModule } from './prisma/prisma.module';
import { RuntimeHealthController } from './runtime-health.controller';
import { RuntimeHealthService } from './runtime-health.service';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, TenantsModule, UsersModule, AgentsModule, ModelsModule],
  controllers: [HealthController, RuntimeHealthController],
  providers: [
    RuntimeHealthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
