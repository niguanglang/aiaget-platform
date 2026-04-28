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

export type TenantStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

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

export interface UserListItem {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  status: UserStatus;
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
  roleCodes?: string[];
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  status?: UserStatus;
  roleCodes?: string[];
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

export interface AgentDetail extends AgentListItem {
  temperature: number;
  max_context_tokens: number;
  enable_stream: boolean;
  enable_log: boolean;
  versions: AgentVersionItem[];
  audit_logs: AgentAuditLogItem[];
  bindings: {
    models: unknown[];
    prompts: unknown[];
    knowledge: unknown[];
    tools: unknown[];
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
