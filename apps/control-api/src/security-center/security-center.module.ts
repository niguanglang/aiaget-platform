import { Module } from '@nestjs/common';

import { AgentTeamsModule } from '../agent-teams/agent-teams.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { SecurityApprovalWorkbenchService } from './security-approval-workbench.service';
import { SecurityCenterController } from './security-center.controller';
import { SecurityOperationAlertNotificationTaskService } from './security-operation-alert-notification-task.service';
import { SecurityOperationAlertSlaService } from './security-operation-alert-sla.service';
import { SecurityCenterService } from './security-center.service';

@Module({
  imports: [AuthModule, PrismaModule, StorageModule, ApprovalsModule, SystemSettingsModule, AgentTeamsModule],
  controllers: [SecurityCenterController],
  providers: [
    SecurityCenterService,
    SecurityApprovalWorkbenchService,
    SecurityOperationAlertNotificationTaskService,
    SecurityOperationAlertSlaService,
  ],
  exports: [
    SecurityCenterService,
    SecurityApprovalWorkbenchService,
    SecurityOperationAlertNotificationTaskService,
    SecurityOperationAlertSlaService,
  ],
})
export class SecurityCenterModule {}
