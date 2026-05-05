from typing import Any, Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field, PrivateAttr


class HealthResponse(BaseModel):
    service: str
    status: Literal["healthy", "degraded", "unavailable"]
    timestamp: str
    version: str


class WorkflowStartRequest(BaseModel):
    task_id: str


class AgentTeamWorkflowStartRequest(BaseModel):
    run_id: str


class ChannelReleaseAutomationWorkflowStartRequest(BaseModel):
    channel_id: str


class ChannelReleaseSelfHealingWorkflowStartRequest(BaseModel):
    channel_id: str


class AgentTeamWorkflowResumeRequest(BaseModel):
    run_id: str
    approved: bool = True
    handoff_id: str | None = None
    decision_note: str | None = None
    completed_member_ids: list[str] = Field(default_factory=list)
    previous_outputs: list[str] = Field(default_factory=list)
    next_round_index: int = 1


class RuntimeAgentTeamResumeContext(BaseModel):
    handoff_id: str | None = None
    decision_note: str | None = None
    completed_member_ids: list[str] = Field(default_factory=list)
    previous_outputs: list[str] = Field(default_factory=list)
    next_round_index: int = 1


class RuntimeAgentTeamResumeSignal(BaseModel):
    approved: bool
    handoff_id: str | None = None
    decision_note: str | None = None
    completed_member_ids: list[str] = Field(default_factory=list)
    previous_outputs: list[str] = Field(default_factory=list)
    next_round_index: int = 1


class WorkflowStartResponse(BaseModel):
    workflow_id: str
    run_id: str
    status: Literal["STARTED"]
    backend: Literal["TEMPORAL", "LOCAL_FALLBACK"]


class WorkflowSignalResponse(BaseModel):
    workflow_id: str
    run_id: str
    status: Literal["SIGNALED", "RESUMED"]
    backend: Literal["TEMPORAL", "LOCAL_FALLBACK"]


class RuntimeConversationMessage(BaseModel):
    role: Literal["USER", "ASSISTANT", "SYSTEM", "TOOL"]
    content: str


class RuntimePromptMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class RuntimeModelConfig(BaseModel):
    provider_type: str
    base_url: str
    api_key: str
    model: str
    temperature: float = 0.7
    input_price: float = 0
    output_price: float = 0


