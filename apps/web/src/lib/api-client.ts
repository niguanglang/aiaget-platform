import type {
  AgentCategoryItem,
  AgentDetail,
  AgentListItem,
  BillingOverview,
  BillingWindow,
  CreateAgentKnowledgeBindingInput,
  CreateAgentModelBindingInput,
  CreateAgentPromptBindingInput,
  CreateAgentToolBindingInput,
  CreateTenantApiKeyInput,
  CreateTenantApiKeyResult,
  AuditEventDetail,
  AuditEventListItem,
  AuditOverview,
  CreateMenuInput,
  CreateDepartmentInput,
  CreateModelApiKeyInput,
  CreateModelConfigInput,
  CreateModelProviderInput,
  CreateResourceAclInput,
  CreateKnowledgeBaseInput,
  CreateConversationFeedbackInput,
  CreateConversationInput,
  CreateUserInput,
  CreateAgentInput,
  CreateAgentVersionInput,
  ConversationDetail,
  ConversationFeedbackItem,
  ConversationListItem,
  ConversationStreamEvent,
  CurrentUserResponse,
  HealthResponse,
  KnowledgeBaseDetail,
  KnowledgeBaseListItem,
  KnowledgeDocumentDetail,
  KnowledgeOverview,
  KnowledgeRetrievalTestInput,
  KnowledgeRetrievalTestResult,
  LoginResponse,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentOverview,
  DepartmentTreeItem,
  MenuDetail,
  MenuListItem,
  MenuOverview,
  MenuRoleBindingItem,
  MenuTreeItem,
  ModelProviderDetail,
  ModelProviderListItem,
  MonitorEventDetail,
  MonitorEventListItem,
  MonitorObservabilityOverview,
  MonitorOverview,
  MonitorTraceDetail,
  PaginatedResult,
  PermissionCatalogGroup,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PublishPromptInput,
  RenderPromptInput,
  RenderPromptResult,
  RoleDetail,
  RoleListItem,
  RoleOverview,
  RollbackAgentInput,
  RollbackPromptInput,
  SecurityPolicyDetail,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyOverview,
  SecurityCenterOverview,
  SimulateSecurityPolicyInput,
  SimulateSecurityPolicyResult,
  StorageDownloadUrlResult,
  StorageEnsureBucketResult,
  StorageObjectListResult,
  StorageObjectUploadInput,
  StorageObjectUploadResult,
  StorageSettings,
  SystemSettingCategory,
  SystemSettingItem,
  SystemSettingOverview,
  TenantApiKeyListItem,
  TenantDetail,
  TenantListItem,
  TestPromptInput,
  TestPromptResult,
  ToolApprovalDetail,
  ToolApprovalOverview,
  TestToolInput,
  TestToolResult,
  TestModelProviderInput,
  TestModelProviderResult,
  ToolDetail,
  ToolListItem,
  ToolApprovalListItem,
  ReviewToolApprovalInput,
  UpdateAgentInput,
  UpdateAgentKnowledgeBindingInput,
  UpdateAgentToolBindingInput,
  UpdateDepartmentInput,
  UpdateMenuInput,
  UpdateMenuRoleBindingInput,
  UpdateSecurityPolicyInput,
  UpdateSystemSettingInput,
  UpdateToolInput,
  SendConversationMessageInput,
  UpdateTenantInput,
  RebuildKnowledgeIndexResult,
  ResourceAclCheckInput,
  ResourceAclCheckResult,
  ResourceAclItem,
  ResourceAclOptionResult,
  ResourceAclOverview,
  CreateSecurityPolicyInput,
  CreateToolInput,
  CreatePromptTemplateInput,
  CreatePromptVariableInput,
  UpdateKnowledgeBaseInput,
  UpdateKnowledgeDocumentInput,
  UpdatePromptTemplateInput,
  UpdatePromptVariableInput,
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
  UpdateResourceAclInput,
  DataScopeOverview,
  DataScopePreviewInput,
  DataScopePreviewResult,
  ReplaceRoleDataScopeInput,
  RoleDataScopeDetail,
  RoleDataScopeItem,
  UploadKnowledgeDocumentInput,
  UpdateModelConfigInput,
  UpdateModelProviderInput,
  UpdateUserInput,
  UserListItem,
} from '@aiaget/shared-types';

