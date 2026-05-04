# M93 审批与归档告警 SLA 死信处置审计导出与联动

## 目标

M93 在 M92 的 SLA 死信处置审计时间线上补齐导出和排查联动能力。安全管理员和审计员可以按当前筛选条件导出 CSV，并从单条处置记录跳转到审计中心或监控 Trace 页面继续排查。

## 后端接口

新增同步 CSV 导出接口：

```text
GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/export
```

支持和列表一致的筛选参数：

```text
keyword
action
disposition_status
page
page_size
```

CSV 字段：

```text
事件ID
通知事件ID
告警ID
标题
动作
处置状态
备注
投递事件ID
操作人
请求ID
Trace ID
发生时间
```

## 前端

安全中心 `/security` 的“SLA 死信处置审计时间线”新增：

```text
1. 导出 CSV 按钮
2. 导出中禁用按钮并显示正在导出
3. 导出成功提示
4. 导出失败提示
5. 无数据或加载中禁用导出
6. 行内“审计中心”跳转，使用 request_id 作为关键词
7. 行内“查看 Trace”跳转，使用 trace_id 作为监控关键词
```

跳转规则：

```text
/audit?keyword=<request_id>
/monitor?keyword=<trace_id>
```

## 设计资产

```text
images/frontend-reference-design/m93-sla死信审计导出与联动/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用安全中心查看权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不跑迁移、不启动容器、不安装中间件。
3. CSV 导出为同步请求，适合当前运营审计量级。
4. 后续如果死信审计量增大，可升级为 MinIO 归档下载任务。

## 验收标准

- SLA 死信处置审计列表可以按当前筛选导出 CSV。
- 导出按钮在加载、导出中或无数据时禁用。
- 导出成功和失败有中文反馈。
- 带请求 ID 的记录可以跳转审计中心。
- 带 Trace ID 的记录可以跳转监控中心。
- Control API typecheck 通过。
- Web typecheck 通过。
