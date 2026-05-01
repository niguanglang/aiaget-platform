import { PrismaClient } from '@prisma/client';
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

  await seedResourceAcls(tenant.id, admin.id, adminRole.id, seededAgent.id);

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
  sortOrder: number;
  visible?: boolean;
  enabled?: boolean;
}

const defaultMenus: DefaultMenuDefinition[] = [
  { code: 'dashboard', name: '工作台', type: 'MENU', path: '/dashboard', component: 'dashboard/page', icon: 'Gauge', permissionCode: PERMISSION_CODES.dashboardOverviewView, sortOrder: 10 },
  { code: 'agent_center', name: 'Agent 中心', type: 'DIRECTORY', icon: 'Bot', sortOrder: 20 },
  { code: 'agents', parentCode: 'agent_center', name: 'Agent 管理', type: 'MENU', path: '/agents', component: 'agents/page', icon: 'Bot', permissionCode: PERMISSION_CODES.agentAgentView, sortOrder: 10 },
  { code: 'prompts', name: '提示词中心', type: 'MENU', path: '/prompts', component: 'prompts/page', icon: 'FileText', permissionCode: PERMISSION_CODES.promptTemplateView, sortOrder: 30 },
  { code: 'models', name: '模型中心', type: 'MENU', path: '/models', component: 'models/page', icon: 'KeyRound', permissionCode: PERMISSION_CODES.modelConfigView, sortOrder: 40 },
  { code: 'knowledge', name: '知识库中心', type: 'MENU', path: '/knowledge', component: 'knowledge/page', icon: 'Database', permissionCode: PERMISSION_CODES.knowledgeBaseView, sortOrder: 50 },
  { code: 'storage', name: '文件存储', type: 'MENU', path: '/storage', component: 'storage/page', icon: 'HardDrive', permissionCode: PERMISSION_CODES.storageObjectView, sortOrder: 55 },
  { code: 'tools', name: '工具中心', type: 'MENU', path: '/tools', component: 'tools/page', icon: 'Wrench', permissionCode: PERMISSION_CODES.toolDefinitionView, sortOrder: 60 },
  { code: 'conversations', name: '会话中心', type: 'MENU', path: '/conversations', component: 'conversations/page', icon: 'MessageSquareText', permissionCode: PERMISSION_CODES.conversationHistoryView, sortOrder: 70 },
  { code: 'monitor', name: '监控中心', type: 'MENU', path: '/monitor', component: 'monitor/page', icon: 'Activity', permissionCode: PERMISSION_CODES.monitorLogView, sortOrder: 80 },
  { code: 'billing', name: '成本与额度', type: 'MENU', path: '/billing', component: 'billing/page', icon: 'Coins', permissionCode: PERMISSION_CODES.monitorLogView, sortOrder: 85 },
  { code: 'security_center', name: '安全中心', type: 'DIRECTORY', icon: 'ShieldCheck', sortOrder: 90 },
  { code: 'security_policies', parentCode: 'security_center', name: '安全策略', type: 'MENU', path: '/security', component: 'security/page', icon: 'ShieldCheck', permissionCode: PERMISSION_CODES.securityRuleView, sortOrder: 10 },
  { code: 'approvals', parentCode: 'security_center', name: '高危工具审批', type: 'MENU', path: '/approvals', component: 'approvals/page', icon: 'ClipboardCheck', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 20 },
  { code: 'audit', parentCode: 'security_center', name: '审计日志', type: 'MENU', path: '/audit', component: 'audit/page', icon: 'ScrollText', permissionCode: PERMISSION_CODES.securityAuditView, sortOrder: 30 },
  { code: 'system_management', name: '系统管理', type: 'DIRECTORY', icon: 'Settings', sortOrder: 100 },
  { code: 'settings', parentCode: 'system_management', name: '系统设置', type: 'MENU', path: '/settings', component: 'settings/page', icon: 'Settings', permissionCode: PERMISSION_CODES.systemSettingsView, sortOrder: 10 },
  { code: 'departments', parentCode: 'system_management', name: '部门管理', type: 'MENU', path: '/departments', component: 'departments/page', icon: 'Network', permissionCode: PERMISSION_CODES.systemDepartmentView, sortOrder: 20 },
  { code: 'roles', parentCode: 'system_management', name: '角色管理', type: 'MENU', path: '/roles', component: 'roles/page', icon: 'ShieldCheck', permissionCode: PERMISSION_CODES.systemRoleView, sortOrder: 30 },
  { code: 'data_scopes', parentCode: 'system_management', name: '数据权限', type: 'MENU', path: '/data-scopes', component: 'data-scopes/page', icon: 'SlidersHorizontal', permissionCode: PERMISSION_CODES.systemDataScopeView, sortOrder: 40 },
  { code: 'resource_acls', parentCode: 'system_management', name: '资源授权', type: 'MENU', path: '/resource-acls', component: 'resource-acls/page', icon: 'KeyRound', permissionCode: PERMISSION_CODES.systemResourceAclView, sortOrder: 50 },
  { code: 'menus', parentCode: 'system_management', name: '菜单管理', type: 'MENU', path: '/menus', component: 'menus/page', icon: 'ListTree', permissionCode: PERMISSION_CODES.systemMenuView, sortOrder: 60 },
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
  { code: 'menu_create', parentCode: 'menus', name: '新建菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 10, visible: false },
  { code: 'menu_update', parentCode: 'menus', name: '编辑菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 20, visible: false },
  { code: 'menu_delete', parentCode: 'menus', name: '删除菜单', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 30, visible: false },
  { code: 'menu_role_bind', parentCode: 'menus', name: '角色菜单授权', type: 'BUTTON', permissionCode: PERMISSION_CODES.systemMenuManage, sortOrder: 40, visible: false },
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

const dataScopeResourceTypes = [
  'AGENT',
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

async function seedResourceAcls(tenantId: string, operatorId: string, adminRoleId: string, agentId: string) {
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
