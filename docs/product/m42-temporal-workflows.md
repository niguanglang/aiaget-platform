# M42 Temporal 工作流

## 目标

M42 将 M28 的知识库后台任务升级为可接入 Temporal 的工作流边界：

```text
Control API：创建任务、恢复任务、选择调度模式、兜底失败标记
Runtime：暴露 workflow start endpoint、连接 Temporal Client、提供 Worker/Activity 骨架
Temporal：在显式启用后负责持久化调度、重试和 Worker 派发
```

本里程碑不创建、不启动任何 Temporal 容器或中间件。默认仍使用本地后台队列。

## 已实现

- Control API 知识库任务分发器新增工作流调度模式：
  - `local`：默认模式，保持 M28 的本地 `setImmediate` 后台执行。
  - `temporal_first`：优先请求 Runtime workflow endpoint，失败后回退本地执行。
  - `temporal`：强制请求 Runtime workflow endpoint，调度失败则把任务标记为 `FAILED`。
- Runtime 新增内部 workflow endpoint：

```text
POST /runtime/workflows/knowledge-tasks/start
```

- Control API 新增 Runtime 内部任务执行适配器：

```text
POST /api/v1/runtime/internal/knowledge-tasks/run
```

- Runtime 新增 Temporal Worker 骨架：

```text
apps/agent-runtime/app/workflows/knowledge_tasks.py
apps/agent-runtime/app/workflows/worker.py
```

- Runtime 与 Control API 内部调用统一使用：

```text
x-runtime-internal-token
```

## 工作流输入

Temporal workflow 只接收最小输入：

```json
{
  "task_id": "knowledge_embedding_task.id"
}
```

任务上下文不通过消息体传递，Worker Activity 会回调 Control API，由 Control API 根据 `task_id` 从 PostgreSQL 重新加载租户、知识库、文档、任务状态和索引写入上下文。

这样可以避免 workflow payload 膨胀，也能保证任务恢复时读取最新配置。

## 执行流

### 默认本地模式

```text
创建 knowledge_embedding_task
-> KnowledgeTaskDispatcherService.enqueue(task_id)
-> 本地后台执行 KnowledgeService.executeQueuedTask(task_id)
-> 写入 PostgreSQL / Qdrant / OpenSearch
-> 更新任务 SUCCESS 或 FAILED
```

### Temporal 优先模式

```text
创建 knowledge_embedding_task
-> Control API 请求 Runtime workflow start endpoint
-> Runtime 根据 RUNTIME_TEMPORAL_ENABLED 决定 backend
   -> false：Runtime 本地后台 fallback，回调 Control API 内部 run endpoint
   -> true：Runtime 调用 Temporal Client start_workflow
-> Worker Activity 回调 Control API 内部 run endpoint
-> Control API 执行原有任务边界并持久化状态
```

### 强制 Temporal 模式

```text
创建 knowledge_embedding_task
-> Control API 请求 Runtime workflow start endpoint
-> 请求失败：任务标记 FAILED
-> 请求成功：由 Runtime/Temporal/Worker 接管后续执行
```

## 环境变量

Control API：

```text
KNOWLEDGE_WORKFLOW_MODE=local
RUNTIME_BASE_URL=http://localhost:8000
RUNTIME_INTERNAL_TOKEN=dev-runtime-internal-token
```

Runtime：

```text
RUNTIME_CONTROL_API_BASE_URL=http://localhost:3001
RUNTIME_INTERNAL_TOKEN=dev-runtime-internal-token
RUNTIME_TEMPORAL_ENABLED=false
RUNTIME_TEMPORAL_ADDRESS=localhost:7233
RUNTIME_TEMPORAL_NAMESPACE=default
RUNTIME_TEMPORAL_TASK_QUEUE=aiaget-knowledge-tasks
```

## Worker 启动

真实 Temporal 启用后，Runtime 服务和 Worker 分开运行。

Runtime API：

```text
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Temporal Worker：

```text
RUNTIME_TEMPORAL_ENABLED=true python -m app.workflows.worker
```

只有在 `RUNTIME_TEMPORAL_ENABLED=true` 且 Temporal 服务可访问时，Worker 才会连接 Temporal。

## 边界说明

- M42 不改数据库表结构。
- M42 不把文档解析、Embedding、Qdrant、OpenSearch 逻辑复制到 Runtime。
- Activity 仍回调 Control API 执行现有 `KnowledgeService` 任务边界。
- Control API 继续负责任务状态、失败标记、索引写入、租户上下文和持久化。
- 后续如果把解析、切片、Embedding 拆成多个 Activity，可以沿用当前 `task_id` 作为 workflow 主键。

## 验证

```text
python3 -m compileall apps/agent-runtime/app
pnpm --filter @aiaget/control-api typecheck
```
