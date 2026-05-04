# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 运行记录选择器 | `RunTraceWorkspace` in `apps/web/src/components/agent-teams/agent-teams-content.tsx` | `AgentTeamDetail.runs` | 保持现有交互 |
| 运行摘要 | `RunSummaryPanel` | `AgentTeamRunSummary` | 展示 WAITING_HUMAN 状态 |
| 步骤时间线 | `StepTimeline` / `StepDetailPanel` | `AgentTeamStepItem[]` | 不新增字段 |
| 人工介入审批卡片 | 新增 `HumanResumePanel` | `AgentTeamRunSummary` + `AgentTeamHandoffItem[]` | 当前运行 WAITING_HUMAN 且存在 PENDING handoff 时启用 |
| 通过并继续 | 新增 API client `approveAgentTeamHandoff` | `POST /agent-teams/handoffs/:handoffId/approve` | 成功后 invalidate team detail |
| 拒绝并结束 | 新增 API client `rejectAgentTeamHandoff` | `POST /agent-teams/handoffs/:handoffId/reject` | 成功后 invalidate team detail |
| 审批备注 | `textarea` + local state | `ReviewAgentTeamHandoffInput.decision_note` | 中文 placeholder |
| 接力记录 | `HandoffList` | `AgentTeamHandoffItem[]` | 增强 PENDING 状态展示，无需新表格 |
| 权限禁用 | `canReviewHandoff` | `security:approval:handle` 或 tenant_admin | 后端仍强制校验 |
