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
  output_text: string | null;
  latency_ms: number;
  error_message: string | null;
}