import { getStoredSession, type LoginInput } from '@/lib/session';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const CONTROL_API_BASE_URL =
  process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL ?? 'http://localhost:3001/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

function createRequestId() {
  return `req_${crypto.randomUUID().replaceAll('-', '')}`;
}

function createTraceContext() {
  const traceId = randomHex(16);
  const spanId = randomHex(8);

  return {
    traceId,
    traceparent: `00-${traceId}-${spanId}-01`,
  };
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function request<TResponse>(path: string, init: RequestOptions = {}): Promise<TResponse> {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers(init.headers);

  headers.set('accept', 'application/json');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (init.body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  if (!init.skipAuth && session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${CONTROL_API_BASE_URL}${path}`, {
    ...init,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers,
  });

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const message = extractErrorMessage(errorBody) ?? `Request failed with HTTP ${response.status}`;

    throw new ApiClientError(message, response.status, requestId, errorBody);
  }

  return (await response.json()) as TResponse;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(errorBody: unknown) {
  if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
    const message = (errorBody as { message?: unknown }).message;

    return Array.isArray(message) ? message.join(', ') : message?.toString();
  }

  return null;
}

export function loginRequest(input: LoginInput) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
}

export function refreshRequest(refreshToken: string) {
  return request<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken,
    },
    skipAuth: true,
  });
}

export function logoutRequest(refreshToken?: string) {
  return request<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: {
      refreshToken,
    },
  });
}

export function getMe() {
  return request<CurrentUserResponse>('/auth/me');
}

export function getControlHealth() {
  return request<HealthResponse>('/health');
}

export function getRuntimeHealth() {
  return request<HealthResponse>('/runtime/health');
}

export function listTenants(params: { page?: number; page_size?: number; keyword?: string; status?: string }) {
  return request<PaginatedResult<TenantListItem>>(`/tenants?${toSearchParams(params)}`);
}

export function listUsers(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  department_id?: string;
}) {
  return request<PaginatedResult<UserListItem>>(`/users?${toSearchParams(params)}`);
}

export function createUser(input: CreateUserInput) {
  return request<UserListItem>('/users', {
    method: 'POST',
    body: input,
  });
}

export function getTenant(tenantId: string) {
  return request<TenantDetail>(`/tenants/${tenantId}`);
}

export function updateTenant(tenantId: string, input: UpdateTenantInput) {
  return request<TenantDetail>(`/tenants/${tenantId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function getRoleOverview() {
  return request<RoleOverview>('/roles/overview');
}

export function listRolePermissionCatalog() {
  return request<PermissionCatalogGroup[]>('/roles/permissions/catalog');
}

export function listRoles(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
} = {}) {
  return request<PaginatedResult<RoleListItem>>(`/roles?${toSearchParams(params)}`);
}

export function createRole(input: CreateRoleInput) {
  return request<RoleDetail>('/roles', {
    method: 'POST',
    body: input,
  });
}

export function getRole(roleId: string) {
  return request<RoleDetail>(`/roles/${roleId}`);
}

export function updateRole(roleId: string, input: UpdateRoleInput) {
  return request<RoleDetail>(`/roles/${roleId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteRole(roleId: string) {
  return request<{ success: boolean }>(`/roles/${roleId}`, {
    method: 'DELETE',
  });
}

export function enableRole(roleId: string) {
  return request<RoleDetail>(`/roles/${roleId}/enable`, {
    method: 'POST',
  });
}

export function disableRole(roleId: string) {
  return request<RoleDetail>(`/roles/${roleId}/disable`, {
    method: 'POST',
  });
}

export function updateRolePermissions(roleId: string, input: UpdateRolePermissionsInput) {
  return request<RoleDetail>(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: input,
  });
}

export function getDataScopeOverview() {
  return request<DataScopeOverview>('/data-scopes/overview');
}

export function listRoleDataScopes(params: {
  role_id?: string;
  resource_type?: string;
  scope_type?: string;
  status?: string;
} = {}) {
  return request<RoleDataScopeItem[]>(`/data-scopes?${toSearchParams(params)}`);
}

export function getRoleDataScopes(roleId: string) {
  return request<RoleDataScopeDetail>(`/data-scopes/roles/${roleId}`);
}

export function replaceRoleDataScopes(roleId: string, input: ReplaceRoleDataScopeInput) {
  return request<RoleDataScopeDetail>(`/data-scopes/roles/${roleId}`, {
    method: 'PUT',
    body: input,
  });
}

export function previewDataScope(input: DataScopePreviewInput) {
  return request<DataScopePreviewResult>('/data-scopes/preview', {
    method: 'POST',
    body: input,
  });
}

export function getResourceAclOverview() {
  return request<ResourceAclOverview>('/resource-acls/overview');
}

export function listResourceAclOptions(params: {
  resource_type?: string;
  subject_type?: string;
  keyword?: string;
} = {}) {
  return request<ResourceAclOptionResult>(`/resource-acls/options?${toSearchParams(params)}`);
}

export function listResourceAcls(params: {
  resource_type?: string;
  resource_id?: string;
  subject_type?: string;
  subject_id?: string;
  permission_code?: string;
  effect?: string;
  status?: string;
} = {}) {
  return request<ResourceAclItem[]>(`/resource-acls?${toSearchParams(params)}`);
}

export function createResourceAcl(input: CreateResourceAclInput) {
  return request<ResourceAclItem>('/resource-acls', {
    method: 'POST',
    body: input,
  });
}

export function updateResourceAcl(resourceAclId: string, input: UpdateResourceAclInput) {
  return request<ResourceAclItem>(`/resource-acls/${resourceAclId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteResourceAcl(resourceAclId: string) {
  return request<{ success: boolean }>(`/resource-acls/${resourceAclId}`, {
    method: 'DELETE',
  });
}

export function checkResourceAcl(input: ResourceAclCheckInput) {
  return request<ResourceAclCheckResult>('/resource-acls/check', {
    method: 'POST',
    body: input,
  });
}

export function listTenantApiKeys() {
  return request<TenantApiKeyListItem[]>('/api-keys');
}

export function createTenantApiKey(input: CreateTenantApiKeyInput) {
  return request<CreateTenantApiKeyResult>('/api-keys', {
    method: 'POST',
    body: input,
  });
}

export function deleteTenantApiKey(keyId: string) {
  return request<{ success: boolean }>(`/api-keys/${keyId}`, {
    method: 'DELETE',
  });
}

export function getExternalAgentChatEndpoint(agentId = '{agentId}') {
  return `${CONTROL_API_BASE_URL}/external/agents/${agentId}/chat`;
}

export function getDepartmentOverview() {
  return request<DepartmentOverview>('/departments/overview');
}

export function getDepartmentTree() {
  return request<DepartmentTreeItem[]>('/departments/tree');
}

export function listDepartments(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  parent_id?: string;
}) {
  return request<PaginatedResult<DepartmentListItem>>(`/departments?${toSearchParams(params)}`);
}

export function createDepartment(input: CreateDepartmentInput) {
  return request<DepartmentDetail>('/departments', {
    method: 'POST',
    body: input,
  });
}

export function getDepartment(departmentId: string) {
  return request<DepartmentDetail>(`/departments/${departmentId}`);
}

export function updateDepartment(departmentId: string, input: UpdateDepartmentInput) {
  return request<DepartmentDetail>(`/departments/${departmentId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteDepartment(departmentId: string) {
  return request<{ success: boolean }>(`/departments/${departmentId}`, {
    method: 'DELETE',
  });
}

export function enableDepartment(departmentId: string) {
  return request<DepartmentDetail>(`/departments/${departmentId}/enable`, {
    method: 'POST',
  });
}

export function disableDepartment(departmentId: string) {
  return request<DepartmentDetail>(`/departments/${departmentId}/disable`, {
    method: 'POST',
  });
}

export function getMenuOverview() {
  return request<MenuOverview>('/menus/overview');
}

export function getMenuTree() {
  return request<MenuTreeItem[]>('/menus/tree');
}

export function listMenus(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  type?: string;
  status?: string;
  visible?: boolean;
}) {
  return request<PaginatedResult<MenuListItem>>(`/menus?${toSearchParams(params)}`);
}

export function createMenu(input: CreateMenuInput) {
  return request<MenuDetail>('/menus', {
    method: 'POST',
    body: input,
  });
}

export function getMenu(menuId: string) {
  return request<MenuDetail>(`/menus/${menuId}`);
}

export function updateMenu(menuId: string, input: UpdateMenuInput) {
  return request<MenuDetail>(`/menus/${menuId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteMenu(menuId: string) {
  return request<{ success: boolean }>(`/menus/${menuId}`, {
    method: 'DELETE',
  });
}

export function enableMenu(menuId: string) {
  return request<MenuDetail>(`/menus/${menuId}/enable`, {
    method: 'POST',
  });
}

export function disableMenu(menuId: string) {
  return request<MenuDetail>(`/menus/${menuId}/disable`, {
    method: 'POST',
  });
}

export function listMenuRoleBindings() {
  return request<MenuRoleBindingItem[]>('/menus/role-bindings');
}

export function updateMenuRoleBinding(roleId: string, input: UpdateMenuRoleBindingInput) {
  return request<MenuRoleBindingItem>(`/menus/role-bindings/${roleId}`, {
    method: 'PUT',
    body: input,
  });
}

export function getStorageSettings() {
  return request<StorageSettings>('/storage/settings');
}

export function ensureStorageBucket() {
  return request<StorageEnsureBucketResult>('/storage/ensure-bucket', {
    method: 'POST',
  });
}

export function listStorageObjects(params: {
  page?: number;
  page_size?: number;
  prefix?: string;
  keyword?: string;
}) {
  return request<StorageObjectListResult>(`/storage/objects?${toSearchParams(params)}`);
}

export function uploadStorageObject(input: StorageObjectUploadInput) {
  return request<StorageObjectUploadResult>('/storage/objects', {
    method: 'POST',
    body: input,
  });
}

export function deleteStorageObject(key: string) {
  return request<{ success: boolean }>(`/storage/objects?${toSearchParams({ key })}`, {
    method: 'DELETE',
  });
}

export function getStorageDownloadUrl(key: string) {
  return request<StorageDownloadUrlResult>(`/storage/objects/download-url?${toSearchParams({ key })}`);
}

export function getSystemSettingsOverview() {
  return request<SystemSettingOverview>('/system-settings/overview');
}

export function listSystemSettings(params: {
  category?: SystemSettingCategory | '';
  status?: string;
} = {}) {
  return request<SystemSettingItem[]>(`/system-settings?${toSearchParams(params)}`);
}

export function updateSystemSetting(settingId: string, input: UpdateSystemSettingInput) {
  return request<SystemSettingItem>(`/system-settings/${settingId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function resetSystemSetting(settingId: string) {
  return request<SystemSettingItem>(`/system-settings/${settingId}/reset`, {
    method: 'POST',
  });
}

export function updateUser(userId: string, input: UpdateUserInput) {
  return request<UserListItem>(`/users/${userId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteUser(userId: string) {
  return request<{ success: boolean }>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

export function listAgentCategories() {
  return request<AgentCategoryItem[]>('/agent-categories');
}

export function listAgents(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  category_id?: string;
  owner_id?: string;
}) {
  return request<PaginatedResult<AgentListItem>>(`/agents?${toSearchParams(params)}`);
}

export function createAgent(input: CreateAgentInput) {
  return request<AgentDetail>('/agents', {
    method: 'POST',
    body: input,
  });
}

export function getAgent(agentId: string) {
  return request<AgentDetail>(`/agents/${agentId}`);
}

export function updateAgent(agentId: string, input: UpdateAgentInput) {
  return request<AgentDetail>(`/agents/${agentId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgent(agentId: string) {
  return request<{ success: boolean }>(`/agents/${agentId}`, {
    method: 'DELETE',
  });
}

export function createAgentVersion(agentId: string, input: CreateAgentVersionInput) {
  return request<AgentDetail>(`/agents/${agentId}/versions`, {
    method: 'POST',
    body: input,
  });
}

export function publishAgent(agentId: string) {
  return request<AgentDetail>(`/agents/${agentId}/publish`, {
    method: 'POST',
  });
}

export function rollbackAgent(agentId: string, input: RollbackAgentInput) {
  return request<AgentDetail>(`/agents/${agentId}/rollback`, {
    method: 'POST',
    body: input,
  });
}

export function disableAgent(agentId: string) {
  return request<AgentDetail>(`/agents/${agentId}/disable`, {
    method: 'POST',
  });
}

export function archiveAgent(agentId: string) {
  return request<AgentDetail>(`/agents/${agentId}/archive`, {
    method: 'POST',
  });
}

export function createAgentModelBinding(agentId: string, input: CreateAgentModelBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/models`, {
    method: 'POST',
    body: input,
  });
}

export function deleteAgentModelBinding(agentId: string, bindingId: string) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/models/${bindingId}`, {
    method: 'DELETE',
  });
}

export function createAgentPromptBinding(agentId: string, input: CreateAgentPromptBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/prompts`, {
    method: 'POST',
    body: input,
  });
}

export function deleteAgentPromptBinding(agentId: string, bindingId: string) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/prompts/${bindingId}`, {
    method: 'DELETE',
  });
}

export function createAgentKnowledgeBinding(agentId: string, input: CreateAgentKnowledgeBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/knowledge`, {
    method: 'POST',
    body: input,
  });
}

export function updateAgentKnowledgeBinding(agentId: string, bindingId: string, input: UpdateAgentKnowledgeBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/knowledge/${bindingId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgentKnowledgeBinding(agentId: string, bindingId: string) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/knowledge/${bindingId}`, {
    method: 'DELETE',
  });
}

export function createAgentToolBinding(agentId: string, input: CreateAgentToolBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/tools`, {
    method: 'POST',
    body: input,
  });
}

export function updateAgentToolBinding(agentId: string, bindingId: string, input: UpdateAgentToolBindingInput) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/tools/${bindingId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgentToolBinding(agentId: string, bindingId: string) {
  return request<AgentDetail>(`/agents/${agentId}/bindings/tools/${bindingId}`, {
    method: 'DELETE',
  });
}

export function listModelProviders(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  provider_type?: string;
  status?: string;
  capability?: string;
}) {
  return request<PaginatedResult<ModelProviderListItem>>(`/model-providers?${toSearchParams(params)}`);
}

export function createModelProvider(input: CreateModelProviderInput) {
  return request<ModelProviderDetail>('/model-providers', {
    method: 'POST',
    body: input,
  });
}

export function getModelProvider(providerId: string) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}`);
}

export function updateModelProvider(providerId: string, input: UpdateModelProviderInput) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteModelProvider(providerId: string) {
  return request<{ success: boolean }>(`/model-providers/${providerId}`, {
    method: 'DELETE',
  });
}

export function enableModelProvider(providerId: string) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}/enable`, {
    method: 'POST',
  });
}

export function disableModelProvider(providerId: string) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}/disable`, {
    method: 'POST',
  });
}

export function createModelApiKey(providerId: string, input: CreateModelApiKeyInput) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}/api-keys`, {
    method: 'POST',
    body: input,
  });
}

export function deleteModelApiKey(providerId: string, keyId: string) {
  return request<ModelProviderDetail>(`/model-providers/${providerId}/api-keys/${keyId}`, {
    method: 'DELETE',
  });
}

export function testModelProvider(providerId: string, input: TestModelProviderInput) {
  return request<TestModelProviderResult>(`/model-providers/${providerId}/test`, {
    method: 'POST',
    body: input,
  });
}

export function createModelConfig(input: CreateModelConfigInput) {
  return request<ModelProviderDetail>('/models', {
    method: 'POST',
    body: input,
  });
}

export function updateModelConfig(modelId: string, input: UpdateModelConfigInput) {
  return request<ModelProviderDetail>(`/models/${modelId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteModelConfig(modelId: string) {
  return request<{ success: boolean }>(`/models/${modelId}`, {
    method: 'DELETE',
  });
}

export function enableModelConfig(modelId: string) {
  return request<ModelProviderDetail>(`/models/${modelId}/enable`, {
    method: 'POST',
  });
}

export function disableModelConfig(modelId: string) {
  return request<ModelProviderDetail>(`/models/${modelId}/disable`, {
    method: 'POST',
  });
}

export function listPromptTemplates(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  type?: string;
  status?: string;
  owner_id?: string;
}) {
  return request<PaginatedResult<PromptTemplateListItem>>(`/prompt-templates?${toSearchParams(params)}`);
}

export function createPromptTemplate(input: CreatePromptTemplateInput) {
  return request<PromptTemplateDetail>('/prompt-templates', {
    method: 'POST',
    body: input,
  });
}

export function getPromptTemplate(promptId: string) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}`);
}

export function updatePromptTemplate(promptId: string, input: UpdatePromptTemplateInput) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deletePromptTemplate(promptId: string) {
  return request<{ success: boolean }>(`/prompt-templates/${promptId}`, {
    method: 'DELETE',
  });
}

export function copyPromptTemplate(promptId: string) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/copy`, {
    method: 'POST',
  });
}

export function publishPromptTemplate(promptId: string, input: PublishPromptInput) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/publish`, {
    method: 'POST',
    body: input,
  });
}

