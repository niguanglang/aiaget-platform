# M54 安全事件详情中心

## 目标

M54 把 M40 已经进入审计链路的运行时拒绝事件，从安全中心摘要升级为可检索、可筛选、可查看详情的事件中心。后续补齐的 `security_event` 专表已经成为优先数据源，旧聚合来源继续兼容历史数据。

事件中心优先读取：

```text
security_event
```

当专表暂无记录时，为兼容旧数据继续回退：

```text
operation_log
security_policy_evaluation
platform_event
```

## 已实现

- Control API 新增安全事件接口：

```text
GET /api/v1/security-center/events
GET /api/v1/security-center/events/:eventId
```

- 事件来源统一为：

```text
DATA_SCOPE
RESOURCE_ACL
SECURITY_POLICY
OPERATION
```

- 支持列表筛选：
  - `keyword`
  - `source`
  - `window`: `1h` / `24h` / `7d` / `30d`
  - `trace_only`
  - `page`
  - `page_size`

- 详情返回：
  - 事件摘要
  - 主体属性
  - 资源属性
  - 上下文
  - 请求摘要
  - 匹配策略
  - 操作人、IP、User-Agent
  - request ID / trace ID

- 数据持久化增强：
  - Guard 拒绝事件双写 `operation_log` 和 `security_event`
  - `security_event` 使用稳定事件 ID
  - `source_record_type` / `source_record_id` 保留来源记录定位
  - 安全中心列表和详情优先读取 `security_event`

- 前端 `/security` 新增“安全事件详情中心”：
  - 事件搜索和筛选工具栏
  - 安全事件表格
  - 详情抽屉
  - trace ID 跳转运行监控
  - 加载、空状态、无 trace 禁用态

## 边界说明

- 新安全事件 ID 直接使用 `security_event.id`。
- 历史 `operation_log` 事件 ID 使用 `operation:{id}`。
- 历史 `security_policy_evaluation` 事件 ID 使用 `policy:{id}`。
- 历史 `platform_event` 事件 ID 使用 `platform:{id}`。
- 安全中心总览仍只展示最近拒绝摘要，完整列表通过 M54 新接口读取。
- 当前事件中心是只读审计能力，不提供忽略、归档、关闭工单等处置动作。

## 参考设计

参考设计工作区：

```text
images/frontend-reference-design/安全事件详情中心/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 验证

```text
pnpm --filter @aiaget/shared-types typecheck
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```
