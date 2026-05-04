import type {
  ApprovalAuditArchiveApprovalDetail,
  ApprovalAuditArchiveApprovalItem,
  ApprovalAuditArchiveApprovalOverview,
  ApprovalAuditArchiveListResult,
  ApprovalAuditEventItem,
  ApprovalAuditEventStatus,
  ApprovalAuditEventType,
  ApprovalAuditOverview,
  ApprovalAuditSourceType,
  ApprovalAuditWindow,
  CreateApprovalAuditArchiveResult,
  AgentCategoryItem,
  AgentTeamDetail,
  AgentTeamListItem,
  AgentTeamOverview,
  AgentTeamRunReportArchiveApprovalItem,
  AgentTeamRunReportArchiveListResult,
  AgentDetail,
  AgentListItem,
  BillingOverview,
  BillingQuotaPolicyItem,
  BillingSubscriptionItem,
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
  CreateAgentTeamFeedbackInput,
  CreateAgentTeamHandoffInput,
  CreateAgentTeamInput,
  CreateAgentTeamMemberInput,
  CreateAgentTeamRunReportArchiveResult,
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
  ChannelSenderDeliveryDetail,
  ChannelRolloutGateOverview,
  ChannelSenderPolicy,
  ChannelSenderTaskOverview,
  ChannelSenderTaskRunResult,
  ChannelPublishApprovalInput,
  ChannelPublishControl,
  ChannelPublishRolloutInput,
  ChannelReleaseBatchInput,
  ChannelReleaseAutomationOverview,
  ChannelReleaseAutomationPolicyInput,
  ChannelReleaseGateOverview,
  ChannelReleaseGatePolicyInput,
  ChannelReleasePipeline,
  ChannelReleaseReport,
  ChannelReleaseReportSnapshotCompareResult,
  ChannelReleaseReportSnapshotDetail,
  ChannelReleaseReportSnapshotOverview,
  ChannelReleaseSchedulerOverview,
  ChannelReleaseSchedulerRunResult,
  ChannelReleaseSelfHealingOverview,
  ChannelReleaseSelfHealingPolicyInput,
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
  NotifyPlatformUsageAlertInput,
  NotifySecurityOperationAlertInput,
  UpdateSecurityOperationAlertInput,
  MonitorOverview,
  MonitorTraceDetail,
  NotificationPolicyApprovalOverview,
  NotificationPolicyAuditOverview,
  NotificationPolicyChangePreview,
  NotificationPolicySnapshotOverview,
  PlatformEventDetail,
  PlatformEventListItem,
  PlatformEventRelationItem,
  PlatformEventUsageOverview,
  PlatformUsageAnomalyOverview,
  PlatformUsageAlertItem,
  PlatformUsageAlertNotificationOverview,
  PlatformUsageAlertNotificationResult,
  PlatformUsageAlertNotificationStatus,
  PlatformUsageAlertNotificationTaskOverview,
  PlatformUsageAlertNotificationTaskRunResult,
  PlatformUsageAlertOverview,
  PlatformUsageLedgerItem,
  PlatformUsageRollupItem,
  PlatformUsageTrendPoint,
  PaginatedResult,
  PermissionCatalogGroup,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PluginHookItem,
  PluginInstallationDetail,
  PluginInstallationItem,
  PluginMarketItem,
  PluginMenuBindingItem,
  PluginOverview,
  PublishChannelListItem,
  PublishChannelOverview,
  PublishPromptInput,
  RenderPromptInput,
  RenderPromptResult,
  RoleDetail,
  RoleListItem,
  RoleOverview,
  RollbackAgentInput,
  RollbackPromptInput,
  ExternalApiObservabilityOverview,
  ExternalApiObservabilityWindow,
  ListChannelSenderDeliveriesResult,
  ListWebhookDeliveriesResult,
  RetryChannelSenderDeliveryResult,
  RetryWebhookDeliveryResult,
  WebhookDeliveryDetail,
  SecurityPolicyDetail,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyOverview,
  SecurityCenterEventDetail,
  SecurityCenterEventListItem,
  SecurityCenterEventWindow,
  SecurityCenterOverview,
  SecurityApprovalWorkbenchDetail,
  SecurityApprovalWorkbenchItem,
  SecurityApprovalWorkbenchOverview,
  ListSecurityApprovalWorkbenchQuery,
  ReviewSecurityApprovalWorkbenchInput,
  SecurityOperationAlertActionResult,
  SecurityOperationAlertNotificationArchiveApprovalDetail,
  SecurityOperationAlertNotificationArchiveApprovalItem,
  SecurityOperationAlertNotificationArchiveApprovalOverview,
  SecurityOperationAlertNotificationArchiveListResult,
  SecurityOperationAlertNotificationOverview,
  SecurityOperationAlertNotificationResult,
  SecurityOperationAlertNotificationTaskRecoveryActionInput,
  SecurityOperationAlertNotificationTaskRecoveryActionResult,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult,
  SecurityOperationAlertNotificationTaskRecoveryAuditOverview,
  SecurityOperationAlertNotificationTaskOverview,
  SecurityOperationAlertNotificationTaskRunOverview,
  SecurityOperationAlertNotificationTaskRunResult,
  ListSecurityOperationAlertNotificationsParams,
  ListSecurityOperationAlertNotificationTaskRecoveryAuditsParams,
  CreateSecurityOperationAlertNotificationArchiveResult,
  ListSecurityOperationAlertSlaDeadLetterAuditsParams,
  CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult,
  CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult,
  ReviewToolApprovalInput,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  SecurityOperationAlertSlaDeadLetterAuditArchiveListResult,
  SecurityOperationAlertSlaDeadLetterAuditItem,
  SecurityOperationAlertSlaDeadLetterActionInput,
  SecurityOperationAlertSlaDeadLetterActionResult,
  SecurityOperationAlertSlaDeadLetterOverview,
  SecurityOperationAlertSlaOverview,
  SecurityOperationAlertSlaNotificationOverview,
  SecurityOperationAlertSlaNotificationItem,
  SecurityOperationAlertSlaNotificationRetryOverview,
  SecurityOperationAlertSlaNotificationRetryTaskRunResult,
  SecurityOperationAlertSlaNotificationResult,
  SecurityOperationAlertSlaTaskRunResult,
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
  SystemSettingSnapshotApprovalStatus,
  SystemSettingSnapshotItem,
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
  ReviewAgentTeamHandoffInput,
  RollbackSystemSettingSnapshotInput,
  ReviewNotificationPolicyApprovalInput,
  UpdateAgentInput,
  UpdateAgentTeamInput,
  UpdateAgentTeamMemberInput,
  UpdateAgentKnowledgeBindingInput,
  UpdateAgentToolBindingInput,
  UpdateDepartmentInput,
  UpdateMenuInput,
  UpdateMenuRoleBindingInput,
  UpdateSecurityPolicyInput,
  UpdateSystemSettingInput,
  UpdateToolInput,
  SendConversationMessageInput,
  StartAgentTeamRunInput,
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
  UpdatePublishChannelInput,
  UpdateChannelPublishControlInput,
  UpdateChannelSenderPolicyInput,
  UpdatePluginHookInput,
  UpdatePluginInstallationInput,
  UpdatePluginMenuBindingInput,
  UpdatePromptTemplateInput,
  UpdatePromptVariableInput,
  UpdateBillingQuotaPolicyInput,
  UpdateBillingSubscriptionInput,
  UpdatePlatformUsageAlertInput,
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
  UpsertPublishChannelInput,
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

export function getExternalApiObservability(params: { window?: ExternalApiObservabilityWindow } = {}) {
  return request<ExternalApiObservabilityOverview>(`/api-keys/external-observability?${toSearchParams(params)}`);
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

export function listWebhookDeliveries(params: { api_key_id?: string } = {}) {
  return request<ListWebhookDeliveriesResult>(`/api-keys/webhook-deliveries?${toSearchParams(params)}`);
}

export function getWebhookDelivery(deliveryId: string) {
  return request<WebhookDeliveryDetail>(`/api-keys/webhook-deliveries/${deliveryId}`);
}

export function retryWebhookDelivery(deliveryId: string) {
  return request<RetryWebhookDeliveryResult>(`/api-keys/webhook-deliveries/${deliveryId}/retry`, {
    method: 'POST',
  });
}

export function getExternalAgentChatEndpoint(agentId = '{agentId}') {
  return `${CONTROL_API_BASE_URL}/external/agents/${agentId}/chat`;
}

export function getExternalChannelChatEndpoint(channelId = '{channelId}') {
  return `${CONTROL_API_BASE_URL}/external/channels/${channelId}/chat`;
}

export function getExternalChannelStreamEndpoint(channelId = '{channelId}') {
  return `${CONTROL_API_BASE_URL}/external/channels/${channelId}/chat/stream`;
}

export function getExternalChannelCallbackEndpoint(channelId = '{channelId}') {
  return `${CONTROL_API_BASE_URL}/external/channels/${channelId}/callback`;
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

export function previewNotificationPolicySettingChange(settingId: string, input: UpdateSystemSettingInput) {
  return request<NotificationPolicyChangePreview>(`/system-settings/notification-policy/preview/${settingId}`, {
    method: 'POST',
    body: input,
  });
}

export function getNotificationPolicyAudit() {
  return request<NotificationPolicyAuditOverview>('/system-settings/notification-policy/audit');
}

export function listNotificationPolicySnapshots() {
  return request<NotificationPolicySnapshotOverview>('/system-settings/notification-policy/snapshots');
}

export function rollbackNotificationPolicySnapshot(snapshotId: string, input: RollbackSystemSettingSnapshotInput = {}) {
  return request<SystemSettingItem>(`/system-settings/notification-policy/snapshots/${snapshotId}/rollback`, {
    method: 'POST',
    body: input,
  });
}

export function getNotificationPolicyApprovalOverview() {
  return request<NotificationPolicyApprovalOverview>('/system-settings/notification-policy/approvals/overview');
}

export function listNotificationPolicyApprovals(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: SystemSettingSnapshotApprovalStatus | '';
}) {
  return request<PaginatedResult<SystemSettingSnapshotItem>>(
    `/system-settings/notification-policy/approvals?${toSearchParams(params)}`,
  );
}

export function getNotificationPolicyApproval(snapshotId: string) {
  return request<SystemSettingSnapshotItem>(`/system-settings/notification-policy/approvals/${snapshotId}`);
}

export function approveNotificationPolicyApproval(snapshotId: string, input: ReviewNotificationPolicyApprovalInput) {
  return request<SystemSettingSnapshotItem>(`/system-settings/notification-policy/approvals/${snapshotId}/approve`, {
    method: 'POST',
    body: input,
  });
}

export function rejectNotificationPolicyApproval(snapshotId: string, input: ReviewNotificationPolicyApprovalInput) {
  return request<SystemSettingSnapshotItem>(`/system-settings/notification-policy/approvals/${snapshotId}/reject`, {
    method: 'POST',
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

export function getPublishChannelOverview() {
  return request<PublishChannelOverview>('/channels/overview');
}

export function listChannelSenderDeliveries(params: {
  channel_id?: string;
  status?: string;
  provider?: string;
} = {}) {
  return request<ListChannelSenderDeliveriesResult>(`/channels/sender-deliveries?${toSearchParams(params)}`);
}

export function getChannelSenderDelivery(deliveryId: string) {
  return request<ChannelSenderDeliveryDetail>(`/channels/sender-deliveries/${deliveryId}`);
}

export function retryChannelSenderDelivery(deliveryId: string) {
  return request<RetryChannelSenderDeliveryResult>(`/channels/sender-deliveries/${deliveryId}/retry`, {
    method: 'POST',
  });
}

export function getChannelSenderPolicy(channelId: string) {
  return request<ChannelSenderPolicy>(`/channels/${channelId}/sender-policy`);
}

export function updateChannelSenderPolicy(channelId: string, input: UpdateChannelSenderPolicyInput) {
  return request<ChannelSenderPolicy>(`/channels/${channelId}/sender-policy`, {
    method: 'PUT',
    body: input,
  });
}

export function getChannelSenderTaskOverview() {
  return request<ChannelSenderTaskOverview>('/channels/sender-tasks/overview');
}

export function runChannelSenderAutoRetry() {
  return request<ChannelSenderTaskRunResult>('/channels/sender-tasks/run-auto-retry', {
    method: 'POST',
  });
}

export function runChannelSenderCleanup() {
  return request<ChannelSenderTaskRunResult>('/channels/sender-tasks/run-cleanup', {
    method: 'POST',
  });
}

export function getChannelReleaseSchedulerOverview() {
  return request<ChannelReleaseSchedulerOverview>('/channels/release-scheduler/overview');
}

export function runChannelReleaseSchedulerOnce() {
  return request<ChannelReleaseSchedulerRunResult>('/channels/release-scheduler/run-once', {
    method: 'POST',
  });
}

export function upsertPublishChannel(input: UpsertPublishChannelInput) {
  return request<PublishChannelListItem>('/channels', {
    method: 'POST',
    body: input,
  });
}

export function updatePublishChannel(channelId: string, input: UpdatePublishChannelInput) {
  return request<PublishChannelListItem>(`/channels/${channelId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function enablePublishChannel(channelId: string) {
  return request<PublishChannelListItem>(`/channels/${channelId}/enable`, {
    method: 'POST',
  });
}

export function disablePublishChannel(channelId: string) {
  return request<PublishChannelListItem>(`/channels/${channelId}/disable`, {
    method: 'POST',
  });
}

export function checkPublishChannel(channelId: string) {
  return request<PublishChannelListItem>(`/channels/${channelId}/check`, {
    method: 'POST',
  });
}

export function getChannelPublishControl(channelId: string) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control`);
}

export function getChannelRolloutGateOverview(channelId: string) {
  return request<ChannelRolloutGateOverview>(`/channels/${channelId}/rollout-gate/overview`);
}

export function getChannelReleasePipeline(channelId: string) {
  return request<ChannelReleasePipeline>(`/channels/${channelId}/release-pipeline`);
}

export function getChannelReleaseReport(channelId: string) {
  return request<ChannelReleaseReport>(`/channels/${channelId}/release-report`);
}

export function listChannelReleaseReportSnapshots(channelId: string) {
  return request<ChannelReleaseReportSnapshotOverview>(`/channels/${channelId}/release-report/snapshots`);
}

export function createChannelReleaseReportSnapshot(channelId: string) {
  return request<ChannelReleaseReportSnapshotDetail>(`/channels/${channelId}/release-report/snapshots`, {
    method: 'POST',
  });
}

export function getChannelReleaseReportSnapshot(channelId: string, snapshotId: string) {
  return request<ChannelReleaseReportSnapshotDetail>(`/channels/${channelId}/release-report/snapshots/${snapshotId}`);
}

export function compareChannelReleaseReportSnapshots(channelId: string, baseSnapshotId: string, targetSnapshotId: string) {
  return request<ChannelReleaseReportSnapshotCompareResult>(
    `/channels/${channelId}/release-report/snapshots/${baseSnapshotId}/compare/${targetSnapshotId}`,
  );
}

export function startChannelReleaseBatch(channelId: string, input: ChannelReleaseBatchInput) {
  return request<ChannelReleasePipeline>(`/channels/${channelId}/release-pipeline/start`, {
    method: 'POST',
    body: input,
  });
}

export function markChannelReleaseFull(channelId: string, input: ChannelReleaseBatchInput) {
  return request<ChannelReleasePipeline>(`/channels/${channelId}/release-pipeline/mark-full`, {
    method: 'POST',
    body: input,
  });
}

export function abortChannelReleaseBatch(channelId: string, input: ChannelReleaseBatchInput) {
  return request<ChannelReleasePipeline>(`/channels/${channelId}/release-pipeline/abort`, {
    method: 'POST',
    body: input,
  });
}

export function getChannelReleaseGate(channelId: string) {
  return request<ChannelReleaseGateOverview>(`/channels/${channelId}/release-gate`);
}

export function updateChannelReleaseGate(channelId: string, input: ChannelReleaseGatePolicyInput) {
  return request<ChannelReleaseGateOverview>(`/channels/${channelId}/release-gate`, {
    method: 'PUT',
    body: input,
  });
}

export function evaluateChannelReleaseGate(channelId: string) {
  return request<ChannelReleaseGateOverview>(`/channels/${channelId}/release-gate/evaluate`, {
    method: 'POST',
  });
}

export function getChannelReleaseAutomation(channelId: string) {
  return request<ChannelReleaseAutomationOverview>(`/channels/${channelId}/release-automation`);
}

export function updateChannelReleaseAutomation(channelId: string, input: ChannelReleaseAutomationPolicyInput) {
  return request<ChannelReleaseAutomationOverview>(`/channels/${channelId}/release-automation`, {
    method: 'PUT',
    body: input,
  });
}

export function runChannelReleaseAutomation(channelId: string) {
  return request<ChannelReleaseAutomationOverview>(`/channels/${channelId}/release-automation/run`, {
    method: 'POST',
  });
}

export function getChannelReleaseSelfHealing(channelId: string) {
  return request<ChannelReleaseSelfHealingOverview>(`/channels/${channelId}/release-self-healing`);
}

export function updateChannelReleaseSelfHealing(channelId: string, input: ChannelReleaseSelfHealingPolicyInput) {
  return request<ChannelReleaseSelfHealingOverview>(`/channels/${channelId}/release-self-healing`, {
    method: 'PUT',
    body: input,
  });
}

export function runChannelReleaseSelfHealing(channelId: string) {
  return request<ChannelReleaseSelfHealingOverview>(`/channels/${channelId}/release-self-healing/run`, {
    method: 'POST',
  });
}

export function updateChannelPublishControl(channelId: string, input: UpdateChannelPublishControlInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control`, {
    method: 'PUT',
    body: input,
  });
}

export function requestChannelPublishApproval(channelId: string, input: ChannelPublishApprovalInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control/request-approval`, {
    method: 'POST',
    body: input,
  });
}

export function approveChannelPublish(channelId: string, input: ChannelPublishApprovalInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control/approve`, {
    method: 'POST',
    body: input,
  });
}

export function rejectChannelPublish(channelId: string, input: ChannelPublishApprovalInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control/reject`, {
    method: 'POST',
    body: input,
  });
}

export function updateChannelRollout(channelId: string, input: ChannelPublishRolloutInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control/rollout`, {
    method: 'POST',
    body: input,
  });
}

export function rollbackChannelPublish(channelId: string, input: ChannelPublishApprovalInput) {
  return request<ChannelPublishControl>(`/channels/${channelId}/publish-control/rollback`, {
    method: 'POST',
    body: input,
  });
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

export function getAgentTeamOverview() {
  return request<AgentTeamOverview>('/agent-teams/overview');
}

export function listAgentTeams(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  mode?: string;
  owner_id?: string;
}) {
  return request<PaginatedResult<AgentTeamListItem>>(`/agent-teams?${toSearchParams(params)}`);
}

export function createAgentTeam(input: CreateAgentTeamInput) {
  return request<AgentTeamDetail>('/agent-teams', {
    method: 'POST',
    body: input,
  });
}

export function getAgentTeam(teamId: string) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}`);
}

export function updateAgentTeam(teamId: string, input: UpdateAgentTeamInput) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgentTeam(teamId: string) {
  return request<{ success: boolean }>(`/agent-teams/${teamId}`, {
    method: 'DELETE',
  });
}

export function createAgentTeamMember(teamId: string, input: CreateAgentTeamMemberInput) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}/members`, {
    method: 'POST',
    body: input,
  });
}

export function updateAgentTeamMember(teamId: string, memberId: string, input: UpdateAgentTeamMemberInput) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}/members/${memberId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgentTeamMember(teamId: string, memberId: string) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export function startAgentTeamRun(teamId: string, input: StartAgentTeamRunInput) {
  return request<AgentTeamDetail>(`/agent-teams/${teamId}/runs`, {
    method: 'POST',
    body: input,
  });
}

export function createAgentTeamHandoff(runId: string, input: CreateAgentTeamHandoffInput) {
  return request<AgentTeamDetail>(`/agent-teams/runs/${runId}/handoff`, {
    method: 'POST',
    body: input,
  });
}

export function approveAgentTeamHandoff(handoffId: string, input: ReviewAgentTeamHandoffInput) {
  return request<AgentTeamDetail>(`/agent-teams/handoffs/${handoffId}/approve`, {
    method: 'POST',
    body: input,
  });
}

export function rejectAgentTeamHandoff(handoffId: string, input: ReviewAgentTeamHandoffInput) {
  return request<AgentTeamDetail>(`/agent-teams/handoffs/${handoffId}/reject`, {
    method: 'POST',
    body: input,
  });
}

export function createAgentTeamFeedback(runId: string, input: CreateAgentTeamFeedbackInput) {
  return request<unknown>(`/agent-teams/runs/${runId}/feedback`, {
    method: 'POST',
    body: input,
  });
}

export async function exportAgentTeamRunReport(runId: string) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${CONTROL_API_BASE_URL}/agent-teams/runs/${runId}/report/export`, {
    headers,
  });

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function createAgentTeamRunReportArchive(runId: string) {
  return request<CreateAgentTeamRunReportArchiveResult>(`/agent-teams/runs/${runId}/report/archives`, {
    method: 'POST',
  });
}