export function rollbackPromptTemplate(promptId: string, input: RollbackPromptInput) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/rollback`, {
    method: 'POST',
    body: input,
  });
}

export function renderPromptTemplate(promptId: string, input: RenderPromptInput) {
  return request<RenderPromptResult>(`/prompt-templates/${promptId}/render`, {
    method: 'POST',
    body: input,
  });
}

export function testPromptTemplate(promptId: string, input: TestPromptInput) {
  return request<TestPromptResult>(`/prompt-templates/${promptId}/test`, {
    method: 'POST',
    body: input,
  });
}

export function createPromptVariable(promptId: string, input: CreatePromptVariableInput) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/variables`, {
    method: 'POST',
    body: input,
  });
}

export function updatePromptVariable(promptId: string, variableId: string, input: UpdatePromptVariableInput) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/variables/${variableId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deletePromptVariable(promptId: string, variableId: string) {
  return request<PromptTemplateDetail>(`/prompt-templates/${promptId}/variables/${variableId}`, {
    method: 'DELETE',
  });
}

export function listKnowledgeBases(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  visibility?: string;
  owner_id?: string;
}) {
  return request<PaginatedResult<KnowledgeBaseListItem>>(`/knowledge-bases?${toSearchParams(params)}`);
}

export function getKnowledgeOverview() {
  return request<KnowledgeOverview>('/knowledge-bases/overview');
}

