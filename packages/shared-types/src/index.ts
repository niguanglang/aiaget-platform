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
  agentAgentView: 'agent:agent:view',
  agentAgentManage: 'agent:agent:manage',
  agentAgentUse: 'agent:agent:use',
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

export type BillingWindow = '24h' | '7d';
export type BillingQuotaRiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNLIMITED';

export interface BillingSummary {
  total_cost: number;
  model_cost: number;
  run_step_cost: number;
  total_tokens: number;
  model_calls: number;
  projected_monthly_cost: number;
  quota_usage_rate: number;
  risky_api_key_count: number;
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

export interface BillingOverview {
  generated_at: string;
  window: BillingWindow;
  summary: BillingSummary;
  cost_trend: BillingCostTrendPoint[];
  provider_costs: BillingProviderCostItem[];
  model_costs: BillingModelCostItem[];
  quota_overview: BillingApiKeyQuotaItem[];
  risky_api_keys: BillingApiKeyQuotaItem[];
  conversation_costs: BillingConversationCostItem[];
}

export type AuditWindow = '24h' | '7d';
export type AuditEventSourceType = 'login' | 'operation';
export type AuditEventStatus = 'SUCCESS' | 'FAILED' | 'DEGRADED';

export interface AuditSummary {
  login_total: number;
  operation_total: number;
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
