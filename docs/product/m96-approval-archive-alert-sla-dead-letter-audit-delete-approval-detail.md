# M96 审批与归档告警 SLA 死信审计归档删除审批详情

## 目标

M96 在 M95 归档删除审批化基础上，补齐审批详情和审计时间线联动。安全管理员、租户管理员和审计员可以选择一条归档删除审批，查看审批摘要、申请/审批/生效事件、请求 ID 和 Trace ID，并跳转审计中心或监控中心定位链路。

## 后端接口

复用 M95 已有详情接口：

```text
GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId
```

返回数据包括：

```text
1. 审批基础信息
2. 归档对象路径和文件信息
3. 申请人、审批人、申请时间、审批时间
4. audit_timeline
5. request_id / trace_id
```

## 前端

安全中心 `/security` 的“归档删除审批”区域新增：

```text
1. 审批记录选中态
2. 查看详情按钮
3. 审批详情摘要
4. 审批审计时间线
5. 事件类型中文标签：申请删除、批准删除、拒绝删除、删除生效
6. 审计中心跳转：/audit?keyword=<request_id>
7. Trace 跳转：/monitor?keyword=<trace_id>
8. 详情加载、空态、错误态
```

## 设计资产

```text
images/frontend-reference-design/m96-sla死信审计归档删除审批详情/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用当前安全中心接口权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不执行数据库迁移。
3. 本阶段不启动容器、不安装中间件、不触碰外部服务。
4. 审批详情基于 `platform_event` 聚合生成，后续可迁移到专用审批详情表或 Temporal 工作流历史。

## 验收标准

- 归档删除审批列表可以选择记录。
- 选中记录后可以加载审批详情。
- 审批详情展示归档文件、对象路径、状态、申请人、审批人、时间和意见。
- 审计时间线展示申请、批准、拒绝、生效事件。
- 有 `request_id` 时可以跳转审计中心。
- 有 `trace_id` 时可以跳转监控中心。
- Web typecheck 通过。
- Control API typecheck 通过。