export function createKnowledgeBase(input: CreateKnowledgeBaseInput) {
  return request<KnowledgeBaseDetail>('/knowledge-bases', {
    method: 'POST',
    body: input,
  });
}

export function getKnowledgeBase(knowledgeId: string) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}`);
}

export function updateKnowledgeBase(knowledgeId: string, input: UpdateKnowledgeBaseInput) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteKnowledgeBase(knowledgeId: string) {
  return request<{ success: boolean }>(`/knowledge-bases/${knowledgeId}`, {
    method: 'DELETE',
  });
}

export function uploadKnowledgeDocument(knowledgeId: string, input: UploadKnowledgeDocumentInput) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}/documents`, {
    method: 'POST',
    body: input,
  });
}

export function getKnowledgeDocument(knowledgeId: string, documentId: string) {
  return request<KnowledgeDocumentDetail>(`/knowledge-bases/${knowledgeId}/documents/${documentId}`);
}

export function updateKnowledgeDocument(
  knowledgeId: string,
  documentId: string,
  input: UpdateKnowledgeDocumentInput,
) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}/documents/${documentId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteKnowledgeDocument(knowledgeId: string, documentId: string) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export function reprocessKnowledgeDocument(knowledgeId: string, documentId: string) {
  return request<KnowledgeBaseDetail>(`/knowledge-bases/${knowledgeId}/documents/${documentId}/reprocess`, {
    method: 'POST',
  });
}

export function runKnowledgeRetrievalTest(knowledgeId: string, input: KnowledgeRetrievalTestInput) {
  return request<KnowledgeRetrievalTestResult>(`/knowledge-bases/${knowledgeId}/retrieval-test`, {
    method: 'POST',
    body: input,
  });
}

export function rebuildKnowledgeIndex(knowledgeId: string) {
  return request<RebuildKnowledgeIndexResult>(`/knowledge-bases/${knowledgeId}/rebuild-index`, {
    method: 'POST',
  });
}

export function listTools(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  tool_type?: string;
  status?: string;
  risk_level?: string;
}) {
  return request<PaginatedResult<ToolListItem>>(`/tools?${toSearchParams(params)}`);
}

