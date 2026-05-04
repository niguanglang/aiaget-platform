# M74 通知策略审计与变更影响预览

## 目标

在 M73 通知策略配置中心基础上，补齐保存前影响预览和最近变更审计，让运营人员在调整告警通知自动重试策略前可以判断风险。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 后端接口

新增两个只读接口：

```text
POST /api/v1/system-settings/notification-policy/preview/:id
GET  /api/v1/system-settings/notification-policy/audit
```

权限：

```text
system:settings:view
```

保存仍使用原有接口和权限：

```text
PATCH /api/v1/system-settings/:id
system:settings:manage
```

## 数据来源

影响预览读取：

```text
system_setting
platform_event
```

审计读取：

```text
operation_log
```

审计不新增专用表。系统设置更新和恢复默认已经由全局 OperationLogInterceptor 写入操作日志，本模块只把通知策略相关日志投影为审计摘要。

## 影响预览

预览内容：

```text
1. 当前值与待保存值
2. 当前状态与待保存状态
3. 变更字段
4. 影响等级：LOW / MEDIUM / HIGH
5. 风险摘要
6. 风险提示
7. 近 24 小时任务快照
8. 近 7 天策略变更次数
```

任务快照包含：

```text
pending_auto_retry_count
failed_notification_count
partial_notification_count
retried_notification_count
policy_source
```

## 风险规则

高影响场景示例：

```text
1. 关闭自动重试且存在失败或部分成功投递
2. 停用通知策略且当前存在投递积压
3. 扫描间隔过短
4. 单批重试数量过大
5. 最大重试次数过高
6. 退避时间过短
7. 回看窗口超过 7 天
```

中影响场景示例：

```text
1. 扫描间隔明显变短或变长
2. 单批数量大幅提高
3. 回看窗口扩大
4. 最大重试次数降低
```

## 前端承载

设置中心：

```text
/settings
```

通知策略分类下新增：

```text
1. 每个通知策略参数卡片内增加“变更影响预览”
2. 有变更时可以点击“预览影响”
3. 展示低/中/高影响标识、变更字段、任务快照和风险提示
4. 右侧配置治理卡片展示“通知策略审计”
5. 保存或恢复默认后刷新审计摘要
```

## 参考设计

```text
images/frontend-reference-design/m74-notification-policy-audit-impact/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. 不阻断保存，只提供保存前风险提示。
2. 不做审批流，后续可接入安全中心审批。
3. 不新增完整审计日志页面，只在设置中心展示最近摘要。
4. 不新增策略版本表，继续复用 `system_setting`。

## 验收标准

- 通知策略分类下修改参数后可以预览影响。
- 预览能展示影响等级、风险摘要、任务快照和风险提示。
- 设置中心右侧能看到通知策略最近审计摘要。
- 保存和恢复默认后审计摘要会刷新。
- Control API typecheck 通过。
- Web typecheck 通过。