export function listAgentTeamRunReportArchives() {
  return request<AgentTeamRunReportArchiveListResult>('/agent-teams/report/archives');
}

export function getAgentTeamRunReportArchiveDownloadUrl(archiveId: string) {
  return request<StorageDownloadUrlResult>(`/agent-teams/report/archives/${archiveId}/download-url`);
}

export function deleteAgentTeamRunReportArchive(archiveId: string) {
  return request<{ success: boolean; approval_id: string }>(`/agent-teams/report/archives/${archiveId}`, {
    method: 'DELETE',
  });
}

export function listAgentTeamRunReportArchiveApprovals() {
  return request<AgentTeamRunReportArchiveApprovalItem[]>('/agent-teams/report/archive-approvals');
}

export function approveAgentTeamRunReportArchiveApproval(approvalId: string, input: ReviewAgentTeamHandoffInput) {
  return request<AgentTeamRunReportArchiveApprovalItem>(`/agent-teams/report/archive-approvals/${approvalId}/approve`, {
    method: 'POST',
    body: input,
  });
}

export function rejectAgentTeamRunReportArchiveApproval(approvalId: string, input: ReviewAgentTeamHandoffInput) {
  return request<AgentTeamRunReportArchiveApprovalItem>(`/agent-teams/report/archive-approvals/${approvalId}/reject`, {
    method: 'POST',
    body: input,
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

export function getPluginOverview() {
  return request<PluginOverview>('/plugins/overview');
}

export function listPluginMarket() {
  return request<PluginMarketItem[]>('/plugins/market');
}

export function listPluginInstallations() {
  return request<PluginInstallationItem[]>('/plugins/installations');
}

export function getPluginInstallation(pluginId: string) {
  return request<PluginInstallationDetail>(`/plugins/${pluginId}`);
}

export function installPlugin(input: PluginMarketItem) {
  return request<PluginInstallationDetail>('/plugins/install', {
    method: 'POST',
    body: {
      code: input.code,
      name: input.name,
      provider: input.provider,
      description: input.description,
      latest_version: input.latest_version,
      source_type: 'MARKET',
      permission_preview: input.permission_codes,
      risk_level: input.risk_level,
    },
  });
}

export function updatePluginInstallation(pluginId: string, input: UpdatePluginInstallationInput) {
  return request<PluginInstallationDetail>(`/plugins/${pluginId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function enablePlugin(pluginId: string) {
  return request<PluginInstallationDetail>(`/plugins/${pluginId}/enable`, {
    method: 'POST',
  });
}

export function disablePlugin(pluginId: string) {
  return request<PluginInstallationDetail>(`/plugins/${pluginId}/disable`, {
    method: 'POST',
  });
}

export function upgradePlugin(pluginId: string) {
  return request<PluginInstallationDetail>(`/plugins/${pluginId}/upgrade`, {
    method: 'POST',
  });
}

export function updatePluginHook(pluginId: string, hookId: string, input: UpdatePluginHookInput) {
  return request<PluginHookItem>(`/plugins/${pluginId}/hooks/${hookId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function updatePluginMenuBinding(pluginId: string, bindingId: string, input: UpdatePluginMenuBindingInput) {
  return request<PluginMenuBindingItem>(`/plugins/${pluginId}/menu-bindings/${bindingId}`, {
    method: 'PATCH',
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

export function getApprovalAuditOverview(params: { window?: ApprovalAuditWindow }) {
  return request<ApprovalAuditOverview>(`/tool-approvals/audit-events/overview?${toSearchParams(params)}`);
}

export function listApprovalAuditEvents(params: {
  page?: number;
  page_size?: number;
  window?: ApprovalAuditWindow;
  keyword?: string;
  source_type?: ApprovalAuditSourceType | '';
  event_type?: ApprovalAuditEventType | '';
  event_status?: ApprovalAuditEventStatus | '';
  trace_only?: boolean;
}) {
  return request<PaginatedResult<ApprovalAuditEventItem>>(`/tool-approvals/audit-events?${toSearchParams(params)}`);
}

export function getApprovalAuditEvent(eventId: string) {
  return request<ApprovalAuditEventItem>(`/tool-approvals/audit-events/${eventId}`);
}

export async function exportApprovalAuditEvents(params: {
  window?: ApprovalAuditWindow;
  keyword?: string;
  source_type?: ApprovalAuditSourceType | '';
  event_type?: ApprovalAuditEventType | '';
  event_status?: ApprovalAuditEventStatus | '';
  trace_only?: boolean;
}) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(
    `${CONTROL_API_BASE_URL}/tool-approvals/audit-events/export?${toSearchParams(params)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function createApprovalAuditArchive(params: {
  window?: ApprovalAuditWindow;
  keyword?: string;
  source_type?: ApprovalAuditSourceType | '';
  event_type?: ApprovalAuditEventType | '';
  event_status?: ApprovalAuditEventStatus | '';
  trace_only?: boolean;
}) {
  return request<CreateApprovalAuditArchiveResult>(`/tool-approvals/audit-events/archives?${toSearchParams(params)}`, {
    method: 'POST',
  });
}

export function listApprovalAuditArchives() {
  return request<ApprovalAuditArchiveListResult>('/tool-approvals/audit-events/archives');
}

export function getApprovalAuditArchiveDownloadUrl(archiveId: string) {
  return request<StorageDownloadUrlResult>(`/tool-approvals/audit-events/archives/${archiveId}/download-url`);
}

export function deleteApprovalAuditArchive(archiveId: string) {
  return request<{ success: boolean; approval_id: string }>(`/tool-approvals/audit-events/archives/${archiveId}`, {
    method: 'DELETE',
  });
}

export function getApprovalAuditArchiveApprovalOverview() {
  return request<ApprovalAuditArchiveApprovalOverview>('/tool-approvals/audit-events/archive-approvals/overview');
}

export function listApprovalAuditArchiveApprovals() {
  return request<ApprovalAuditArchiveApprovalItem[]>('/tool-approvals/audit-events/archive-approvals');
}

export function getApprovalAuditArchiveApproval(approvalId: string) {
  return request<ApprovalAuditArchiveApprovalDetail>(`/tool-approvals/audit-events/archive-approvals/${approvalId}`);
}

export function approveApprovalAuditArchiveApproval(approvalId: string, input: ReviewToolApprovalInput) {
  return request<ApprovalAuditArchiveApprovalDetail>(
    `/tool-approvals/audit-events/archive-approvals/${approvalId}/approve`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function rejectApprovalAuditArchiveApproval(approvalId: string, input: ReviewToolApprovalInput) {
  return request<ApprovalAuditArchiveApprovalDetail>(
    `/tool-approvals/audit-events/archive-approvals/${approvalId}/reject`,
    {
      method: 'POST',
      body: input,
    },
  );
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

export function listPlatformEvents(params: {
  page?: number;
  page_size?: number;
  window?: string;
  event_type?: string;
  resource_type?: string;
  status?: string;
  severity?: string;
  trace_id?: string;
  request_id?: string;
  source_system?: string;
  keyword?: string;
}) {
  return request<PaginatedResult<PlatformEventListItem>>(`/platform-events?${toSearchParams(params)}`);
}

export function getPlatformEvent(eventId: string) {
  return request<PlatformEventDetail>(`/platform-events/${eventId}`);
}

export function listPlatformEventRelations(eventId: string) {
  return request<PlatformEventRelationItem[]>(`/platform-events/${eventId}/relations`);
}

export function getPlatformUsageOverview(params: { window?: string }) {
  return request<PlatformEventUsageOverview>(`/platform-usage/overview?${toSearchParams(params)}`);
}

export function listPlatformUsageTrends(params: {
  window?: string;
  period?: string;
  metric_type?: string;
  resource_type?: string;
}) {
  return request<PlatformUsageTrendPoint[]>(`/platform-usage/trends?${toSearchParams(params)}`);
}

export function listPlatformUsageLedger(params: {
  page?: number;
  page_size?: number;
  window?: string;
  subject_type?: string;
  resource_type?: string;
  metric_type?: string;
  billable?: boolean;
  trace_id?: string;
  request_id?: string;
  event_id?: string;
  source_system?: string;
  keyword?: string;
}) {
  return request<PaginatedResult<PlatformUsageLedgerItem>>(`/platform-usage/ledger?${toSearchParams(params)}`);
}

export function rebuildPlatformUsageRollups(params: { window?: string }) {
  return request<{ rebuilt_count: number; items: PlatformUsageRollupItem[] }>(`/platform-usage/rollups/rebuild?${toSearchParams(params)}`, {
    method: 'POST',
  });
}

export function detectPlatformUsageAnomalies(params: { window?: string }) {
  return request<PlatformUsageAnomalyOverview>(`/platform-usage/anomalies/detect?${toSearchParams(params)}`, {
    method: 'POST',
  });
}

export function listPlatformUsageAlerts(params: { window?: string }) {
  return request<PlatformUsageAlertOverview>(`/platform-usage/alerts?${toSearchParams(params)}`);
}

export function updatePlatformUsageAlert(alertId: string, input: UpdatePlatformUsageAlertInput) {
  return request<PlatformUsageAlertItem>(`/platform-usage/alerts/${alertId}/actions`, {
    method: 'POST',
    body: input,
  });
}

export function notifyPlatformUsageAlert(alertId: string, input: NotifyPlatformUsageAlertInput = {}) {
  return request<PlatformUsageAlertNotificationResult>(`/platform-usage/alerts/${alertId}/notify`, {
    method: 'POST',
    body: input,
  });
}

export function listPlatformUsageAlertNotifications(params: {
  window?: string;
  status?: PlatformUsageAlertNotificationStatus;
  alert_id?: string;
} = {}) {
  return request<PlatformUsageAlertNotificationOverview>(`/platform-usage/alert-notifications?${toSearchParams(params)}`);
}

export function retryPlatformUsageAlertNotification(notificationEventId: string) {
  return request<PlatformUsageAlertNotificationResult>(`/platform-usage/alert-notifications/${notificationEventId}/retry`, {
    method: 'POST',
  });
}

export function getPlatformUsageAlertNotificationTaskOverview() {
  return request<PlatformUsageAlertNotificationTaskOverview>('/platform-usage/alert-notification-tasks/overview');
}

export function runPlatformUsageAlertNotificationAutoRetry() {
  return request<PlatformUsageAlertNotificationTaskRunResult>('/platform-usage/alert-notification-tasks/run-auto-retry', {
    method: 'POST',
  });
}

export function getBillingOverview(params: { window?: BillingWindow }) {
  return request<BillingOverview>(`/billing/overview?${toSearchParams(params)}`);
}

export function updateBillingSubscription(input: UpdateBillingSubscriptionInput) {
  return request<BillingSubscriptionItem>('/billing/subscription', {
    method: 'PATCH',
    body: input,
  });
}

export function updateBillingQuotaPolicy(id: string, input: UpdateBillingQuotaPolicyInput) {
  return request<BillingQuotaPolicyItem>(`/billing/quota-policies/${id}`, {
    method: 'PATCH',
    body: input,
  });
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

export function getSecurityApprovalWorkbenchOverview() {
  return request<SecurityApprovalWorkbenchOverview>('/security-center/approval-workbench/overview');
}

export function listSecurityApprovalWorkbenchItems(params: ListSecurityApprovalWorkbenchQuery = {}) {
  return request<PaginatedResult<SecurityApprovalWorkbenchItem>>(
    `/security-center/approval-workbench?${toSearchParams({
      page: params.page,
      page_size: params.page_size,
      keyword: params.keyword,
      type: params.type,
      status: params.status,
      risk_domain: params.risk_domain,
    })}`,
  );
}

export async function exportSecurityApprovalWorkbenchItems(params: ListSecurityApprovalWorkbenchQuery = {}) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(
    `${CONTROL_API_BASE_URL}/security-center/approval-workbench/export?${toSearchParams({
      keyword: params.keyword,
      type: params.type,
      status: params.status,
      risk_domain: params.risk_domain,
    })}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function getSecurityApprovalWorkbenchItem(approvalId: string) {
  return request<SecurityApprovalWorkbenchDetail>(`/security-center/approval-workbench/${approvalId}`);
}

export function reviewSecurityApprovalWorkbenchItem(
  approvalId: string,
  input: ReviewSecurityApprovalWorkbenchInput,
) {
  return request<SecurityApprovalWorkbenchDetail>(`/security-center/approval-workbench/${approvalId}/review`, {
    method: 'POST',
    body: input,
  });
}

export function listSecurityCenterEvents(params: {
  page?: number;
  page_size?: number;
  window?: SecurityCenterEventWindow;
  source?: string;
  keyword?: string;
  trace_only?: boolean;
}) {
  return request<PaginatedResult<SecurityCenterEventListItem>>(`/security-center/events?${toSearchParams(params)}`);
}

export function getSecurityCenterEvent(eventId: string) {
  return request<SecurityCenterEventDetail>(`/security-center/events/${eventId}`);
}

export function notifySecurityOperationAlert(alertId: string, input: NotifySecurityOperationAlertInput) {
  return request<SecurityOperationAlertNotificationResult>(`/security-center/operation-alerts/${alertId}/notify`, {
    method: 'POST',
    body: input,
  });
}

export function updateSecurityOperationAlert(alertId: string, input: UpdateSecurityOperationAlertInput) {
  return request<SecurityOperationAlertActionResult>(`/security-center/operation-alerts/${alertId}/actions`, {
    method: 'POST',
    body: input,
  });
}

export function listSecurityOperationAlertNotifications(params: ListSecurityOperationAlertNotificationsParams = {}) {
  return request<SecurityOperationAlertNotificationOverview>(
    `/security-center/operation-alert-notifications?${toSearchParams(toSecurityOperationAlertNotificationQuery(params))}`,
  );
}

export async function exportSecurityOperationAlertNotifications(
  params: ListSecurityOperationAlertNotificationsParams = {},
) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(
    `${CONTROL_API_BASE_URL}/security-center/operation-alert-notifications/export?${toSearchParams(toSecurityOperationAlertNotificationQuery(params))}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function createSecurityOperationAlertNotificationArchive(
  params: ListSecurityOperationAlertNotificationsParams = {},
) {
  return request<CreateSecurityOperationAlertNotificationArchiveResult>(
    `/security-center/operation-alert-notifications/archives?${toSearchParams(toSecurityOperationAlertNotificationQuery(params))}`,
    {
      method: 'POST',
    },
  );
}

function toSecurityOperationAlertNotificationQuery(params: ListSecurityOperationAlertNotificationsParams = {}) {
  return {
    status: params.status,
    alert_category: params.alert_category,
    keyword: params.keyword,
  };
}

export function listSecurityOperationAlertNotificationArchives() {
  return request<SecurityOperationAlertNotificationArchiveListResult>(
    '/security-center/operation-alert-notifications/archives',
  );
}

export function getSecurityOperationAlertNotificationArchiveDownloadUrl(archiveId: string) {
  return request<StorageDownloadUrlResult>(
    `/security-center/operation-alert-notifications/archives/${archiveId}/download-url`,
  );
}

export function deleteSecurityOperationAlertNotificationArchive(archiveId: string) {
  return request<{ success: boolean; approval_id: string }>(
    `/security-center/operation-alert-notifications/archives/${archiveId}`,
    {
      method: 'DELETE',
    },
  );
}

export function getSecurityOperationAlertNotificationArchiveApprovalOverview() {
  return request<SecurityOperationAlertNotificationArchiveApprovalOverview>(
    '/security-center/operation-alert-notifications/archive-approvals/overview',
  );
}

export function listSecurityOperationAlertNotificationArchiveApprovals() {
  return request<SecurityOperationAlertNotificationArchiveApprovalItem[]>(
    '/security-center/operation-alert-notifications/archive-approvals',
  );
}

export function getSecurityOperationAlertNotificationArchiveApproval(approvalId: string) {
  return request<SecurityOperationAlertNotificationArchiveApprovalDetail>(
    `/security-center/operation-alert-notifications/archive-approvals/${approvalId}`,
  );
}

export function approveSecurityOperationAlertNotificationArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertNotificationArchiveApprovalDetail>(
    `/security-center/operation-alert-notifications/archive-approvals/${approvalId}/approve`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function rejectSecurityOperationAlertNotificationArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertNotificationArchiveApprovalDetail>(
    `/security-center/operation-alert-notifications/archive-approvals/${approvalId}/reject`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function retrySecurityOperationAlertNotification(notificationEventId: string) {
  return request<SecurityOperationAlertNotificationResult>(
    `/security-center/operation-alert-notifications/${notificationEventId}/retry`,
    {
      method: 'POST',
    },
  );
}

export function getSecurityOperationAlertNotificationTaskOverview() {
  return request<SecurityOperationAlertNotificationTaskOverview>(
    '/security-center/operation-alert-notification-tasks/overview',
  );
}

export function listSecurityOperationAlertNotificationTaskRuns(params: {
  task?: string;
  status?: string;
  keyword?: string;
} = {}) {
  return request<SecurityOperationAlertNotificationTaskRunOverview>(
    `/security-center/operation-alert-notification-tasks/runs?${toSearchParams(params)}`,
  );
}

export function runSecurityOperationAlertNotificationAutoNotify() {
  return request<SecurityOperationAlertNotificationTaskRunResult>(
    '/security-center/operation-alert-notification-tasks/run-auto-notify',
    {
      method: 'POST',
    },
  );
}

export function runSecurityOperationAlertNotificationAutoRetry() {
  return request<SecurityOperationAlertNotificationTaskRunResult>(
    '/security-center/operation-alert-notification-tasks/run-auto-retry',
    {
      method: 'POST',
    },
  );
}

export function updateSecurityOperationAlertNotificationTaskRecoverySuggestion(
  suggestionId: string,
  input: SecurityOperationAlertNotificationTaskRecoveryActionInput,
) {
  return request<SecurityOperationAlertNotificationTaskRecoveryActionResult>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/${suggestionId}/actions`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function listSecurityOperationAlertNotificationTaskRecoveryAudits(params: {
  action?: string;
  status?: string;
  reason_code?: string;
  failure_source?: string;
  keyword?: string;
} = {}) {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditOverview>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits?${toSearchParams(params)}`,
  );
}

export async function exportSecurityOperationAlertNotificationTaskRecoveryAudits(
  params: ListSecurityOperationAlertNotificationTaskRecoveryAuditsParams = {},
) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();
  const queryParams = {
    action: params.action,
    status: params.status,
    reason_code: params.reason_code,
    failure_source: params.failure_source,
    keyword: params.keyword,
  };

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(
    `${CONTROL_API_BASE_URL}/security-center/operation-alert-notification-task-recovery-suggestions/audits/export?${toSearchParams(queryParams)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function createSecurityOperationAlertNotificationTaskRecoveryAuditArchive(
  params: ListSecurityOperationAlertNotificationTaskRecoveryAuditsParams = {},
) {
  const queryParams = {
    action: params.action,
    status: params.status,
    reason_code: params.reason_code,
    failure_source: params.failure_source,
    keyword: params.keyword,
  };

  return request<CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archives?${toSearchParams(queryParams)}`,
    {
      method: 'POST',
    },
  );
}

export function listSecurityOperationAlertNotificationTaskRecoveryAuditArchives() {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult>(
    '/security-center/operation-alert-notification-task-recovery-suggestions/audits/archives',
  );
}

export function getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl(archiveId: string) {
  return request<StorageDownloadUrlResult>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archives/${archiveId}/download-url`,
  );
}

export function deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive(archiveId: string) {
  return request<{ success: boolean; approval_id: string }>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archives/${archiveId}`,
    {
      method: 'DELETE',
    },
  );
}

export function getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview() {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview>(
    '/security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/overview',
  );
}

export function listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals() {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[]>(
    '/security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals',
  );
}

export function getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(approvalId: string) {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/${approvalId}`,
  );
}

export function approveSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/${approvalId}/approve`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function rejectSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/${approvalId}/reject`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function getSecurityOperationAlertSlaOverview() {
  return request<SecurityOperationAlertSlaOverview>('/security-center/operation-alert-sla/overview');
}

export function runSecurityOperationAlertSlaEscalation() {
  return request<SecurityOperationAlertSlaTaskRunResult>('/security-center/operation-alert-sla/run-escalation', {
    method: 'POST',
  });
}

export function getSecurityOperationAlertSlaNotificationOverview() {
  return request<SecurityOperationAlertSlaNotificationOverview>(
    '/security-center/operation-alert-sla/notifications/overview',
  );
}

export function notifySecurityOperationAlertSlaOverdue() {
  return request<SecurityOperationAlertSlaNotificationResult>('/security-center/operation-alert-sla/notify-overdue', {
    method: 'POST',
  });
}

export function getSecurityOperationAlertSlaNotificationRetryOverview() {
  return request<SecurityOperationAlertSlaNotificationRetryOverview>(
    '/security-center/operation-alert-sla/notification-retry/overview',
  );
}

export function runSecurityOperationAlertSlaNotificationAutoRetry() {
  return request<SecurityOperationAlertSlaNotificationRetryTaskRunResult>(
    '/security-center/operation-alert-sla/notification-retry/run',
    {
      method: 'POST',
    },
  );
}

export function retrySecurityOperationAlertSlaNotification(notificationEventId: string) {
  return request<SecurityOperationAlertSlaNotificationItem>(
    `/security-center/operation-alert-sla/notifications/${notificationEventId}/retry`,
    {
      method: 'POST',
    },
  );
}

export function getSecurityOperationAlertSlaDeadLetterOverview() {
  return request<SecurityOperationAlertSlaDeadLetterOverview>(
    '/security-center/operation-alert-sla/dead-letters/overview',
  );
}

export function handleSecurityOperationAlertSlaDeadLetterAction(
  notificationEventId: string,
  input: SecurityOperationAlertSlaDeadLetterActionInput,
) {
  return request<SecurityOperationAlertSlaDeadLetterActionResult>(
    `/security-center/operation-alert-sla/dead-letters/${notificationEventId}/actions`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function listSecurityOperationAlertSlaDeadLetterAudits(
  params: ListSecurityOperationAlertSlaDeadLetterAuditsParams = {},
) {
  const queryParams = {
    action: params.action,
    alert_category: params.alert_category,
    disposition_status: params.disposition_status,
    keyword: params.keyword,
    page: params.page,
    page_size: params.page_size,
  };

  return request<PaginatedResult<SecurityOperationAlertSlaDeadLetterAuditItem>>(
    `/security-center/operation-alert-sla/dead-letter-audits?${toSearchParams(queryParams)}`,
  );
}

export async function exportSecurityOperationAlertSlaDeadLetterAudits(
  params: ListSecurityOperationAlertSlaDeadLetterAuditsParams = {},
) {
  const requestId = createRequestId();
  const traceContext = createTraceContext();
  const session = getStoredSession();
  const headers = new Headers();
  const queryParams = {
    action: params.action,
    alert_category: params.alert_category,
    disposition_status: params.disposition_status,
    keyword: params.keyword,
    page: params.page,
    page_size: params.page_size,
  };

  headers.set('accept', 'text/csv');
  headers.set('x-request-id', requestId);
  headers.set('x-trace-id', traceContext.traceId);
  headers.set('traceparent', traceContext.traceparent);

  if (session?.accessToken) {
    headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(
    `${CONTROL_API_BASE_URL}/security-center/operation-alert-sla/dead-letter-audits/export?${toSearchParams(queryParams)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const message = (await response.text()) || `Request failed with HTTP ${response.status}`;
    throw new ApiClientError(message, response.status, requestId);
  }

  return response.blob();
}

export function createSecurityOperationAlertSlaDeadLetterAuditArchive(
  params: ListSecurityOperationAlertSlaDeadLetterAuditsParams = {},
) {
  const queryParams = {
    action: params.action,
    alert_category: params.alert_category,
    disposition_status: params.disposition_status,
    keyword: params.keyword,
  };

  return request<CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult>(
    `/security-center/operation-alert-sla/dead-letter-audits/archives?${toSearchParams(queryParams)}`,
    {
      method: 'POST',
    },
  );
}

export function listSecurityOperationAlertSlaDeadLetterAuditArchives() {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveListResult>(
    '/security-center/operation-alert-sla/dead-letter-audits/archives',
  );
}

export function getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl(archiveId: string) {
  return request<StorageDownloadUrlResult>(
    `/security-center/operation-alert-sla/dead-letter-audits/archives/${archiveId}/download-url`,
  );
}

export function deleteSecurityOperationAlertSlaDeadLetterAuditArchive(archiveId: string) {
  return request<{ success: boolean; approval_id: string }>(
    `/security-center/operation-alert-sla/dead-letter-audits/archives/${archiveId}`,
    {
      method: 'DELETE',
    },
  );
}

export function getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview() {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview>(
    '/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/overview',
  );
}

export function listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals() {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]>(
    '/security-center/operation-alert-sla/dead-letter-audits/archive-approvals',
  );
}

export function getSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approvalId: string) {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/${approvalId}`,
  );
}

export function approveSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/${approvalId}/approve`,
    {
      method: 'POST',
      body: input,
    },
  );
}

export function rejectSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(
  approvalId: string,
  input: ReviewToolApprovalInput,
) {
  return request<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail>(
    `/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/${approvalId}/reject`,
    {
      method: 'POST',
      body: input,
    },
  );
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
