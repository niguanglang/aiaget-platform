# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心父级页面 | `apps/web/src/components/security/security-policy-content.tsx` / `ApprovalArchiveOperationsCard` | `GET /security-center/overview` | 在 M103 建议区增加生命周期动作。 |
| 建议卡片 | `NotificationTaskRecoverySuggestionsCard` | `SecurityOperationAlertNotificationTaskRecoverySuggestion[]` | 增加 `actionResults`、`onAction`、`pendingAction`、`updatingSuggestionId` 参数。 |
| 建议状态 Badge | `StatusBadge` | `status`、`last_action` | 展示待处理、已确认、已忽略、已处理。 |
| 建议动作按钮 | `Button` | `SecurityOperationAlertNotificationTaskRecoveryActionInput` | 确认、忽略、标记已处理；动作只写事件，不改配置。 |
| 排障链接 | `Button asChild` + `Link` | `primary_action_href`、`secondary_action_href` | 保留 M103 的设置、审计、监控入口。 |
| 后端控制器 | `apps/control-api/src/security-center/security-center.controller.ts` | `POST /security-center/operation-alert-notification-task-recovery-suggestions/:suggestionId/actions` | 复用 `security:rule:view`。 |
| 后端服务 | `apps/control-api/src/security-center/security-center.service.ts` | `platform_event` | 新增动作事件写入和生命周期事件投影。 |
| 共享类型 | `packages/shared-types/src/index.ts` | action/status/result 类型 | 前后端共用闭环动作合同。 |
| 前端 API | `apps/web/src/lib/api-client.ts` | `updateSecurityOperationAlertNotificationTaskRecoverySuggestion` | 新增 API client 方法。 |
| 产品文档 | `docs/product/m104-approval-archive-alert-notification-task-recovery-closure.md` | N/A | 记录目标、字段、接口、边界和验收。 |
