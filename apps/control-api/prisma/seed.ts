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
    const menuCodes = role.code === 'tenant_viewer'
      ? defaultMenus
          .filter((menu) => menu.type !== 'BUTTON')
          .map((menu) => menu.code)
      : defaultMenus.map((menu) => menu.code);

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
  const seededChannel = await seedPublishChannels(tenant.id, admin.id, seededAgent.id);
  const seededPlugin = await seedPlugins(tenant.id, admin.id);

  await seedResourceAcls(tenant.id, admin.id, adminRole.id, seededAgent.id, seededAgentTeam.id, seededChannel.id, seededPlugin.id);

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
  { code: 'channels', parentCode: 'agent_center', name: '渠道发布', type: 'MENU', path: '/channels', component: 'channels/page', icon: 'RadioTower', permissionCode: PERMISSION_CODES.channelPublishView, sortOrder: 30 },
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
        tenantId_invoiceNo: {
          tenantId,
          invoiceNo: invoice.invoiceNo,
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
