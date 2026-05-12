import { Prisma, PrismaClient } from '@prisma/client';
import { PERMISSION_CODES, permissionDefinitions } from '@aiaget/shared-types';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const defaultTenantCode = process.env.DEFAULT_TENANT_CODE ?? 'default';
const defaultTenantName = process.env.DEFAULT_TENANT_NAME ?? 'Default Enterprise';
const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? 'oss-admin-7f4c2a@local.invalid';
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'AIAgetDev!9sK4pQ7m';

const permissions = permissionDefinitions;

const defaultSystemSettings = [
  {
    category: 'GENERAL',
    key: 'default_locale',
    name: '默认语言',
    description: '控制台默认语言与本地化展示。',
    value: 'zh-CN',
    defaultValue: 'zh-CN',
    valueType: 'SELECT',
    options: [
      { label: '简体中文', value: 'zh-CN' },
      { label: '英文', value: 'en-US' },
    ],
    isSecret: false,
    sortOrder: 10,
  },
  {
    category: 'GENERAL',
    key: 'workspace_name',
    name: '工作区名称',
    description: '展示在控制台和外部调用响应里的工作区名称。',
    value: '企业 Agent 平台',
    defaultValue: '企业 Agent 平台',
    valueType: 'STRING',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
  {
    category: 'SECURITY',
    key: 'session_timeout_minutes',
    name: '会话超时分钟数',
    description: '用户长期无操作后的登录会话过期时间。',
    value: 120,
    defaultValue: 120,
    valueType: 'NUMBER',
    options: null,
    isSecret: false,
    sortOrder: 10,
  },
  {
    category: 'SECURITY',
    key: 'api_key_ip_allowlist_required',
    name: 'API Key 必须配置 IP 白名单',
    description: '启用后新建外部调用密钥必须提供 IP 白名单。',
    value: false,
    defaultValue: false,
    valueType: 'BOOLEAN',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
  {
    category: 'RUNTIME',
    key: 'runtime_stream_enabled',
    name: '运行时流式输出',
    description: '控制 Agent Runtime 是否默认允许 SSE 流式响应。',
    value: true,
    defaultValue: true,
    valueType: 'BOOLEAN',
    options: null,
    isSecret: false,
    sortOrder: 10,
  },
  {
    category: 'RUNTIME',
    key: 'runtime_default_temperature',
    name: '默认温度',
    description: 'Agent 未单独设置模型温度时使用的默认值。',
    value: 0.4,
    defaultValue: 0.4,
    valueType: 'NUMBER',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
  {
    category: 'OBSERVABILITY',
    key: 'trace_sample_rate',
    name: 'Trace 采样率',
    description: 'OpenTelemetry 链路追踪采样比例，取值范围 0 到 1。',
    value: 1,
    defaultValue: 1,
    valueType: 'NUMBER',
    options: null,
    isSecret: false,
    sortOrder: 10,
  },
  {
    category: 'OBSERVABILITY',
    key: 'monitor_error_alert_enabled',
    name: '异常告警开关',
    description: '启用后监控中心会记录并展示异常告警信号。',
    value: true,
    defaultValue: true,
    valueType: 'BOOLEAN',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
  {
    category: 'RETENTION',
    key: 'audit_retention_days',
    name: '审计日志保留天数',
    description: '审计与操作日志建议保留时长。',
    value: 180,
    defaultValue: 180,
    valueType: 'NUMBER',
    options: null,
    isSecret: false,
    sortOrder: 10,
  },
  {
    category: 'RETENTION',
    key: 'conversation_retention_days',
    name: '会话记录保留天数',
    description: '会话与运行记录建议保留时长。',
    value: 90,
    defaultValue: 90,
    valueType: 'NUMBER',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
  {
    category: 'INTEGRATION',
    key: 'external_webhook_url',
    name: '外部 Webhook 地址',
    description: '用于后续集成审批、告警或自动化通知的 Webhook 地址。',
    value: '',
    defaultValue: '',
    valueType: 'STRING',
    options: null,
    isSecret: true,
    sortOrder: 10,
  },
  {
    category: 'INTEGRATION',
    key: 'minio_public_base_url',
    name: '文件公开访问基址',
    description: '用于生成对象存储文件预览或下载链接的外部基址。',
    value: '',
    defaultValue: '',
    valueType: 'STRING',
    options: null,
    isSecret: false,
    sortOrder: 20,
  },
] as const;

const roles = [
  {
    code: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full access to the tenant workspace.',
    permissionCodes: permissions.map((permission) => permission.code),
  },
  {
    code: 'tenant_operator',
    name: 'Tenant Operator',
    description: 'Operational access without user write permissions.',
    permissionCodes: permissions
      .map((permission) => permission.code)
      .filter((code) =>
        code !== PERMISSION_CODES.systemUserManage &&
        code !== PERMISSION_CODES.systemRoleManage &&
        code !== PERMISSION_CODES.systemDataScopeManage &&
        code !== PERMISSION_CODES.systemResourceAclManage &&
        code !== PERMISSION_CODES.securityAuditView,
      ),
  },
  {
    code: 'tenant_viewer',
    name: 'Tenant Viewer',
    description: 'Read-only access to tenant console modules.',
    permissionCodes: permissions
      .filter((permission) => permission.action === 'view')
      .map((permission) => permission.code),
  },
] as const;

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: {
      code: defaultTenantCode,
    },
    create: {
      code: defaultTenantCode,
      name: defaultTenantName,
      status: 'ACTIVE',
    },
    update: {
      name: defaultTenantName,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: permission.code,
        },
      },
      create: {
        tenantId: tenant.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
        resource: permission.resource,
        action: permission.action,
      },
      update: {
        name: permission.name,
        module: permission.module,
        resource: permission.resource,
        action: permission.action,
        deletedAt: null,
      },
    });
  }

  const permissionRecords = await prisma.permission.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
  });
  const permissionByCode = new Map(permissionRecords.map((permission) => [permission.code, permission]));

  for (const role of roles) {
    const roleRecord = await prisma.role.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: role.code,
        },
      },
      create: {
        tenantId: tenant.id,
        code: role.code,
        name: role.name,
        description: role.description,
        status: 'ACTIVE',
        isSystem: true,
      },
      update: {
        name: role.name,
        description: role.description,
        status: 'ACTIVE',
        isSystem: true,
        deletedAt: null,
      },
    });

    await prisma.rolePermission.createMany({
      data: role.permissionCodes
        .map((permissionCode) => permissionByCode.get(permissionCode))
        .filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
        .map((permission) => ({
          tenantId: tenant.id,
          roleId: roleRecord.id,
          permissionId: permission.id,
        })),
      skipDuplicates: true,
    });
  }

  const adminPasswordHash = await hash(defaultAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: defaultAdminEmail,
      },
    },
    create: {
      tenantId: tenant.id,
      email: defaultAdminEmail,
      name: 'Default Admin',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
    update: {
      name: 'Default Admin',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'tenant_admin',
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      roleId: adminRole.id,
    },
    update: {
      deletedAt: null,
    },
  });

  const rootDepartment = await seedDepartments(tenant.id, admin.id);
  await prisma.user.update({
    where: {
      id: admin.id,
    },
    data: {
      departmentId: rootDepartment.id,
      updatedBy: admin.id,
    },
  });

  await seedMenus(tenant.id, admin.id);
  await seedRoleDataScopes(tenant.id, admin.id);
  await seedSystemSettings(tenant.id, admin.id);
  await seedBillingCommercialization(tenant.id, admin.id);

  const menuRecords = await prisma.menu.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
  });
  const menuByCode = new Map(menuRecords.map((menu) => [menu.code, menu]));
  const roleRecords = await prisma.role.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
  });

  for (const role of roleRecords) {
    const menuCodes = defaultMenus
      .filter((menu) => menu.type !== 'BUTTON')
      .map((menu) => menu.code);

    await prisma.roleMenu.createMany({
      data: menuCodes
        .map((menuCode) => menuByCode.get(menuCode))
        .filter((menu): menu is NonNullable<typeof menu> => Boolean(menu))
        .map((menu) => ({
          tenantId: tenant.id,
          roleId: role.id,
          menuId: menu.id,
          createdBy: admin.id,
          updatedBy: admin.id,
        })),
      skipDuplicates: true,
    });
  }

  for (const category of [
    {
      code: 'general',
      name: 'General Assistant',
      description: 'General purpose enterprise assistant agents.',
    },
    {
      code: 'operations',
      name: 'Operations',
      description: 'Operational support, monitoring, and workflow agents.',
    },
    {
      code: 'knowledge',
      name: 'Knowledge Expert',
      description: 'Knowledge-base oriented expert agents.',
    },
  ]) {
    await prisma.agentCategory.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: category.code,
        },
      },
      create: {
        tenantId: tenant.id,
        code: category.code,
        name: category.name,
        description: category.description,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      update: {
        name: category.name,
        description: category.description,
        deletedAt: null,
        updatedBy: admin.id,
      },
    });
  }

  for (const tool of [
    {
      code: 'runtime_health_probe',
      name: '运行时健康探针',
      description: '调用本地运行时健康接口，验证 HTTP 工具连通性。',
      method: 'GET',
      url: 'http://localhost:8000/runtime/health',
      riskLevel: 'LOW',
      authType: 'NONE',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['service', 'status'],
        properties: {
          service: { type: 'string' },
          status: { type: 'string' },
          timestamp: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
    {
      code: 'control_health_probe',
      name: '控制服务健康探针',
      description: '调用本地控制服务健康接口，验证工具记录与日志链路。',
      method: 'GET',
      url: 'http://localhost:3001/api/v1/health',
      riskLevel: 'LOW',
      authType: 'NONE',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['service', 'status'],
        properties: {
          service: { type: 'string' },
          status: { type: 'string' },
          timestamp: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
  ] as const) {
    await prisma.tool.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: tool.code,
        },
      },
      create: {
        tenantId: tenant.id,
        name: tool.name,
        code: tool.code,
        description: tool.description,
        toolType: 'HTTP',
        method: tool.method,
        url: tool.url,
        status: 'ACTIVE',
        riskLevel: tool.riskLevel,
        timeoutMs: 10000,
        requireApproval: false,
        authType: tool.authType,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      update: {
        name: tool.name,
        description: tool.description,
        method: tool.method,
        url: tool.url,
        status: 'ACTIVE',
        riskLevel: tool.riskLevel,
        timeoutMs: 10000,
        requireApproval: false,
        authType: tool.authType,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        deletedAt: null,
        updatedBy: admin.id,
      },
    });
  }

  const operationsCategory = await prisma.agentCategory.findUniqueOrThrow({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'operations',
      },
    },
  });

  const seededAgent = await prisma.agent.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'ops_copilot',
      },
    },
    create: {
      tenantId: tenant.id,
      categoryId: operationsCategory.id,
      ownerId: admin.id,
      name: '运行运维助手',
      code: 'ops_copilot',
      description: '用于演示会话、运行时调用和工具联动的默认运维智能体。',
      status: 'PUBLISHED',
      version: 1,
      temperature: 0.4,
      maxContextTokens: 4096,
      enableStream: true,
      enableLog: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
    update: {
      categoryId: operationsCategory.id,
      ownerId: admin.id,
      name: '运行运维助手',
      description: '用于演示会话、运行时调用和工具联动的默认运维智能体。',
      status: 'PUBLISHED',
      version: 1,
      temperature: 0.4,
      maxContextTokens: 4096,
      enableStream: true,
      enableLog: true,
      deletedAt: null,
      updatedBy: admin.id,
    },
  });

  for (const toolCode of ['runtime_health_probe', 'control_health_probe']) {
    const tool = await prisma.tool.findUniqueOrThrow({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: toolCode,
        },
      },
    });

    await prisma.agentToolBinding.upsert({
      where: {
        tenantId_agentId_toolId: {
          tenantId: tenant.id,
          agentId: seededAgent.id,
          toolId: tool.id,
        },
      },
      create: {
        tenantId: tenant.id,
        agentId: seededAgent.id,
        toolId: tool.id,
        requireApproval: false,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      update: {
        requireApproval: false,
        deletedAt: null,
        updatedBy: admin.id,
      },
    });
  }

  const seededAgentTeam = await seedAgentTeam(tenant.id, admin.id, seededAgent.id);
  const seededCustomerAssessment = await seedCustomerAssessment(tenant.id, admin.id);
  const seededSkill = await seedSkill(tenant.id, admin.id, seededAgent.id);
  const seededRoleScenario = await seedRoleScenario(tenant.id, admin.id, seededAgent.id, seededSkill.id);
  const seededKnowledge = await prisma.knowledgeBase.findFirst({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const seededSolutionPackage = await seedSolutionPackage(
    tenant.id,
    admin.id,
    seededCustomerAssessment.id,
    seededRoleScenario.id,
  );
  const seededDeliveryReview = await seedDeliveryReview(tenant.id, admin.id, seededSolutionPackage.id);
  const seededDeliveryAsset = await seedDeliveryAsset(
    tenant.id,
    admin.id,
    seededDeliveryReview.id,
    seededSolutionPackage.id,
    seededSkill.id,
    seededAgent.id,
    seededKnowledge?.id ?? null,
  );
  const seededCustomerSuccessPlan = await seedCustomerSuccessPlan(
    tenant.id,
    admin.id,
    seededDeliveryReview.id,
    seededDeliveryAsset.id,
    seededSolutionPackage.id,
  );
  const seededCustomerSuccessAction = await seedCustomerSuccessAction(
    tenant.id,
    admin.id,
    seededCustomerSuccessPlan.id,
    seededDeliveryReview.id,
    seededDeliveryAsset.id,
    seededSolutionPackage.id,
  );
  const seededCustomerSuccessOpportunity = await seedCustomerSuccessOpportunity(
    tenant.id,
    admin.id,
    seededCustomerSuccessPlan.id,
    seededCustomerSuccessAction.id,
    seededDeliveryReview.id,
    seededDeliveryAsset.id,
    seededSolutionPackage.id,
  );
  const seededChannel = await seedPublishChannels(tenant.id, admin.id, seededAgent.id);
  const seededPlugin = await seedPlugins(tenant.id, admin.id);

  await seedResourceAcls(
    tenant.id,
    admin.id,
    adminRole.id,
    seededAgent.id,
    seededAgentTeam.id,
    seededRoleScenario.id,
    seededSolutionPackage.id,
    seededDeliveryReview.id,
    seededDeliveryAsset.id,
    seededCustomerSuccessPlan.id,
    seededCustomerSuccessAction.id,
    seededCustomerSuccessOpportunity.id,
    seededCustomerAssessment.id,
    seededSkill.id,
    seededChannel.id,
    seededPlugin.id,
  );

  console.log(
    `Seeded tenant "${defaultTenantCode}" with default admin "${defaultAdminEmail}". Password: "${defaultAdminPassword}"`,
  );
}

interface DefaultMenuDefinition {
  code: string;
  parentCode?: string | null;
  name: string;
  type: 'DIRECTORY' | 'MENU' | 'BUTTON';
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  permissionCode?: string | null;
  isExternal?: boolean;
  externalUrl?: string | null;
  redirectPath?: string | null;
  keepAlive?: boolean;
  affix?: boolean;
  hideBreadcrumb?: boolean;
  routeMeta?: Record<string, unknown> | null;
  sortOrder: number;
  visible?: boolean;
  enabled?: boolean;
}

const defaultMenus: DefaultMenuDefinition[] = [
  { code: 'dashboard', name: '工作台', type: 'MENU', path: '/dashboard', component: 'dashboard/page', icon: 'Gauge', permissionCode: PERMISSION_CODES.dashboardOverviewView, sortOrder: 10 },
  { code: 'agent_center', name: 'Agent 中心', type: 'DIRECTORY', icon: 'Bot', sortOrder: 20 },
  { code: 'agents', parentCode: 'agent_center', name: 'Agent 管理', type: 'MENU', path: '/agents', component: 'agents/page', icon: 'Bot', permissionCode: PERMISSION_CODES.agentAgentView, sortOrder: 10 },
  { code: 'agent_teams', parentCode: 'agent_center', name: 'Agent 协作', type: 'MENU', path: '/agent-teams', component: 'agent-teams/page', icon: 'GitBranch', permissionCode: PERMISSION_CODES.agentTeamView, sortOrder: 20 },
  { code: 'agent_team_report_archives', parentCode: 'agent_teams', name: '报告归档', type: 'MENU', path: '/agent-teams/report-archives', component: 'agent-teams/report-archives/page', icon: 'FileArchive', permissionCode: PERMISSION_CODES.agentTeamView, sortOrder: 10 },
  { code: 'role_scenarios', parentCode: 'agent_center', name: '岗位场景', type: 'MENU', path: '/role-scenarios', component: 'role-scenarios/page', icon: 'Workflow', permissionCode: PERMISSION_CODES.roleScenarioView, sortOrder: 25 },
  { code: 'solution_packages', parentCode: 'agent_center', name: '落地方案', type: 'MENU', path: '/solution-packages', component: 'solution-packages/page', icon: 'FileCheck2', permissionCode: PERMISSION_CODES.solutionPackageView, sortOrder: 30 },
  { code: 'delivery_reviews', parentCode: 'agent_center', name: '验收复盘', type: 'MENU', path: '/delivery-reviews', component: 'delivery-reviews/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.deliveryReviewView, sortOrder: 35 },
  { code: 'delivery_assets', parentCode: 'agent_center', name: '成果资产', type: 'MENU', path: '/delivery-assets', component: 'delivery-assets/page', icon: 'ArchiveRestore', permissionCode: PERMISSION_CODES.deliveryAssetView, sortOrder: 37 },
  { code: 'customer_success_plans', parentCode: 'agent_center', name: '客户成功', type: 'MENU', path: '/customer-success-plans', component: 'customer-success-plans/page', icon: 'TrendingUp', permissionCode: PERMISSION_CODES.customerSuccessView, sortOrder: 38 },
  { code: 'customer_success_actions', parentCode: 'agent_center', name: '成功行动', type: 'MENU', path: '/customer-success-actions', component: 'customer-success-actions/page', icon: 'ListChecks', permissionCode: PERMISSION_CODES.customerSuccessActionView, sortOrder: 39 },
  { code: 'customer_success_opportunities', parentCode: 'agent_center', name: '续约机会', type: 'MENU', path: '/customer-success-opportunities', component: 'customer-success-opportunities/page', icon: 'Handshake', permissionCode: PERMISSION_CODES.customerSuccessOpportunityView, sortOrder: 40 },
  { code: 'customer_success_opportunity_analytics', parentCode: 'customer_success_opportunities', name: '机会分析', type: 'MENU', path: '/customer-success-opportunities/analytics', component: 'customer-success-opportunities/analytics/page', icon: 'BarChart3', permissionCode: PERMISSION_CODES.customerSuccessOpportunityView, sortOrder: 10 },
  { code: 'customer_assessments', parentCode: 'agent_center', name: '客户评估', type: 'MENU', path: '/customer-assessments', component: 'customer-assessments/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.customerAssessmentView, sortOrder: 41 },
  { code: 'skills', parentCode: 'agent_center', name: '技能资产', type: 'MENU', path: '/skills', component: 'skills/page', icon: 'Blocks', permissionCode: PERMISSION_CODES.skillHubView, sortOrder: 45 },
  { code: 'channels', parentCode: 'agent_center', name: '渠道发布', type: 'MENU', path: '/channels', component: 'channels/page', icon: 'RadioTower', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 50 },
  { code: 'channel_publish', parentCode: 'channels', name: '发布渠道', type: 'MENU', path: '/channels/publish', component: 'channels/publish/page', icon: 'RadioTower', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 10 },
  { code: 'channel_providers', parentCode: 'channels', name: '渠道提供方', type: 'MENU', path: '/channels/providers', component: 'channels/providers/page', icon: 'RadioTower', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 20 },
  { code: 'channel_accounts', parentCode: 'channels', name: '渠道账号', type: 'MENU', path: '/channels/accounts', component: 'channels/accounts/page', icon: 'KeyRound', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 30 },
  { code: 'channel_templates', parentCode: 'channels', name: '渠道模板', type: 'MENU', path: '/channels/templates', component: 'channels/templates/page', icon: 'FileText', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 40 },
  { code: 'channel_route_rules', parentCode: 'channels', name: '路由规则', type: 'MENU', path: '/channels/route-rules', component: 'channels/route-rules/page', icon: 'GitBranch', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 50 },
  { code: 'channel_jobs', parentCode: 'channels', name: '发布任务', type: 'MENU', path: '/channels/jobs', component: 'channels/jobs/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 60 },
  { code: 'channel_deliveries', parentCode: 'channels', name: '投递记录', type: 'MENU', path: '/channels/deliveries', component: 'channels/deliveries/page', icon: 'Activity', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 70 },
  { code: 'channel_replies', parentCode: 'channels', name: '回复记录', type: 'MENU', path: '/channels/replies', component: 'channels/replies/page', icon: 'MessageSquareReply', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 80 },
  { code: 'channel_sender', parentCode: 'channels', name: 'Sender 投递', type: 'MENU', path: '/channels/sender', component: 'channels/sender/page', icon: 'Send', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 90 },
  { code: 'channel_release', parentCode: 'channels', name: '发布治理', type: 'MENU', path: '/channels/release', component: 'channels/release/page', icon: 'Rocket', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 100 },
  { code: 'prompts', name: '提示词中心', type: 'MENU', path: '/prompts', component: 'prompts/page', icon: 'FileText', permissionCode: PERMISSION_CODES.promptTemplateView, sortOrder: 30 },
  { code: 'models', name: '模型中心', type: 'MENU', path: '/models', component: 'models/page', icon: 'KeyRound', permissionCode: PERMISSION_CODES.modelConfigView, sortOrder: 40 },
  { code: 'knowledge', name: '知识库中心', type: 'MENU', path: '/knowledge', component: 'knowledge/page', icon: 'Database', permissionCode: PERMISSION_CODES.knowledgeBaseView, sortOrder: 50 },
  { code: 'storage', name: '文件存储', type: 'MENU', path: '/storage', component: 'storage/page', icon: 'HardDrive', permissionCode: PERMISSION_CODES.storageObjectView, sortOrder: 55 },
  { code: 'storage_settings', parentCode: 'storage', name: '存储设置', type: 'MENU', path: '/storage/settings', component: 'storage/settings/page', icon: 'Settings', permissionCode: PERMISSION_CODES.storageObjectView, sortOrder: 10 },
  { code: 'storage_upload', parentCode: 'storage', name: '上传文件', type: 'MENU', path: '/storage/upload', component: 'storage/upload/page', icon: 'UploadCloud', permissionCode: PERMISSION_CODES.storageObjectManage, sortOrder: 20 },
  { code: 'plugins', name: '插件生态', type: 'MENU', path: '/plugins', component: 'plugins/page', icon: 'Boxes', permissionCode: PERMISSION_CODES.pluginCenterView, sortOrder: 57 },
  { code: 'tools', name: '工具中心', type: 'MENU', path: '/tools', component: 'tools/page', icon: 'Wrench', permissionCode: PERMISSION_CODES.toolDefinitionView, sortOrder: 60 },
  { code: 'conversations', name: '会话中心', type: 'MENU', path: '/conversations', component: 'conversations/page', icon: 'MessageSquareText', permissionCode: PERMISSION_CODES.conversationHistoryView, sortOrder: 70 },
  { code: 'monitor', name: '监控中心', type: 'MENU', path: '/monitor', component: 'monitor/page', icon: 'Activity', permissionCode: PERMISSION_CODES.monitorLogView, sortOrder: 80 },
  { code: 'billing', name: '成本与额度', type: 'MENU', path: '/billing', component: 'billing/page', icon: 'Coins', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 85 },
  { code: 'billing_usage', parentCode: 'billing', name: '用量明细', type: 'MENU', path: '/billing/usage', component: 'billing/usage/page', icon: 'Coins', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 10 },
  { code: 'billing_quota_policy', parentCode: 'billing', name: '额度策略', type: 'MENU', path: '/billing/quota-policy', component: 'billing/quota-policy/page', icon: 'Gauge', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 20 },
  { code: 'billing_invoices', parentCode: 'billing', name: '发票账单', type: 'MENU', path: '/billing/invoices', component: 'billing/invoices/page', icon: 'ReceiptText', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 30 },
  { code: 'billing_adjustments', parentCode: 'billing', name: '调账记录', type: 'MENU', path: '/billing/adjustments', component: 'billing/adjustments/page', icon: 'FileText', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 40 },
  { code: 'billing_subscription', parentCode: 'billing', name: '订阅套餐', type: 'MENU', path: '/billing/subscription', component: 'billing/subscription/page', icon: 'WalletCards', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 50 },
  { code: 'api_keys', name: 'API Key', type: 'MENU', path: '/api-keys', component: 'api-keys/page', icon: 'KeySquare', permissionCode: PERMISSION_CODES.systemApiKeyView, sortOrder: 87 },
  { code: 'api_reference', name: '接口文档', type: 'MENU', path: '/api-reference', component: 'api-reference/page', icon: 'BookOpen', permissionCode: PERMISSION_CODES.systemApiKeyView, sortOrder: 88 },
  { code: 'security_center', name: '安全中心', type: 'DIRECTORY', icon: 'ShieldCheck', sortOrder: 90 },
  { code: 'security_overview', parentCode: 'security_center', name: '安全总览', type: 'MENU', path: '/security', component: 'security/page', icon: 'ShieldCheck', permissionCode: PERMISSION_CODES.securityRuleView, sortOrder: 10 },
  { code: 'security_policies', parentCode: 'security_center', name: '安全策略', type: 'MENU', path: '/security/policies', component: 'security/policies/page', icon: 'ShieldCheck', permissionCode: PERMISSION_CODES.securityRuleView, sortOrder: 20 },
  { code: 'security_events', parentCode: 'security_center', name: '安全事件', type: 'MENU', path: '/security/events', component: 'security/events/page', icon: 'Activity', permissionCode: PERMISSION_CODES.securityAuditView, sortOrder: 30 },
  { code: 'security_alerts', parentCode: 'security_center', name: '告警运营', type: 'MENU', path: '/security/alerts', component: 'security/alerts/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 40 },
  { code: 'security_recovery', parentCode: 'security_center', name: '自愈恢复', type: 'MENU', path: '/security/recovery', component: 'security/recovery/page', icon: 'ScrollText', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 50 },
  { code: 'security_archives', parentCode: 'security_center', name: '归档治理', type: 'MENU', path: '/security/archives', component: 'security/archives/page', icon: 'FileArchive', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 60 },
  { code: 'approvals', parentCode: 'security_center', name: '审批中心', type: 'MENU', path: '/approvals', component: 'approvals/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 70 },
  { code: 'approval_tools', parentCode: 'approvals', name: '高危工具审批', type: 'MENU', path: '/approvals/tools', component: 'approvals/tools/page', icon: 'Wrench', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 10 },
  { code: 'approval_notification_policy', parentCode: 'approvals', name: '通知策略审批', type: 'MENU', path: '/approvals/notification-policy', component: 'approvals/notification-policy/page', icon: 'Settings', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 20 },
  { code: 'approval_archive_deletions', parentCode: 'approvals', name: '归档删除审批', type: 'MENU', path: '/approvals/archive-deletions', component: 'approvals/archive-deletions/page', icon: 'FileArchive', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 30 },
  { code: 'approval_audits', parentCode: 'security_center', name: '审批审计', type: 'MENU', path: '/approval-audits', component: 'approval-audits/page', icon: 'ScrollText', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 80 },
  { code: 'approval_audit_archives', parentCode: 'approval_audits', name: '审计归档', type: 'MENU', path: '/approval-audits/archives', component: 'approval-audits/archives/page', icon: 'FileArchive', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 10 },
  { code: 'audit', parentCode: 'security_center', name: '审计日志', type: 'MENU', path: '/audit', component: 'audit/page', icon: 'ScrollText', permissionCode: PERMISSION_CODES.securityAuditView, sortOrder: 90 },
  { code: 'system_management', name: '系统管理', type: 'DIRECTORY', icon: 'Settings', sortOrder: 100 },
  { code: 'settings', parentCode: 'system_management', name: '系统设置', type: 'MENU', path: '/settings', component: 'settings/page', icon: 'Settings', permissionCode: PERMISSION_CODES.systemSettingsView, sortOrder: 10 },
  { code: 'tenants', parentCode: 'system_management', name: '租户管理', type: 'MENU', path: '/tenants', component: 'tenants/page', icon: 'Network', permissionCode: PERMISSION_CODES.systemTenantView, sortOrder: 20 },
  { code: 'users', parentCode: 'system_management', name: '用户管理', type: 'MENU', path: '/users', component: 'users/page', icon: 'UsersRound', permissionCode: PERMISSION_CODES.systemUserView, sortOrder: 30 },
  { code: 'departments', parentCode: 'system_management', name: '部门管理', type: 'MENU', path: '/departments', component: 'departments/page', icon: 'Network', permissionCode: PERMISSION_CODES.systemDepartmentView, sortOrder: 40 },
  { code: 'roles', parentCode: 'system_management', name: '角色管理', type: 'MENU', path: '/roles', component: 'roles/page', icon: 'ShieldCheck', permissionCode: PERMISSION_CODES.systemRoleView, sortOrder: 50 },
  { code: 'data_scopes', parentCode: 'system_management', name: '数据权限', type: 'MENU', path: '/data-scopes', component: 'data-scopes/page', icon: 'SlidersHorizontal', permissionCode: PERMISSION_CODES.systemDataScopeView, sortOrder: 60 },
  { code: 'resource_acls', parentCode: 'system_management', name: '资源授权', type: 'MENU', path: '/resource-acls', component: 'resource-acls/page', icon: 'KeyRound', permissionCode: PERMISSION_CODES.systemResourceAclView, sortOrder: 70 },
  { code: 'menus', parentCode: 'system_management', name: '菜单管理', type: 'MENU', path: '/menus', component: 'menus/page', icon: 'ListTree', permissionCode: PERMISSION_CODES.systemMenuView, sortOrder: 80 },
  { code: 'tenant_update', parentCode: 'tenants', name: '编辑租户', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemTenantManage, sortOrder: 10, visible: false },
  { code: 'user_create', parentCode: 'users', name: '新建用户', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemUserManage, sortOrder: 10, visible: false },
  { code: 'user_update', parentCode: 'users', name: '编辑用户', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemUserManage, sortOrder: 20, visible: false },
  { code: 'user_delete', parentCode: 'users', name: '删除用户', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemUserManage, sortOrder: 30, visible: false },
  { code: 'department_create', parentCode: 'departments', name: '新建部门', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemDepartmentManage, sortOrder: 10, visible: false },
  { code: 'department_update', parentCode: 'departments', name: '编辑部门', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemDepartmentManage, sortOrder: 20, visible: false },
  { code: 'department_delete', parentCode: 'departments', name: '删除部门', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemDepartmentManage, sortOrder: 30, visible: false },
  { code: 'role_create', parentCode: 'roles', name: '新建角色', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemRoleManage, sortOrder: 10, visible: false },
  { code: 'role_update', parentCode: 'roles', name: '编辑角色', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemRoleManage, sortOrder: 20, visible: false },
  { code: 'role_delete', parentCode: 'roles', name: '删除角色', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemRoleManage, sortOrder: 30, visible: false },
  { code: 'role_permission_bind', parentCode: 'roles', name: '角色权限授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemRoleManage, sortOrder: 40, visible: false },
  { code: 'data_scope_update', parentCode: 'data_scopes', name: '编辑数据权限', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemDataScopeManage, sortOrder: 10, visible: false },
  { code: 'data_scope_preview', parentCode: 'data_scopes', name: '预览数据权限', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemDataScopeView, sortOrder: 20, visible: false },
  { code: 'resource_acl_create', parentCode: 'resource_acls', name: '新建资源授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemResourceAclManage, sortOrder: 10, visible: false },
  { code: 'resource_acl_update', parentCode: 'resource_acls', name: '编辑资源授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemResourceAclManage, sortOrder: 20, visible: false },
  { code: 'resource_acl_delete', parentCode: 'resource_acls', name: '删除资源授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemResourceAclManage, sortOrder: 30, visible: false },
  { code: 'resource_acl_check', parentCode: 'resource_acls', name: '模拟资源授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemResourceAclView, sortOrder: 40, visible: false },
  { code: 'agent_team_create', parentCode: 'agent_teams', name: '新建 Agent 协作团队', type: 'BUTTON', permissionCode: PERMISSION_CODES.agentTeamManage, sortOrder: 10, visible: false },
  { code: 'agent_team_update', parentCode: 'agent_teams', name: '编辑 Agent 协作团队', type: 'BUTTON', permissionCode: PERMISSION_CODES.agentTeamManage, sortOrder: 20, visible: false },
  { code: 'agent_team_run', parentCode: 'agent_teams', name: '启动 Agent 协作任务', type: 'BUTTON', permissionCode: PERMISSION_CODES.agentTeamRun, sortOrder: 30, visible: false },
  { code: 'role_scenario_create', parentCode: 'role_scenarios', name: '新建岗位场景', type: 'BUTTON', permissionCode: PERMISSION_CODES.roleScenarioManage, sortOrder: 10, visible: false },
  { code: 'role_scenario_update', parentCode: 'role_scenarios', name: '编辑岗位场景', type: 'BUTTON', permissionCode: PERMISSION_CODES.roleScenarioManage, sortOrder: 20, visible: false },
  { code: 'role_scenario_archive', parentCode: 'role_scenarios', name: '归档岗位场景', type: 'BUTTON', permissionCode: PERMISSION_CODES.roleScenarioManage, sortOrder: 30, visible: false },
  { code: 'solution_package_create', parentCode: 'solution_packages', name: '新建落地方案', type: 'BUTTON', permissionCode: PERMISSION_CODES.solutionPackageManage, sortOrder: 10, visible: false },
  { code: 'solution_package_update', parentCode: 'solution_packages', name: '编辑落地方案', type: 'BUTTON', permissionCode: PERMISSION_CODES.solutionPackageManage, sortOrder: 20, visible: false },
  { code: 'solution_package_archive', parentCode: 'solution_packages', name: '归档落地方案', type: 'BUTTON', permissionCode: PERMISSION_CODES.solutionPackageManage, sortOrder: 30, visible: false },
  { code: 'delivery_review_create', parentCode: 'delivery_reviews', name: '新建验收复盘', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryReviewManage, sortOrder: 10, visible: false },
  { code: 'delivery_review_update', parentCode: 'delivery_reviews', name: '编辑验收复盘', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryReviewManage, sortOrder: 20, visible: false },
  { code: 'delivery_review_archive', parentCode: 'delivery_reviews', name: '归档验收复盘', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryReviewManage, sortOrder: 30, visible: false },
  { code: 'delivery_asset_create', parentCode: 'delivery_assets', name: '新建成果资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryAssetManage, sortOrder: 10, visible: false },
  { code: 'delivery_asset_update', parentCode: 'delivery_assets', name: '编辑成果资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryAssetManage, sortOrder: 20, visible: false },
  { code: 'delivery_asset_archive', parentCode: 'delivery_assets', name: '归档成果资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.deliveryAssetManage, sortOrder: 30, visible: false },
  { code: 'customer_success_plan_create', parentCode: 'customer_success_plans', name: '新建客户成功计划', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessManage, sortOrder: 10, visible: false },
  { code: 'customer_success_plan_update', parentCode: 'customer_success_plans', name: '编辑客户成功计划', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessManage, sortOrder: 20, visible: false },
  { code: 'customer_success_plan_archive', parentCode: 'customer_success_plans', name: '归档客户成功计划', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessManage, sortOrder: 30, visible: false },
  { code: 'customer_success_action_create', parentCode: 'customer_success_actions', name: '新建客户成功行动', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessActionManage, sortOrder: 10, visible: false },
  { code: 'customer_success_action_update', parentCode: 'customer_success_actions', name: '编辑客户成功行动', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessActionManage, sortOrder: 20, visible: false },
  { code: 'customer_success_action_archive', parentCode: 'customer_success_actions', name: '归档客户成功行动', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessActionManage, sortOrder: 30, visible: false },
  { code: 'customer_success_opportunity_create', parentCode: 'customer_success_opportunities', name: '新建续约机会', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessOpportunityManage, sortOrder: 10, visible: false },
  { code: 'customer_success_opportunity_update', parentCode: 'customer_success_opportunities', name: '编辑续约机会', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessOpportunityManage, sortOrder: 20, visible: false },
  { code: 'customer_success_opportunity_archive', parentCode: 'customer_success_opportunities', name: '归档续约机会', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerSuccessOpportunityManage, sortOrder: 30, visible: false },
  { code: 'customer_assessment_create', parentCode: 'customer_assessments', name: '新建客户评估', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerAssessmentManage, sortOrder: 10, visible: false },
  { code: 'customer_assessment_update', parentCode: 'customer_assessments', name: '编辑客户评估', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerAssessmentManage, sortOrder: 20, visible: false },
  { code: 'customer_assessment_archive', parentCode: 'customer_assessments', name: '归档客户评估', type: 'BUTTON', permissionCode: PERMISSION_CODES.customerAssessmentManage, sortOrder: 30, visible: false },
  { code: 'skill_create', parentCode: 'skills', name: '新建技能资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.skillHubManage, sortOrder: 10, visible: false },
  { code: 'skill_update', parentCode: 'skills', name: '编辑技能资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.skillHubManage, sortOrder: 20, visible: false },
  { code: 'skill_publish', parentCode: 'skills', name: '发布技能版本', type: 'BUTTON', permissionCode: PERMISSION_CODES.skillHubManage, sortOrder: 30, visible: false },
  { code: 'skill_delete', parentCode: 'skills', name: '归档技能资产', type: 'BUTTON', permissionCode: PERMISSION_CODES.skillHubManage, sortOrder: 40, visible: false },
  { code: 'channel_create', parentCode: 'channels', name: '新建发布渠道', type: 'BUTTON', permissionCode: PERMISSION_CODES.channelPublishManage, sortOrder: 10, visible: false },
  { code: 'channel_update', parentCode: 'channels', name: '编辑发布渠道', type: 'BUTTON', permissionCode: PERMISSION_CODES.channelPublishManage, sortOrder: 20, visible: false },
  { code: 'channel_enable', parentCode: 'channels', name: '启用发布渠道', type: 'BUTTON', permissionCode: PERMISSION_CODES.channelPublishDeploy, sortOrder: 30, visible: false },
  { code: 'channel_disable', parentCode: 'channels', name: '停用发布渠道', type: 'BUTTON', permissionCode: PERMISSION_CODES.channelPublishDisable, sortOrder: 40, visible: false },
  { code: 'menu_create', parentCode: 'menus', name: '新建菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 10, visible: false },
  { code: 'menu_update', parentCode: 'menus', name: '编辑菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 20, visible: false },
  { code: 'menu_delete', parentCode: 'menus', name: '删除菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 30, visible: false },
  { code: 'menu_role_bind', parentCode: 'menus', name: '角色菜单授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 40, visible: false },
  { code: 'api_key_create', parentCode: 'api_keys', name: '创建 API Key', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemApiKeyManage, sortOrder: 10, visible: false },
  { code: 'api_key_delete', parentCode: 'api_keys', name: '删除 API Key', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemApiKeyManage, sortOrder: 20, visible: false },
];

async function seedMenus(tenantId: string, operatorId: string) {
  const menuByCode = new Map<string, { id: string }>();

  for (const menu of defaultMenus) {
    const parent = menu.parentCode ? menuByCode.get(menu.parentCode) : null;

    const menuRecord = await prisma.menu.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: menu.code,
        },
      },
      create: {
        tenantId,
        parentId: parent?.id ?? null,
        name: menu.name,
        code: menu.code,
        type: menu.type,
        path: menu.path ?? null,
        component: menu.component ?? null,
        icon: menu.icon ?? null,
        permissionCode: menu.permissionCode ?? null,
        isExternal: menu.isExternal ?? false,
        externalUrl: menu.externalUrl ?? null,
        redirectPath: menu.redirectPath ?? null,
        keepAlive: menu.keepAlive ?? false,
        affix: menu.affix ?? false,
        hideBreadcrumb: menu.hideBreadcrumb ?? false,
        routeMeta: menu.routeMeta ? toSeedJsonInput(menu.routeMeta) : Prisma.JsonNull,
        sortOrder: menu.sortOrder,
        visible: menu.visible ?? true,
        enabled: menu.enabled ?? true,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        parentId: parent?.id ?? null,
        name: menu.name,
        type: menu.type,
        path: menu.path ?? null,
        component: menu.component ?? null,
        icon: menu.icon ?? null,
        permissionCode: menu.permissionCode ?? null,
        isExternal: menu.isExternal ?? false,
        externalUrl: menu.externalUrl ?? null,
        redirectPath: menu.redirectPath ?? null,
        keepAlive: menu.keepAlive ?? false,
        affix: menu.affix ?? false,
        hideBreadcrumb: menu.hideBreadcrumb ?? false,
        routeMeta: menu.routeMeta ? toSeedJsonInput(menu.routeMeta) : Prisma.JsonNull,
        sortOrder: menu.sortOrder,
        visible: menu.visible ?? true,
        enabled: menu.enabled ?? true,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });

    menuByCode.set(menu.code, menuRecord);
  }
}

function toSeedJsonInput(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const dataScopeResourceTypes = [
  'AGENT',
  'AGENT_TEAM',
  'ROLE_SCENARIO',
  'SOLUTION_PACKAGE',
  'DELIVERY_REVIEW',
  'DELIVERY_ASSET',
  'CUSTOMER_SUCCESS_PLAN',
  'CUSTOMER_SUCCESS_ACTION',
  'CUSTOMER_SUCCESS_OPPORTUNITY',
  'CUSTOMER_ASSESSMENT',
  'SKILL',
  'CHANNEL',
  'PLUGIN',
  'KNOWLEDGE_BASE',
  'DOCUMENT',
  'TOOL',
  'MODEL',
  'CONVERSATION',
  'AUDIT_LOG',
] as const;

async function seedRoleDataScopes(tenantId: string, operatorId: string) {
  const roleRecords = await prisma.role.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
  });

  for (const role of roleRecords) {
    const scopeType = role.code === 'tenant_admin'
      ? 'ALL'
      : role.code === 'tenant_viewer'
        ? 'SELF'
        : 'TENANT';

    for (const resourceType of dataScopeResourceTypes) {
      await prisma.roleDataScope.upsert({
        where: {
          tenantId_roleId_resourceType: {
            tenantId,
            roleId: role.id,
            resourceType,
          },
        },
        create: {
          tenantId,
          roleId: role.id,
          resourceType,
          scopeType,
          scopeValue: defaultDataScopeValue(),
          status: 'ACTIVE',
          createdBy: operatorId,
          updatedBy: operatorId,
        },
        update: {
          deletedAt: null,
          updatedBy: operatorId,
        },
      });
    }
  }
}

function defaultDataScopeValue() {
  return {
    department_ids: [],
    user_ids: [],
    resource_ids: [],
    include_children: false,
  };
}

async function seedAgentTeam(tenantId: string, operatorId: string, agentId: string) {
  const team = await prisma.agentTeam.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'ops_collaboration_team',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      name: '运维协作团队',
      code: 'ops_collaboration_team',
      description: '用于演示多 Agent 协作、成员职责、运行轨迹和人工接力的默认团队。',
      status: 'ACTIVE',
      mode: 'SEQUENTIAL',
      maxRounds: 3,
      timeoutSeconds: 300,
      handoffPolicy: 'AUTO',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      name: '运维协作团队',
      description: '用于演示多 Agent 协作、成员职责、运行轨迹和人工接力的默认团队。',
      status: 'ACTIVE',
      mode: 'SEQUENTIAL',
      maxRounds: 3,
      timeoutSeconds: 300,
      handoffPolicy: 'AUTO',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  await prisma.agentTeamMember.upsert({
    where: {
      tenantId_teamId_agentId: {
        tenantId,
        teamId: team.id,
        agentId,
      },
    },
    create: {
      tenantId,
      teamId: team.id,
      agentId,
      role: '执行专家',
      responsibility: '负责执行运维排障、调用授权工具并产出最终处理建议。',
      executionOrder: 1,
      required: true,
      status: 'ACTIVE',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      role: '执行专家',
      responsibility: '负责执行运维排障、调用授权工具并产出最终处理建议。',
      executionOrder: 1,
      required: true,
      status: 'ACTIVE',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  return team;
}

async function seedSkill(tenantId: string, operatorId: string, agentId: string) {
  const skill = await prisma.skill.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'meeting_summary_archive',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      name: '会议纪要归档 Skill',
      code: 'meeting_summary_archive',
      category: 'OPERATIONS',
      status: 'PUBLISHED',
      version: 1,
      description: '将会议内容沉淀为可追踪纪要、待办和风险项的标准业务技能。',
      triggerScenario: '会议结束后需要沉淀结论、责任人、截止时间和风险提醒。',
      inputRequirements: '会议录音转写、会议主题、参会人、业务背景和补充附件。',
      executionSteps: '1. 提取议题和结论\n2. 识别行动项和责任人\n3. 标记风险和待确认事项\n4. 输出归档纪要',
      outputFormat: 'Markdown 纪要，包含议题、结论、行动项、风险和后续跟进。',
      qualityCriteria: '行动项必须包含责任人和截止时间，风险项必须给出影响说明。',
      boundaryRules: '不得编造未在输入中出现的客户事实，涉及敏感信息必须脱敏。',
      tags: ['会议', '运营', '归档'],
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      name: '会议纪要归档 Skill',
      category: 'OPERATIONS',
      status: 'PUBLISHED',
      version: 1,
      description: '将会议内容沉淀为可追踪纪要、待办和风险项的标准业务技能。',
      triggerScenario: '会议结束后需要沉淀结论、责任人、截止时间和风险提醒。',
      inputRequirements: '会议录音转写、会议主题、参会人、业务背景和补充附件。',
      executionSteps: '1. 提取议题和结论\n2. 识别行动项和责任人\n3. 标记风险和待确认事项\n4. 输出归档纪要',
      outputFormat: 'Markdown 纪要，包含议题、结论、行动项、风险和后续跟进。',
      qualityCriteria: '行动项必须包含责任人和截止时间，风险项必须给出影响说明。',
      boundaryRules: '不得编造未在输入中出现的客户事实，涉及敏感信息必须脱敏。',
      tags: ['会议', '运营', '归档'],
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  await prisma.skillVersion.upsert({
    where: {
      tenantId_skillId_version: {
        tenantId,
        skillId: skill.id,
        version: 1,
      },
    },
    create: {
      tenantId,
      skillId: skill.id,
      version: 1,
      status: 'PUBLISHED',
      snapshot: {
        id: skill.id,
        name: skill.name,
        code: skill.code,
        category: skill.category,
        status: skill.status,
        description: skill.description,
        trigger_scenario: skill.triggerScenario,
        input_requirements: skill.inputRequirements,
        execution_steps: skill.executionSteps,
        output_format: skill.outputFormat,
        quality_criteria: skill.qualityCriteria,
        boundary_rules: skill.boundaryRules,
        tags: skill.tags,
      },
      changeNote: '初始化默认会议纪要归档技能。',
      publishedAt: new Date(),
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      status: 'PUBLISHED',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  await prisma.agentSkillBinding.upsert({
    where: {
      tenantId_agentId_skillId_bindingType: {
        tenantId,
        agentId,
        skillId: skill.id,
        bindingType: 'SUPPORTING',
      },
    },
    create: {
      tenantId,
      agentId,
      skillId: skill.id,
      bindingType: 'SUPPORTING',
      sortOrder: 10,
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      bindingType: 'SUPPORTING',
      sortOrder: 10,
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  return skill;
}

async function seedCustomerAssessment(tenantId: string, operatorId: string) {
  const scores = {
    customer_type_clarity: 5,
    decision_intent: 5,
    business_goal: 4,
    process_maturity: 4,
    data_assets: 5,
    management_budget: 5,
  };
  const readinessScore = calculateSeedReadinessScore(scores);

  return prisma.customerAssessment.upsert({
    where: {
      id: '00000000-0000-0000-0000-00000000c119',
    },
    create: {
      id: '00000000-0000-0000-0000-00000000c119',
      tenantId,
      ownerId: operatorId,
      customerName: '华中设计院',
      customerType: 'TASK_DRIVEN',
      decisionStage: 'PROCUREMENT',
      status: 'QUALIFIED',
      industry: '设计院',
      contactName: '李总',
      contactInfo: 'li@example.test',
      businessGoal: '降低方案返工并确保资料引用可信。',
      processMaturity: '已有投标与方案评审流程。',
      dataAssetStatus: '历史方案、规范和项目资料较完整。',
      managementSupport: '院领导推动，预算已预留。',
      budgetSignal: '预算明确，等待验收方案。',
      sixQuestionScores: scores,
      readinessScore,
      recommendedStrategy: '任务型客户：优先准备安全、合规、交付和验收材料，快速进入样板成果。当前准备度较高，可以围绕样板成果和验收口径推进。',
      riskSummary: '需要提前确认数据不出域、权限边界和验收口径。',
      nextAction: '补齐合规方案并安排样板知识库检索演示。',
      notes: '从讲义六问判断看，客户已进入采购决策。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      customerName: '华中设计院',
      customerType: 'TASK_DRIVEN',
      decisionStage: 'PROCUREMENT',
      status: 'QUALIFIED',
      industry: '设计院',
      contactName: '李总',
      contactInfo: 'li@example.test',
      businessGoal: '降低方案返工并确保资料引用可信。',
      processMaturity: '已有投标与方案评审流程。',
      dataAssetStatus: '历史方案、规范和项目资料较完整。',
      managementSupport: '院领导推动，预算已预留。',
      budgetSignal: '预算明确，等待验收方案。',
      sixQuestionScores: scores,
      readinessScore,
      recommendedStrategy: '任务型客户：优先准备安全、合规、交付和验收材料，快速进入样板成果。当前准备度较高，可以围绕样板成果和验收口径推进。',
      riskSummary: '需要提前确认数据不出域、权限边界和验收口径。',
      nextAction: '补齐合规方案并安排样板知识库检索演示。',
      notes: '从讲义六问判断看，客户已进入采购决策。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedRoleScenario(tenantId: string, operatorId: string, agentId: string, skillId: string) {
  const tool = await prisma.tool.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: 'runtime_health_probe',
      },
    },
  });
  const knowledge = await prisma.knowledgeBase.findFirst({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const prompt = await prisma.promptTemplate.findFirst({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return prisma.roleScenario.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'sales_solution_delivery',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      agentId,
      skillId,
      knowledgeId: knowledge?.id ?? null,
      toolId: tool?.id ?? null,
      promptId: prompt?.id ?? null,
      name: '售前方案交付场景包',
      code: 'sales_solution_delivery',
      roleName: '售前顾问',
      departmentName: '解决方案部',
      scenarioType: 'SALES',
      status: 'READY',
      priority: 'HIGH',
      painPoint: '客户资料分散，售前方案需要反复返工，引用来源和风险口径难以统一。',
      businessGoal: '将客户六问、知识检索、方案生成、工具校验和验收材料串成标准化 AI 落地场景包。',
      workflowSummary: '客户分层 -> 资料检索 -> Skill 执行 -> Agent 生成方案 -> 工具校验 -> 样板成果验收。',
      expectedOutcome: '形成可复用售前方案包，减少方案准备时间并提升引用可信度。',
      sampleDeliverable: 'Markdown 方案包，包含客户画像、目标场景、架构建议、引用来源、风险清单和验收口径。',
      acceptanceCriteria: '引用来源完整，关键风险有处理建议，输出格式符合交付模板，客户可以基于样板成果做试点验收。',
      roiMetric: '单次方案准备时间下降 40%，方案返工次数下降 30%，引用遗漏率低于 5%。',
      impactScore: 96,
      tags: ['售前', '方案', '样板成果', '场景包'],
      notes: '作为 M120 默认样板，用于连接客户评估、Skill Hub 和 Agent 执行。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      agentId,
      skillId,
      knowledgeId: knowledge?.id ?? null,
      toolId: tool?.id ?? null,
      promptId: prompt?.id ?? null,
      name: '售前方案交付场景包',
      roleName: '售前顾问',
      departmentName: '解决方案部',
      scenarioType: 'SALES',
      status: 'READY',
      priority: 'HIGH',
      painPoint: '客户资料分散，售前方案需要反复返工，引用来源和风险口径难以统一。',
      businessGoal: '将客户六问、知识检索、方案生成、工具校验和验收材料串成标准化 AI 落地场景包。',
      workflowSummary: '客户分层 -> 资料检索 -> Skill 执行 -> Agent 生成方案 -> 工具校验 -> 样板成果验收。',
      expectedOutcome: '形成可复用售前方案包，减少方案准备时间并提升引用可信度。',
      sampleDeliverable: 'Markdown 方案包，包含客户画像、目标场景、架构建议、引用来源、风险清单和验收口径。',
      acceptanceCriteria: '引用来源完整，关键风险有处理建议，输出格式符合交付模板，客户可以基于样板成果做试点验收。',
      roiMetric: '单次方案准备时间下降 40%，方案返工次数下降 30%，引用遗漏率低于 5%。',
      impactScore: 96,
      tags: ['售前', '方案', '样板成果', '场景包'],
      notes: '作为 M120 默认样板，用于连接客户评估、Skill Hub 和 Agent 执行。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedSolutionPackage(
  tenantId: string,
  operatorId: string,
  customerAssessmentId: string,
  roleScenarioId: string,
) {
  return prisma.solutionPackage.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'huazhong_design_ai_pilot',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      customerAssessmentId,
      roleScenarioId,
      name: '华中设计院 AI 落地试点方案包',
      code: 'huazhong_design_ai_pilot',
      customerName: '华中设计院',
      industry: '设计院',
      customerType: 'TASK_DRIVEN',
      packageStage: 'PILOT_DESIGN',
      status: 'APPROVED',
      priority: 'HIGH',
      executiveSummary: '围绕任务型客户的安全、合规、交付和验收诉求，把客户六问评估与售前方案场景包沉淀为可执行试点方案。',
      businessObjectives: '降低方案返工，确保历史资料稳定检索，统一引用来源、风险提示和验收口径。',
      scopeSummary: '首期覆盖解决方案部售前顾问、历史方案知识库、方案生成 Agent 和样板验收材料。',
      scenarioBlueprint: '客户分层 -> 资料盘点 -> 知识库检索 -> Agent 方案生成 -> 风险校验 -> 样板成果验收 -> 复盘扩展。',
      deliveryRoadmap: '第 1 周完成资料盘点与权限边界；第 2 周完成场景包配置与样板输出；第 3 周完成试点验收和扩展计划。',
      acceptancePlan: '验收材料包含方案样板、引用来源清单、风险处置建议、权限审计记录和复盘结论。',
      roiSummary: '单次方案准备时间下降 40%，方案返工次数下降 30%，引用遗漏率低于 5%。',
      riskMitigation: '采用只读知识检索、人工审核和安全策略前置，暂不让高危工具直接进入生产流程。',
      commercialStrategy: '先以小范围试点证明样板成果，再扩展到更多项目类型和岗位场景。',
      nextMilestone: '完成客户资料清单确认，并安排样板方案评审会。',
      packageScore: 94,
      tags: ['设计院', '任务型客户', '试点方案', '样板验收'],
      notes: 'M121 默认样板，用于串联客户评估、岗位场景和后续交付闭环。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      customerAssessmentId,
      roleScenarioId,
      name: '华中设计院 AI 落地试点方案包',
      customerName: '华中设计院',
      industry: '设计院',
      customerType: 'TASK_DRIVEN',
      packageStage: 'PILOT_DESIGN',
      status: 'APPROVED',
      priority: 'HIGH',
      executiveSummary: '围绕任务型客户的安全、合规、交付和验收诉求，把客户六问评估与售前方案场景包沉淀为可执行试点方案。',
      businessObjectives: '降低方案返工，确保历史资料稳定检索，统一引用来源、风险提示和验收口径。',
      scopeSummary: '首期覆盖解决方案部售前顾问、历史方案知识库、方案生成 Agent 和样板验收材料。',
      scenarioBlueprint: '客户分层 -> 资料盘点 -> 知识库检索 -> Agent 方案生成 -> 风险校验 -> 样板成果验收 -> 复盘扩展。',
      deliveryRoadmap: '第 1 周完成资料盘点与权限边界；第 2 周完成场景包配置与样板输出；第 3 周完成试点验收和扩展计划。',
      acceptancePlan: '验收材料包含方案样板、引用来源清单、风险处置建议、权限审计记录和复盘结论。',
      roiSummary: '单次方案准备时间下降 40%，方案返工次数下降 30%，引用遗漏率低于 5%。',
      riskMitigation: '采用只读知识检索、人工审核和安全策略前置，暂不让高危工具直接进入生产流程。',
      commercialStrategy: '先以小范围试点证明样板成果，再扩展到更多项目类型和岗位场景。',
      nextMilestone: '完成客户资料清单确认，并安排样板方案评审会。',
      packageScore: 94,
      tags: ['设计院', '任务型客户', '试点方案', '样板验收'],
      notes: 'M121 默认样板，用于串联客户评估、岗位场景和后续交付闭环。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedDeliveryReview(tenantId: string, operatorId: string, solutionPackageId: string) {
  return prisma.deliveryReview.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'huazhong_design_pilot_review',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      solutionPackageId,
      name: '华中设计院试点验收复盘',
      code: 'huazhong_design_pilot_review',
      customerName: '华中设计院',
      reviewStage: 'PILOT_ACCEPTANCE',
      result: 'PASSED',
      status: 'COMPLETED',
      satisfactionLevel: 'HIGH',
      acceptanceScore: 95,
      deliveredScope: '完成售前方案样板、引用来源清单、风险提示模板、权限审计说明和验收清单。',
      acceptanceSummary: '客户确认样板成果可用于试点验收，引用来源完整，关键风险均有处理建议。',
      issueSummary: '需要补充更多历史方案样例，并完善跨部门资料权限边界说明。',
      improvementActions: '补齐 20 份历史方案样例，增加权限边界说明，并把验收清单同步到交付模板库。',
      expansionPlan: '下一阶段扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
      reusableAssets: '方案模板、验收清单、风险提示模板、引用来源检查表、复盘会议纪要模板。',
      nextAction: '安排扩展方案评审会，确认第二批岗位场景和资料范围。',
      reviewedAt: new Date('2026-05-09T16:00:00.000Z'),
      tags: ['验收', '复盘', '试点', '扩展'],
      notes: 'M122 默认样板，用于串联客户评估、岗位场景、方案包和交付复盘闭环。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      solutionPackageId,
      name: '华中设计院试点验收复盘',
      customerName: '华中设计院',
      reviewStage: 'PILOT_ACCEPTANCE',
      result: 'PASSED',
      status: 'COMPLETED',
      satisfactionLevel: 'HIGH',
      acceptanceScore: 95,
      deliveredScope: '完成售前方案样板、引用来源清单、风险提示模板、权限审计说明和验收清单。',
      acceptanceSummary: '客户确认样板成果可用于试点验收，引用来源完整，关键风险均有处理建议。',
      issueSummary: '需要补充更多历史方案样例，并完善跨部门资料权限边界说明。',
      improvementActions: '补齐 20 份历史方案样例，增加权限边界说明，并把验收清单同步到交付模板库。',
      expansionPlan: '下一阶段扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
      reusableAssets: '方案模板、验收清单、风险提示模板、引用来源检查表、复盘会议纪要模板。',
      nextAction: '安排扩展方案评审会，确认第二批岗位场景和资料范围。',
      reviewedAt: new Date('2026-05-09T16:00:00.000Z'),
      tags: ['验收', '复盘', '试点', '扩展'],
      notes: 'M122 默认样板，用于串联客户评估、岗位场景、方案包和交付复盘闭环。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedDeliveryAsset(
  tenantId: string,
  operatorId: string,
  deliveryReviewId: string,
  solutionPackageId: string,
  skillId: string,
  agentId: string,
  knowledgeId: string | null,
) {
  return prisma.deliveryAsset.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'sales_solution_acceptance_asset',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      deliveryReviewId,
      solutionPackageId,
      skillId,
      agentId,
      knowledgeId,
      name: '售前方案验收资产包',
      code: 'sales_solution_acceptance_asset',
      customerName: '华中设计院',
      assetType: 'SOLUTION_TEMPLATE',
      status: 'PUBLISHED',
      visibility: 'TENANT',
      reuseScore: 92,
      summary: '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类任务型客户试点复用。',
      businessValue: '降低方案准备时间，减少验收返工，并统一引用来源、风险说明和验收口径。',
      reuseGuidance: '适用于任务型客户的售前方案试点，可复制到投标资料问答、项目复盘助手和客户成功运营场景。',
      sourceContext: '来源于华中设计院试点验收复盘，客户确认样板成果可进入扩展阶段。',
      riskNotes: '复用前需要确认客户资料权限、行业术语、知识库密级和输出审核责任。',
      nextAction: '把资产同步到 Skill Hub，并标记为售前方案交付推荐资产。',
      tags: ['成果资产', '售前', '验收', '复用'],
      notes: 'M123 默认样板，用于把验收复盘沉淀为可复用交付资产。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      deliveryReviewId,
      solutionPackageId,
      skillId,
      agentId,
      knowledgeId,
      name: '售前方案验收资产包',
      customerName: '华中设计院',
      assetType: 'SOLUTION_TEMPLATE',
      status: 'PUBLISHED',
      visibility: 'TENANT',
      reuseScore: 92,
      summary: '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类任务型客户试点复用。',
      businessValue: '降低方案准备时间，减少验收返工，并统一引用来源、风险说明和验收口径。',
      reuseGuidance: '适用于任务型客户的售前方案试点，可复制到投标资料问答、项目复盘助手和客户成功运营场景。',
      sourceContext: '来源于华中设计院试点验收复盘，客户确认样板成果可进入扩展阶段。',
      riskNotes: '复用前需要确认客户资料权限、行业术语、知识库密级和输出审核责任。',
      nextAction: '把资产同步到 Skill Hub，并标记为售前方案交付推荐资产。',
      tags: ['成果资产', '售前', '验收', '复用'],
      notes: 'M123 默认样板，用于把验收复盘沉淀为可复用交付资产。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedCustomerSuccessPlan(
  tenantId: string,
  operatorId: string,
  deliveryReviewId: string,
  deliveryAssetId: string,
  solutionPackageId: string,
) {
  return prisma.customerSuccessPlan.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'huazhong_design_success_expansion',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '华中设计院客户成功扩展计划',
      code: 'huazhong_design_success_expansion',
      customerName: '华中设计院',
      planStage: 'EXPANSION_DESIGN',
      status: 'ACTIVE',
      priority: 'HIGH',
      healthLevel: 'HIGH',
      successScore: 88,
      expansionScope: '扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
      successObjectives: '30 天完成第二批岗位场景试点，复用成果资产并形成续约材料。',
      stakeholderPlan: '客户 CIO 负责业务牵引，设计院运营经理负责资料准备，平台客户成功经理每周复盘。',
      assetReusePlan: '复用售前方案验收资产包，复制验收清单、风险提示和引用来源检查表。',
      renewalPlan: '在试点验收后 45 天形成续约方案和新增部门推广清单。',
      riskSummary: '资料权限边界、跨部门目标不一致和知识库密级需要提前确认。',
      nextAction: '组织扩展方案评审会，确认第二批岗位场景和资料范围。',
      dueAt: new Date('2026-06-15T10:00:00.000Z'),
      tags: ['客户成功', '扩展', '续约', '复用'],
      notes: 'M124 默认样板，用于把验收复盘和成果资产转成可执行客户成功计划。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '华中设计院客户成功扩展计划',
      customerName: '华中设计院',
      planStage: 'EXPANSION_DESIGN',
      status: 'ACTIVE',
      priority: 'HIGH',
      healthLevel: 'HIGH',
      successScore: 88,
      expansionScope: '扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
      successObjectives: '30 天完成第二批岗位场景试点，复用成果资产并形成续约材料。',
      stakeholderPlan: '客户 CIO 负责业务牵引，设计院运营经理负责资料准备，平台客户成功经理每周复盘。',
      assetReusePlan: '复用售前方案验收资产包，复制验收清单、风险提示和引用来源检查表。',
      renewalPlan: '在试点验收后 45 天形成续约方案和新增部门推广清单。',
      riskSummary: '资料权限边界、跨部门目标不一致和知识库密级需要提前确认。',
      nextAction: '组织扩展方案评审会，确认第二批岗位场景和资料范围。',
      dueAt: new Date('2026-06-15T10:00:00.000Z'),
      tags: ['客户成功', '扩展', '续约', '复用'],
      notes: 'M124 默认样板，用于把验收复盘和成果资产转成可执行客户成功计划。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedCustomerSuccessAction(
  tenantId: string,
  operatorId: string,
  customerSuccessPlanId: string,
  deliveryReviewId: string,
  deliveryAssetId: string,
  solutionPackageId: string,
) {
  return prisma.customerSuccessAction.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'huazhong_design_expansion_review',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      customerSuccessPlanId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '第二批岗位场景扩展评审会',
      code: 'huazhong_design_expansion_review',
      customerName: '华中设计院',
      actionType: 'MEETING',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      actionScore: 86,
      actionSummary: '组织客户 CIO、运营经理和平台客户成功经理确认第二批岗位场景。',
      expectedOutcome: '明确扩展场景、资料边界、验收节奏和复用资产清单。',
      executionNotes: '已完成会议议程和资料清单准备。',
      blockerSummary: '知识库密级边界仍需安全管理员确认。',
      completionEvidence: '会议纪要和二批场景清单将归档到成果资产。',
      nextAction: '发送评审会议邀请并确认参会人。',
      dueAt: new Date('2026-06-18T10:00:00.000Z'),
      tags: ['客户成功', '行动', '扩展', '复用'],
      notes: 'M125 默认样板，用于把客户成功计划拆成可执行行动。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      customerSuccessPlanId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '第二批岗位场景扩展评审会',
      customerName: '华中设计院',
      actionType: 'MEETING',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      actionScore: 86,
      actionSummary: '组织客户 CIO、运营经理和平台客户成功经理确认第二批岗位场景。',
      expectedOutcome: '明确扩展场景、资料边界、验收节奏和复用资产清单。',
      executionNotes: '已完成会议议程和资料清单准备。',
      blockerSummary: '知识库密级边界仍需安全管理员确认。',
      completionEvidence: '会议纪要和二批场景清单将归档到成果资产。',
      nextAction: '发送评审会议邀请并确认参会人。',
      dueAt: new Date('2026-06-18T10:00:00.000Z'),
      tags: ['客户成功', '行动', '扩展', '复用'],
      notes: 'M125 默认样板，用于把客户成功计划拆成可执行行动。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

async function seedCustomerSuccessOpportunity(
  tenantId: string,
  operatorId: string,
  customerSuccessPlanId: string,
  customerSuccessActionId: string,
  deliveryReviewId: string,
  deliveryAssetId: string,
  solutionPackageId: string,
) {
  return prisma.customerSuccessOpportunity.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'huazhong_design_renewal_expansion',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      customerSuccessPlanId,
      customerSuccessActionId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '华中设计院二期续约扩展机会',
      code: 'huazhong_design_renewal_expansion',
      customerName: '华中设计院',
      opportunityType: 'EXPANSION',
      stage: 'PROPOSAL',
      status: 'OPEN',
      priority: 'HIGH',
      confidenceLevel: 'HIGH',
      riskLevel: 'MEDIUM',
      opportunityScore: 92,
      estimatedAmount: 680000,
      probability: 75,
      expectedCloseAt: new Date('2026-07-20T10:00:00.000Z'),
      opportunitySummary: '基于试点验收和成功行动，推进第二批岗位场景扩展与年度续约。',
      customerValue: '复用已验收资产，覆盖更多业务岗位，降低二期交付风险。',
      commercialStrategy: '以续约为主线，绑定二期扩展场景和年度服务包。',
      decisionPath: 'CIO 确认技术价值，运营负责人确认推广节奏，采购负责人确认商务条款。',
      riskSummary: '预算窗口和知识库密级审批可能影响签约节奏。',
      nextAction: '准备二期扩展报价单并约定商务评审会。',
      tags: ['续约', '扩展', '客户成功', '商务'],
      notes: 'M126 默认样板，用于把客户成功计划和成功行动转成可跟踪续约机会。',
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      customerSuccessPlanId,
      customerSuccessActionId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
      name: '华中设计院二期续约扩展机会',
      customerName: '华中设计院',
      opportunityType: 'EXPANSION',
      stage: 'PROPOSAL',
      status: 'OPEN',
      priority: 'HIGH',
      confidenceLevel: 'HIGH',
      riskLevel: 'MEDIUM',
      opportunityScore: 92,
      estimatedAmount: 680000,
      probability: 75,
      expectedCloseAt: new Date('2026-07-20T10:00:00.000Z'),
      closedAt: null,
      opportunitySummary: '基于试点验收和成功行动，推进第二批岗位场景扩展与年度续约。',
      customerValue: '复用已验收资产，覆盖更多业务岗位，降低二期交付风险。',
      commercialStrategy: '以续约为主线，绑定二期扩展场景和年度服务包。',
      decisionPath: 'CIO 确认技术价值，运营负责人确认推广节奏，采购负责人确认商务条款。',
      riskSummary: '预算窗口和知识库密级审批可能影响签约节奏。',
      nextAction: '准备二期扩展报价单并约定商务评审会。',
      lossReason: null,
      tags: ['续约', '扩展', '客户成功', '商务'],
      notes: 'M126 默认样板，用于把客户成功计划和成功行动转成可跟踪续约机会。',
      deletedAt: null,
      updatedBy: operatorId,
    },
  });
}

function calculateSeedReadinessScore(scores: Record<string, number>) {
  const sum = Object.values(scores).reduce((total, score) => total + score, 0);

  return Math.round((sum / 30) * 100);
}

async function seedPlugins(tenantId: string, operatorId: string) {
  const now = new Date();
  const permissionPreview = [
    PERMISSION_CODES.pluginCenterView,
    PERMISSION_CODES.monitorLogView,
    PERMISSION_CODES.securityAuditView,
  ];
  const manifestJson = {
    schema_version: '1.0',
    entry: 'control-api:platform-events',
    capabilities: ['event_projection', 'usage_rollup', 'menu_injection', 'audit_preview'],
    hooks: ['platform.event.created', 'platform.usage.rollup'],
  };
  const configJson = {
    event_projection: true,
    usage_rollup: true,
    audit_sample_rate: 1,
  };

  const plugin = await prisma.plugin.upsert({
    where: {
      tenantId_code: {
        tenantId,
        code: 'observability_bridge',
      },
    },
    create: {
      tenantId,
      ownerId: operatorId,
      code: 'observability_bridge',
      name: '可观测性桥接插件',
      provider: 'AIAget 官方插件',
      description: '把平台事件、用量聚合、审计记录和监控入口串联起来的默认插件，用于演示插件生态闭环。',
      sourceType: 'MARKET',
      latestVersion: '1.0.0',
      riskLevel: 'LOW',
      manifestJson,
      configJson,
      permissionPreview,
      status: 'ACTIVE',
      runtimeStatus: 'RUNNING',
      menuCount: 1,
      hookCount: 2,
      auditCount: 1,
      installedAt: now,
      enabledAt: now,
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      name: '可观测性桥接插件',
      provider: 'AIAget 官方插件',
      description: '把平台事件、用量聚合、审计记录和监控入口串联起来的默认插件，用于演示插件生态闭环。',
      sourceType: 'MARKET',
      latestVersion: '1.0.0',
      riskLevel: 'LOW',
      manifestJson,
      configJson,
      permissionPreview,
      status: 'ACTIVE',
      runtimeStatus: 'RUNNING',
      menuCount: 1,
      hookCount: 2,
      auditCount: 1,
      installedAt: now,
      enabledAt: now,
      disabledAt: null,
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  await prisma.pluginVersion.upsert({
    where: {
      tenantId_pluginId_version: {
        tenantId,
        pluginId: plugin.id,
        version: '1.0.0',
      },
    },
    create: {
      tenantId,
      pluginId: plugin.id,
      version: '1.0.0',
      status: 'PUBLISHED',
      manifestJson,
      changeNote: '默认可观测性桥接插件初始版本，提供事件投影、用量聚合和审计入口演示。',
      publishedAt: now,
      createdBy: operatorId,
    },
    update: {
      status: 'PUBLISHED',
      manifestJson,
      changeNote: '默认可观测性桥接插件初始版本，提供事件投影、用量聚合和审计入口演示。',
      publishedAt: now,
      createdBy: operatorId,
    },
  });

  await prisma.pluginInstallation.upsert({
    where: {
      tenantId_pluginId: {
        tenantId,
        pluginId: plugin.id,
      },
    },
    create: {
      tenantId,
      pluginId: plugin.id,
      ownerId: operatorId,
      installedVersion: '1.0.0',
      latestVersion: '1.0.0',
      status: 'ACTIVE',
      runtimeStatus: 'RUNNING',
      sourceType: 'MARKET',
      riskLevel: 'LOW',
      configJson,
      manifestJson,
      permissionPreview,
      installedAt: now,
      enabledAt: now,
      createdBy: operatorId,
      updatedBy: operatorId,
    },
    update: {
      ownerId: operatorId,
      installedVersion: '1.0.0',
      latestVersion: '1.0.0',
      status: 'ACTIVE',
      runtimeStatus: 'RUNNING',
      sourceType: 'MARKET',
      riskLevel: 'LOW',
      configJson,
      manifestJson,
      permissionPreview,
      installedAt: now,
      enabledAt: now,
      disabledAt: null,
      deletedAt: null,
      updatedBy: operatorId,
    },
  });

  for (const hook of [
    {
      code: 'platform_event_capture',
      name: '平台事件捕获',
      hookType: 'EVENT',
      target: 'platform.event.created',
      method: 'ASYNC',
      configJson: {
        event_types: ['agent.run.completed', 'tool.call.completed', 'plugin.installed'],
        delivery: 'internal',
      },
    },
    {
      code: 'usage_rollup_sync',
      name: '用量聚合同步',
      hookType: 'USAGE',
      target: 'platform.usage.rollup',
      method: 'SCHEDULED',
      configJson: {
        period: 'daily',
        metric_types: ['TOKEN', 'COST', 'CALL'],
      },
    },
  ]) {
    await prisma.pluginHook.upsert({
      where: {
        tenantId_pluginId_code: {
          tenantId,
          pluginId: plugin.id,
          code: hook.code,
        },
      },
      create: {
        tenantId,
        pluginId: plugin.id,
        code: hook.code,
        name: hook.name,
        hookType: hook.hookType,
        target: hook.target,
        method: hook.method,
        status: 'ACTIVE',
        configJson: hook.configJson,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        name: hook.name,
        hookType: hook.hookType,
        target: hook.target,
        method: hook.method,
        status: 'ACTIVE',
        configJson: hook.configJson,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }

  const monitorMenu = await prisma.menu.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: 'monitor',
      },
    },
  });
  if (monitorMenu) {
    await prisma.pluginMenuBinding.upsert({
      where: {
        tenantId_pluginId_menuId: {
          tenantId,
          pluginId: plugin.id,
          menuId: monitorMenu.id,
        },
      },
      create: {
        tenantId,
        pluginId: plugin.id,
        menuId: monitorMenu.id,
        enabled: true,
        visible: true,
        sortOrder: 80,
        status: 'ACTIVE',
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        enabled: true,
        visible: true,
        sortOrder: 80,
        status: 'ACTIVE',
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }

  const seedAuditLog = await prisma.pluginAuditLog.findFirst({
    where: {
      tenantId,
      pluginId: plugin.id,
      action: 'SEED',
    },
  });
  const seedAuditPayload = {
    version: '1.0.0',
    hooks: 2,
    menu_bindings: monitorMenu ? 1 : 0,
  };
  if (seedAuditLog) {
    await prisma.pluginAuditLog.update({
      where: {
        id: seedAuditLog.id,
      },
      data: {
        title: '默认插件初始化',
        summary: '已初始化可观测性桥接插件，用于插件市场、菜单注入、Hook 和审计链路演示。',
        status: 'SUCCESS',
        riskLevel: 'LOW',
        payloadJson: seedAuditPayload,
        createdBy: operatorId,
      },
    });
  } else {
    await prisma.pluginAuditLog.create({
      data: {
        tenantId,
        pluginId: plugin.id,
        action: 'SEED',
        title: '默认插件初始化',
        summary: '已初始化可观测性桥接插件，用于插件市场、菜单注入、Hook 和审计链路演示。',
        status: 'SUCCESS',
        riskLevel: 'LOW',
        payloadJson: seedAuditPayload,
        createdBy: operatorId,
      },
    });
  }

  return plugin;
}

async function seedPublishChannels(tenantId: string, operatorId: string, agentId: string) {
  const now = new Date();
  const defaultChannels = [
    {
      channel: 'WEB_WIDGET',
      name: '官网 Web 组件',
      description: '面向企业门户的 Web Widget 发布入口，用于演示 Agent 在线服务。',
      endpointUrl: 'https://console.example.com/widget/ops-copilot',
      callbackUrl: null,
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      healthMessage: '默认 Web 组件渠道已启用。',
      config: {
        theme: 'light',
        welcome_message: '你好，我是运维助手。',
        allow_file_upload: false,
      },
    },
    {
      channel: 'OPEN_API',
      name: '开放 API',
      description: '通过外部 API Key 调用 Agent 的标准开放接口渠道。',
      endpointUrl: '/api/v1/external/agents/{agentId}/chat',
      callbackUrl: null,
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      healthMessage: '开放 API 渠道已启用。',
      config: {
        stream_enabled: true,
        require_api_key: true,
        rate_limit_per_minute: 60,
      },
    },
    {
      channel: 'FEISHU',
      name: '飞书机器人',
      description: '飞书应用机器人发布占位配置，等待企业应用凭证接入。',
      endpointUrl: null,
      callbackUrl: 'https://console.example.com/channels/feishu/callback',
      status: 'DRAFT',
      healthStatus: 'UNKNOWN',
      healthMessage: '待补充飞书应用凭证后启用。',
      config: {
        app_id: '',
        event_subscriptions: ['im.message.receive_v1'],
      },
    },
  ] as const;

  let firstChannel: { id: string } | null = null;
  for (const item of defaultChannels) {
    const channel = await prisma.agentPublishChannel.upsert({
      where: {
        tenantId_agentId_channel: {
          tenantId,
          agentId,
          channel: item.channel,
        },
      },
      create: {
        tenantId,
        agentId,
        channel: item.channel,
        name: item.name,
        description: item.description,
        status: item.status,
        endpointUrl: item.endpointUrl,
        callbackUrl: item.callbackUrl,
        config: item.config,
        lastPublishedAt: item.status === 'ACTIVE' ? now : null,
        lastCheckedAt: item.status === 'ACTIVE' ? now : null,
        healthStatus: item.healthStatus,
        healthMessage: item.healthMessage,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        name: item.name,
        description: item.description,
        status: item.status,
        endpointUrl: item.endpointUrl,
        callbackUrl: item.callbackUrl,
        config: item.config,
        lastPublishedAt: item.status === 'ACTIVE' ? now : null,
        lastCheckedAt: item.status === 'ACTIVE' ? now : null,
        healthStatus: item.healthStatus,
        healthMessage: item.healthMessage,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
    firstChannel ??= channel;
  }

  return firstChannel ?? prisma.agentPublishChannel.findFirstOrThrow({
    where: {
      tenantId,
      agentId,
      deletedAt: null,
    },
  });
}

async function seedResourceAcls(
  tenantId: string,
  operatorId: string,
  adminRoleId: string,
  agentId: string,
  agentTeamId: string,
  roleScenarioId: string,
  solutionPackageId: string,
  deliveryReviewId: string,
  deliveryAssetId: string,
  customerSuccessPlanId: string,
  customerSuccessActionId: string,
  customerSuccessOpportunityId: string,
  customerAssessmentId: string,
  skillId: string,
  channelId: string,
  pluginId: string,
) {
  const defaultAcls = [
    {
      resourceType: 'AGENT',
      resourceId: agentId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode: PERMISSION_CODES.agentAgentView,
      effect: 'ALLOW',
    },
    {
      resourceType: 'AGENT',
      resourceId: agentId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode: PERMISSION_CODES.agentAgentManage,
      effect: 'ALLOW',
    },
    {
      resourceType: 'AGENT_TEAM',
      resourceId: agentTeamId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode: PERMISSION_CODES.agentTeamView,
      effect: 'ALLOW',
    },
    {
      resourceType: 'AGENT_TEAM',
      resourceId: agentTeamId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode: PERMISSION_CODES.agentTeamManage,
      effect: 'ALLOW',
    },
    {
      resourceType: 'AGENT_TEAM',
      resourceId: agentTeamId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode: PERMISSION_CODES.agentTeamRun,
      effect: 'ALLOW',
    },
    ...[PERMISSION_CODES.roleScenarioView, PERMISSION_CODES.roleScenarioManage].map((permissionCode) => ({
      resourceType: 'ROLE_SCENARIO',
      resourceId: roleScenarioId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.solutionPackageView, PERMISSION_CODES.solutionPackageManage].map((permissionCode) => ({
      resourceType: 'SOLUTION_PACKAGE',
      resourceId: solutionPackageId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.deliveryReviewView, PERMISSION_CODES.deliveryReviewManage].map((permissionCode) => ({
      resourceType: 'DELIVERY_REVIEW',
      resourceId: deliveryReviewId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.deliveryAssetView, PERMISSION_CODES.deliveryAssetManage].map((permissionCode) => ({
      resourceType: 'DELIVERY_ASSET',
      resourceId: deliveryAssetId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.customerSuccessView, PERMISSION_CODES.customerSuccessManage].map((permissionCode) => ({
      resourceType: 'CUSTOMER_SUCCESS_PLAN',
      resourceId: customerSuccessPlanId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.customerSuccessActionView, PERMISSION_CODES.customerSuccessActionManage].map((permissionCode) => ({
      resourceType: 'CUSTOMER_SUCCESS_ACTION',
      resourceId: customerSuccessActionId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.customerSuccessOpportunityView, PERMISSION_CODES.customerSuccessOpportunityManage].map((permissionCode) => ({
      resourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
      resourceId: customerSuccessOpportunityId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.customerAssessmentView, PERMISSION_CODES.customerAssessmentManage].map((permissionCode) => ({
      resourceType: 'CUSTOMER_ASSESSMENT',
      resourceId: customerAssessmentId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[PERMISSION_CODES.skillHubView, PERMISSION_CODES.skillHubManage].map((permissionCode) => ({
      resourceType: 'SKILL',
      resourceId: skillId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[
      PERMISSION_CODES.channelPublishView,
      PERMISSION_CODES.channelPublishManage,
      PERMISSION_CODES.channelPublishDeploy,
      PERMISSION_CODES.channelPublishDisable,
    ].map((permissionCode) => ({
      resourceType: 'CHANNEL',
      resourceId: channelId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
    ...[
      PERMISSION_CODES.pluginCenterView,
      PERMISSION_CODES.pluginCenterManage,
      PERMISSION_CODES.pluginCenterInstall,
      PERMISSION_CODES.pluginCenterEnable,
      PERMISSION_CODES.pluginCenterDisable,
      PERMISSION_CODES.pluginCenterUpgrade,
      PERMISSION_CODES.pluginCenterUninstall,
      PERMISSION_CODES.pluginCenterAudit,
    ].map((permissionCode) => ({
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      subjectType: 'ROLE',
      subjectId: adminRoleId,
      permissionCode,
      effect: 'ALLOW',
    })),
  ] as const;

  for (const acl of defaultAcls) {
    await prisma.resourceAcl.upsert({
      where: {
        tenantId_resourceType_resourceId_subjectType_subjectId_permissionCode: {
          tenantId,
          resourceType: acl.resourceType,
          resourceId: acl.resourceId,
          subjectType: acl.subjectType,
          subjectId: acl.subjectId,
          permissionCode: acl.permissionCode,
        },
      },
      create: {
        tenantId,
        resourceType: acl.resourceType,
        resourceId: acl.resourceId,
        subjectType: acl.subjectType,
        subjectId: acl.subjectId,
        permissionCode: acl.permissionCode,
        effect: acl.effect,
        status: 'ACTIVE',
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        effect: acl.effect,
        status: 'ACTIVE',
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }
}

async function seedSystemSettings(tenantId: string, operatorId: string) {
  for (const setting of defaultSystemSettings) {
    await prisma.systemSetting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: setting.key,
        },
      },
      create: {
        tenantId,
        category: setting.category,
        key: setting.key,
        name: setting.name,
        description: setting.description,
        value: setting.value,
        defaultValue: setting.defaultValue,
        valueType: setting.valueType,
        options: setting.options,
        isSecret: setting.isSecret,
        isSystem: true,
        status: 'ACTIVE',
        sortOrder: setting.sortOrder,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        category: setting.category,
        name: setting.name,
        description: setting.description,
        defaultValue: setting.defaultValue,
        valueType: setting.valueType,
        options: setting.options,
        isSecret: setting.isSecret,
        isSystem: true,
        sortOrder: setting.sortOrder,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }
}

async function seedBillingCommercialization(tenantId: string, operatorId: string) {
  const period = currentBillingPeriod();

  for (const plan of defaultBillingPlans) {
    await prisma.billingPlan.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: plan.code,
        },
      },
      create: {
        tenantId,
        code: plan.code,
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        monthlyBasePrice: plan.monthlyBasePrice,
        yearlyBasePrice: plan.yearlyBasePrice,
        currency: plan.currency,
        includedMonthlyCost: plan.includedMonthlyCost,
        includedMonthlyTokens: plan.includedMonthlyTokens,
        includedMonthlyCalls: plan.includedMonthlyCalls,
        includedStorageGb: plan.includedStorageGb,
        overageUnitPrice: plan.overageUnitPrice,
        featureLimits: plan.featureLimits,
        status: 'ACTIVE',
        sortOrder: plan.sortOrder,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        monthlyBasePrice: plan.monthlyBasePrice,
        yearlyBasePrice: plan.yearlyBasePrice,
        currency: plan.currency,
        includedMonthlyCost: plan.includedMonthlyCost,
        includedMonthlyTokens: plan.includedMonthlyTokens,
        includedMonthlyCalls: plan.includedMonthlyCalls,
        includedStorageGb: plan.includedStorageGb,
        overageUnitPrice: plan.overageUnitPrice,
        featureLimits: plan.featureLimits,
        status: 'ACTIVE',
        sortOrder: plan.sortOrder,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }

  const businessPlan = await prisma.billingPlan.findUniqueOrThrow({
    where: {
      tenantId_code: {
        tenantId,
        code: 'business',
      },
    },
  });

  let subscription = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (subscription) {
    subscription = await prisma.tenantSubscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        planId: businessPlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currency: businessPlan.currency,
        basePrice: businessPlan.monthlyBasePrice,
        includedMonthlyCost: businessPlan.includedMonthlyCost,
        includedMonthlyTokens: businessPlan.includedMonthlyTokens,
        includedMonthlyCalls: businessPlan.includedMonthlyCalls,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        autoRenew: true,
        metadata: { source: 'seed', milestone: 'M63-3' },
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  } else {
    subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: businessPlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currency: businessPlan.currency,
        basePrice: businessPlan.monthlyBasePrice,
        includedMonthlyCost: businessPlan.includedMonthlyCost,
        includedMonthlyTokens: businessPlan.includedMonthlyTokens,
        includedMonthlyCalls: businessPlan.includedMonthlyCalls,
        startedAt: period.start,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        autoRenew: true,
        metadata: { source: 'seed', milestone: 'M63-3' },
        createdBy: operatorId,
        updatedBy: operatorId,
      },
    });
  }

  const lastPeriodStart = new Date(period.start);
  lastPeriodStart.setMonth(lastPeriodStart.getMonth() - 1);
  const lastPeriodEnd = new Date(period.start);
  lastPeriodEnd.setMilliseconds(lastPeriodEnd.getMilliseconds() - 1);

  for (const invoice of [
    {
      invoiceNo: `INV-${period.start.getFullYear()}${String(period.start.getMonth() + 1).padStart(2, '0')}-AIA`,
      status: 'OPEN',
      subtotalAmount: 699,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 699,
      paidAmount: 0,
      periodStart: period.start,
      periodEnd: period.end,
      dueAt: addDays(period.end, 7),
      paidAt: null,
      lineItems: [
        { name: '企业版订阅', amount: 699, quantity: 1, unit: 'month' },
        { name: '当前周期超额用量', amount: 0, quantity: 0, unit: 'usage' },
      ],
    },
    {
      invoiceNo: `INV-${lastPeriodStart.getFullYear()}${String(lastPeriodStart.getMonth() + 1).padStart(2, '0')}-AIA`,
      status: 'PAID',
      subtotalAmount: 699,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 699,
      paidAmount: 699,
      periodStart: lastPeriodStart,
      periodEnd: lastPeriodEnd,
      dueAt: addDays(lastPeriodEnd, 7),
      paidAt: addDays(lastPeriodEnd, 3),
      lineItems: [
        { name: '企业版订阅', amount: 699, quantity: 1, unit: 'month' },
        { name: '上周期超额用量', amount: 0, quantity: 0, unit: 'usage' },
      ],
    },
  ]) {
    await prisma.billingInvoice.upsert({
      where: {
        tenantId_subscriptionId_periodStart_periodEnd: {
          tenantId,
          subscriptionId: subscription.id,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
        },
      },
      create: {
        tenantId,
        subscriptionId: subscription.id,
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        currency: businessPlan.currency,
        subtotalAmount: invoice.subtotalAmount,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        lineItems: invoice.lineItems,
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        subscriptionId: subscription.id,
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        currency: businessPlan.currency,
        subtotalAmount: invoice.subtotalAmount,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        lineItems: invoice.lineItems,
        deletedAt: null,
        updatedBy: operatorId,
      },
    });
  }

  for (const policy of defaultBillingQuotaPolicies) {
    const existing = await prisma.billingQuotaPolicy.findFirst({
      where: {
        tenantId,
        subjectType: policy.subjectType,
        subjectId: null,
        metricType: policy.metricType,
        period: policy.period,
        deletedAt: null,
      },
    });

    if (existing) {
      await prisma.billingQuotaPolicy.update({
        where: {
          id: existing.id,
        },
        data: {
          name: policy.name,
          limitValue: policy.limitValue,
          warnThreshold: policy.warnThreshold,
          hardThreshold: policy.hardThreshold,
          action: policy.action,
          status: 'ACTIVE',
          lastEvaluatedAt: new Date(),
          metadata: { source: 'seed', milestone: 'M63-3' },
          updatedBy: operatorId,
        },
      });
      continue;
    }

    await prisma.billingQuotaPolicy.create({
      data: {
        tenantId,
        name: policy.name,
        subjectType: policy.subjectType,
        subjectId: null,
        metricType: policy.metricType,
        period: policy.period,
        limitValue: policy.limitValue,
        warnThreshold: policy.warnThreshold,
        hardThreshold: policy.hardThreshold,
        action: policy.action,
        status: 'ACTIVE',
        lastEvaluatedAt: new Date(),
        metadata: { source: 'seed', milestone: 'M63-3' },
        createdBy: operatorId,
        updatedBy: operatorId,
      },
    });
  }
}

const defaultBillingPlans = [
  {
    code: 'team',
    name: '团队版',
    tier: 'TEAM',
    description: '适合小团队试点，包含基础 Agent、模型调用和知识库额度。',
    monthlyBasePrice: 199,
    yearlyBasePrice: 1990,
    currency: 'USD',
    includedMonthlyCost: 80,
    includedMonthlyTokens: 2_000_000,
    includedMonthlyCalls: 20_000,
    includedStorageGb: 100,
    overageUnitPrice: 0.00002,
    featureLimits: { agents: 30, api_keys: 20, agent_teams: 5, plugins: 5 },
    sortOrder: 10,
  },
  {
    code: 'business',
    name: '企业版',
    tier: 'BUSINESS',
    description: '适合企业内部运营，包含更高额度、多 Agent 协作和插件生态治理。',
    monthlyBasePrice: 699,
    yearlyBasePrice: 6990,
    currency: 'USD',
    includedMonthlyCost: 350,
    includedMonthlyTokens: 10_000_000,
    includedMonthlyCalls: 120_000,
    includedStorageGb: 500,
    overageUnitPrice: 0.000015,
    featureLimits: { agents: 200, api_keys: 100, agent_teams: 30, plugins: 30 },
    sortOrder: 20,
  },
  {
    code: 'enterprise',
    name: '旗舰版',
    tier: 'ENTERPRISE',
    description: '适合私有化和集团级部署，支持高级安全、全渠道发布和专属容量。',
    monthlyBasePrice: 1999,
    yearlyBasePrice: 19990,
    currency: 'USD',
    includedMonthlyCost: 1200,
    includedMonthlyTokens: 50_000_000,
    includedMonthlyCalls: 500_000,
    includedStorageGb: 2048,
    overageUnitPrice: 0.00001,
    featureLimits: { agents: 1000, api_keys: 500, agent_teams: 200, plugins: 200 },
    sortOrder: 30,
  },
] as const;

const defaultBillingQuotaPolicies = [
  {
    name: '租户月度成本额度',
    subjectType: 'TENANT',
    metricType: 'COST',
    period: 'MONTH',
    limitValue: 500,
    warnThreshold: 80,
    hardThreshold: 100,
    action: 'WARN',
  },
  {
    name: '租户月度词元额度',
    subjectType: 'TENANT',
    metricType: 'TOKEN',
    period: 'MONTH',
    limitValue: 10_000_000,
    warnThreshold: 80,
    hardThreshold: 100,
    action: 'THROTTLE',
  },
  {
    name: '租户月度调用额度',
    subjectType: 'TENANT',
    metricType: 'API_CALL',
    period: 'MONTH',
    limitValue: 120_000,
    warnThreshold: 80,
    hardThreshold: 100,
    action: 'BLOCK',
  },
] as const;

function currentBillingPeriod() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return { start, end };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

interface DefaultDepartmentDefinition {
  code: string;
  parentCode?: string | null;
  name: string;
  description: string;
  sortOrder: number;
}

const defaultDepartments: DefaultDepartmentDefinition[] = [
  {
    code: 'headquarters',
    name: '总部',
    description: '企业默认根部门，承载租户管理员和跨部门配置。',
    sortOrder: 10,
  },
  {
    code: 'ai_platform',
    parentCode: 'headquarters',
    name: 'AI 平台部',
    description: '负责智能体平台、模型、知识库和运行监控。',
    sortOrder: 10,
  },
  {
    code: 'operations',
    parentCode: 'headquarters',
    name: '运营支持部',
    description: '负责业务运营、审批流和工具配置。',
    sortOrder: 20,
  },
  {
    code: 'security',
    parentCode: 'headquarters',
    name: '安全合规部',
    description: '负责审计、安全策略和高危操作治理。',
    sortOrder: 30,
  },
];

async function seedDepartments(tenantId: string, operatorId: string) {
  const departmentByCode = new Map<string, { id: string }>();
  let rootDepartment: { id: string } | null = null;

  for (const department of defaultDepartments) {
    const parent = department.parentCode ? departmentByCode.get(department.parentCode) : null;
    const departmentRecord = await prisma.department.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: department.code,
        },
      },
      create: {
        tenantId,
        parentId: parent?.id ?? null,
        name: department.name,
        code: department.code,
        description: department.description,
        leaderUserId: operatorId,
        sortOrder: department.sortOrder,
        status: 'ACTIVE',
        createdBy: operatorId,
        updatedBy: operatorId,
      },
      update: {
        parentId: parent?.id ?? null,
        name: department.name,
        description: department.description,
        leaderUserId: operatorId,
        sortOrder: department.sortOrder,
        status: 'ACTIVE',
        deletedAt: null,
        updatedBy: operatorId,
      },
    });

    departmentByCode.set(department.code, departmentRecord);
    if (!department.parentCode) {
      rootDepartment = departmentRecord;
    }
  }

  return rootDepartment ?? departmentByCode.values().next().value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