class RuntimeSupervisorPolicy(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    runtime_model_config: RuntimeModelConfig | None = Field(default=None, alias="model_config")
    prompt: str | None = None
    failure_policy: str = "MATCH_HANDOFF_POLICY"
    quality_gate_enabled: bool = False
    quality_threshold: float = 0.75
    budget_token_limit: int | None = None
    budget_cost_limit: float | None = None


class RuntimeAgentSnapshot(BaseModel):
    tenant_id: str
    user_id: str
    agent_id: str
    name: str
    code: str
    status: str = "DRAFT"
    version: int = 0
    temperature: float = 0.7
    max_context_tokens: int = 4096
    enable_stream: bool = True
    enable_log: bool = True


class RuntimePromptVariable(BaseModel):
    name: str
    default_value: str | None = None


class RuntimePromptSnapshot(BaseModel):
    binding_id: str
    prompt_id: str
    prompt_type: str
    role: Literal["system", "user", "assistant"] = "system"
    template_name: str
    template_code: str
    template_type: str
    content: str
    variables: list[RuntimePromptVariable] = Field(default_factory=list)


class RuntimeKnowledgeBindingSnapshot(BaseModel):
    binding_id: str
    knowledge_id: str
    knowledge_name: str
    knowledge_code: str
    weight: int = 100
    recall_top_k: int = 5


class RuntimeToolSnapshot(BaseModel):
    binding_id: str
    tool_id: str
    tool_name: str
    tool_code: str
    tool_type: str = "HTTP"
    method: str = "POST"
    risk_level: str = "LOW"
    require_approval: bool = False
    binding_require_approval: bool = False


class RuntimeControlApiSnapshot(BaseModel):
    base_url: str
    internal_token: str


class RuntimeToolCallSummary(BaseModel):
    tool_id: str | None = None
    tool_name: str
    tool_code: str
    status: Literal["SUCCESS", "FAILED", "APPROVAL_REQUIRED", "REJECTED"]
    approval_request_id: str | None = None
    latency_ms: int
    response_status: int | None = None
    output_preview: str | None = None
    error_message: str | None = None


class RuntimeReferenceHint(BaseModel):
    id: str
    title: str
    snippet: str
    score: float | None = None
    source_type: str | None = None


class RuntimeRetrievalResult(BaseModel):
    references: list[RuntimeReferenceHint] = Field(default_factory=list)
    mode: str = "HYBRID"
    latency_ms: int = 0
    cost_total: float = 0


class RuntimeConversationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    _runtime_rendered_prompts: list[RuntimePromptMessage] | None = PrivateAttr(default=None)
    _runtime_references: list[RuntimeReferenceHint] | None = PrivateAttr(default=None)
    _runtime_tool_calls: list[RuntimeToolCallSummary] | None = PrivateAttr(default=None)

    request_id: str | None = None
    trace_id: str | None = None
    parent_span_id: str | None = None
    traceparent: str | None = None
    conversation_id: str | None = None
    agent: RuntimeAgentSnapshot | None = None
    agent_name: str
    agent_code: str
    user_message: str
    history: list[RuntimeConversationMessage] = Field(default_factory=list)
    prompt_messages: list[RuntimePromptMessage] = Field(default_factory=list)
    prompts: list[RuntimePromptSnapshot] = Field(default_factory=list)
    knowledge_bindings: list[RuntimeKnowledgeBindingSnapshot] = Field(default_factory=list)
    tools: list[RuntimeToolSnapshot] = Field(default_factory=list)
    tool_calls: list[RuntimeToolCallSummary] = Field(default_factory=list)
    references: list[RuntimeReferenceHint] = Field(default_factory=list)
    control_api: RuntimeControlApiSnapshot | None = None
    runtime_model_config: RuntimeModelConfig | None = Field(default=None, alias="model_config")
    resume_context: RuntimeAgentTeamResumeContext | None = None


class RuntimeConversationStep(BaseModel):
    id: str
    type: Literal["prompt", "tool", "knowledge", "response"]
    title: str
    status: Literal["done", "failed", "skipped"]
    summary: str
    trace_id: str | None = None
    span_id: str | None = None
    parent_span_id: str | None = None
    request_model: str | None = None
    tool_name: str | None = None
    retrieval_mode: str | None = None
    response_status: int | None = None
    latency_ms: int | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    cost_total: float | None = None
    item_count: int | None = None


class RuntimeModelCallSummary(BaseModel):
    trace_id: str
    status: Literal["SUCCESS", "FAILED"]
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    request_summary: dict[str, Any]
    response_summary: dict[str, Any]
    error_message: str | None = None


class RuntimeConversationResponse(BaseModel):
    trace_id: str
    status: Literal["SUCCESS", "FAILED"] = "SUCCESS"
    assistant_message: str
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    steps: list[RuntimeConversationStep]
    references: list[RuntimeReferenceHint]
    tool_calls: list[RuntimeToolCallSummary]
    model_call: RuntimeModelCallSummary | None = None
    error_message: str | None = None


class RuntimeAgentTeamSnapshot(BaseModel):
    tenant_id: str
    user_id: str
    team_id: str
    name: str
    code: str
    status: str = "ACTIVE"
    mode: Literal["SEQUENTIAL", "PARALLEL", "SUPERVISOR"] = "SEQUENTIAL"
    max_rounds: int = 3
    timeout_seconds: int = 300
    handoff_policy: str = "AUTO"
    supervisor_model_id: str | None = None
    supervisor_prompt: str | None = None
    failure_policy: str = "MATCH_HANDOFF_POLICY"
    quality_gate_enabled: bool = False
    quality_threshold: float = 0.75
    budget_token_limit: int | None = None
    budget_cost_limit: float | None = None
    supervisor_policy: RuntimeSupervisorPolicy | None = None


class RuntimeAgentTeamMemberRequest(BaseModel):
    member_id: str
    role: str
    responsibility: str | None = None
    execution_order: int = 0
    required: bool = True
    agent_request: RuntimeConversationRequest


class RuntimeAgentTeamRequest(BaseModel):
    request_id: str | None = None
    trace_id: str | None = None
    parent_span_id: str | None = None
    traceparent: str | None = None
    run_id: str
    objective: str
    team: RuntimeAgentTeamSnapshot
    members: list[RuntimeAgentTeamMemberRequest] = Field(default_factory=list)
    resume_context: RuntimeAgentTeamResumeContext | None = None


class RuntimeAgentTeamStepResult(BaseModel):
    member_id: str | None = None
    agent_id: str | None = None
    step_type: Literal["PLAN", "AGENT_RUN", "HANDOFF", "VERIFY", "SUMMARY"]
    title: str
    status: Literal["PENDING", "RUNNING", "SUCCESS", "FAILED", "SKIPPED"]
    input_summary: str | None = None
    output_summary: str | None = None
    trace_id: str | None = None
    span_id: str | None = None
    parent_span_id: str | None = None
    duration_ms: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_total: float = 0
    error_message: str | None = None
    started_at: str | None = None
    ended_at: str | None = None


class RuntimeAgentTeamHandoffResult(BaseModel):
    from_member_id: str | None = None
    to_member_id: str | None = None
    from_agent_id: str | None = None
    to_agent_id: str | None = None
    reason: str
    status: Literal["PENDING", "APPROVED", "REJECTED", "AUTO"] = "AUTO"
    decision_note: str | None = None
    decided_at: str | None = None


class RuntimeAgentTeamMemberResult(BaseModel):
    member_id: str
    agent_id: str | None = None
    agent_name: str
    agent_code: str
    status: Literal["SUCCESS", "FAILED"]
    assistant_message: str
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_total: float = 0
    latency_ms: int
    steps: list[RuntimeConversationStep] = Field(default_factory=list)
    references: list[RuntimeReferenceHint] = Field(default_factory=list)
    tool_calls: list[RuntimeToolCallSummary] = Field(default_factory=list)
    model_call: RuntimeModelCallSummary | None = None
    error_message: str | None = None


class RuntimeAgentTeamResponse(BaseModel):
    trace_id: str
    status: Literal["SUCCESS", "FAILED", "WAITING_HUMAN"]
    summary: str
    total_tokens: int
    total_cost: float
    latency_ms: int
    steps: list[RuntimeAgentTeamStepResult] = Field(default_factory=list)
    handoffs: list[RuntimeAgentTeamHandoffResult] = Field(default_factory=list)
    member_results: list[RuntimeAgentTeamMemberResult] = Field(default_factory=list)
    error_message: str | None = None


class AgentGraphState(TypedDict, total=False):
    request: RuntimeConversationRequest
    steps: list[RuntimeConversationStep]
    trace_id: str
    span_id: str
    parent_span_id: str | None
    status: Literal["SUCCESS", "FAILED"]
    assistant_message: str
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    model_call: RuntimeModelCallSummary | None
    error_message: str | None
    rendered_prompts: list[RuntimePromptMessage]
    references: list[RuntimeReferenceHint]
    tool_calls: list[RuntimeToolCallSummary]