export function createTool(input: CreateToolInput) {
  return request<ToolDetail>('/tools', {
    method: 'POST',
    body: input,
  });
}

export function getTool(toolId: string) {
  return request<ToolDetail>(`/tools/${toolId}`);
}

export function updateTool(toolId: string, input: UpdateToolInput) {
  return request<ToolDetail>(`/tools/${toolId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteTool(toolId: string) {
  return request<{ success: boolean }>(`/tools/${toolId}`, {
    method: 'DELETE',
  });
}

export function copyTool(toolId: string) {
  return request<ToolDetail>(`/tools/${toolId}/copy`, {
    method: 'POST',
  });
}

export function enableTool(toolId: string) {
  return request<ToolDetail>(`/tools/${toolId}/enable`, {
    method: 'POST',
  });
}

export function disableTool(toolId: string) {
  return request<ToolDetail>(`/tools/${toolId}/disable`, {
    method: 'POST',
  });
}

export function testTool(toolId: string, input: TestToolInput) {
  return request<TestToolResult>(`/tools/${toolId}/test`, {
    method: 'POST',
    body: input,
  });
}

export function getToolApprovalOverview() {
  return request<ToolApprovalOverview>('/tool-approvals/overview');
}

export function listToolApprovals(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  trigger_source?: string;
  tool_id?: string;
}) {
  return request<PaginatedResult<ToolApprovalListItem>>(`/tool-approvals?${toSearchParams(params)}`);
}

export function getToolApproval(approvalId: string) {
  return request<ToolApprovalDetail>(`/tool-approvals/${approvalId}`);
}

export function approveToolApproval(approvalId: string, input: ReviewToolApprovalInput) {
  return request<ToolApprovalDetail>(`/tool-approvals/${approvalId}/approve`, {
    method: 'POST',
    body: input,
  });
}

export function rejectToolApproval(approvalId: string, input: ReviewToolApprovalInput) {
  return request<ToolApprovalDetail>(`/tool-approvals/${approvalId}/reject`, {
    method: 'POST',
    body: input,
  });
}

export function listConversations(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  agent_id?: string;
  status?: string;
}) {
  return request<PaginatedResult<ConversationListItem>>(`/conversations?${toSearchParams(params)}`);
}

export function createConversation(input: CreateConversationInput) {
  return request<ConversationDetail>('/conversations', {
    method: 'POST',
    body: input,
  });
}

export function getConversation(conversationId: string) {
  return request<ConversationDetail>(`/conversations/${conversationId}`);
}

export function deleteConversation(conversationId: string) {
  return request<{ success: boolean }>(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

export function sendConversationMessage(conversationId: string, input: SendConversationMessageInput) {
  return request<ConversationDetail>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: input,
  });
}

export async function streamConversationMessage(
  conversationId: string,
  input: SendConversationMessageInput,
  handlers: {
    onEvent: (event: ConversationStreamEvent) => void;
  },
) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();

  headers.set('accept', 'text/event-stream');
  headers.set('content-type', 'application/json');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${CONTROL_API_BASE_URL}/conversations/${conversationId}/messages/stream`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers,
  });

  if (!response.ok || !response.body) {
    const errorBody = await safeJson(response);
    const message = extractErrorMessage(errorBody) ?? `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId, errorBody);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (rawEvent) {
        const parsed = parseSseEvent(rawEvent);
        if (parsed) {
          handlers.onEvent(parsed);
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const parsed = parseSseEvent(tail);
    if (parsed) {
      handlers.onEvent(parsed);
    }
  }
}

export function createConversationFeedback(conversationId: string, input: CreateConversationFeedbackInput) {
  return request<ConversationFeedbackItem>(`/conversations/${conversationId}/feedback`, {
    method: 'POST',
    body: input,
  });
}

export function getMonitorOverview(params: { window?: string }) {
  return request<MonitorOverview>(`/monitor/overview?${toSearchParams(params)}`);
}

export function listMonitorEvents(params: {
  page?: number;
  page_size?: number;
  window?: string;
  module?: string;
  status?: string;
  source_type?: string;
  step_type?: string;
  keyword?: string;
}) {
  return request<PaginatedResult<MonitorEventListItem>>(`/monitor/events?${toSearchParams(params)}`);
}

export function getMonitorEvent(eventId: string) {
  return request<MonitorEventDetail>(`/monitor/events/${eventId}`);
}

export function getMonitorTrace(traceId: string, params: { window?: string } = {}) {
  return request<MonitorTraceDetail>(`/monitor/traces/${traceId}?${toSearchParams(params)}`);
}

export function getMonitorObservabilityOverview(params: { window?: string }) {
  return request<MonitorObservabilityOverview>(`/monitor/observability?${toSearchParams(params)}`);
}

export function getBillingOverview(params: { window?: BillingWindow }) {
  return request<BillingOverview>(`/billing/overview?${toSearchParams(params)}`);
}

export function getAuditOverview(params: { window?: string }) {
  return request<AuditOverview>(`/audit/overview?${toSearchParams(params)}`);
}

export function listAuditEvents(params: {
  page?: number;
  page_size?: number;
  window?: string;
  source_type?: string;
  status?: string;
  keyword?: string;
}) {
  return request<PaginatedResult<AuditEventListItem>>(`/audit/events?${toSearchParams(params)}`);
}

export function getAuditEvent(eventId: string) {
  return request<AuditEventDetail>(`/audit/events/${eventId}`);
}

export function getSecurityPolicyOverview() {
  return request<SecurityPolicyOverview>('/security-policies/overview');
}

export function getSecurityCenterOverview() {
  return request<SecurityCenterOverview>('/security-center/overview');
}

export function listSecurityPolicies(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  effect?: string;
  resource_type?: string;
}) {
  return request<PaginatedResult<SecurityPolicyListItem>>(`/security-policies?${toSearchParams(params)}`);
}

export function createSecurityPolicy(input: CreateSecurityPolicyInput) {
  return request<SecurityPolicyDetail>('/security-policies', {
    method: 'POST',
    body: input,
  });
}

export function getSecurityPolicy(policyId: string) {
  return request<SecurityPolicyDetail>(`/security-policies/${policyId}`);
}

export function updateSecurityPolicy(policyId: string, input: UpdateSecurityPolicyInput) {
  return request<SecurityPolicyDetail>(`/security-policies/${policyId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteSecurityPolicy(policyId: string) {
  return request<{ success: boolean }>(`/security-policies/${policyId}`, {
    method: 'DELETE',
  });
}

export function enableSecurityPolicy(policyId: string) {
  return request<SecurityPolicyDetail>(`/security-policies/${policyId}/enable`, {
    method: 'POST',
  });
}

export function disableSecurityPolicy(policyId: string) {
  return request<SecurityPolicyDetail>(`/security-policies/${policyId}/disable`, {
    method: 'POST',
  });
}

export function simulateSecurityPolicy(input: SimulateSecurityPolicyInput) {
  return request<SimulateSecurityPolicyResult>('/security-policies/simulate', {
    method: 'POST',
    body: input,
  });
}

export function listSecurityPolicyEvaluations(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  decision?: string;
  action?: string;
}) {
  return request<PaginatedResult<SecurityPolicyEvaluationItem>>(
    `/security-policies/evaluations?${toSearchParams(params)}`,
  );
}

function toSearchParams(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value.toString());
    }
  });

  return searchParams.toString();
}

function parseSseEvent(rawEvent: string): ConversationStreamEvent | null {
  const lines = rawEvent.split('\n');
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return JSON.parse(dataLines.join('\n')) as ConversationStreamEvent;
}
