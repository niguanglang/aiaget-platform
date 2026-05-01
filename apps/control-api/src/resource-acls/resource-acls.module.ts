import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourceAclsController } from './resource-acls.controller';
import { ResourceAclsService } from './resource-acls.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ResourceAclsController],
  providers: [ResourceAclsService],
  exports: [ResourceAclsService],
})
export class ResourceAclsModule {}
