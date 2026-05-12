# M41 Runtime 执行下沉

## 目标

M41 把会话执行从 Control API 继续下沉到 Runtime：

```text
Control API：鉴权、租户、权限、配置快照、内部适配、结果持久化
Runtime：Agent 图执行、提示词渲染、知识检索决策、工具触发决策、模型调用、响应收口
```

## 已实现

- 会话 Runtime 请求升级为配置快照：
  - `agent`
  - `prompts`
  - `knowledge_bindings`
  - `tools`
  - `model_config`
  - `control_api`
- Runtime LangGraph 节点升级：
  - `load_agent_config`
  - `render_prompt`
  - `retrieve_knowledge`
  - `call_tools`
  - `execute_model`
  - `finalize_response`
- Control API 新增内部 Runtime 适配接口：
  - `POST /api/v1/runtime/internal/knowledge/retrieve`
  - `POST /api/v1/runtime/internal/tools/call`
- 内部适配接口使用 `x-runtime-internal-token` 保护。
- 内部适配接口在服务层继续校验：
  - Agent 数据范围
  - Tool 数据范围
  - Agent `agent:agent:use` 资源 ACL
  - Tool `tool:call:execute` 资源 ACL
- Runtime 内部资源 ACL 与控制面 Guard 复用相同主体解析，支持父部门授权对子部门用户继承。
- M43 后，Runtime 工具调用通过 Control API 内部适配器进入 `ToolGatewayService`，复用统一的审批、限流、重试、安全策略评估和工具调用日志。
- Runtime 调用内部适配接口时继续透传：
  - `x-request-id`
  - `x-trace-id`
  - `traceparent`
- `control_first` 模式仍保留旧执行路径，默认 `runtime_first` 不再预执行 RAG 和工具。

## 新执行流

```text
用户发送消息
-> Control API 通过 JWT、权限、DataScope、Resource ACL、安全策略
-> Control API 写入用户消息
-> Control API 读取 Agent/Prompt/Knowledge/Tool/Model 配置快照
-> Control API 调用 Runtime
-> Runtime 渲染提示词
-> Runtime 按 Agent 绑定触发知识检索
-> Runtime 按消息意图触发工具调用
-> Runtime 调用模型或本地 deterministic fallback
-> Runtime 返回 assistant_message、references、tool_calls、steps、model_call
-> Control API 写入 run、assistant message、model_call_log
```

## 边界说明

Runtime 已经主导执行顺序和步骤产出，但知识检索与工具调用仍通过 Control API 内部适配器落到现有服务上。内部适配器不会直接裸调业务服务，而是重建用户上下文并执行数据范围、资源授权和绑定校验。这样可以复用已有：

- 多租户上下文
- 知识库混合检索日志
- 工具高危审批和 Tool Gateway 执行边界
- 工具调用日志
- M40 权限与安全闭环
- 模型调用日志持久化

后续如果 Runtime 直接连接 PostgreSQL/Qdrant/OpenSearch/Tool Gateway，需要继续把同一套权限、安全策略和审计事件复制到 Runtime 侧，避免绕过控制面。

## 环境变量

```text
RUNTIME_BASE_URL=http://localhost:8000
CONTROL_API_INTERNAL_BASE_URL=http://localhost:3001
RUNTIME_INTERNAL_TOKEN=change-me-runtime-internal-token
AGENT_RUNTIME_EXECUTION_MODE=runtime_first
```

该示例用于本地开发或兼容发布。生产发布必须改为 `AGENT_RUNTIME_EXECUTION_MODE=runtime_only`，不允许 Runtime 失败后回退到 Control API 模型调用。

执行模式：

```text
runtime_first  默认，优先 Runtime；Runtime 失败且有模型配置时回退 Control API 模型调用
runtime_only   强制 Runtime；Runtime 错误直接返回
control_first  旧路径，Control API 预执行 Prompt/RAG/Tool 后再调用模型
```

## 验证

- `python3 -m compileall apps/agent-runtime/app`
- `pnpm --filter @aiaget/control-api typecheck`
