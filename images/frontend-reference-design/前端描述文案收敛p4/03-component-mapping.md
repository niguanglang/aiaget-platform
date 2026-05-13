# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 空状态 | `apps/web/src/components/ui/empty-state.tsx` | 各模块空列表/无权限/加载失败状态 | 默认不渲染长描述，只保留标题和操作 |
| 知识库工作区 | `knowledge/*`, `knowledge-shared.tsx` | 知识库、文档、任务、召回 API | 头部说明从共享 Header 收敛 |
| 渠道与发布 | `channels/*`, `channel-release-shared.tsx`, `channel-operations-pages.tsx` | 渠道发布、任务、投递、模板 API | 子导航和 Header 不展示解释文本 |
| 安全中心 | `security/*`, `security-page-shared.tsx` | 审批、告警、归档、安全事件 API | 页面保留操作和状态，删除治理说明段 |
| 平台用量 | `platform-event-usage/*` | 平台事件、账本、告警、通知、任务 API | 子导航、空状态和头部说明收敛 |
| 数据权限与团队 | `data-scopes/*`, `agent-teams/*` | 数据范围、团队运行、步骤、归档 API | 删除教程式说明，保留矩阵、运行和审批操作 |
