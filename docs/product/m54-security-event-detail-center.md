# M54 安全事件详情中心

## 目标

M54 把 M40 已经进入审计链路的运行时拒绝事件，从安全中心摘要升级为可检索、可筛选、可查看详情的事件中心。

本里程碑不新增数据库表、不启动服务、不创建容器，继续复用：

```text
operation_log
security_policy_evaluation
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

- 前端 `/security` 新增“安全事件详情中心”：
  - 事件搜索和筛选工具栏
  - 安全事件表格
  - 详情抽屉
  - trace ID 跳转运行监控
  - 加载、空状态、无 trace 禁用态

## 边界说明

- `operation_log` 事件 ID 使用 `operation:{id}`。
- `security_policy_evaluation` 事件 ID 使用 `policy:{id}`。
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
