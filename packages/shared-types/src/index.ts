export type HealthStatus = 'healthy' | 'degraded' | 'unavailable';

export interface HealthResponse {
  service: string;
  status: HealthStatus;
  timestamp: string;
  version: string;
}

export interface ApiResponse<TData> {
  request_id: string;
  data: TData;
  error: null;
}

export interface ApiErrorResponse {
  request_id: string;
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  page: number;
  page_size: number;
  total: number;
}

export const PERMISSION_CODES = {
  dashboardOverviewView: 'dashboard:overview:view',
  systemSettingsView: 'system:settings:view',
  systemSettingsManage: 'system:settings:manage',
  systemTenantView: 'system:tenant:view',
  systemTenantManage: 'system:tenant:manage',
  systemRoleView: 'system:role:view',
  systemRoleManage: 'system:role:manage',
  systemDepartmentView: 'system:department:view',
  systemDepartmentManage: 'system:department:manage',
  systemMenuView: 'system:menu:view',
  systemMenuManage: 'system:menu:manage',
  systemDataScopeView: 'system:data_scope:view',
  systemDataScopeManage: 'system:data_scope:manage',
  systemResourceAclView: 'system:resource_acl:view',
  systemResourceAclManage: 'system:resource_acl:manage',
  systemApiKeyView: 'system:api_key:view',
  systemApiKeyManage: 'system:api_key:manage',
  systemApiKeyInvoke: 'system:api_key:invoke',
  systemUserView: 'system:user:view',
  systemUserManage: 'system:user:manage',
  storageObjectView: 'storage:object:view',
  storageObjectManage: 'storage:object:manage',
  securityRuleView: 'security:rule:view',
  securityRuleManage: 'security:rule:manage',
  securityApprovalView: 'security:approval:view',
  securityApprovalHandle: 'security:approval:handle',
  securityAuditView: 'security:audit:view',
  pluginCenterView: 'plugin:center:view',
  pluginCenterManage: 'plugin:center:manage',
  pluginCenterInstall: 'plugin:center:install',
  pluginCenterEnable: 'plugin:center:enable',
  pluginCenterDisable: 'plugin:center:disable',
  pluginCenterUpgrade: 'plugin:center:upgrade',
  pluginCenterAudit: 'plugin:center:audit',
  channelPublishView: 'channel:publish:view',
  channelPublishManage: 'channel:publish:manage',
  channelPublishDeploy: 'channel:publish:deploy',
  channelPublishDisable: 'channel:publish:disable',
  agentAgentView: 'agent:agent:view',
  agentAgentManage: 'agent:agent:manage',
  agentAgentUse: 'agent:agent:use',
  agentTeamView: 'agent:team:view',
  agentTeamManage: 'agent:team:manage',
  agentTeamRun: 'agent:team:run',
  agentTeamHandoffReview: 'security:approval:handle',
  promptTemplateView: 'prompt:template:view',
  promptTemplateManage: 'prompt:template:manage',
  modelConfigView: 'model:config:view',
  modelConfigManage: 'model:config:manage',
  knowledgeBaseView: 'knowledge:base:view',
  knowledgeBaseManage: 'knowledge:base:manage',
  toolDefinitionView: 'tool:definition:view',
  toolDefinitionManage: 'tool:definition:manage',
  toolCallExecute: 'tool:call:execute',
  conversationHistoryView: 'conversation:history:view',
  conversationChatManage: 'conversation:chat:manage',
  monitorLogView: 'monitor:log:view',
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export interface PermissionDefinition {
  code: PermissionCode;
  legacy_code: string;
  name: string;
  module: string;
  resource: string;
  action: string;
}

export const permissionDefinitions: PermissionDefinition[] = [
  {
    code: PERMISSION_CODES.dashboardOverviewView,
    legacy_code: 'dashboard.read',
    name: 'Dashboard Overview View',
    module: 'dashboard',
    resource: 'overview',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemSettingsView,
    legacy_code: 'settings.read',
    name: 'System Settings View',
    module: 'system',
    resource: 'settings',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemSettingsManage,
    legacy_code: 'settings.write',
    name: 'System Settings Manage',
    module: 'system',
    resource: 'settings',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemTenantView,
    legacy_code: 'tenant.read',
    name: 'System Tenant View',
    module: 'system',
    resource: 'tenant',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemTenantManage,
    legacy_code: 'tenant.write',
    name: 'System Tenant Manage',
    module: 'system',
    resource: 'tenant',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemRoleView,
    legacy_code: 'role.read',
    name: 'System Role View',
    module: 'system',
    resource: 'role',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemRoleManage,
    legacy_code: 'role.write',
    name: 'System Role Manage',
    module: 'system',
    resource: 'role',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemDepartmentView,
    legacy_code: 'department.read',
    name: 'System Department View',
    module: 'system',
    resource: 'department',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemDepartmentManage,
    legacy_code: 'department.write',
    name: 'System Department Manage',
    module: 'system',
    resource: 'department',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemMenuView,
    legacy_code: 'menu.read',
    name: 'System Menu View',
    module: 'system',
    resource: 'menu',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemMenuManage,
    legacy_code: 'menu.write',
    name: 'System Menu Manage',
    module: 'system',
    resource: 'menu',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemDataScopeView,
    legacy_code: 'data_scope.read',
    name: 'System Data Scope View',
    module: 'system',
    resource: 'data_scope',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemDataScopeManage,
    legacy_code: 'data_scope.write',
    name: 'System Data Scope Manage',
    module: 'system',
    resource: 'data_scope',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemResourceAclView,
    legacy_code: 'resource_acl.read',
    name: 'System Resource ACL View',
    module: 'system',
    resource: 'resource_acl',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemResourceAclManage,
    legacy_code: 'resource_acl.write',
    name: 'System Resource ACL Manage',
    module: 'system',
    resource: 'resource_acl',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemApiKeyView,
    legacy_code: 'api_key.read',
    name: 'System API Key View',
    module: 'system',
    resource: 'api_key',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemApiKeyManage,
    legacy_code: 'api_key.write',
    name: 'System API Key Manage',
    module: 'system',
    resource: 'api_key',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.systemApiKeyInvoke,
    legacy_code: 'api_key.invoke',
    name: 'System API Key Invoke',
    module: 'system',
    resource: 'api_key',
    action: 'invoke',
  },
  {
    code: PERMISSION_CODES.systemUserView,
    legacy_code: 'user.read',
    name: 'System User View',
    module: 'system',
    resource: 'user',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.systemUserManage,
    legacy_code: 'user.write',
    name: 'System User Manage',
    module: 'system',
    resource: 'user',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.storageObjectView,
    legacy_code: 'storage.read',
    name: 'Storage Object View',
    module: 'storage',
    resource: 'object',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.storageObjectManage,
    legacy_code: 'storage.write',
    name: 'Storage Object Manage',
    module: 'storage',
    resource: 'object',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.securityRuleView,
    legacy_code: 'security_policy.read',
    name: 'Security Rule View',
    module: 'security',
    resource: 'rule',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.securityRuleManage,
    legacy_code: 'security_policy.write',
    name: 'Security Rule Manage',
    module: 'security',
    resource: 'rule',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.agentAgentView,
    legacy_code: 'agent.read',
    name: 'Agent View',
    module: 'agent',
    resource: 'agent',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.agentAgentManage,
    legacy_code: 'agent.write',
    name: 'Agent Manage',
    module: 'agent',
    resource: 'agent',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.agentAgentUse,
    legacy_code: 'agent.use',
    name: 'Agent Use',
    module: 'agent',
    resource: 'agent',
    action: 'use',
  },
  {
    code: PERMISSION_CODES.agentTeamView,
    legacy_code: 'agent_team.read',
    name: 'Agent Team View',
    module: 'agent',
    resource: 'team',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.agentTeamManage,
    legacy_code: 'agent_team.write',
    name: 'Agent Team Manage',
    module: 'agent',
    resource: 'team',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.agentTeamRun,
    legacy_code: 'agent_team.run',
    name: 'Agent Team Run',
    module: 'agent',
    resource: 'team',
    action: 'run',
  },
  {
    code: PERMISSION_CODES.agentTeamHandoffReview,
    legacy_code: 'agent_team_handoff.review',
    name: 'Agent Team Handoff Review',
    module: 'agent',
    resource: 'team_handoff',
    action: 'review',
  },
  {
    code: PERMISSION_CODES.promptTemplateView,
    legacy_code: 'prompt.read',
    name: 'Prompt Template View',
    module: 'prompt',
    resource: 'template',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.promptTemplateManage,
    legacy_code: 'prompt.write',
    name: 'Prompt Template Manage',
    module: 'prompt',
    resource: 'template',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.modelConfigView,
    legacy_code: 'model.read',
    name: 'Model Config View',
    module: 'model',
    resource: 'config',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.modelConfigManage,
    legacy_code: 'model.write',
    name: 'Model Config Manage',
    module: 'model',
    resource: 'config',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.knowledgeBaseView,
    legacy_code: 'knowledge.read',
    name: 'Knowledge Base View',
    module: 'knowledge',
    resource: 'base',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.knowledgeBaseManage,
    legacy_code: 'knowledge.write',
    name: 'Knowledge Base Manage',
    module: 'knowledge',
    resource: 'base',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.toolDefinitionView,
    legacy_code: 'tool.read',
    name: 'Tool Definition View',
    module: 'tool',
    resource: 'definition',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.toolDefinitionManage,
    legacy_code: 'tool.write',
    name: 'Tool Definition Manage',
    module: 'tool',
    resource: 'definition',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.toolCallExecute,
    legacy_code: 'tool.execute',
    name: 'Tool Call Execute',
    module: 'tool',
    resource: 'call',
    action: 'execute',
  },
  {
    code: PERMISSION_CODES.securityApprovalView,
    legacy_code: 'approval.read',
    name: 'Security Approval View',
    module: 'security',
    resource: 'approval',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.securityApprovalHandle,
    legacy_code: 'approval.write',
    name: 'Security Approval Handle',
    module: 'security',
    resource: 'approval',
    action: 'handle',
  },
  {
    code: PERMISSION_CODES.conversationHistoryView,
    legacy_code: 'conversation.read',
    name: 'Conversation History View',
    module: 'conversation',
    resource: 'history',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.conversationChatManage,
    legacy_code: 'conversation.write',
    name: 'Conversation Chat Manage',
    module: 'conversation',
    resource: 'chat',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.monitorLogView,
    legacy_code: 'monitor.read',
    name: 'Monitor Log View',
    module: 'monitor',
    resource: 'log',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.securityAuditView,
    legacy_code: 'audit.read',
    name: 'Security Audit View',
    module: 'security',
    resource: 'audit',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.pluginCenterView,
    legacy_code: 'plugin.read',
    name: 'Plugin Center View',
    module: 'plugin',
    resource: 'center',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.pluginCenterManage,
    legacy_code: 'plugin.write',
    name: 'Plugin Center Manage',
    module: 'plugin',
    resource: 'center',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.pluginCenterInstall,
    legacy_code: 'plugin.install',
    name: 'Plugin Center Install',
    module: 'plugin',
    resource: 'center',
    action: 'install',
  },
  {
    code: PERMISSION_CODES.pluginCenterEnable,
    legacy_code: 'plugin.enable',
    name: 'Plugin Center Enable',
    module: 'plugin',
    resource: 'center',
    action: 'enable',
  },
  {
    code: PERMISSION_CODES.pluginCenterDisable,
    legacy_code: 'plugin.disable',
    name: 'Plugin Center Disable',
    module: 'plugin',
    resource: 'center',
    action: 'disable',
  },
  {
    code: PERMISSION_CODES.pluginCenterUpgrade,
    legacy_code: 'plugin.upgrade',
    name: 'Plugin Center Upgrade',
    module: 'plugin',
    resource: 'center',
    action: 'upgrade',
  },
  {
    code: PERMISSION_CODES.pluginCenterAudit,
    legacy_code: 'plugin.audit',
    name: 'Plugin Center Audit',
    module: 'plugin',
    resource: 'center',
    action: 'audit',
  },
  {
    code: PERMISSION_CODES.channelPublishView,
    legacy_code: 'channel.read',
    name: 'Channel Publish View',
    module: 'channel',
    resource: 'publish',
    action: 'view',
  },
  {
    code: PERMISSION_CODES.channelPublishManage,
    legacy_code: 'channel.write',
    name: 'Channel Publish Manage',
    module: 'channel',
    resource: 'publish',
    action: 'manage',
  },
  {
    code: PERMISSION_CODES.channelPublishDeploy,
    legacy_code: 'channel.deploy',
    name: 'Channel Publish Deploy',
    module: 'channel',
    resource: 'publish',
    action: 'deploy',
  },
  {
    code: PERMISSION_CODES.channelPublishDisable,
    legacy_code: 'channel.disable',
    name: 'Channel Publish Disable',
    module: 'channel',
    resource: 'publish',
    action: 'disable',
  },
];

export const legacyPermissionAliases = permissionDefinitions.reduce<Record<string, PermissionCode[]>>(
  (aliases, permission) => {
    aliases[permission.legacy_code] = [...(aliases[permission.legacy_code] ?? []), permission.code];

    return aliases;
  },
  {},
);

export function expandPermissionCodes(permissions: readonly string[]) {
  const expanded = new Set<string>(permissions);

  for (const permission of permissions) {
    for (const canonicalCode of legacyPermissionAliases[permission] ?? []) {
      expanded.add(canonicalCode);
    }

    for (const definition of permissionDefinitions) {
      if (definition.code === permission) {
        expanded.add(definition.legacy_code);
      }
    }
  }

  return Array.from(expanded);
}

export function hasPermission(permissions: readonly string[], permission: string) {
  const expandedPermissions = new Set(expandPermissionCodes(permissions));
  const expandedRequired = expandPermissionCodes([permission]);

  return expandedRequired.some((requiredPermission) => expandedPermissions.has(requiredPermission));
}

export function hasAnyPermission(permissions: readonly string[], requiredPermissions: readonly string[]) {
  return requiredPermissions.some((permission) => hasPermission(permissions, permission));
}

export function hasEveryPermission(permissions: readonly string[], requiredPermissions: readonly string[]) {
  return requiredPermissions.every((permission) => hasPermission(permissions, permission));
}

export type TenantStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type DepartmentStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type RoleStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface TenantSummary {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
}

export interface DepartmentSummary {
  id: string;
  code: string;
  name: string;
  status: DepartmentStatus;
}

export type MenuType = 'DIRECTORY' | 'MENU' | 'BUTTON';

export interface AuthorizedMenuItem {
  id: string;
  parent_id: string | null;
  name: string;
  code: string;
  type: MenuType;
  path: string | null;
  icon: string | null;
  permission_code: string | null;
  sort_order: number;
  children: AuthorizedMenuItem[];
}

export interface CurrentUserResponse {
  tenant: TenantSummary;
  user: {
    id: string;
    email: string;
    name: string;
    status: UserStatus;
    roles: RoleSummary[];
    permissions: string[];
  };
  menus: AuthorizedMenuItem[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  currentUser: CurrentUserResponse;
}

export interface TenantListItem extends TenantSummary {
  created_at: string;
  updated_at: string;
}

export interface TenantDetail extends TenantListItem {}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
}

export interface UserListItem {
  id: string;
  tenant_id: string;
  department_id: string | null;
  email: string;
  name: string;
  status: UserStatus;
  department: DepartmentSummary | null;
  roles: RoleSummary[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  status?: UserStatus;
  department_id?: string | null;
  roleCodes?: string[];
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  status?: UserStatus;
  department_id?: string | null;
  roleCodes?: string[];
}

export type DepartmentStatusFilter = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface DepartmentLeaderSummary {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
}

export interface DepartmentListItem {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  code: string;
  description: string | null;
  leader: DepartmentLeaderSummary | null;
  sort_order: number;
  status: DepartmentStatus;
  level: number;
  child_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentTreeItem extends DepartmentListItem {
  children: DepartmentTreeItem[];
}

export interface DepartmentDetail extends DepartmentListItem {
  children: DepartmentListItem[];
  members: UserListItem[];
}

export interface DepartmentOverview {
  total: number;
  active_count: number;
  disabled_count: number;
  root_count: number;
  member_count: number;
}

export interface CreateDepartmentInput {
  parent_id?: string | null;
  name: string;
  code: string;
  description?: string | null;
  leader_user_id?: string | null;
  sort_order?: number;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentInput {
  parent_id?: string | null;
  name?: string;
  description?: string | null;
  leader_user_id?: string | null;
  sort_order?: number;
  status?: DepartmentStatus;
}

export interface RoleListItem extends RoleSummary {
  tenant_id: string;
  description: string | null;
  status: RoleStatus;
  is_system: boolean;
  permission_count: number;
  menu_count: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionCatalogItem {
  id: string;
  code: string;
  name: string;
  module: string;
  resource: string;
  action: string;
}

export interface PermissionCatalogResourceGroup {
  resource: string;
  resource_label: string;
  permissions: PermissionCatalogItem[];
}

export interface PermissionCatalogGroup {
  module: string;
  module_label: string;
  resources: PermissionCatalogResourceGroup[];
}

export interface RoleUserReference {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  department: DepartmentSummary | null;
}

export interface RoleMenuReference {
  id: string;
  code: string;
  name: string;
  type: MenuType;
  path: string | null;
  permission_code: string | null;
}

export interface RoleDetail extends RoleListItem {
  permissions: PermissionCatalogItem[];
  menus: RoleMenuReference[];
  users: RoleUserReference[];
}

export interface RoleOverview {
  total: number;
  active_count: number;
  disabled_count: number;
  system_count: number;
  custom_count: number;
  user_binding_count: number;
  permission_binding_count: number;
  menu_binding_count: number;
}

export type DataScopeType = 'ALL' | 'TENANT' | 'DEPT' | 'DEPT_AND_CHILD' | 'SELF' | 'CUSTOM';
export type DataScopeStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type DataScopeResourceType =
  | 'AGENT'
  | 'AGENT_TEAM'
  | 'CHANNEL'
  | 'PLUGIN'
  | 'KNOWLEDGE_BASE'
  | 'DOCUMENT'
  | 'TOOL'
  | 'MODEL'
  | 'CONVERSATION'
  | 'AUDIT_LOG';

export interface DataScopeResourceDefinition {
  resource_type: DataScopeResourceType;
  name: string;
  description: string;
  permission_codes: string[];
}

export interface RoleDataScopeValue {
  department_ids: string[];
  user_ids: string[];
  resource_ids: string[];
  include_children: boolean;
}

export interface RoleDataScopeItem {
  id: string;
  tenant_id: string;
  role_id: string;
  role_code: string;
  role_name: string;
  resource_type: DataScopeResourceType;
  resource_name: string;
  scope_type: DataScopeType;
  scope_label: string;
  scope_value: RoleDataScopeValue;
  status: DataScopeStatus;
  department_count: number;
  user_count: number;
  resource_count: number;
  updated_at: string;
}

export interface RoleDataScopeDetail {
  role: RoleListItem;
  scopes: RoleDataScopeItem[];
}

export interface DataScopeOverview {
  role_count: number;
  configured_role_count: number;
  scope_count: number;
  custom_scope_count: number;
  all_scope_count: number;
  tenant_scope_count: number;
  self_scope_count: number;
  dept_scope_count: number;
  resource_types: DataScopeResourceDefinition[];
}

export interface ReplaceRoleDataScopeInput {
  scopes: Array<{
    resource_type: DataScopeResourceType;
    scope_type: DataScopeType;
    scope_value?: Partial<RoleDataScopeValue> | null;
    status?: Exclude<DataScopeStatus, 'DELETED'>;
  }>;
}

export interface DataScopePreviewInput {
  role_id: string;
  resource_type: DataScopeResourceType;
  scope_type: DataScopeType;
  scope_value?: Partial<RoleDataScopeValue> | null;
}

export interface DataScopePreviewResult {
  role_id: string;
  role_name: string;
  resource_type: DataScopeResourceType;
  scope_type: DataScopeType;
  scope_label: string;
  departments: DepartmentSummary[];
  users: UserListItem[];
  department_count: number;
  user_count: number;
  note: string;
}

export type ResourceAclResourceType = DataScopeResourceType;
export type ResourceAclSubjectType = 'USER' | 'ROLE' | 'DEPARTMENT' | 'TENANT';
export type ResourceAclEffect = 'ALLOW' | 'DENY';
export type ResourceAclStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface ResourceAclResourceDefinition extends DataScopeResourceDefinition {}

export interface ResourceAclSubjectSummary {
  id: string;
  type: ResourceAclSubjectType;
  name: string;
  code: string | null;
  description: string | null;
}

export interface ResourceAclResourceSummary {
  id: string;
  type: ResourceAclResourceType;
  name: string;
  code: string | null;
  description: string | null;
  status: string | null;
}

export interface ResourceAclItem {
  id: string;
  tenant_id: string;
  resource_type: ResourceAclResourceType;
  resource_id: string;
  resource: ResourceAclResourceSummary;
  subject_type: ResourceAclSubjectType;
  subject_id: string;
  subject: ResourceAclSubjectSummary;
  permission_code: string;
  effect: ResourceAclEffect;
  status: ResourceAclStatus;
  condition_count: number;
  conditions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceAclOverview {
  total: number;
  active_count: number;
  disabled_count: number;
  allow_count: number;
  deny_count: number;
  resource_types: ResourceAclResourceDefinition[];
  subject_counts: Array<{
    subject_type: ResourceAclSubjectType;
    count: number;
  }>;
  resource_counts: Array<{
    resource_type: ResourceAclResourceType;
    count: number;
  }>;
}

export interface ResourceAclOptionResult {
  resources: ResourceAclResourceSummary[];
  subjects: ResourceAclSubjectSummary[];
  permissions: string[];
}

export interface CreateResourceAclInput {
  resource_type: ResourceAclResourceType;
  resource_id: string;
  subject_type: ResourceAclSubjectType;
  subject_id: string;
  permission_code: string;
  effect?: ResourceAclEffect;
  status?: Exclude<ResourceAclStatus, 'DELETED'>;
  conditions?: Record<string, unknown> | null;
}

export interface UpdateResourceAclInput {
  permission_code?: string;
  effect?: ResourceAclEffect;
  status?: Exclude<ResourceAclStatus, 'DELETED'>;
  conditions?: Record<string, unknown> | null;
}

export interface ResourceAclCheckInput {
  resource_type: ResourceAclResourceType;
  resource_id: string;
  subject_type: ResourceAclSubjectType;
  subject_id: string;
  permission_code: string;
}

export interface ResourceAclCheckResult {
  decision: 'ALLOW' | 'DENY' | 'NO_MATCH';
  matched_acl: ResourceAclItem | null;
  checked_count: number;
  reason: string;
}

export type PluginSourceType = 'MARKET' | 'CUSTOM';
export type PluginInstallationStatus = 'PENDING_REVIEW' | 'INSTALLED' | 'ACTIVE' | 'DISABLED' | 'UPGRADING' | 'FAILED' | 'ARCHIVED';
export type PluginRuntimeStatus = 'RUNNING' | 'STOPPED' | 'UPGRADING' | 'BLOCKED' | 'ERROR';
export type PluginRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PluginHookStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface PluginMarketItem {
  plugin_id: string;
  code: string;
  name: string;
  provider: string;
  description: string | null;
  latest_version: string;
  installed: boolean;
  install_status: PluginInstallationStatus | null;
  risk_level: PluginRiskLevel;
  permission_codes: string[];
  menu_count: number;
  hook_count: number;
  updated_at: string;
}

export interface PluginInstallationItem {
  id: string;
  tenant_id: string;
  plugin_id: string;
  code: string;
  name: string;
  provider: string;
  description: string | null;
  source_type: PluginSourceType;
  installed_version: string;
  latest_version: string;
  status: PluginInstallationStatus;
  runtime_status: PluginRuntimeStatus;
  risk_level: PluginRiskLevel;
  owner_id: string | null;
  menu_count: number;
  hook_count: number;
  permission_count: number;
  installed_at: string | null;
  last_upgraded_at: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  updated_at: string;
}

export interface PluginMenuBindingItem {
  id: string;
  plugin_id: string;
  menu_code: string;
  menu_name: string;
  path: string | null;
  component: string | null;
  icon: string | null;
  sort_order: number;
  visible: boolean;
  enabled: boolean;
  status: 'ACTIVE' | 'DISABLED' | 'DELETED';
  created_at: string;
  updated_at: string;
}

export interface PluginHookItem {
  id: string;
  plugin_id: string;
  code: string;
  name: string;
  hook_type: string;
  target: string;
  method: string;
  status: PluginHookStatus;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PluginVersionItem {
  id: string;
  plugin_id: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  change_note: string | null;
  published_at: string | null;
  created_at: string;
}

export interface PluginAuditLogItem {
  id: string;
  plugin_id: string;
  action: string;
  title: string;
  summary: string;
  status: string;
  risk_level: PluginRiskLevel;
  request_id: string | null;
  trace_id: string | null;
  created_at: string;
}

export interface PluginSecurityPreview {
  summary: string;
  risks: string[];
  notes: string[];
}

export interface PluginInstallationDetail extends PluginInstallationItem {
  manifest_json: Record<string, unknown> | null;
  config_json: Record<string, unknown> | null;
  permission_preview: string[];
  menu_bindings: PluginMenuBindingItem[];
  hooks: PluginHookItem[];
  versions: PluginVersionItem[];
  audit_logs: PluginAuditLogItem[];
  security_preview: PluginSecurityPreview;
}

export interface PluginOverview {
  total: number;
  active_count: number;
  disabled_count: number;
  pending_review_count: number;
  upgrade_available_count: number;
  hook_count: number;
  menu_count: number;
  audit_count: number;
}

export interface CreatePluginInstallationInput {
  code: string;
  name?: string;
  provider?: string;
  description?: string | null;
  latest_version?: string;
  source_type?: PluginSourceType;
  manifest_json?: Record<string, unknown> | null;
  config_json?: Record<string, unknown> | null;
  permission_preview?: string[];
  risk_level?: PluginRiskLevel;
}

export interface UpdatePluginInstallationInput {
  name?: string;
  description?: string | null;
  status?: PluginInstallationStatus;
  runtime_status?: PluginRuntimeStatus;
  config_json?: Record<string, unknown> | null;
  latest_version?: string;
  risk_level?: PluginRiskLevel;
}

export interface UpdatePluginHookInput {
  status?: PluginHookStatus;
  config_json?: Record<string, unknown> | null;
}

export interface UpdatePluginMenuBindingInput {
  enabled?: boolean;
  visible?: boolean;
  sort_order?: number;
}

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string | null;
  status?: RoleStatus;
  permission_ids?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  status?: RoleStatus;
}

export interface UpdateRolePermissionsInput {
  permission_ids: string[];
}

export type MenuStatusFilter = 'ENABLED' | 'DISABLED';

export interface MenuListItem {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  code: string;
  type: MenuType;
  path: string | null;
  component: string | null;
  icon: string | null;
  permission_code: string | null;
  sort_order: number;
  level: number;
  visible: boolean;
  enabled: boolean;
  child_count: number;
  role_count: number;
  created_at: string;
  updated_at: string;
}

export interface MenuTreeItem extends MenuListItem {
  children: MenuTreeItem[];
}

export interface MenuDetail extends MenuListItem {
  children: MenuListItem[];
  role_bindings: Array<{
    role_id: string;
    role_code: string;
    role_name: string;
  }>;
}

export interface MenuOverview {
  total: number;
  directory_count: number;
  menu_count: number;
  button_count: number;
  hidden_count: number;
  disabled_count: number;
}

export interface CreateMenuInput {
  parent_id?: string | null;
  name: string;
  code: string;
  type: MenuType;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  permission_code?: string | null;
  sort_order?: number;
  visible?: boolean;
  enabled?: boolean;
}

export interface UpdateMenuInput {
  parent_id?: string | null;
  name?: string;
  type?: MenuType;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  permission_code?: string | null;
  sort_order?: number;
  visible?: boolean;
  enabled?: boolean;
}

export interface MenuRoleBindingItem {
  role_id: string;
  role_code: string;
  role_name: string;
  menu_ids: string[];
}

export interface UpdateMenuRoleBindingInput {
  menu_ids: string[];
}

export interface TenantApiKeyListItem {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  masked_key: string;
  status: TenantStatus;
  scopes: string[];
  allowed_agent_ids: string[];
  ip_allowlist: string[];
  rate_limit_per_minute: number;
  daily_quota: number | null;
  used_count_today: number;
  quota_reset_date: string | null;
  allow_stream: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  webhook_events: ExternalWebhookEventType[];
  webhook_secret_configured: boolean;
  webhook_last_status: ExternalWebhookDeliveryStatus | null;
  webhook_last_error: string | null;
  webhook_last_sent_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface CreateTenantApiKeyInput {
  name: string;
  scopes?: string[];
  allowed_agent_ids?: string[];
  ip_allowlist?: string[];
  rate_limit_per_minute?: number;
  daily_quota?: number | null;
  allow_stream?: boolean;
  webhook_enabled?: boolean;
  webhook_url?: string | null;
  webhook_events?: ExternalWebhookEventType[];
  webhook_secret?: string | null;
  expires_at?: string | null;
}

export interface CreateTenantApiKeyResult {
  api_key: string;
  item: TenantApiKeyListItem;
}

export interface ExternalAgentChatInput {
  message: string;
  title?: string | null;
}

export interface ExternalAgentChatResponse {
  conversation_id: string;
  agent_id: string;
  channel_id?: string | null;
  agent_name: string;
  agent_code: string;
  message_id: string | null;
  run_id: string | null;
  trace_id: string | null;
  status: ConversationRunStatus | null;
  answer: string;
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    latency_ms: number;
    cost_total: number | null;
  } | null;
  created_at: string | null;
}

export type ExternalWebhookEventType = 'agent.run.completed';
export type ExternalWebhookDeliveryStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface ExternalAgentRunCompletedWebhookPayload {
  id: string;
  event: ExternalWebhookEventType;
  created_at: string;
  tenant_id: string;
  api_key_id: string;
  api_key_prefix: string;
  agent_id: string;
  conversation_id: string;
  run_id: string | null;
  trace_id: string | null;
  status: ExternalAgentChatResponse['status'];
  result: ExternalAgentChatResponse;
}

export type WebhookDeliveryStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';

export interface WebhookDeliveryListItem {
  id: string;
  delivery_id: string;
  parent_delivery_id: string | null;
  api_key_id: string;
  api_key_name: string;
  api_key_prefix: string;
  event: ExternalWebhookEventType;
  target_url: string;
  status: WebhookDeliveryStatus;
  response_status: number | null;
  latency_ms: number | null;
  retry_count: number;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface WebhookDeliveryDetail extends WebhookDeliveryListItem {
  payload: ExternalAgentRunCompletedWebhookPayload;
  request_headers: Record<string, string>;
  response_body: string | null;
  updated_at: string;
}

export interface ListWebhookDeliveriesResult {
  items: WebhookDeliveryListItem[];
  total: number;
}

export interface RetryWebhookDeliveryResult {
  item: WebhookDeliveryDetail;
}

export interface ExternalAgentStreamStartEvent {
  type: 'start';
  trace_id?: string | null;
  request_model: string;
  steps: ConversationRunStepItem[];
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
}

export interface ExternalAgentStreamDeltaEvent {
  type: 'delta';
  delta: string;
}

export interface ExternalAgentStreamDoneEvent {
  type: 'done';
  result: ExternalAgentChatResponse;
}

export interface ExternalAgentStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ExternalAgentStreamEvent =
  | ExternalAgentStreamStartEvent
  | ExternalAgentStreamDeltaEvent
  | ExternalAgentStreamDoneEvent
  | ExternalAgentStreamErrorEvent;

export type ExternalApiObservabilityWindow = '24h' | '7d';
export type ExternalApiCallStatus = 'SUCCESS' | 'DEGRADED' | 'FAILED';
export type ExternalApiQuotaRiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNLIMITED';

export interface ExternalApiObservabilitySummary {
  total_requests: number;
  success_requests: number;
  denied_requests: number;
  success_rate: number;
  total_tokens: number;
  total_cost: number;
  average_latency_ms: number;
  active_key_count: number;
  risky_key_count: number;
}

export interface ExternalApiCallLogItem {
  event_id: string;
  api_key_id: string | null;
  api_key_name: string | null;
  masked_key: string | null;
  agent_id: string | null;
  agent_name: string | null;
  status: ExternalApiCallStatus;
  status_code: number;
  trace_id: string | null;
  request_id: string;
  latency_ms: number | null;
  total_tokens: number;
  cost_total: number;
  ip: string | null;
  path: string;
  error_message: string | null;
  occurred_at: string;
}

export interface ExternalApiQuotaWatchItem {
  api_key_id: string;
  api_key_name: string;
  masked_key: string;
  status: TenantStatus;
  used_count_today: number;
  daily_quota: number | null;
  remaining_today: number | null;
  usage_rate: number | null;
  risk_level: ExternalApiQuotaRiskLevel;
  last_used_at: string | null;
}

export interface ExternalApiSecurityDenialItem {
  event_id: string;
  source: string | null;
  reason: string;
  api_key_id: string | null;
  api_key_prefix: string | null;
  agent_id: string | null;
  trace_id: string | null;
  request_id: string;
  path: string;
  status_code: number;
  occurred_at: string;
}

export interface ExternalApiObservabilityOverview {
  generated_at: string;
  window: ExternalApiObservabilityWindow;
  summary: ExternalApiObservabilitySummary;
  recent_calls: ExternalApiCallLogItem[];
  quota_watch: ExternalApiQuotaWatchItem[];
  security_denials: ExternalApiSecurityDenialItem[];
}

export type StorageConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE';

export interface StorageSettings {
  provider: 'MINIO';
  endpoint: string;
  console_url: string;
  bucket: string;
  region: string;
  access_key_masked: string;
  force_path_style: boolean;
  status: StorageConnectionStatus;
  bucket_exists: boolean;
  last_checked_at: string;
  error_message: string | null;
}

export interface StorageSummary {
  object_count: number;
  total_size_bytes: number;
  bucket_exists: boolean;
  status: StorageConnectionStatus;
}

export interface StorageObjectItem {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}

export interface StorageObjectListResult {
  summary: StorageSummary;
  items: StorageObjectItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface StorageObjectUploadInput {
  file_name: string;
  folder?: string | null;
  content_type?: string | null;
  content_base64: string;
}

export interface StorageObjectUploadResult {
  item: StorageObjectItem;
}

export interface StorageEnsureBucketResult {
  bucket: string;
  bucket_created: boolean;
  bucket_exists: boolean;
  status: StorageConnectionStatus;
}

export interface StorageDownloadUrlResult {
  url: string;
  expires_in: number;
}

export type SystemSettingCategory =
  | 'GENERAL'
  | 'SECURITY'
  | 'RUNTIME'
  | 'OBSERVABILITY'
  | 'NOTIFICATION'
  | 'RETENTION'
  | 'INTEGRATION';
export type SystemSettingValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SELECT';
export type SystemSettingStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface SystemSettingUpdaterSummary {
  id: string;
  name: string;
  email: string;
}

export interface SystemSettingOption {
  label: string;
  value: string | number | boolean;
}

export interface SystemSettingItem {
  id: string;
  tenant_id: string;
  category: SystemSettingCategory;
  key: string;
  name: string;
  description: string | null;
  value: unknown;
  default_value: unknown;
  value_type: SystemSettingValueType;
  options: SystemSettingOption[];
  is_secret: boolean;
  is_system: boolean;
  status: SystemSettingStatus;
  sort_order: number;
  updated_at: string;
  updated_by: SystemSettingUpdaterSummary | null;
}

export interface SystemSettingCategorySummary {
  category: SystemSettingCategory;
  label: string;
  total: number;
  active: number;
  changed: number;
}

export interface SystemSettingOverview {
  total: number;
  active: number;
  disabled: number;
  secret: number;
  changed_from_default: number;
  category_count: number;
  last_updated_at: string | null;
  categories: SystemSettingCategorySummary[];
}

export interface UpdateSystemSettingInput {
  value?: unknown;
  status?: Extract<SystemSettingStatus, 'ACTIVE' | 'DISABLED'>;
}

export type NotificationPolicyImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NotificationPolicyChangePreview {
  setting_id: string;
  key: string;
  name: string;
  current_value: unknown;
  next_value: unknown;
  current_status: SystemSettingStatus;
  next_status: Extract<SystemSettingStatus, 'ACTIVE' | 'DISABLED'>;
  changed_fields: string[];
  impact_level: NotificationPolicyImpactLevel;
  impact_summary: string;
  warnings: string[];
  task_snapshot: {
    pending_auto_notify_count: number;
    auto_notified_count: number;
    pending_auto_retry_count: number;
    failed_notification_count: number;
    partial_notification_count: number;
    retried_notification_count: number;
    policy_source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
  };
  recent_change_count: number;
}

export interface NotificationPolicyAuditItem {
  id: string;
  setting_id: string | null;
  setting_key: string | null;
  action: string;
  method: string;
  path: string;
  status_code: number;
  request_id: string;
  user_name: string | null;
  user_email: string | null;
  value: unknown;
  status: string | null;
  occurred_at: string;
}

export interface NotificationPolicyAuditOverview {
  generated_at: string;
  summary: {
    change_count: number;
    success_count: number;
    failed_count: number;
    latest_change_at: string | null;
  };
  recent_changes: NotificationPolicyAuditItem[];
}

export type SystemSettingSnapshotAction = 'UPDATE' | 'RESET' | 'ROLLBACK';
export type SystemSettingSnapshotApprovalStatus = 'NOT_REQUIRED' | 'RESERVED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalAuditSourceType = 'TOOL_APPROVAL' | 'NOTIFICATION_POLICY' | 'APPROVAL_AUDIT_ARCHIVE';
export type ApprovalAuditEventType =
  | 'REQUEST_CREATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'EXECUTION_FAILED'
  | 'ARCHIVED'
  | 'DOWNLOAD_URL_CREATED'
  | 'DELETE_REQUESTED'
  | 'DELETE_APPLIED';
export type ApprovalAuditEventStatus = 'INFO' | 'SUCCESS' | 'FAILED' | 'WARNING';

export interface ApprovalAuditActorSummary {
  id: string;
  name: string;
  email: string;
}

export interface ApprovalAuditEventItem {
  id: string;
  tenant_id: string;
  source_type: ApprovalAuditSourceType;
  source_id: string;
  event_type: ApprovalAuditEventType;
  event_status: ApprovalAuditEventStatus;
  title: string;
  note: string | null;
  request_id: string | null;
  trace_id: string | null;
  metadata: Record<string, unknown> | null;
  actor: ApprovalAuditActorSummary | null;
  occurred_at: string;
}

export type ApprovalAuditWindow = '24h' | '7d' | '30d';

export interface ApprovalAuditOverview {
  generated_at: string;
  window: ApprovalAuditWindow;
  summary: {
    total_count: number;
    success_count: number;
    failed_count: number;
    warning_count: number;
    info_count: number;
    trace_count: number;
    latest_event_at: string | null;
  };
  source_rankings: Array<{
    source_type: ApprovalAuditSourceType;
    event_count: number;
    failed_count: number;
  }>;
  event_type_rankings: Array<{
    event_type: ApprovalAuditEventType;
    event_count: number;
    failed_count: number;
  }>;
  recent_events: ApprovalAuditEventItem[];
}

export interface ApprovalAuditArchiveItem {
  id: string;
  key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
  download_expires_in: number;
}

export interface ApprovalAuditArchiveListResult {
  items: ApprovalAuditArchiveItem[];
  total: number;
  summary: {
    archive_count: number;
    total_size_bytes: number;
  };
}

export interface CreateApprovalAuditArchiveResult {
  item: ApprovalAuditArchiveItem;
}

export type ApprovalAuditArchiveApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface ApprovalAuditArchiveApprovalActor {
  id: string;
  name: string;
  email: string;
}

export interface ApprovalAuditArchiveApprovalItem {
  id: string;
  archive_id: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
  status: ApprovalAuditArchiveApprovalStatus;
  reason: string | null;
  requested_by: ApprovalAuditArchiveApprovalActor | null;
  reviewed_by: ApprovalAuditArchiveApprovalActor | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface ApprovalAuditArchiveApprovalDetail extends ApprovalAuditArchiveApprovalItem {
  audit_timeline: ApprovalAuditEventItem[];
}

export interface ApprovalAuditArchiveApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  applied_count: number;
}

export interface ListApprovalAuditEventsQuery {
  page?: number;
  page_size?: number;
  window?: ApprovalAuditWindow;
  keyword?: string;
  source_type?: ApprovalAuditSourceType | '';
  event_type?: ApprovalAuditEventType | '';
  event_status?: ApprovalAuditEventStatus | '';
  trace_only?: boolean;
}

export interface SystemSettingSnapshotItem {
  id: string;
  setting_id: string;
  setting_key: string;
  setting_name: string;
  version: number;
  action: SystemSettingSnapshotAction;
  previous_value: unknown;
  next_value: unknown;
  previous_status: SystemSettingStatus;
  next_status: SystemSettingStatus;
  approval_status: SystemSettingSnapshotApprovalStatus;
  approval_request_id: string | null;
  rollback_from_snapshot_id: string | null;
  rollback_count: number;
  impact_level: NotificationPolicyImpactLevel | null;
  impact_summary: string | null;
  created_by: SystemSettingUpdaterSummary | null;
  created_at: string;
  audit_timeline: ApprovalAuditEventItem[];
}

export interface NotificationPolicySnapshotOverview {
  generated_at: string;
  summary: {
    snapshot_count: number;
    rollback_count: number;
    approval_reserved_count: number;
    pending_approval_count: number;
    approved_count: number;
    rejected_count: number;
    latest_snapshot_at: string | null;
  };
  recent_snapshots: SystemSettingSnapshotItem[];
}

export interface NotificationPolicyApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  high_impact_pending_count: number;
}

export type SecurityApprovalWorkbenchType =
  | 'TOOL_CALL'
  | 'NOTIFICATION_POLICY'
  | 'APPROVAL_AUDIT_ARCHIVE_DELETE'
  | 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE'
  | 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE'
  | 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE'
  | 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';

export type SecurityApprovalWorkbenchStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export type SecurityApprovalWorkbenchRiskDomain = 'TOOL' | 'POLICY' | 'AUDIT_ARCHIVE' | 'OPERATION_ALERT';

export type SecurityApprovalWorkbenchRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityApprovalWorkbenchDecision = 'APPROVE' | 'REJECT';

export interface SecurityApprovalWorkbenchActor {
  id: string;
  name: string;
  email: string;
}

export interface SecurityApprovalWorkbenchTimelineItem {
  id: string;
  type: string;
  title: string;
  status: string;
  note: string | null;
  actor: SecurityApprovalWorkbenchActor | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
}

export interface SecurityApprovalWorkbenchItem {
  id: string;
  source_id: string;
  type: SecurityApprovalWorkbenchType;
  source_module: string;
  title: string;
  description: string;
  status: SecurityApprovalWorkbenchStatus;
  risk_domain: SecurityApprovalWorkbenchRiskDomain;
  risk_level: SecurityApprovalWorkbenchRiskLevel;
  target_id: string | null;
  target_label: string;
  reason: string | null;
  requester: SecurityApprovalWorkbenchActor | null;
  reviewer: SecurityApprovalWorkbenchActor | null;
  requested_at: string;
  reviewed_at: string | null;
  request_id: string | null;
  trace_id: string | null;
}

export interface SecurityApprovalWorkbenchDetail extends SecurityApprovalWorkbenchItem {
  metadata: Record<string, unknown>;
  timeline: SecurityApprovalWorkbenchTimelineItem[];
}

export interface SecurityApprovalWorkbenchOverview {
  generated_at: string;
  summary: {
    total_count: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    applied_count: number;
    high_risk_pending_count: number;
    archive_delete_pending_count: number;
    oldest_pending_at: string | null;
  };
  by_type: Array<{
    type: SecurityApprovalWorkbenchType;
    total_count: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    applied_count: number;
  }>;
  by_risk_domain: Array<{
    risk_domain: SecurityApprovalWorkbenchRiskDomain;
    total_count: number;
    pending_count: number;
    high_risk_pending_count: number;
  }>;
  recent_pending: SecurityApprovalWorkbenchItem[];
}

export interface ListSecurityApprovalWorkbenchQuery {
  page?: number;
  page_size?: number;
  keyword?: string;
  type?: SecurityApprovalWorkbenchType | '';
  status?: SecurityApprovalWorkbenchStatus | '';
  risk_domain?: SecurityApprovalWorkbenchRiskDomain | '';
}

export interface ReviewSecurityApprovalWorkbenchInput {
  decision: SecurityApprovalWorkbenchDecision;
  decision_note?: string | null;
}

export interface ListNotificationPolicyApprovalsQuery {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: SystemSettingSnapshotApprovalStatus | '';
}

export interface ReviewNotificationPolicyApprovalInput {
  decision_note?: string | null;
}

export interface RollbackSystemSettingSnapshotInput {
  note?: string | null;
}

export type SecurityPolicyStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type SecurityPolicyEffect = 'ALLOW' | 'DENY';
export type SecurityPolicyDecision = 'ALLOW' | 'DENY' | 'NO_MATCH';
export type SecurityPolicyOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'exists';

export interface SecurityPolicyCondition {
  path: string;
  operator: SecurityPolicyOperator;
  value?: unknown;
  label?: string;
}

export interface SecurityPolicyActorSummary {
  id: string;
  name: string;
  email: string;
}

export interface SecurityPolicyListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
  effect: SecurityPolicyEffect;
  resource_type: string;
  action: string;
  priority: number;
  status: SecurityPolicyStatus;
  condition_count: number;
  evaluation_count: number;
  last_evaluated_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: SecurityPolicyActorSummary | null;
  updated_by: SecurityPolicyActorSummary | null;
}

export interface SecurityPolicyDetail extends SecurityPolicyListItem {
  conditions: unknown;
}

export interface SecurityPolicyEvaluationItem {
  id: string;
  tenant_id: string;
  request_id: string;
  trace_id: string | null;
  subject: Record<string, unknown>;
  resource: Record<string, unknown>;
  action: string;
  decision: SecurityPolicyDecision;
  matched_policy_id: string | null;
  matched_policy_code: string | null;
  matched_policy_name: string | null;
  reason: string;
  context: Record<string, unknown> | null;
  created_at: string;
  created_by: SecurityPolicyActorSummary | null;
}

export interface SecurityPolicyOverview {
  total: number;
  active: number;
  disabled: number;
  deny: number;
  allow: number;
  resource_types: Array<{
    resource_type: string;
    policy_count: number;
  }>;
  recent_evaluations: SecurityPolicyEvaluationItem[];
  decisions: Array<{
    decision: SecurityPolicyDecision;
    evaluation_count: number;
  }>;
}

export type SecurityCenterRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type SecurityCenterModuleKey =
  | 'security_policies'
  | 'data_scopes'
  | 'resource_acls'
  | 'approvals'
  | 'audit'
  | 'monitor';

export interface SecurityCenterMetric {
  label: string;
  value: string;
  helper: string;
}

export interface SecurityCenterModuleSummary {
  key: SecurityCenterModuleKey;
  title: string;
  description: string;
  href: string;
  permission: PermissionCode;
  status: HealthStatus | 'planned';
  primary_metric: SecurityCenterMetric;
  secondary_metric: SecurityCenterMetric;
  action_label: string;
}

export interface SecurityCenterRiskSignal {
  id: string;
  title: string;
  description: string;
  severity: SecurityCenterRiskLevel;
  href: string;
  metric: string;
}

export interface SecurityCenterOperationalAlert extends SecurityCenterRiskSignal {
  action_label: string;
  status: SecurityOperationAlertStatus;
  last_action: SecurityOperationAlertAction | null;
  last_note: string | null;
  updated_at: string | null;
  triggered_at: string;
}

export type SecurityOperationAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'CLOSED';
export type SecurityOperationAlertAction = 'ACKNOWLEDGE' | 'ESCALATE' | 'CLOSE';
export type SecurityOperationAlertNotificationChannel = 'IN_APP' | 'WEBHOOK';
export type SecurityOperationAlertNotificationStatus = 'SENT' | 'PARTIAL' | 'SKIPPED' | 'FAILED';

export interface UpdateSecurityOperationAlertInput {
  action: SecurityOperationAlertAction;
  note?: string | null;
}

export interface SecurityOperationAlertActionResult {
  alert_id: string;
  status: SecurityOperationAlertStatus;
  last_action: SecurityOperationAlertAction;
  last_note: string | null;
  updated_at: string;
}

export interface NotifySecurityOperationAlertInput {
  channels?: SecurityOperationAlertNotificationChannel[];
  note?: string | null;
}

export interface SecurityOperationAlertNotificationResult {
  alert_id: string;
  status: SecurityOperationAlertNotificationStatus;
  channels: SecurityOperationAlertNotificationChannel[];
  targets: string[];
  delivery_event_id: string | null;
  webhook_status: number | null;
  message: string;
  delivered_at: string;
}

export interface SecurityOperationAlertNotificationItem extends SecurityOperationAlertNotificationResult {
  notification_event_id: string;
  alert_category: string | null;
  webhook_error: string | null;
  retry_count: number;
  retried_from_event_id: string | null;
  request_id: string | null;
  trace_id: string | null;
  created_at: string;
}

export interface SecurityOperationAlertNotificationOverview {
  generated_at: string;
  summary: {
    total_count: number;
    sent_count: number;
    partial_count: number;
    skipped_count: number;
    failed_count: number;
    retryable_count: number;
  };
  items: SecurityOperationAlertNotificationItem[];
}

export interface SecurityOperationAlertNotificationArchiveItem {
  id: string;
  key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
  download_expires_in: number;
}

export interface SecurityOperationAlertNotificationArchiveListResult {
  items: SecurityOperationAlertNotificationArchiveItem[];
  total: number;
  summary: {
    archive_count: number;
    total_size_bytes: number;
  };
}

export interface CreateSecurityOperationAlertNotificationArchiveResult {
  item: SecurityOperationAlertNotificationArchiveItem;
}

export type SecurityOperationAlertNotificationArchiveApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface SecurityOperationAlertNotificationArchiveApprovalActor {
  id: string;
  name: string;
  email: string;
}

export interface SecurityOperationAlertNotificationArchiveApprovalItem {
  id: string;
  archive_id: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
  status: SecurityOperationAlertNotificationArchiveApprovalStatus;
  reason: string | null;
  requested_by: SecurityOperationAlertNotificationArchiveApprovalActor | null;
  reviewed_by: SecurityOperationAlertNotificationArchiveApprovalActor | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface SecurityOperationAlertNotificationArchiveApprovalTimelineItem {
  event_id: string;
  source_id: string;
  event_type: string;
  status: string;
  title: string;
  note: string | null;
  actor: SecurityOperationAlertNotificationArchiveApprovalActor | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
}

export interface SecurityOperationAlertNotificationArchiveApprovalDetail
  extends SecurityOperationAlertNotificationArchiveApprovalItem {
  audit_timeline: SecurityOperationAlertNotificationArchiveApprovalTimelineItem[];
}

export interface SecurityOperationAlertNotificationArchiveApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  applied_count: number;
}

export interface ListSecurityOperationAlertNotificationsParams {
  status?: SecurityOperationAlertNotificationStatus | '';
  alert_category?: string;
  keyword?: string;
}

export type SecurityOperationAlertNotificationTaskName = 'AUTO_NOTIFY' | 'AUTO_RETRY';

export interface SecurityOperationAlertNotificationTaskRunResult {
  task: SecurityOperationAlertNotificationTaskName;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  notified_count: number;
  retried_count: number;
  sla_dead_letter_notify_count: number;
  agent_team_report_archive_delete_notify_count: number;
  recovery_archive_delete_notify_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
}

export interface SecurityOperationAlertNotificationTaskOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  policy: {
    auto_notify_enabled: boolean;
    auto_notify_interval_ms: number;
    auto_notify_batch_size: number;
    auto_retry_enabled: boolean;
    retry_interval_ms: number;
    retry_batch_size: number;
    max_retry_count: number;
    retry_backoff_seconds: number;
    lookback_hours: number;
    source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
  };
  summary: {
    pending_auto_notify_count: number;
    auto_notified_count: number;
    oldest_auto_notify_at: string | null;
    pending_auto_retry_count: number;
    failed_notification_count: number;
    partial_notification_count: number;
    retried_notification_count: number;
    oldest_retryable_at: string | null;
  };
  last_auto_notify_result: SecurityOperationAlertNotificationTaskRunResult | null;
  last_auto_retry_result: SecurityOperationAlertNotificationTaskRunResult | null;
}

export type SecurityOperationAlertNotificationTaskTriggerType = 'MANUAL' | 'SCHEDULED';

export interface SecurityOperationAlertNotificationTaskRunItem extends SecurityOperationAlertNotificationTaskRunResult {
  event_id: string;
  event_type: string;
  trigger_type: SecurityOperationAlertNotificationTaskTriggerType;
  request_id: string | null;
  trace_id: string | null;
  summary: string | null;
  duration_ms: number;
  created_at: string;
}

export interface SecurityOperationAlertNotificationTaskRunOverview {
  generated_at: string;
  summary: {
    total_count: number;
    success_count: number;
    failed_count: number;
    skipped_count: number;
    manual_count: number;
    scheduled_count: number;
    auto_notify_count: number;
    auto_retry_count: number;
    sla_dead_letter_notify_count: number;
    agent_team_report_archive_delete_notify_count: number;
    recovery_archive_delete_notify_count: number;
    latest_finished_at: string | null;
  };
  items: SecurityOperationAlertNotificationTaskRunItem[];
}

export type SecurityOperationAlertNotificationTaskRecoveryReason =
  | 'WEBHOOK_NOT_CONFIGURED'
  | 'WEBHOOK_DELIVERY_FAILED'
  | 'AUTO_NOTIFY_DISABLED'
  | 'AUTO_RETRY_DISABLED'
  | 'CONSECUTIVE_FAILURES'
  | 'HIGH_FAILURE_RATE';

export type SecurityOperationAlertNotificationTaskRecoveryStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IGNORED'
  | 'RESOLVED';

export type SecurityOperationAlertNotificationTaskRecoveryAction = 'ACKNOWLEDGE' | 'IGNORE' | 'RESOLVE';

export type SecurityOperationAlertNotificationTaskRecoveryFailureSource =
  | 'SLA_DEAD_LETTER_ARCHIVE_DELETE'
  | 'AGENT_TEAM_REPORT_ARCHIVE_DELETE'
  | 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE'
  | 'MIXED'
  | 'UNKNOWN';

export interface SecurityOperationAlertNotificationTaskRecoverySuggestion {
  id: string;
  title: string;
  description: string;
  severity: SecurityCenterRiskLevel;
  reason_code: SecurityOperationAlertNotificationTaskRecoveryReason;
  failure_source: SecurityOperationAlertNotificationTaskRecoveryFailureSource;
  sla_dead_letter_failed_count: number;
  agent_team_report_archive_delete_failed_count: number;
  recovery_archive_delete_failed_count: number;
  status: SecurityOperationAlertNotificationTaskRecoveryStatus;
  last_action: SecurityOperationAlertNotificationTaskRecoveryAction | null;
  last_note: string | null;
  updated_at: string | null;
  primary_action_label: string;
  primary_action_href: string;
  secondary_action_label: string | null;
  secondary_action_href: string | null;
  evidence: string;
}

export interface SecurityOperationAlertNotificationTaskRecoveryActionInput {
  action: SecurityOperationAlertNotificationTaskRecoveryAction;
  note?: string | null;
}

export interface SecurityOperationAlertNotificationTaskRecoveryActionResult {
  suggestion_id: string;
  failure_source: SecurityOperationAlertNotificationTaskRecoveryFailureSource;
  status: SecurityOperationAlertNotificationTaskRecoveryStatus;
  last_action: SecurityOperationAlertNotificationTaskRecoveryAction;
  last_note: string | null;
  updated_at: string;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditItem {
  event_id: string;
  suggestion_id: string;
  title: string;
  severity: SecurityCenterRiskLevel;
  reason_code: SecurityOperationAlertNotificationTaskRecoveryReason;
  failure_source: SecurityOperationAlertNotificationTaskRecoveryFailureSource;
  sla_dead_letter_failed_count: number;
  agent_team_report_archive_delete_failed_count: number;
  recovery_archive_delete_failed_count: number;
  action: SecurityOperationAlertNotificationTaskRecoveryAction;
  status: SecurityOperationAlertNotificationTaskRecoveryStatus;
  note: string | null;
  evidence: string | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditOverview {
  generated_at: string;
  summary: {
    total_count: number;
    acknowledged_count: number;
    ignored_count: number;
    resolved_count: number;
    sla_dead_letter_source_count: number;
    agent_team_report_archive_delete_source_count: number;
    recovery_archive_delete_source_count: number;
    mixed_source_count: number;
    unknown_source_count: number;
    latest_action_at: string | null;
  };
  items: SecurityOperationAlertNotificationTaskRecoveryAuditItem[];
}

export interface ListSecurityOperationAlertNotificationTaskRecoveryAuditsParams {
  keyword?: string;
  action?: SecurityOperationAlertNotificationTaskRecoveryAction | '';
  status?: SecurityOperationAlertNotificationTaskRecoveryStatus | '';
  reason_code?: SecurityOperationAlertNotificationTaskRecoveryReason | '';
  failure_source?: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '';
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem {
  id: string;
  key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
  download_expires_in: number;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult {
  items: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem[];
  total: number;
  summary: {
    archive_count: number;
    total_size_bytes: number;
  };
}

export interface CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult {
  item: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem;
}

export type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED';

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalActor {
  id: string;
  name: string;
  email: string;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem {
  id: string;
  archive_id: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
  status: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalStatus;
  reason: string | null;
  requested_by: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalActor | null;
  reviewed_by: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalActor | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem {
  event_id: string;
  source_id: string;
  event_type: string;
  status: string;
  title: string;
  note: string | null;
  actor: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalActor | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail
  extends SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem {
  audit_timeline: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem[];
}

export interface SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  applied_count: number;
}

export type SecurityOperationAlertSlaStatus = 'WITHIN_SLA' | 'WARNING' | 'OVERDUE' | 'CLOSED';
export type SecurityOperationAlertSlaTaskName = 'AUTO_ESCALATE';

export interface SecurityOperationAlertSlaItem {
  alert_id: string;
  title: string;
  description: string;
  severity: SecurityCenterRiskLevel;
  href: string;
  metric: string;
  status: SecurityOperationAlertStatus;
  sla_status: SecurityOperationAlertSlaStatus;
  triggered_at: string;
  due_at: string;
  warning_at: string;
  minutes_remaining: number;
  overdue_minutes: number;
  auto_escalated: boolean;
  auto_escalated_at: string | null;
  last_action: SecurityOperationAlertAction | null;
  last_note: string | null;
  updated_at: string | null;
}

export interface SecurityOperationAlertSlaTaskRunResult {
  task: SecurityOperationAlertSlaTaskName;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  escalated_count: number;
  skipped_count: number;
  failed_count: number;
  error_message: string | null;
}

export interface SecurityOperationAlertSlaSubscriptionPolicy {
  enabled: boolean;
  channels: SecurityOperationAlertNotificationChannel[];
  default_targets: string[];
  high_risk_targets: string[];
  archive_targets: string[];
  webhook_configured: boolean;
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

export interface SecurityOperationAlertSlaNotificationItem {
  notification_event_id: string;
  alert_id: string;
  title: string;
  status: SecurityOperationAlertNotificationStatus;
  channels: SecurityOperationAlertNotificationChannel[];
  targets: string[];
  webhook_status: number | null;
  webhook_error: string | null;
  retry_count: number;
  retried_from_event_id: string | null;
  dead_lettered: boolean;
  dead_letter_reason: string | null;
  delivered_at: string;
  created_at: string;
  message: string;
}

export interface SecurityOperationAlertSlaNotificationResult {
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  notified_count: number;
  sent_count: number;
  partial_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
}

export interface SecurityOperationAlertSlaNotificationOverview {
  generated_at: string;
  policy: SecurityOperationAlertSlaSubscriptionPolicy;
  summary: {
    pending_overdue_count: number;
    sent_count: number;
    partial_count: number;
    failed_count: number;
    skipped_count: number;
    total_count: number;
    last_delivered_at: string | null;
  };
  items: SecurityOperationAlertSlaNotificationItem[];
  last_notification_result: SecurityOperationAlertSlaNotificationResult | null;
}

export type SecurityOperationAlertSlaNotificationRetryTaskName = 'AUTO_RETRY';

export interface SecurityOperationAlertSlaNotificationRetryTaskRunResult {
  task: SecurityOperationAlertSlaNotificationRetryTaskName;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  retried_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  dead_letter_count: number;
  error_message: string | null;
}

export interface SecurityOperationAlertSlaNotificationRetryOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  policy: {
    auto_retry_enabled: boolean;
    retry_interval_ms: number;
    retry_batch_size: number;
    max_retry_count: number;
    retry_backoff_seconds: number;
    lookback_hours: number;
    source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
  };
  summary: {
    pending_auto_retry_count: number;
    failed_notification_count: number;
    partial_notification_count: number;
    retried_notification_count: number;
    dead_letter_count: number;
    oldest_retryable_at: string | null;
    last_dead_letter_at: string | null;
  };
  retryable_items: SecurityOperationAlertSlaNotificationItem[];
  dead_letter_items: SecurityOperationAlertSlaNotificationItem[];
  last_auto_retry_result: SecurityOperationAlertSlaNotificationRetryTaskRunResult | null;
}

export type SecurityOperationAlertSlaDeadLetterDispositionStatus = 'OPEN' | 'CLAIMED' | 'REQUEUED' | 'CLOSED';
export type SecurityOperationAlertSlaDeadLetterAction = 'CLAIM' | 'REQUEUE' | 'CLOSE';

export interface SecurityOperationAlertSlaDeadLetterItem extends SecurityOperationAlertSlaNotificationItem {
  disposition_status: SecurityOperationAlertSlaDeadLetterDispositionStatus;
  disposition_action: SecurityOperationAlertSlaDeadLetterAction | null;
  disposition_note: string | null;
  disposition_event_id: string | null;
  handled_by: string | null;
  handled_at: string | null;
}

export interface SecurityOperationAlertSlaDeadLetterActionInput {
  action: SecurityOperationAlertSlaDeadLetterAction;
  note?: string | null;
}

export interface SecurityOperationAlertSlaDeadLetterActionResult {
  notification_event_id: string;
  action: SecurityOperationAlertSlaDeadLetterAction;
  disposition_status: SecurityOperationAlertSlaDeadLetterDispositionStatus;
  note: string | null;
  delivery_event_id: string | null;
  handled_by: string | null;
  handled_at: string;
}

export interface SecurityOperationAlertSlaDeadLetterOverview {
  generated_at: string;
  summary: {
    total_count: number;
    open_count: number;
    claimed_count: number;
    requeued_count: number;
    closed_count: number;
    oldest_open_at: string | null;
    last_action_at: string | null;
  };
  items: SecurityOperationAlertSlaDeadLetterItem[];
  last_action_result: SecurityOperationAlertSlaDeadLetterActionResult | null;
}

export interface SecurityOperationAlertSlaDeadLetterAuditItem {
  event_id: string;
  notification_event_id: string;
  alert_id: string | null;
  title: string;
  action: SecurityOperationAlertSlaDeadLetterAction;
  disposition_status: SecurityOperationAlertSlaDeadLetterDispositionStatus;
  note: string | null;
  delivery_event_id: string | null;
  handled_by: string | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
}

export interface ListSecurityOperationAlertSlaDeadLetterAuditsParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  action?: SecurityOperationAlertSlaDeadLetterAction | '';
  disposition_status?: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveItem {
  id: string;
  key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
  download_expires_in: number;
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveListResult {
  items: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  total: number;
  summary: {
    archive_count: number;
    total_size_bytes: number;
  };
}

export interface CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult {
  item: SecurityOperationAlertSlaDeadLetterAuditArchiveItem;
}

export type SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED';

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalActor {
  id: string;
  name: string;
  email: string;
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem {
  id: string;
  archive_id: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
  status: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalStatus;
  reason: string | null;
  requested_by: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalActor | null;
  reviewed_by: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalActor | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem {
  event_id: string;
  source_id: string;
  event_type: string;
  status: string;
  title: string;
  note: string | null;
  actor: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalActor | null;
  request_id: string | null;
  trace_id: string | null;
  occurred_at: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail
  extends SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem {
  audit_timeline: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem[];
}

export interface SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  applied_count: number;
}

export interface SecurityOperationAlertSlaOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  policy: {
    enabled: boolean;
    scan_interval_ms: number;
    due_minutes: number;
    warning_minutes: number;
    auto_escalate_enabled: boolean;
    lookback_hours: number;
    source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
  };
  summary: {
    total_count: number;
    within_sla_count: number;
    warning_count: number;
    overdue_count: number;
    closed_count: number;
    auto_escalated_count: number;
    next_due_at: string | null;
  };
  items: SecurityOperationAlertSlaItem[];
  last_auto_escalation_result: SecurityOperationAlertSlaTaskRunResult | null;
}

export interface SecurityCenterDenialItem {
  id: string;
  source: 'DATA_SCOPE' | 'RESOURCE_ACL' | 'SECURITY_POLICY' | 'OPERATION';
  title: string;
  reason: string;
  resource_type: string | null;
  resource_id: string | null;
  action: string | null;
  matched_code: string | null;
  path: string;
  method: string;
  status_code: number;
  request_id: string;
  trace_id: string | null;
  occurred_at: string;
}

export type SecurityCenterEventSource = SecurityCenterDenialItem['source'];
export type SecurityCenterEventWindow = '1h' | '24h' | '7d' | '30d';

export interface SecurityCenterEventListItem extends SecurityCenterDenialItem {
  severity: SecurityCenterRiskLevel;
  has_trace: boolean;
  source_record_type: 'operation_log' | 'security_policy_evaluation';
  source_record_id: string;
}

export interface SecurityCenterEventDetail extends SecurityCenterEventListItem {
  subject: Record<string, unknown> | null;
  resource: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  request_summary: Record<string, unknown> | null;
  matched_policy: {
    id: string | null;
    code: string | null;
    name: string | null;
  } | null;
  operator: SecurityPolicyActorSummary | null;
  ip: string | null;
  user_agent: string | null;
  error_message: string | null;
}

export interface SecurityCenterOverview {
  generated_at: string;
  posture: {
    score: number;
    level: SecurityCenterRiskLevel;
    summary: string;
    guard_chain: string[];
  };
  metrics: {
    active_policies: number;
    deny_policies: number;
    resource_acl_deny: number;
    pending_approvals: number;
    runtime_pending_approvals: number;
    security_events_24h: number;
    security_policy_denials_24h: number;
    list_data_scope_filters: number;
    resource_acl_condition_checks: number;
    failed_monitor_events_24h: number;
    configured_data_scope_roles: number;
    custom_data_scopes: number;
  };
  modules: SecurityCenterModuleSummary[];
  approval_operations: {
    tool_pending: number;
    tool_approved: number;
    tool_rejected: number;
    runtime_pending: number;
    notification_pending: number;
    notification_high_impact_pending: number;
    archive_delete_pending: number;
    archive_delete_approved: number;
    archive_delete_rejected: number;
    archive_delete_applied: number;
    operation_alert_notification_archive_delete_pending: number;
    operation_alert_notification_archive_delete_approved: number;
    operation_alert_notification_archive_delete_rejected: number;
    operation_alert_notification_archive_delete_applied: number;
    agent_team_report_archive_delete_pending: number;
    agent_team_report_archive_delete_approved: number;
    agent_team_report_archive_delete_rejected: number;
    agent_team_report_archive_delete_applied: number;
    sla_dead_letter_archive_delete_pending: number;
    sla_dead_letter_archive_delete_approved: number;
    sla_dead_letter_archive_delete_rejected: number;
    sla_dead_letter_archive_delete_applied: number;
    notification_task_recovery_audit_archive_delete_pending: number;
    notification_task_recovery_audit_archive_delete_approved: number;
    notification_task_recovery_audit_archive_delete_rejected: number;
    notification_task_recovery_audit_archive_delete_applied: number;
    notification_task_runs_24h: number;
    notification_task_failed_24h: number;
    notification_task_skipped_24h: number;
    notification_task_failure_rate_24h: number;
    notification_task_consecutive_failures: number;
    notification_task_sla_dead_letter_failed_24h: number;
    notification_task_agent_team_report_archive_delete_failed_24h: number;
    notification_task_recovery_archive_delete_failed_24h: number;
    notification_task_recovery_suggestions: SecurityOperationAlertNotificationTaskRecoverySuggestion[];
    audit_events_24h: number;
    audit_failed_24h: number;
    audit_warning_24h: number;
    audit_trace_count_24h: number;
    archive_count: number;
    archive_total_size_bytes: number;
    archive_storage_status: StorageConnectionStatus | 'UNKNOWN';
    operational_alerts: SecurityCenterOperationalAlert[];
  };
  risks: SecurityCenterRiskSignal[];
  recent: {
    policy_evaluations: SecurityPolicyEvaluationItem[];
    security_denials: SecurityCenterDenialItem[];
    audit_failures: AuditFailureItem[];
    monitor_errors: MonitorErrorSampleItem[];
  };
}

export interface CreateSecurityPolicyInput {
  name: string;
  code: string;
  description?: string | null;
  effect: SecurityPolicyEffect;
  resource_type: string;
  action: string;
  priority?: number;
  conditions?: unknown;
}

export interface UpdateSecurityPolicyInput {
  name?: string;
  description?: string | null;
  effect?: SecurityPolicyEffect;
  resource_type?: string;
  action?: string;
  priority?: number;
  status?: SecurityPolicyStatus;
  conditions?: unknown;
}

export interface SimulateSecurityPolicyInput {
  subject: Record<string, unknown>;
  resource: Record<string, unknown>;
  action: string;
  context?: Record<string, unknown> | null;
}

export interface SimulateSecurityPolicyResult {
  decision: SecurityPolicyDecision;
  matched_policy: SecurityPolicyListItem | null;
  reason: string;
  checked_count: number;
  evaluation: SecurityPolicyEvaluationItem;
}

export type AgentStatus = 'DRAFT' | 'TESTING' | 'PENDING' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';

export interface AgentCategoryItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface AgentOwnerSummary {
  id: string;
  name: string;
  email: string;
}

export interface AgentListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
  avatar_url: string | null;
  status: AgentStatus;
  version: number;
  category: AgentCategoryItem | null;
  owner: AgentOwnerSummary | null;
  default_model: string | null;
  updated_at: string;
  created_at: string;
}

export interface AgentVersionItem {
  id: string;
  version: number;
  status: string;
  change_note: string | null;
  published_at: string | null;
  created_at: string;
  created_by: AgentOwnerSummary | null;
}

export interface AgentAuditLogItem {
  id: string;
  action: string;
  message: string;
  created_at: string;
  operator: AgentOwnerSummary | null;
}

export type AgentModelBindingType = 'DEFAULT';
export type AgentPromptBindingType = PromptType;

export interface AgentModelBindingItem {
  id: string;
  model_id: string;
  model_name: string;
  model_code: string;
  provider_id: string;
  provider_name: string;
  binding_type: AgentModelBindingType;
  created_at: string;
}

export interface AgentPromptBindingItem {
  id: string;
  prompt_id: string;
  prompt_name: string;
  prompt_code: string;
  prompt_type: AgentPromptBindingType;
  created_at: string;
}

export interface AgentKnowledgeBindingItem {
  id: string;
  knowledge_id: string;
  knowledge_name: string;
  knowledge_code: string;
  weight: number;
  recall_top_k: number;
  created_at: string;
}

export interface AgentToolBindingItem {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_code: string;
  require_approval: boolean;
  created_at: string;
}

export interface AgentDetail extends AgentListItem {
  temperature: number;
  max_context_tokens: number;
  enable_stream: boolean;
  enable_log: boolean;
  versions: AgentVersionItem[];
  audit_logs: AgentAuditLogItem[];
  bindings: {
    models: AgentModelBindingItem[];
    prompts: AgentPromptBindingItem[];
    knowledge: AgentKnowledgeBindingItem[];
    tools: AgentToolBindingItem[];
  };
}

export interface CreateAgentInput {
  name: string;
  code: string;
  description?: string | null;
  avatar_url?: string | null;
  category_id?: string | null;
  owner_id?: string | null;
  temperature?: number;
  max_context_tokens?: number;
  enable_stream?: boolean;
  enable_log?: boolean;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
  category_id?: string | null;
  owner_id?: string | null;
  status?: AgentStatus;
  temperature?: number;
  max_context_tokens?: number;
  enable_stream?: boolean;
  enable_log?: boolean;
}

export interface CreateAgentVersionInput {
  change_note?: string | null;
}

export interface RollbackAgentInput {
  version: number;
}

export interface CreateAgentModelBindingInput {
  model_id: string;
  binding_type?: AgentModelBindingType;
}

export interface CreateAgentPromptBindingInput {
  prompt_id: string;
  prompt_type: AgentPromptBindingType;
}

export interface CreateAgentKnowledgeBindingInput {
  knowledge_id: string;
  weight?: number;
  recall_top_k?: number;
}

export interface UpdateAgentKnowledgeBindingInput {
  weight?: number;
  recall_top_k?: number;
}

export interface CreateAgentToolBindingInput {
  tool_id: string;
  require_approval?: boolean;
}

export interface UpdateAgentToolBindingInput {
  require_approval?: boolean;
}

export type PublishChannelType = 'WEB_WIDGET' | 'OPEN_API' | 'WECHAT_WORK' | 'DINGTALK' | 'FEISHU' | 'SLACK' | 'CUSTOM_WEBHOOK';
export type PublishChannelStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED' | 'ERROR' | 'ARCHIVED';
export type PublishChannelHealthStatus = 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface PublishChannelAgentSummary {
  id: string;
  name: string;
  code: string;
  status: AgentStatus;
  version: number;
}

export interface PublishChannelListItem {
  id: string;
  tenant_id: string;
  agent_id: string;
  agent: PublishChannelAgentSummary | null;
  channel: PublishChannelType;
  name: string;
  description: string | null;
  status: PublishChannelStatus;
  endpoint_url: string | null;
  callback_url: string | null;
  secret_masked: string | null;
  config: Record<string, unknown> | null;
  last_published_at: string | null;
  last_checked_at: string | null;
  health_status: PublishChannelHealthStatus;
  health_message: string | null;
  request_count_24h: number;
  success_rate_24h: number;
  last_request_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishChannelOverview {
  generated_at: string;
  summary: {
    total_channels: number;
    active_channels: number;
    error_channels: number;
    total_requests_24h: number;
    success_rate_24h: number;
    active_agent_count: number;
  };
  channels: PublishChannelListItem[];
  channel_mix: Array<{
    channel: PublishChannelType;
    total: number;
    active: number;
    requests_24h: number;
  }>;
  recent_events: PlatformEventListItem[];
}

export interface UpsertPublishChannelInput {
  agent_id: string;
  channel: PublishChannelType;
  name: string;
  description?: string | null;
  endpoint_url?: string | null;
  callback_url?: string | null;
  secret?: string | null;
  config?: Record<string, unknown> | null;
  status?: PublishChannelStatus;
}

export interface UpdatePublishChannelInput {
  name?: string;
  description?: string | null;
  endpoint_url?: string | null;
  callback_url?: string | null;
  secret?: string | null;
  config?: Record<string, unknown> | null;
  status?: PublishChannelStatus;
}

export type ChannelPublishApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ChannelPublishRolloutStatus = 'CLOSED' | 'GRAY' | 'FULL';

export interface ChannelPublishControl {
  approval_required: boolean;
  approval_status: ChannelPublishApprovalStatus;
  approval_note: string | null;
  requested_by: string | null;
  requested_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_note: string | null;
  rollout_enabled: boolean;
  rollout_percentage: number;
  rollout_status: ChannelPublishRolloutStatus;
  rollback_available: boolean;
  last_stable_status: PublishChannelStatus | null;
  last_stable_config: Record<string, unknown> | null;
  last_rollback_at: string | null;
  last_rollback_by: string | null;
  updated_at: string | null;
}

export interface UpdateChannelPublishControlInput {
  approval_required?: boolean;
  approval_note?: string | null;
}

export interface ChannelPublishApprovalInput {
  note?: string | null;
}

export interface ChannelPublishRolloutInput {
  rollout_enabled?: boolean;
  rollout_percentage?: number;
}

export type ChannelRolloutGateStatus = 'CLOSED' | 'GRAY' | 'FULL' | 'BLOCKING';
export type ChannelRolloutGateDecisionReason =
  | 'rollout_closed'
  | 'rollout_full'
  | 'rollout_bucket_allowed'
  | 'rollout_bucket_blocked'
  | 'approval_pending'
  | 'channel_unavailable';

export interface ChannelRolloutGateDecision {
  allowed: boolean;
  reason: ChannelRolloutGateDecisionReason;
  bucket: number | null;
  rollout_percentage: number;
  source: string;
  evaluated_at: string;
  request_id: string | null;
  trace_id: string | null;
}

export interface ChannelRolloutGateOverview {
  generated_at: string;
  channel_id: string;
  channel_type: PublishChannelType;
  status: ChannelRolloutGateStatus;
  rollout_enabled: boolean;
  rollout_percentage: number;
  rollout_status: ChannelPublishRolloutStatus;
  evaluated_count_24h: number;
  allowed_count_24h: number;
  blocked_count_24h: number;
  bypass_count_24h: number;
  allowed_rate_24h: number;
  last_decision: ChannelRolloutGateDecision | null;
}

export type ChannelReleaseBatchStatus = 'IDLE' | 'PENDING_APPROVAL' | 'APPROVED' | 'GRAY' | 'FULL' | 'ROLLED_BACK' | 'ABORTED';
export type ChannelReleasePipelineStepKey = 'CREATE_BATCH' | 'REQUEST_APPROVAL' | 'APPROVE' | 'GRAY_ROLLOUT' | 'FULL_RELEASE' | 'ROLLBACK_OR_ABORT';
export type ChannelReleasePipelineStepStatus = 'WAITING' | 'CURRENT' | 'DONE' | 'FAILED' | 'SKIPPED';

export interface ChannelReleaseBatch {
  batch_id: string;
  title: string;
  status: ChannelReleaseBatchStatus;
  target_rollout_percentage: number;
  started_by: string | null;
  started_at: string;
  completed_at: string | null;
  aborted_at: string | null;
  rollback_at: string | null;
  note: string | null;
}

export interface ChannelReleasePipelineStep {
  key: ChannelReleasePipelineStepKey;
  name: string;
  status: ChannelReleasePipelineStepStatus;
  description: string;
  occurred_at: string | null;
  event_type: string | null;
}

export interface ChannelReleasePipeline {
  generated_at: string;
  channel_id: string;
  current_batch: ChannelReleaseBatch | null;
  steps: ChannelReleasePipelineStep[];
  recent_batches: ChannelReleaseBatch[];
  recent_events: PlatformEventListItem[];
  updated_at: string | null;
}

export interface ChannelReleaseBatchInput {
  title?: string | null;
  target_rollout_percentage?: number;
  note?: string | null;
}

export type ChannelReleaseGateDecision = 'PROMOTE_READY' | 'OBSERVE' | 'BLOCKED' | 'DISABLED' | 'NO_BATCH';

export interface ChannelReleaseGatePolicy {
  enabled: boolean;
  min_evaluated_count: number;
  min_allowed_rate: number;
  max_blocked_count: number;
  auto_promote_enabled: boolean;
  observation_window_hours: number;
  updated_at: string | null;
}

export interface ChannelReleaseGatePolicyInput {
  enabled?: boolean;
  min_evaluated_count?: number;
  min_allowed_rate?: number;
  max_blocked_count?: number;
  auto_promote_enabled?: boolean;
  observation_window_hours?: number;
}

export interface ChannelReleaseGateMetrics {
  evaluated_count: number;
  allowed_count: number;
  blocked_count: number;
  bypass_count: number;
  allowed_rate: number;
}

export interface ChannelReleaseGateEvaluation {
  decision: ChannelReleaseGateDecision;
  reason: string;
  eligible_for_full_release: boolean;
  current_batch: ChannelReleaseBatch | null;
  policy: ChannelReleaseGatePolicy;
  metrics: ChannelReleaseGateMetrics;
  evaluated_at: string;
}

export interface ChannelReleaseGateOverview {
  generated_at: string;
  channel_id: string;
  policy: ChannelReleaseGatePolicy;
  evaluation: ChannelReleaseGateEvaluation;
  recent_events: PlatformEventListItem[];
}

export type ChannelReleaseAutomationMode = 'MANUAL' | 'SCHEDULED';
export type ChannelReleaseAutomationDecision = 'PROMOTED' | 'SKIPPED' | 'BLOCKED' | 'DISABLED' | 'FAILED';

export interface ChannelReleaseAutomationPolicy {
  enabled: boolean;
  require_auto_promote_policy: boolean;
  min_interval_minutes: number;
  max_runs_per_day: number;
  dry_run: boolean;
  updated_at: string | null;
}

export interface ChannelReleaseAutomationPolicyInput {
  enabled?: boolean;
  require_auto_promote_policy?: boolean;
  min_interval_minutes?: number;
  max_runs_per_day?: number;
  dry_run?: boolean;
}

export interface ChannelReleaseAutomationRunResult {
  run_id: string;
  channel_id: string;
  batch_id: string | null;
  mode: ChannelReleaseAutomationMode;
  decision: ChannelReleaseAutomationDecision;
  promoted: boolean;
  dry_run: boolean;
  reason: string;
  gate_decision: ChannelReleaseGateDecision;
  started_at: string;
  finished_at: string;
  error_message: string | null;
  workflow_id?: string | null;
  workflow_backend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
}

export interface ChannelReleaseAutomationOverview {
  generated_at: string;
  channel_id: string;
  policy: ChannelReleaseAutomationPolicy;
  gate: ChannelReleaseGateEvaluation;
  current_batch: ChannelReleaseBatch | null;
  running: boolean;
  last_run: ChannelReleaseAutomationRunResult | null;
  today_run_count: number;
  next_allowed_at: string | null;
  recent_events: PlatformEventListItem[];
  workflow_mode?: 'local' | 'temporal_first' | 'temporal';
  workflow_backend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
}

export type ChannelReleaseSelfHealingDecision =
  | 'HEALTHY'
  | 'OBSERVE'
  | 'ROLLBACK_RECOMMENDED'
  | 'ROLLED_BACK'
  | 'SKIPPED'
  | 'DISABLED'
  | 'FAILED';

export interface ChannelReleaseSelfHealingPolicy {
  enabled: boolean;
  dry_run: boolean;
  auto_rollback_enabled: boolean;
  max_error_requests: number;
  min_allowed_rate: number;
  observation_window_hours: number;
  cooldown_minutes: number;
  updated_at: string | null;
}

export interface ChannelReleaseSelfHealingPolicyInput {
  enabled?: boolean;
  dry_run?: boolean;
  auto_rollback_enabled?: boolean;
  max_error_requests?: number;
  min_allowed_rate?: number;
  observation_window_hours?: number;
  cooldown_minutes?: number;
}

export interface ChannelReleaseSelfHealingMetrics {
  evaluated_count: number;
  allowed_count: number;
  blocked_count: number;
  bypass_count: number;
  allowed_rate: number;
  error_request_count: number;
}

export interface ChannelReleaseSelfHealingEvaluation {
  decision: ChannelReleaseSelfHealingDecision;
  reason: string;
  rollback_recommended: boolean;
  rollback_available: boolean;
  policy: ChannelReleaseSelfHealingPolicy;
  metrics: ChannelReleaseSelfHealingMetrics;
  current_batch: ChannelReleaseBatch | null;
  last_automation_run: ChannelReleaseAutomationRunResult | null;
  evaluated_at: string;
}

export interface ChannelReleaseSelfHealingRunResult {
  run_id: string;
  channel_id: string;
  batch_id: string | null;
  decision: ChannelReleaseSelfHealingDecision;
  rolled_back: boolean;
  dry_run: boolean;
  reason: string;
  started_at: string;
  finished_at: string;
  error_message: string | null;
  workflow_id?: string | null;
  workflow_backend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
}

export interface ChannelReleaseSelfHealingOverview {
  generated_at: string;
  channel_id: string;
  policy: ChannelReleaseSelfHealingPolicy;
  evaluation: ChannelReleaseSelfHealingEvaluation;
  last_run: ChannelReleaseSelfHealingRunResult | null;
  next_allowed_at: string | null;
  recent_events: PlatformEventListItem[];
  workflow_mode?: 'local' | 'temporal_first' | 'temporal';
  workflow_backend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
}

export type ChannelReleaseSchedulerTask = 'AUTOMATION' | 'SELF_HEALING';

export type ChannelReleaseSchedulerStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';

export interface ChannelReleaseSchedulerChannelResult {
  channel_id: string;
  channel_name: string;
  task: ChannelReleaseSchedulerTask;
  status: ChannelReleaseSchedulerStatus;
  decision: string | null;
  workflow_backend: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
  error_message: string | null;
}

export interface ChannelReleaseSchedulerRunResult {
  run_id: string;
  task: 'POLL';
  status: ChannelReleaseSchedulerStatus;
  started_at: string;
  finished_at: string;
  scanned_channel_count: number;
  automation_candidate_count: number;
  self_healing_candidate_count: number;
  dispatched_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
  results: ChannelReleaseSchedulerChannelResult[];
}

export interface ChannelReleaseSchedulerOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  workflow_modes: {
    automation: 'local' | 'temporal_first' | 'temporal';
    self_healing: 'local' | 'temporal_first' | 'temporal';
  };
  summary: {
    total_channels: number;
    automation_enabled_channel_count: number;
    self_healing_enabled_channel_count: number;
    active_batch_channel_count: number;
    rollback_ready_channel_count: number;
  };
  last_run: ChannelReleaseSchedulerRunResult | null;
}

export type ChannelReleaseReportSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface ChannelReleaseReportMetric {
  label: string;
  value: string;
  helper: string;
  severity: ChannelReleaseReportSeverity;
}

export interface ChannelReleaseReportTimelineItem {
  id: string;
  occurred_at: string;
  event_type: string;
  title: string;
  status: string;
  severity: string;
  summary: string | null;
  trace_id: string | null;
}

export interface ChannelReleaseReportRiskItem {
  title: string;
  severity: ChannelReleaseReportSeverity;
  description: string;
  recommendation: string;
}

export interface ChannelReleaseReport {
  generated_at: string;
  channel_id: string;
  channel_name: string;
  channel_type: PublishChannelType;
  report_window_hours: number;
  summary: {
    conclusion: string;
    incident_level: ChannelReleaseReportSeverity;
    health_status: PublishChannelHealthStatus;
    publish_status: PublishChannelStatus;
    rollback_available: boolean;
    approval_status: ChannelPublishApprovalStatus;
    rollout_status: ChannelPublishRolloutStatus;
    current_batch_title: string | null;
    last_automation_decision: ChannelReleaseAutomationDecision | null;
    last_self_healing_decision: ChannelReleaseSelfHealingDecision | null;
  };
  metrics: ChannelReleaseReportMetric[];
  risks: ChannelReleaseReportRiskItem[];
  timeline: ChannelReleaseReportTimelineItem[];
  recent_events: PlatformEventListItem[];
  markdown: string;
}

export interface ChannelReleaseReportSnapshotListItem {
  snapshot_id: string;
  channel_id: string;
  channel_name: string;
  incident_level: ChannelReleaseReportSeverity;
  conclusion: string;
  created_at: string;
  created_by: string | null;
  event_id: string;
  trace_id: string | null;
}

export interface ChannelReleaseReportSnapshotDetail extends ChannelReleaseReportSnapshotListItem {
  report: ChannelReleaseReport;
  source_event: PlatformEventListItem;
}

export interface ChannelReleaseReportSnapshotOverview {
  generated_at: string;
  channel_id: string;
  total: number;
  items: ChannelReleaseReportSnapshotListItem[];
}

export type ChannelReleaseReportDiffKind = 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';

export interface ChannelReleaseReportDiffItem {
  field: string;
  label: string;
  kind: ChannelReleaseReportDiffKind;
  before: string | null;
  after: string | null;
  severity: ChannelReleaseReportSeverity;
}

export interface ChannelReleaseReportSnapshotCompareResult {
  generated_at: string;
  channel_id: string;
  base_snapshot: ChannelReleaseReportSnapshotListItem;
  target_snapshot: ChannelReleaseReportSnapshotListItem;
  summary: {
    changed_count: number;
    added_count: number;
    removed_count: number;
    critical_change_count: number;
    conclusion: string;
  };
  summary_diffs: ChannelReleaseReportDiffItem[];
  metric_diffs: ChannelReleaseReportDiffItem[];
  risk_diffs: ChannelReleaseReportDiffItem[];
  timeline_diffs: ChannelReleaseReportDiffItem[];
}

export type ChannelCallbackProvider = 'WECHAT_WORK' | 'DINGTALK' | 'FEISHU' | 'SLACK' | 'CUSTOM_WEBHOOK';
export interface ChannelSenderPolicy {
  auto_retry_enabled: boolean;
  manual_retry_enabled: boolean;
  max_retry_count: number;
  retry_backoff_seconds: number;
  retry_on_statuses: number[];
  alert_on_failure: boolean;
  retention_days: number;
  updated_at: string | null;
}

export interface UpdateChannelSenderPolicyInput {
  auto_retry_enabled?: boolean;
  manual_retry_enabled?: boolean;
  max_retry_count?: number;
  retry_backoff_seconds?: number;
  retry_on_statuses?: number[];
  alert_on_failure?: boolean;
  retention_days?: number;
}

export type ChannelSenderDeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'RETRYING';

export interface ChannelSenderDeliveryListItem {
  id: string;
  delivery_id: string;
  parent_delivery_id: string | null;
  tenant_id: string;
  channel_id: string;
  channel_name: string;
  channel_type: PublishChannelType;
  agent_id: string;
  agent_name: string | null;
  provider: ChannelCallbackProvider;
  target: string | null;
  status: ChannelSenderDeliveryStatus;
  response_status: number | null;
  latency_ms: number | null;
  retry_count: number;
  conversation_id: string | null;
  run_id: string | null;
  trace_id: string | null;
  external_conversation_id: string | null;
  external_message_id: string | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface ChannelSenderDeliveryDetail extends ChannelSenderDeliveryListItem {
  request_body: unknown;
  request_headers: Record<string, string>;
  response_body: string | null;
  updated_at: string;
}

export interface ListChannelSenderDeliveriesResult {
  items: ChannelSenderDeliveryListItem[];
  total: number;
}

export interface RetryChannelSenderDeliveryResult {
  item: ChannelSenderDeliveryDetail;
}

export type ChannelSenderTaskName = 'AUTO_RETRY' | 'CLEANUP';

export interface ChannelSenderTaskRunResult {
  task: ChannelSenderTaskName;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  retried_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  deleted_count: number;
  error_message: string | null;
}

export interface ChannelSenderTaskOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  summary: {
    pending_auto_retry_count: number;
    expired_delivery_count: number;
    auto_retry_enabled_channel_count: number;
    failed_delivery_count: number;
    oldest_failed_at: string | null;
  };
  last_auto_retry_result: ChannelSenderTaskRunResult | null;
  last_cleanup_result: ChannelSenderTaskRunResult | null;
}

export interface ChannelCallbackResult {
  success: boolean;
  ignored: boolean;
  async_accepted?: boolean;
  provider: ChannelCallbackProvider;
  channel_id: string;
  agent_id: string;
  conversation_id: string | null;
  run_id: string | null;
  trace_id: string | null;
  answer: string | null;
  message: string;
  external_message_id?: string | null;
}

export type AgentTeamStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type AgentTeamMode = 'SEQUENTIAL' | 'PARALLEL' | 'SUPERVISOR';
export type AgentTeamHandoffPolicy = 'AUTO' | 'MANUAL' | 'APPROVAL_REQUIRED';
export type AgentTeamFailurePolicy =
  | 'MATCH_HANDOFF_POLICY'
  | 'STOP_ON_REQUIRED_FAILURE'
  | 'WAIT_HUMAN_ON_REQUIRED_FAILURE'
  | 'CONTINUE_OPTIONAL';
export type AgentTeamMemberStatus = 'ACTIVE' | 'DISABLED';
export type AgentTeamRunStatus = 'QUEUED' | 'RUNNING' | 'WAITING_HUMAN' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type AgentTeamStepStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type AgentTeamStepType = 'PLAN' | 'AGENT_RUN' | 'HANDOFF' | 'VERIFY' | 'SUMMARY';
export type AgentTeamHandoffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO';

export interface AgentTeamModelCallItem {
  trace_id: string | null;
  status: 'SUCCESS' | 'FAILED';
  request_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  output_preview: string | null;
  error_message: string | null;
}

export interface AgentTeamMemberItem {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_code: string;
  role: string;
  responsibility: string | null;
  execution_order: number;
  required: boolean;
  status: AgentTeamMemberStatus;
  created_at: string;
  updated_at: string;
}

export interface AgentTeamRunSummary {
  id: string;
  objective: string;
  status: AgentTeamRunStatus;
  request_id: string | null;
  trace_id: string | null;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  total_tokens: number;
  total_cost: number;
  latency_ms: number;
  error_message: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  created_by: AgentOwnerSummary | null;
}

export interface AgentTeamListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
  status: AgentTeamStatus;
  mode: AgentTeamMode;
  max_rounds: number;
  timeout_seconds: number;
  handoff_policy: AgentTeamHandoffPolicy;
  supervisor_model_id: string | null;
  supervisor_model_name: string | null;
  supervisor_model: string | null;
  supervisor_prompt: string | null;
  failure_policy: AgentTeamFailurePolicy;
  quality_gate_enabled: boolean;
  quality_threshold: number;
  budget_token_limit: number | null;
  budget_cost_limit: number | null;
  owner: AgentOwnerSummary | null;
  member_count: number;
  active_member_count: number;
  run_count: number;
  latest_run: AgentTeamRunSummary | null;
  created_at: string;
  updated_at: string;
}

export interface AgentTeamStepItem {
  id: string;
  run_id: string;
  member_id: string | null;
  agent_id: string | null;
  agent_name: string | null;
  agent_code: string | null;
  step_type: AgentTeamStepType;
  title: string;
  status: AgentTeamStepStatus;
  input_summary: string | null;
  output_summary: string | null;
  trace_id: string | null;
  span_id: string | null;
  parent_span_id: string | null;
  duration_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_total: number;
  child_steps: ConversationRunStepItem[];
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
  model_call: AgentTeamModelCallItem | null;
  error_message: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface AgentTeamHandoffItem {
  id: string;
  from_member_id: string | null;
  to_member_id: string | null;
  from_agent_id: string | null;
  to_agent_id: string | null;
  from_agent_name: string | null;
  to_agent_name: string | null;
  reason: string;
  status: AgentTeamHandoffStatus;
  decision_note: string | null;
  decided_by: AgentOwnerSummary | null;
  decided_at: string | null;
  created_at: string;
  created_by: AgentOwnerSummary | null;
}

export interface AgentTeamFeedbackItem {
  id: string;
  run_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  created_by: AgentOwnerSummary | null;
}

export interface AgentTeamRunReportArchiveItem {
  id: string;
  key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
  download_expires_in: number;
  team_id: string | null;
  team_name: string | null;
  run_id: string | null;
  run_objective: string | null;
  created_by: string | null;
}

export interface AgentTeamRunReportArchiveListResult {
  items: AgentTeamRunReportArchiveItem[];
  total: number;
  summary: {
    archive_count: number;
    total_size_bytes: number;
  };
}

export interface CreateAgentTeamRunReportArchiveResult {
  item: AgentTeamRunReportArchiveItem;
}

export type AgentTeamRunReportArchiveApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface AgentTeamRunReportArchiveApprovalItem {
  id: string;
  archive_id: string;
  archive_key: string;
  archive_file_name: string;
  archive_size_bytes: number;
  status: AgentTeamRunReportArchiveApprovalStatus;
  reason: string | null;
  requested_by: AgentOwnerSummary | null;
  reviewed_by: AgentOwnerSummary | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface AgentTeamDetail extends AgentTeamListItem {
  members: AgentTeamMemberItem[];
  runs: AgentTeamRunSummary[];
  steps: AgentTeamStepItem[];
  handoffs: AgentTeamHandoffItem[];
  feedback: AgentTeamFeedbackItem[];
}

export interface AgentTeamOverview {
  total: number;
  active_count: number;
  draft_count: number;
  disabled_count: number;
  running_count: number;
  waiting_human_count: number;
  failed_run_count: number;
  member_count: number;
}

export interface CreateAgentTeamInput {
  name: string;
  code: string;
  description?: string | null;
  owner_id?: string | null;
  status?: AgentTeamStatus;
  mode?: AgentTeamMode;
  max_rounds?: number;
  timeout_seconds?: number;
  handoff_policy?: AgentTeamHandoffPolicy;
  supervisor_model_id?: string | null;
  supervisor_prompt?: string | null;
  failure_policy?: AgentTeamFailurePolicy;
  quality_gate_enabled?: boolean;
  quality_threshold?: number;
  budget_token_limit?: number | null;
  budget_cost_limit?: number | null;
}

export interface UpdateAgentTeamInput {
  name?: string;
  description?: string | null;
  owner_id?: string | null;
  status?: AgentTeamStatus;
  mode?: AgentTeamMode;
  max_rounds?: number;
  timeout_seconds?: number;
  handoff_policy?: AgentTeamHandoffPolicy;
  supervisor_model_id?: string | null;
  supervisor_prompt?: string | null;
  failure_policy?: AgentTeamFailurePolicy;
  quality_gate_enabled?: boolean;
  quality_threshold?: number;
  budget_token_limit?: number | null;
  budget_cost_limit?: number | null;
}

export interface CreateAgentTeamMemberInput {
  agent_id: string;
  role: string;
  responsibility?: string | null;
  execution_order?: number;
  required?: boolean;
  status?: AgentTeamMemberStatus;
}

export interface UpdateAgentTeamMemberInput {
  role?: string;
  responsibility?: string | null;
  execution_order?: number;
  required?: boolean;
  status?: AgentTeamMemberStatus;
}

export interface StartAgentTeamRunInput {
  objective: string;
}

export interface CreateAgentTeamHandoffInput {
  from_member_id?: string | null;
  to_member_id?: string | null;
  from_agent_id?: string | null;
  to_agent_id?: string | null;
  reason: string;
  status?: AgentTeamHandoffStatus;
  decision_note?: string | null;
}

export interface ReviewAgentTeamHandoffInput {
  decision_note?: string | null;
}

export interface CreateAgentTeamFeedbackInput {
  rating: number;
  comment?: string | null;
}

export type ModelProviderStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type ModelProviderType = 'OPENAI_COMPATIBLE' | 'AZURE_OPENAI' | 'ANTHROPIC' | 'LOCAL';
export type ModelCapability = 'chat' | 'embedding' | 'rerank' | 'vision' | 'tool_call';
export type ModelCallStatus = 'SUCCESS' | 'FAILED';

export interface ModelApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  masked_key: string;
  status: ModelProviderStatus;
  last_used_at: string | null;
  created_at: string;
}

export interface ModelConfigItem {
  id: string;
  tenant_id: string;
  provider_id: string;
  name: string;
  model: string;
  capabilities: ModelCapability[];
  context_length: number;
  input_price: number;
  output_price: number;
  rate_limit_rpm: number | null;
  status: ModelProviderStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelCostRuleItem {
  id: string;
  model_config_id: string | null;
  currency: string;
  input_price: number;
  output_price: number;
  unit: string;
  status: ModelProviderStatus;
  effective_from: string;
}

export interface ModelCallLogItem {
  id: string;
  trace_id: string;
  request_model: string;
  status: ModelCallStatus;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost: number;
  latency_ms: number;
  error_message: string | null;
  created_at: string;
}

export interface ModelProviderListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  provider_type: ModelProviderType;
  base_url: string;
  status: ModelProviderStatus;
  is_default: boolean;
  description: string | null;
  model_count: number;
  enabled_model_count: number;
  api_key_count: number;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelProviderDetail extends ModelProviderListItem {
  models: ModelConfigItem[];
  api_keys: ModelApiKeyItem[];
  cost_rules: ModelCostRuleItem[];
  call_logs: ModelCallLogItem[];
}

export interface CreateModelProviderInput {
  name: string;
  code: string;
  provider_type: ModelProviderType;
  base_url: string;
  description?: string | null;
  is_default?: boolean;
}

export interface UpdateModelProviderInput {
  name?: string;
  provider_type?: ModelProviderType;
  base_url?: string;
  description?: string | null;
  status?: ModelProviderStatus;
  is_default?: boolean;
}

export interface CreateModelConfigInput {
  provider_id: string;
  name: string;
  model: string;
  capabilities: ModelCapability[];
  context_length: number;
  input_price?: number;
  output_price?: number;
  rate_limit_rpm?: number | null;
  status?: ModelProviderStatus;
  is_default?: boolean;
}

export interface UpdateModelConfigInput {
  name?: string;
  capabilities?: ModelCapability[];
  context_length?: number;
  input_price?: number;
  output_price?: number;
  rate_limit_rpm?: number | null;
  status?: ModelProviderStatus;
  is_default?: boolean;
}

export interface CreateModelApiKeyInput {
  name: string;
  api_key: string;
}

export interface TestModelProviderInput {
  model_config_id?: string | null;
  prompt: string;
}

export interface TestModelProviderResult {
  trace_id: string;
  status: ModelCallStatus;
  request_model: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost: number;
  output_text: string;
  error_message: string | null;
}

export type PromptStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';
export type PromptType = 'SYSTEM' | 'USER' | 'ASSISTANT' | 'TOOL';
export type PromptVariableType = 'string' | 'number' | 'boolean' | 'json';
export type PromptTestStatus = 'SUCCESS' | 'FAILED';

export interface PromptOwnerSummary {
  id: string;
  name: string;
  email: string;
}

export interface PromptVariableItem {
  id: string;
  name: string;
  variable_type: PromptVariableType;
  default_value: string | null;
  required: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromptVersionItem {
  id: string;
  version: number;
  status: PromptStatus;
  change_note: string | null;
  published_at: string | null;
  created_at: string;
  created_by: PromptOwnerSummary | null;
}

export interface PromptTestRecordItem {
  id: string;
  version: number | null;
  status: PromptTestStatus;
  model_provider_id: string | null;
  model_provider_name: string | null;
  model_config_id: string | null;
  request_model: string | null;
  rendered_content: string;
  output_text: string | null;
  latency_ms: number;
  error_message: string | null;
  created_at: string;
  created_by: PromptOwnerSummary | null;
}

export interface PromptAgentReferenceItem {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_code: string;
  prompt_type: string;
  created_at: string;
}

export interface PromptTemplateListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  type: PromptType;
  status: PromptStatus;
  version: number;
  description: string | null;
  content_preview: string;
  owner: PromptOwnerSummary | null;
  variable_count: number;
  test_count: number;
  agent_reference_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateDetail extends PromptTemplateListItem {
  content: string;
  variables: PromptVariableItem[];
  versions: PromptVersionItem[];
  test_records: PromptTestRecordItem[];
  agent_references: PromptAgentReferenceItem[];
  audit_records: Array<{
    id: string;
    action: string;
    message: string;
    created_at: string;
    operator: PromptOwnerSummary | null;
  }>;
}

export interface CreatePromptTemplateInput {
  name: string;
  code: string;
  type: PromptType;
  content: string;
  description?: string | null;
  owner_id?: string | null;
}

export interface UpdatePromptTemplateInput {
  name?: string;
  type?: PromptType;
  status?: PromptStatus;
  content?: string;
  description?: string | null;
  owner_id?: string | null;
}

export interface CreatePromptVariableInput {
  name: string;
  variable_type: PromptVariableType;
  default_value?: string | null;
  required?: boolean;
  description?: string | null;
  sort_order?: number;
}

export interface UpdatePromptVariableInput {
  name?: string;
  variable_type?: PromptVariableType;
  default_value?: string | null;
  required?: boolean;
  description?: string | null;
  sort_order?: number;
}

export interface PublishPromptInput {
  change_note?: string | null;
}

export interface RollbackPromptInput {
  version: number;
}

export interface RenderPromptInput {
  inputs: Record<string, unknown>;
}

export interface RenderPromptResult {
  rendered_content: string;
  missing_variables: string[];
}

export interface TestPromptInput {
  inputs: Record<string, unknown>;
  model_provider_id?: string | null;
  model_config_id?: string | null;
}

export interface TestPromptResult extends RenderPromptResult {
  id: string;
  status: PromptTestStatus;
  model_provider_id: string | null;
  model_provider_name: string | null;
  model_config_id: string | null;
  request_model: string | null;
  output_text: string | null;
  latency_ms: number;
  error_message: string | null;
}

export type KnowledgeBaseStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type KnowledgeVisibility = 'PRIVATE' | 'TENANT' | 'PUBLIC';
export type KnowledgeDocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
export type KnowledgeSourceType = 'TEXT' | 'MARKDOWN' | 'PDF' | 'WORD' | 'EXCEL' | 'HTML' | 'URL' | 'FAQ';
export type KnowledgeVectorStatus = 'PENDING' | 'READY' | 'FAILED';
export type KnowledgeVectorBackend = 'QDRANT' | 'POSTGRES_FALLBACK';
export type KnowledgeKeywordBackend = 'OPENSEARCH' | 'POSTGRES_FALLBACK';
export type KnowledgeTaskType = 'PROCESS' | 'PARSE' | 'SEGMENT' | 'EMBED' | 'INDEX' | 'REBUILD';
export type KnowledgeTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type KnowledgeRetrievalMode = 'VECTOR' | 'KEYWORD' | 'HYBRID';
export type KnowledgeRecallStatus = 'SUCCESS' | 'FAILED';

export interface KnowledgeOwnerSummary {
  id: string;
  name: string;
  email: string;
}

export interface KnowledgeBaseListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  visibility: KnowledgeVisibility;
  status: KnowledgeBaseStatus;
  description: string | null;
  owner: KnowledgeOwnerSummary | null;
  document_count: number;
  segment_count: number;
  failed_task_count: number;
  recall_count: number;
  agent_reference_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocumentListItem {
  id: string;
  title: string;
  source_type: KnowledgeSourceType;
  mime_type: string | null;
  file_name: string | null;
  file_size: number;
  storage_path: string | null;
  status: KnowledgeDocumentStatus;
  segment_count: number;
  token_count: number;
  error_message: string | null;
  uploaded_by: KnowledgeOwnerSummary | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSegmentItem {
  id: string;
  document_id: string;
  content: string;
  token_count: number;
  keywords: string[];
  embedding_model: string | null;
  metadata: Record<string, unknown> | null;
  vector_backend: KnowledgeVectorBackend;
  vector_collection: string | null;
  vector_error_message: string | null;
  keyword_backend: KnowledgeKeywordBackend;
  keyword_index: string | null;
  keyword_error_message: string | null;
  vector_status: KnowledgeVectorStatus;
  index_status: KnowledgeVectorStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeTaskItem {
  id: string;
  document_id: string | null;
  task_type: KnowledgeTaskType;
  status: KnowledgeTaskStatus;
  total_items: number;
  processed_items: number;
  started_at: string | null;
  ended_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRecallResultItem {
  segment_id: string;
  document_id: string;
  document_title: string;
  content: string;
  score: number;
  keyword_score?: number | null;
  vector_score?: number | null;
  keywords: string[];
  source_type: KnowledgeSourceType;
}

export interface KnowledgeRecallLogItem {
  id: string;
  query: string;
  mode: KnowledgeRetrievalMode;
  top_k: number;
  status: KnowledgeRecallStatus;
  latency_ms: number;
  result_count: number;
  results: KnowledgeRecallResultItem[];
  error_message: string | null;
  created_at: string;
  created_by: KnowledgeOwnerSummary | null;
}

export interface KnowledgeAgentReferenceItem {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_code: string;
  weight: number;
  recall_top_k: number;
  created_at: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentListItem {
  parsed_text: string | null;
  segments: KnowledgeSegmentItem[];
  tasks: KnowledgeTaskItem[];
}

export interface KnowledgeBaseDetail extends KnowledgeBaseListItem {
  documents: KnowledgeDocumentListItem[];
  segments: KnowledgeSegmentItem[];
  tasks: KnowledgeTaskItem[];
  recall_logs: KnowledgeRecallLogItem[];
  agent_references: KnowledgeAgentReferenceItem[];
}

export interface KnowledgeOverviewSummary {
  knowledge_base_count: number;
  active_knowledge_base_count: number;
  document_count: number;
  processing_document_count: number;
  segment_count: number;
  active_task_count: number;
  failed_task_count: number;
  agent_reference_count: number;
  recall_log_count_24h: number;
  recall_success_count_24h: number;
  recall_success_rate_24h: number;
  vector_ready_segment_count: number;
  keyword_ready_segment_count: number;
  vector_ready_rate: number;
  keyword_ready_rate: number;
}

export interface KnowledgeOverviewDocumentItem {
  id: string;
  knowledge_id: string;
  knowledge_name: string;
  title: string;
  source_type: KnowledgeSourceType;
  status: KnowledgeDocumentStatus;
  segment_count: number;
  token_count: number;
  updated_at: string;
}

export interface KnowledgeOverviewTaskItem {
  id: string;
  knowledge_id: string;
  knowledge_name: string;
  task_type: KnowledgeTaskType;
  status: KnowledgeTaskStatus;
  total_items: number;
  processed_items: number;
  started_at: string | null;
  ended_at: string | null;
  updated_at: string;
}

export interface KnowledgeOverviewRecallItem {
  id: string;
  knowledge_id: string;
  knowledge_name: string;
  query: string;
  mode: KnowledgeRetrievalMode;
  status: KnowledgeRecallStatus;
  result_count: number;
  latency_ms: number;
  created_at: string;
}

export interface KnowledgeOverview {
  generated_at: string;
  summary: KnowledgeOverviewSummary;
  recent_documents: KnowledgeOverviewDocumentItem[];
  recent_tasks: KnowledgeOverviewTaskItem[];
  recent_recall_logs: KnowledgeOverviewRecallItem[];
}

export interface CreateKnowledgeBaseInput {
  name: string;
  code: string;
  visibility?: KnowledgeVisibility;
  description?: string | null;
  owner_id?: string | null;
}

export interface UpdateKnowledgeBaseInput {
  name?: string;
  visibility?: KnowledgeVisibility;
  status?: KnowledgeBaseStatus;
  description?: string | null;
  owner_id?: string | null;
}

export interface UploadKnowledgeDocumentInput {
  title: string;
  source_type: KnowledgeSourceType;
  content: string;
  file_name?: string | null;
  mime_type?: string | null;
}

export interface UpdateKnowledgeDocumentInput {
  title?: string;
  status?: KnowledgeDocumentStatus;
}

export interface KnowledgeRetrievalTestInput {
  query: string;
  mode?: KnowledgeRetrievalMode;
  top_k?: number;
}

export interface KnowledgeRetrievalTestResult {
  id: string;
  query: string;
  mode: KnowledgeRetrievalMode;
  top_k: number;
  status: KnowledgeRecallStatus;
  latency_ms: number;
  results: KnowledgeRecallResultItem[];
  error_message: string | null;
}

export interface RebuildKnowledgeIndexResult {
  success: boolean;
  task_id: string;
  processed_segments: number;
  queued?: boolean;
  status?: KnowledgeTaskStatus;
}

export type ToolStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type ToolType = 'HTTP';
export type ToolMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ToolAuthType = 'NONE' | 'BEARER' | 'API_KEY_HEADER' | 'API_KEY_QUERY' | 'BASIC';
export type ToolCallStatus = 'SUCCESS' | 'FAILED' | 'APPROVAL_REQUIRED' | 'REJECTED';
export type ToolCallTriggerSource = 'TEST' | 'RUNTIME';
export type ToolApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ToolListItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
  tool_type: ToolType;
  method: ToolMethod;
  url: string;
  status: ToolStatus;
  risk_level: ToolRiskLevel;
  timeout_ms: number;
  require_approval: boolean;
  auth_type: ToolAuthType;
  call_count_today: number;
  failure_count_today: number;
  last_call_at: string | null;
  last_call_status: ToolCallStatus | null;
  agent_reference_count: number;
  created_at: string;
  updated_at: string;
}

export interface ToolCallLogItem {
  id: string;
  tool_id: string;
  trigger_source: ToolCallTriggerSource;
  status: ToolCallStatus;
  approval_request_id: string | null;
  approval_status: ToolApprovalStatus | null;
  request_url: string;
  request_method: ToolMethod;
  request_headers: Record<string, string> | null;
  request_body: unknown;
  response_status: number | null;
  response_headers: Record<string, string> | null;
  response_body: unknown;
  latency_ms: number;
  error_message: string | null;
  created_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ToolAgentReferenceItem {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_code: string;
  require_approval: boolean;
  created_at: string;
}

export interface ToolDetail extends ToolListItem {
  headers: Record<string, string> | null;
  auth_config: Record<string, unknown> | null;
  input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  call_logs: ToolCallLogItem[];
  agent_references: ToolAgentReferenceItem[];
}

export interface CreateToolInput {
  name: string;
  code: string;
  description?: string | null;
  tool_type?: ToolType;
  method: ToolMethod;
  url: string;
  risk_level?: ToolRiskLevel;
  timeout_ms?: number;
  require_approval?: boolean;
  headers?: Record<string, string> | null;
  auth_type?: ToolAuthType;
  auth_config?: Record<string, unknown> | null;
  input_schema?: Record<string, unknown> | null;
  output_schema?: Record<string, unknown> | null;
}

export interface ToolApprovalActorSummary {
  id: string;
  name: string;
  email: string;
}

export interface ToolApprovalOverview {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  runtime_pending_count: number;
  test_pending_count: number;
}

export interface ToolApprovalListItem {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_code: string;
  agent_id: string | null;
  agent_name: string | null;
  conversation_id: string | null;
  conversation_title: string | null;
  status: ToolApprovalStatus;
  trigger_source: ToolCallTriggerSource;
  execution_status: ToolCallStatus;
  request_url: string;
  request_method: ToolMethod;
  reason: string | null;
  decision_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  requested_by: ToolApprovalActorSummary | null;
  reviewed_by: ToolApprovalActorSummary | null;
}

export interface ToolApprovalDetail extends ToolApprovalListItem {
  request_headers: Record<string, string> | null;
  request_body: unknown;
  response_status: number | null;
  response_headers: Record<string, string> | null;
  response_body: unknown;
  latency_ms: number;
  error_message: string | null;
  audit_timeline: ApprovalAuditEventItem[];
}

export interface ReviewToolApprovalInput {
  decision_note?: string | null;
}

export interface UpdateToolInput {
  name?: string;
  description?: string | null;
  method?: ToolMethod;
  url?: string;
  status?: ToolStatus;
  risk_level?: ToolRiskLevel;
  timeout_ms?: number;
  require_approval?: boolean;
  headers?: Record<string, string> | null;
  auth_type?: ToolAuthType;
  auth_config?: Record<string, unknown> | null;
  input_schema?: Record<string, unknown> | null;
  output_schema?: Record<string, unknown> | null;
}

export interface TestToolInput {
  input?: Record<string, unknown>;
}

export interface TestToolResult {
  id: string;
  tool_id: string;
  status: ToolCallStatus;
  approval_request_id: string | null;
  request_url: string;
  request_method: ToolMethod;
  request_headers: Record<string, string> | null;
  request_body: unknown;
  response_status: number | null;
  response_headers: Record<string, string> | null;
  response_body: unknown;
  latency_ms: number;
  error_message: string | null;
  approval_required: boolean;
}

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';
export type ConversationMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
export type ConversationRunStatus = 'SUCCESS' | 'FAILED';

export interface ConversationUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface ConversationReferenceItem {
  id: string;
  title: string;
  snippet: string;
  score: number | null;
  source_type: string | null;
}

export interface ConversationToolCallItem {
  tool_id: string;
  tool_name: string;
  tool_code: string;
  status: ToolCallStatus;
  approval_request_id?: string | null;
  latency_ms: number;
  response_status: number | null;
  output_preview: string | null;
  error_message: string | null;
}

export interface ConversationRunStepItem {
  id: string;
  type: 'prompt' | 'tool' | 'knowledge' | 'response';
  title: string;
  status: 'done' | 'failed' | 'skipped';
  summary: string;
  trace_id?: string | null;
  span_id?: string | null;
  parent_span_id?: string | null;
  request_model?: string | null;
  tool_name?: string | null;
  retrieval_mode?: string | null;
  response_status?: number | null;
  latency_ms?: number | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  cost_total?: number | null;
  item_count?: number | null;
}

export interface ConversationMessageItem {
  id: string;
  role: ConversationMessageRole;
  content: string;
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
  created_at: string;
  created_by: ConversationUserSummary | null;
}

export interface ConversationRunItem {
  id: string;
  trace_id?: string | null;
  status: ConversationRunStatus;
  request_model: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  cost_total?: number | null;
  steps: ConversationRunStepItem[];
  error_message: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ConversationFeedbackItem {
  id: string;
  run_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  created_by: ConversationUserSummary | null;
}

export interface ConversationListItem {
  id: string;
  tenant_id: string;
  agent_id: string;
  agent_name: string;
  agent_code: string;
  user: ConversationUserSummary | null;
  title: string;
  status: ConversationStatus;
  message_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  last_run_status: ConversationRunStatus | null;
  feedback_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends ConversationListItem {
  messages: ConversationMessageItem[];
  runs: ConversationRunItem[];
  feedback: ConversationFeedbackItem[];
}

export interface CreateConversationInput {
  agent_id: string;
  message: string;
  title?: string | null;
}

export interface SendConversationMessageInput {
  message: string;
}

export interface CreateConversationFeedbackInput {
  run_id?: string | null;
  rating: number;
  comment?: string | null;
}

export interface ConversationStreamStartEvent {
  type: 'start';
  trace_id?: string | null;
  request_model: string;
  steps: ConversationRunStepItem[];
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
}

export interface ConversationStreamDeltaEvent {
  type: 'delta';
  delta: string;
}

export interface ConversationStreamDoneEvent {
  type: 'done';
  conversation: ConversationDetail;
}

export interface ConversationStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ConversationStreamEvent =
  | ConversationStreamStartEvent
  | ConversationStreamDeltaEvent
  | ConversationStreamDoneEvent
  | ConversationStreamErrorEvent;

export type MonitorWindow = '24h' | '7d';
export type MonitorModule =
  | 'agent'
  | 'prompt'
  | 'model'
  | 'knowledge'
  | 'tool'
  | 'conversation'
  | 'user'
  | 'tenant'
  | 'auth'
  | 'system';
export type MonitorEventStatus = 'SUCCESS' | 'FAILED' | 'DEGRADED';
export type MonitorEventSourceType =
  | 'operation'
  | 'model_call'
  | 'tool_call'
  | 'knowledge_recall'
  | 'conversation_run'
  | 'conversation_step';
export type MonitorRunStepType = 'prompt' | 'tool' | 'knowledge' | 'model' | 'response';

export interface MonitorSummary {
  events_total: number;
  success_rate: number;
  average_latency_ms: number;
  p95_latency_ms: number;
  total_cost: number;
  active_conversations: number;
}

export interface MonitorModuleMetricItem {
  module: MonitorModule;
  event_count: number;
  error_count: number;
  average_latency_ms: number | null;
}

export interface MonitorRunStepSummary {
  steps_total: number;
  failed_steps: number;
  average_latency_ms: number;
  total_tokens: number;
  total_cost: number;
  tool_steps: number;
  knowledge_steps: number;
  model_steps: number;
}

export interface MonitorRunStepMetricItem {
  step_type: MonitorRunStepType;
  step_count: number;
  failed_count: number;
  average_latency_ms: number;
  p95_latency_ms: number | null;
  total_tokens: number;
  total_cost: number;
}

export interface MonitorTrendPoint {
  bucket: string;
  total: number;
  success: number;
  failed: number;
  average_latency_ms: number;
}

export interface MonitorAgentRankingItem {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  run_count: number;
  success_rate: number;
  average_latency_ms: number;
}

export interface MonitorModelRankingItem {
  provider_id: string;
  provider_name: string;
  model_config_id: string | null;
  model_name: string;
  call_count: number;
  success_rate: number;
  average_latency_ms: number;
  total_cost: number;
}

export interface MonitorToolRankingItem {
  tool_id: string;
  tool_name: string;
  tool_code: string;
  call_count: number;
  failure_count: number;
  average_latency_ms: number;
}

export interface MonitorKnowledgeRankingItem {
  knowledge_id: string;
  knowledge_name: string;
  knowledge_code: string;
  recall_count: number;
  success_rate: number;
  average_latency_ms: number;
}

export interface MonitorErrorSampleItem {
  event_id: string;
  trace_id: string;
  module: MonitorModule;
  title: string;
  error_message: string;
  occurred_at: string;
}

export interface MonitorOverview {
  window: MonitorWindow;
  health: {
    control_api: HealthResponse;
    runtime: HealthResponse;
  };
  summary: MonitorSummary;
  module_breakdown: MonitorModuleMetricItem[];
  run_step_summary: MonitorRunStepSummary;
  run_step_breakdown: MonitorRunStepMetricItem[];
  latency_trend: MonitorTrendPoint[];
  agent_rankings: MonitorAgentRankingItem[];
  model_rankings: MonitorModelRankingItem[];
  tool_rankings: MonitorToolRankingItem[];
  knowledge_rankings: MonitorKnowledgeRankingItem[];
  errors: MonitorErrorSampleItem[];
}

export interface MonitorEventListItem {
  event_id: string;
  trace_id: string;
  module: MonitorModule;
  source_type: MonitorEventSourceType;
  status: MonitorEventStatus;
  title: string;
  summary: string;
  latency_ms: number | null;
  token_total: number | null;
  cost_total: number | null;
  step_type: MonitorRunStepType | null;
  occurred_at: string;
}

export interface MonitorEventDetail extends MonitorEventListItem {
  error_message: string | null;
  request_payload: unknown;
  response_payload: unknown;
  step_payload: unknown;
}

export interface MonitorTraceTimelineItem {
  event_id: string;
  trace_id: string;
  module: MonitorModule;
  source_type: MonitorEventSourceType;
  status: MonitorEventStatus;
  title: string;
  summary: string;
  step_type: MonitorRunStepType | null;
  started_at: string;
  duration_ms: number | null;
  span_id: string | null;
  parent_span_id: string | null;
}

export interface MonitorTraceMetrics {
  event_count: number;
  success_count: number;
  failed_count: number;
  degraded_count: number;
  total_latency_ms: number;
  average_latency_ms: number;
  p95_latency_ms: number | null;
  total_tokens: number;
  total_cost: number;
  module_count: number;
}

export interface MonitorTracePropagation {
  has_trace_id: boolean;
  has_span_links: boolean;
  span_count: number;
  root_span_count: number;
  orphan_span_count: number;
  missing_span_count: number;
  quality_score: number;
}

export interface MonitorTraceDetail {
  trace_id: string;
  root_event: MonitorEventListItem | null;
  events: MonitorEventDetail[];
  timeline: MonitorTraceTimelineItem[];
  metrics: MonitorTraceMetrics;
  propagation: MonitorTracePropagation;
  errors: MonitorErrorSampleItem[];
}

export interface MonitorTraceSummaryItem {
  trace_id: string;
  title: string;
  module: MonitorModule;
  event_count: number;
  failed_count: number;
  total_latency_ms: number;
  p95_latency_ms: number | null;
  occurred_at: string;
}

export interface MonitorErrorModuleItem {
  module: MonitorModule;
  error_count: number;
  trace_count: number;
  latest_error_at: string;
}

export interface MonitorObservabilityOverview {
  generated_at: string;
  window: MonitorWindow;
  trace_coverage: number;
  linked_trace_count: number;
  orphan_event_count: number;
  error_trace_count: number;
  slow_trace_count: number;
  top_error_modules: MonitorErrorModuleItem[];
  slow_traces: MonitorTraceSummaryItem[];
  recent_error_traces: MonitorTraceSummaryItem[];
}

export type PlatformEventWindow = '24h' | '7d' | '30d';
export type PlatformUsagePeriod = 'hour' | 'day';
export type PlatformEventRelationType = 'TRACE_PARENT' | 'REQUEST' | 'SOURCE_LINK' | 'USAGE_LINK' | 'HANDOFF' | 'APPROVAL' | 'ROLLUP';

export interface PlatformEventRelationItem {
  id: string;
  tenant_id: string;
  relation_type: PlatformEventRelationType | string;
  parent_event_id: string | null;
  child_event_id: string | null;
  source_event_id: string | null;
  target_event_id: string | null;
  relation_source: string | null;
  relation_key: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface PlatformUsageRollupItem {
  id: string;
  tenant_id: string;
  department_id: string | null;
  subject_type: string;
  subject_id: string | null;
  resource_type: string;
  resource_id: string | null;
  metric_type: string;
  period_type: PlatformUsagePeriod | string;
  period_start: string;
  period_end: string;
  event_count: number;
  quantity_total: number;
  amount_total: number;
  cost_total: number;
  error_count: number;
  success_count: number;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformUsageLedgerItem {
  id: string;
  tenant_id: string;
  department_id: string | null;
  user_id: string | null;
  subject_type: string;
  subject_id: string | null;
  resource_type: string;
  resource_id: string | null;
  metric_type: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
  currency: string;
  billable: boolean;
  cost_source: string | null;
  trace_id: string | null;
  request_id: string | null;
  event_id: string | null;
  source_system: string | null;
  source_id: string | null;
  occurred_at: string;
  created_at: string;
}

export interface PlatformEventListItem {
  id: string;
  tenant_id: string;
  department_id: string | null;
  user_id: string | null;
  actor_type: string;
  resource_type: string;
  resource_id: string | null;
  agent_id: string | null;
  team_id: string | null;
  plugin_id: string | null;
  channel_id: string | null;
  conversation_id: string | null;
  run_id: string | null;
  task_id: string | null;
  request_id: string | null;
  trace_id: string | null;
  parent_trace_id: string | null;
  event_source: string;
  event_type: string;
  status: string;
  severity: string;
  security_level: string;
  billable: boolean;
  summary: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  source_system: string | null;
  source_id: string | null;
  dedupe_key: string | null;
  linked_usage_count: number;
  linked_quantity_total: number;
  linked_amount_total: number;
}

export interface PlatformEventDetail extends PlatformEventListItem {
  payload_json: Record<string, unknown> | null;
  relations: PlatformEventRelationItem[];
  usage_events: PlatformUsageLedgerItem[];
}

export interface PlatformEventUsageOverview {
  generated_at: string;
  window: PlatformEventWindow;
  summary: {
    event_count: number;
    usage_count: number;
    relation_count: number;
    rollup_count: number;
    trace_count: number;
    request_count: number;
    error_count: number;
    total_quantity: number;
    total_amount: number;
    total_cost: number;
  };
  event_type_rankings: Array<{
    event_type: string;
    event_count: number;
    last_occurred_at: string;
  }>;
  metric_rankings: Array<{
    metric_type: string;
    event_count: number;
    quantity_total: number;
    amount_total: number;
    cost_total: number;
  }>;
  recent_events: PlatformEventListItem[];
  recent_usage: PlatformUsageLedgerItem[];
  recent_relations: PlatformEventRelationItem[];
  recent_rollups: PlatformUsageRollupItem[];
}

export interface PlatformUsageTrendPoint {
  bucket: string;
  metric_type: string;
  event_count: number;
  quantity_total: number;
  amount_total: number;
  cost_total: number;
}

export type PlatformUsageAnomalySeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type PlatformUsageAnomalyType =
  | 'COST_SPIKE'
  | 'EVENT_SPIKE'
  | 'ERROR_RATE'
  | 'RETRY_RATE'
  | 'NO_SUCCESS';

export interface PlatformUsageAnomalyItem {
  id: string;
  anomaly_type: PlatformUsageAnomalyType;
  severity: PlatformUsageAnomalySeverity;
  metric_type: string;
  resource_type: string;
  resource_id: string | null;
  period_type: PlatformUsagePeriod | string;
  period_start: string;
  period_end: string;
  current_value: number;
  baseline_value: number;
  ratio: number;
  threshold: number;
  event_count: number;
  error_count: number;
  retry_count: number;
  message: string;
  detected_at: string;
}

export interface PlatformUsageAnomalyOverview {
  generated_at: string;
  window: PlatformEventWindow;
  summary: {
    anomaly_count: number;
    critical_count: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    highest_severity: PlatformUsageAnomalySeverity | null;
    detection_event_id: string | null;
  };
  items: PlatformUsageAnomalyItem[];
}

export type PlatformUsageAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'CLOSED';
export type PlatformUsageAlertAction = 'ACKNOWLEDGE' | 'ESCALATE' | 'CLOSE';

export interface PlatformUsageAlertItem {
  alert_id: string;
  source_event_id: string;
  status: PlatformUsageAlertStatus;
  severity: PlatformUsageAnomalySeverity;
  title: string;
  summary: string;
  anomaly_count: number;
  highest_severity: PlatformUsageAnomalySeverity;
  assignee_id: string | null;
  notification_targets: string[];
  created_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  escalated_at: string | null;
  closed_at: string | null;
  last_action: PlatformUsageAlertAction | null;
  last_note: string | null;
}

export interface PlatformUsageAlertOverview {
  generated_at: string;
  window: PlatformEventWindow;
  summary: {
    total_count: number;
    open_count: number;
    acknowledged_count: number;
    escalated_count: number;
    closed_count: number;
    critical_count: number;
    error_count: number;
  };
  items: PlatformUsageAlertItem[];
}

export interface UpdatePlatformUsageAlertInput {
  action: PlatformUsageAlertAction;
  note?: string | null;
}

export type PlatformUsageAlertNotificationChannel = 'IN_APP' | 'WEBHOOK';
export type PlatformUsageAlertNotificationStatus = 'SENT' | 'PARTIAL' | 'SKIPPED' | 'FAILED';

export interface NotifyPlatformUsageAlertInput {
  channels?: PlatformUsageAlertNotificationChannel[];
  note?: string | null;
}

export interface PlatformUsageAlertNotificationResult {
  alert_id: string;
  status: PlatformUsageAlertNotificationStatus;
  channels: PlatformUsageAlertNotificationChannel[];
  targets: string[];
  delivery_event_id: string | null;
  webhook_status: number | null;
  message: string;
  delivered_at: string;
}

export interface PlatformUsageAlertNotificationItem {
  notification_event_id: string;
  alert_id: string;
  status: PlatformUsageAlertNotificationStatus;
  channels: PlatformUsageAlertNotificationChannel[];
  targets: string[];
  webhook_status: number | null;
  webhook_error: string | null;
  message: string;
  retry_count: number;
  retried_from_event_id: string | null;
  delivered_at: string;
  created_at: string;
  summary: string | null;
}

export interface PlatformUsageAlertNotificationOverview {
  generated_at: string;
  window: PlatformEventWindow;
  summary: {
    total_count: number;
    sent_count: number;
    partial_count: number;
    skipped_count: number;
    failed_count: number;
    retryable_count: number;
    retried_count: number;
    latest_failed_at: string | null;
  };
  items: PlatformUsageAlertNotificationItem[];
}

export type PlatformUsageAlertNotificationTaskName = 'AUTO_RETRY';

export interface PlatformUsageAlertNotificationTaskRunResult {
  task: PlatformUsageAlertNotificationTaskName;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  started_at: string;
  finished_at: string;
  scanned_count: number;
  retried_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
}

export interface PlatformUsageAlertNotificationTaskOverview {
  generated_at: string;
  scheduler_enabled: boolean;
  running: boolean;
  last_tick_at: string | null;
  next_tick_after_seconds: number | null;
  policy: {
    auto_retry_enabled: boolean;
    retry_interval_ms: number;
    retry_batch_size: number;
    max_retry_count: number;
    retry_backoff_seconds: number;
    lookback_hours: number;
    source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
  };
  summary: {
    pending_auto_retry_count: number;
    failed_notification_count: number;
    partial_notification_count: number;
    retried_notification_count: number;
    oldest_retryable_at: string | null;
  };
  last_auto_retry_result: PlatformUsageAlertNotificationTaskRunResult | null;
}

export type BillingWindow = '24h' | '7d';
export type BillingQuotaRiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNLIMITED';
export type BillingPlanStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type BillingPlanTier = 'FREE' | 'TEAM' | 'BUSINESS' | 'ENTERPRISE';
export type BillingSubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type BillingInvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'OVERDUE';
export type BillingQuotaSubjectType = 'TENANT' | 'API_KEY' | 'AGENT' | 'MODEL' | 'PLUGIN';
export type BillingQuotaMetricType = 'COST' | 'TOKEN' | 'MODEL_CALL' | 'API_CALL' | 'AGENT_RUN' | 'STORAGE_GB';
export type BillingQuotaPeriod = 'DAY' | 'MONTH';
export type BillingQuotaAction = 'WARN' | 'THROTTLE' | 'REQUIRE_APPROVAL' | 'BLOCK';
export type BillingQuotaPolicyStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export interface BillingSummary {
  total_cost: number;
  model_cost: number;
  run_step_cost: number;
  total_tokens: number;
  model_calls: number;
  projected_monthly_cost: number;
  quota_usage_rate: number;
  risky_api_key_count: number;
  subscription_status: BillingSubscriptionStatus | null;
  plan_name: string | null;
  plan_tier: BillingPlanTier | null;
  monthly_base_price: number;
  included_monthly_cost: number;
  included_monthly_tokens: number;
  included_monthly_calls: number;
  current_period_cost: number;
  current_period_tokens: number;
  current_period_calls: number;
  overage_cost: number;
  next_invoice_amount: number;
  active_quota_policy_count: number;
  quota_blocking_policy_count: number;
}

export interface BillingCostTrendPoint {
  bucket: string;
  total_cost: number;
  model_cost: number;
  run_step_cost: number;
  total_tokens: number;
}

export interface BillingProviderCostItem {
  provider_id: string;
  provider_name: string;
  provider_type: string;
  call_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost: number;
}

export interface BillingModelCostItem {
  model_config_id: string | null;
  model_name: string;
  request_model: string;
  provider_name: string;
  call_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost: number;
  average_latency_ms: number;
}

export interface BillingApiKeyQuotaItem {
  id: string;
  name: string;
  masked_key: string;
  status: TenantStatus;
  rate_limit_per_minute: number;
  daily_quota: number | null;
  used_count_today: number;
  remaining_today: number | null;
  usage_rate: number | null;
  risk_level: BillingQuotaRiskLevel;
  allow_stream: boolean;
  expires_at: string | null;
  last_used_at: string | null;
}

export interface BillingConversationCostItem {
  agent_id: string;
  agent_name: string;
  run_count: number;
  total_tokens: number;
  total_cost: number;
  average_latency_ms: number;
}

export interface BillingPlanItem {
  id: string;
  code: string;
  name: string;
  tier: BillingPlanTier;
  description: string | null;
  monthly_base_price: number;
  yearly_base_price: number;
  currency: string;
  included_monthly_cost: number;
  included_monthly_tokens: number;
  included_monthly_calls: number;
  included_storage_gb: number;
  overage_unit_price: number;
  feature_limits: Record<string, unknown> | null;
  status: BillingPlanStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BillingSubscriptionItem {
  id: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  plan_tier: BillingPlanTier;
  status: BillingSubscriptionStatus;
  billing_cycle: BillingCycle;
  currency: string;
  base_price: number;
  included_monthly_cost: number;
  included_monthly_tokens: number;
  included_monthly_calls: number;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  canceled_at: string | null;
  auto_renew: boolean;
  updated_at: string;
}

export interface BillingInvoiceItem {
  id: string;
  invoice_no: string;
  status: BillingInvoiceStatus;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  period_start: string;
  period_end: string;
  due_at: string | null;
  paid_at: string | null;
  line_items: Record<string, unknown> | null;
  created_at: string;
}

export interface BillingQuotaPolicyItem {
  id: string;
  name: string;
  subject_type: BillingQuotaSubjectType;
  subject_id: string | null;
  metric_type: BillingQuotaMetricType;
  period: BillingQuotaPeriod;
  limit_value: number;
  warn_threshold: number;
  hard_threshold: number;
  action: BillingQuotaAction;
  status: BillingQuotaPolicyStatus;
  current_usage: number;
  usage_rate: number;
  risk_level: BillingQuotaRiskLevel;
  last_evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateBillingSubscriptionInput {
  plan_id?: string;
  billing_cycle?: BillingCycle;
  status?: BillingSubscriptionStatus;
  auto_renew?: boolean;
}

export interface UpdateBillingQuotaPolicyInput {
  limit_value?: number;
  warn_threshold?: number;
  hard_threshold?: number;
  action?: BillingQuotaAction;
  status?: BillingQuotaPolicyStatus;
}

export interface BillingOverview {
  generated_at: string;
  window: BillingWindow;
  summary: BillingSummary;
  plans: BillingPlanItem[];
  subscription: BillingSubscriptionItem | null;
  invoices: BillingInvoiceItem[];
  quota_policies: BillingQuotaPolicyItem[];
  cost_trend: BillingCostTrendPoint[];
  provider_costs: BillingProviderCostItem[];
  model_costs: BillingModelCostItem[];
  quota_overview: BillingApiKeyQuotaItem[];
  risky_api_keys: BillingApiKeyQuotaItem[];
  conversation_costs: BillingConversationCostItem[];
}

export type AuditWindow = '24h' | '7d';
export type AuditEventSourceType = 'login' | 'operation' | 'approval_audit';
export type AuditEventStatus = 'SUCCESS' | 'FAILED' | 'DEGRADED';

export interface AuditSummary {
  login_total: number;
  operation_total: number;
  approval_audit_total: number;
  security_event_total: number;
  config_change_total: number;
  success_rate: number;
}

export interface AuditUserRankingItem {
  user_email: string;
  event_count: number;
  failure_count: number;
}

export interface AuditModuleRankingItem {
  module: string;
  event_count: number;
  failure_count: number;
}

export interface AuditFailureItem {
  event_id: string;
  source_type: AuditEventSourceType;
  title: string;
  error_message: string;
  occurred_at: string;
}

export interface AuditOverview {
  window: AuditWindow;
  summary: AuditSummary;
  user_rankings: AuditUserRankingItem[];
  module_rankings: AuditModuleRankingItem[];
  failures: AuditFailureItem[];
}

export interface AuditEventListItem {
  event_id: string;
  source_type: AuditEventSourceType;
  status: AuditEventStatus;
  user_email: string;
  module: string | null;
  action: string | null;
  title: string;
  summary: string;
  request_id: string | null;
  occurred_at: string;
}

export interface AuditEventDetail extends AuditEventListItem {
  ip: string | null;
  user_agent: string | null;
  path: string | null;
  method: string | null;
  status_code: number | null;
  request_summary: unknown;
  error_message: string | null;
}
