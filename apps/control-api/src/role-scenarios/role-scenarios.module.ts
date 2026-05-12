import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleScenariosController } from './role-scenarios.controller';
import { RoleScenariosService } from './role-scenarios.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RoleScenariosController],
  providers: [RoleScenariosService],
})
export class RoleScenariosModule {}
