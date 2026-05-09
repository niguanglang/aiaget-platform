import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoleScenariosController } from './role-scenarios.controller';
import { RoleScenariosService } from './role-scenarios.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoleScenariosController],
  providers: [RoleScenariosService],
})
export class RoleScenariosModule {}
