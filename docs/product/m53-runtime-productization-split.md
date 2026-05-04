# M53 Runtime 产品化拆分

## 目标

M53 把 Agent Runtime 从单文件实现拆成清晰的产品化边界，为后续继续下沉 RAG、工具、模型适配器和 Temporal Activity 做准备。

本里程碑不改接口协议、不启动服务、不新增容器、不调整中间件配置。

## 已实现

- `app/main.py` 收敛为 FastAPI HTTP 路由壳：
  - `/runtime/health`
  - `/runtime/conversations/respond`
  - `/runtime/conversations/respond-stream`
  - `/runtime/workflows/knowledge-tasks/start`
- 新增 Runtime 契约模块：

```text
apps/agent-runtime/app/runtime/contracts.py
```

- 新增 Runtime 执行模块：

```text
apps/agent-runtime/app/runtime/execution.py
```

- 新增 Runtime 辅助模块：

```text
apps/agent-runtime/app/runtime/helpers.py
```

- 保留现有 LangGraph 节点顺序：

```text
load_agent_config
-> render_prompt
-> retrieve_knowledge
-> call_tools
-> execute_model
-> finalize_response
```

- 保留无 `langgraph` 环境下的顺序执行 fallback。
- 保留 Control API 内部适配器调用方式和 trace header 透传。
- 保留 SSE 事件：

```text
start
delta
done
```

## 模块边界

```text
main.py
  只负责 HTTP 入参、trace header 采集、SSE 输出。

runtime/contracts.py
  负责 Runtime 请求、响应、配置快照、模型调用摘要和图状态类型。

runtime/execution.py
  负责 Agent 图执行、节点编排、模型调用和最终响应组装。

runtime/helpers.py
  负责提示词渲染、token 估算、trace 工具、SSE 格式化、Control API 内部适配器。

workflows/
  继续负责 Temporal / local fallback 知识库任务调度边界。
```

## 当前边界

- Runtime 仍通过 Control API 内部接口执行知识检索和工具调用，避免绕过租户、DataScope、Resource ACL、安全策略和审计边界。
- 模型调用仍先支持 `OPENAI_COMPATIBLE`，无模型配置时使用 deterministic fallback。
- 流式响应仍是先完整执行 Runtime 图，再按现有 SSE 协议分块输出，保证前端协议稳定。

## 验证

```text
python3 -m compileall apps/agent-runtime/app
```
