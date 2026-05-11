# M158 Runtime Workflow 领域状态归一

## 背景

Runtime 工作流总览同时承载知识库任务、渠道发布、多 Agent 团队、插件回滚和插件 Hook 执行。此前总览的 `workflow_mode` 固定取 `KNOWLEDGE_WORKFLOW_MODE`，当最新事件来自渠道、插件或 Agent Team 时，前端可能误以为整体仍处于知识库本地模式。

## 范围

- Runtime 工作流总览 `GET /runtime/workflows/status`。
- 最新工作流事件对应的 workflow mode 解析。
- 后端状态 `workflow_backend` 与 `backend_status` 仍沿用原有事件 payload 解析。

## 后端行为

- `workflow.channel_release_self_healing.*` 使用 `CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE`。
- `workflow.channel_release_*` 使用 `CHANNEL_RELEASE_WORKFLOW_MODE`。
- `workflow.agent_team_run.*` 使用 `AGENT_TEAM_WORKFLOW_MODE`。
- `workflow.plugin_rollback.*` 使用 `PLUGIN_ROLLBACK_WORKFLOW_MODE`。
- `workflow.plugin_hook_execution.*` 使用 `PLUGIN_HOOK_WORKFLOW_MODE`。
- 其他或无事件场景回退到 `KNOWLEDGE_WORKFLOW_MODE`。

## 验收标准

- 最新事件来自渠道 Temporal 工作流时，总览显示渠道 workflow mode，而不是知识库 mode。
- 最新事件 payload 中的 `workflow_backend` 仍能正确展示为 `TEMPORAL` / `LOCAL_FALLBACK`。
- 失败恢复任务列表不受影响。

## 非范围

- 不改各模块工作流派发策略。
- 不新增 Temporal Worker。
- 不调整前端页面结构。
