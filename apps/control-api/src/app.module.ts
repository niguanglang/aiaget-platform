import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AgentsModule } from './agents/agents.module';
import { AgentTeamsModule } from './agent-teams/agent-teams.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { BillingModule } from './billing/billing.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ConversationsModule } from './conversations/conversations.module';
import { CustomerAssessmentsModule } from './customer-assessments/customer-assessments.module';
import { DataScopesModule } from './data-scopes/data-scopes.module';
import { DeliveryAssetsModule } from './delivery-assets/delivery-assets.module';
import { DeliveryReviewsModule } from './delivery-reviews/delivery-reviews.module';
import { DepartmentsModule } from './departments/departments.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { HealthController } from './health.controller';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { MenusModule } from './menus/menus.module';
import { MonitorModule } from './monitor/monitor.module';
import { ModelsModule } from './models/models.module';
import { PlatformEventsModule } from './platform-events/platform-events.module';
import { PluginsModule } from './plugins/plugins.module';
import { PromptsModule } from './prompts/prompts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResourceAclsModule } from './resource-acls/resource-acls.module';
import { RoleScenariosModule } from './role-scenarios/role-scenarios.module';
import { RolesModule } from './roles/roles.module';
import { RuntimeExecutionModule } from './runtime-execution/runtime-execution.module';
import { SecurityCenterModule } from './security-center/security-center.module';
import { RuntimeHealthController } from './runtime-health.controller';
import { RuntimeHealthService } from './runtime-health.service';
import { SecurityPoliciesModule } from './security-policies/security-policies.module';
import { SkillsModule } from './skills/skills.module';
import { SolutionPackagesModule } from './solution-packages/solution-packages.module';
import { StorageModule } from './storage/storage.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { TenantsModule } from './tenants/tenants.module';
import { ToolGatewayModule } from './tool-gateway/tool-gateway.module';
import { ToolsModule } from './tools/tools.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, TenantsModule, UsersModule, DepartmentsModule, AgentsModule, AgentTeamsModule, RoleScenariosModule, SolutionPackagesModule, DeliveryReviewsModule, DeliveryAssetsModule, CustomerAssessmentsModule, SkillsModule, ModelsModule, PromptsModule, KnowledgeModule, ToolGatewayModule, ToolsModule, ConversationsModule, RuntimeExecutionModule, ExternalApiModule, ApprovalsModule, MonitorModule, AuditModule, BillingModule, ChannelsModule, RolesModule, ApiKeysModule, StorageModule, SystemSettingsModule, SecurityPoliciesModule, SecurityCenterModule, MenusModule, DataScopesModule, ResourceAclsModule, PlatformEventsModule, PluginsModule],
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
