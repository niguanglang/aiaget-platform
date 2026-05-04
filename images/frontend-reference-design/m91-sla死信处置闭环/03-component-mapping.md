# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` console route | 复用 M90 SLA 通知重试卡片附近的区域 |
| 死信概览查询 | `useQuery` in `SecurityPolicyContent` | `getSecurityOperationAlertSlaDeadLetterOverview` | 与 SLA notification retry query 并列 |
| 死信处置动作 | `useMutation` + row buttons | `handleSecurityOperationAlertSlaDeadLetterAction` | action: CLAIM / REQUEUE / CLOSE |
| 处置备注 | `Input` + local state | DTO `SecurityOperationAlertSlaDeadLetterActionInput` | 备注可选，最长 500 字 |
| 指标卡 | `MetricCard` | `SecurityOperationAlertSlaDeadLetterOverview.summary` | 待处理、已认领、已重新投递、已关闭 |
| 死信队列 | New local component | `dead_letter_items` | 使用 `StatusBadge` 和中文标签 |
| 最近处置结果 | New local component | `last_action_result` | 展示动作、状态、备注、时间 |
| 后端控制器 | `apps/control-api/src/security-center/security-center.controller.ts` | `SecurityOperationAlertSlaService` | 新增 overview/action endpoints |
| 后端服务 | `apps/control-api/src/security-center/security-operation-alert-sla.service.ts` | `platform_event` | 事件派生处置状态，不新增 DB 表 |
