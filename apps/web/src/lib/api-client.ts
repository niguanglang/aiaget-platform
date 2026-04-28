import type {
  AgentCategoryItem,
  AgentDetail,
  AgentListItem,
  CreateModelApiKeyInput,
  CreateModelConfigInput,
  CreateModelProviderInput,
  CreateUserInput,
  CreateAgentInput,
  CreateAgentVersionInput,
  CurrentUserResponse,
  HealthResponse,
  LoginResponse,
  ModelProviderDetail,
  ModelProviderListItem,
  PaginatedResult,
  RollbackAgentInput,
  TenantListItem,
  TestModelProviderInput,
  TestModelProviderResult,
  UpdateAgentInput,
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

async function request<TResponse>(path: string, init: RequestOptions = {}): Promise<TResponse> {
  const requestId = createRequestId();
  const session = getStoredSession();
  const headers = new Headers(init.headers);

  headers.set('accept', 'application/json');
  headers.set('x-request-id', requestId);

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

export function listUsers(params: { page?: number; page_size?: number; keyword?: string; status?: string }) {
  return request<PaginatedResult<UserListItem>>(`/users?${toSearchParams(params)}`);
}

export function createUser(input: CreateUserInput) {
  return request<UserListItem>('/users', {
    method: 'POST',
    body: input,
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

function toSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value.toString());
    }
  });

  return searchParams.toString();
}
