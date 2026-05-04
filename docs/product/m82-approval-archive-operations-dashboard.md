# M82 审批与归档运营看板

## 目标

在安全中心补齐审批与归档运营视角，把工具审批、通知策略审批、归档删除审批、审批审计事件和 MinIO 归档容量汇总到同一个运营看板，方便安全管理员和审计员快速定位待处理事项。

本模块只新增聚合能力、前端看板和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 后端聚合

扩展接口：

```text
GET /api/v1/security-center/overview
```

新增响应字段：

```text
approval_operations
```

聚合范围：

```text
1. 工具审批待审 / 已通过 / 已拒绝
2. 运行时工具审批待审
3. 通知策略审批待审
4. 高影响通知策略审批待审
5. 归档删除审批待审 / 已通过 / 已拒绝 / 已执行
6. 最近 24 小时审批审计事件、失败、告警和 Trace 覆盖
7. 审批审计归档文件数量和总容量
8. 归档存储状态
```

归档容量通过 `StorageService.listTenantObjects` 读取租户前缀：

```text
audit-archives/approval-audits
```

当对象存储暂不可用时，接口返回 `archive_storage_status = UNKNOWN`，安全中心仍展示审批数据并提示归档状态降级。

## 前端页面

页面：

```text
/security
```

新增卡片：

```text
审批与归档运营
```

展示指标：

```text
工具待审
策略待审
归档删除待审
审批审计
失败/告警
Trace 覆盖
归档文件
归档容量
```

快捷入口：

```text
处理审批 -> /approvals
查看审批审计 -> /approval-audits
打开审计中心 -> /audit
```

## 参考设计

```text
images/frontend-reference-design/m82-审批与归档运营看板/
```

## 边界

1. M82 不新增路由，直接增强安全中心。
2. M82 不新增数据库表。
3. M82 不执行数据库迁移。
4. M82 不启动 MinIO、Qdrant、OpenSearch 或其他容器。
5. 归档删除审批仍沿用 M81 的审批事件链推导。

## 验收标准

- 安全中心总览接口返回 `approval_operations`。
- `/security` 页面展示“审批与归档运营”卡片。
- 卡片展示审批待办、审计质量和归档容量。
- 归档存储不可用时展示中文降级提示。
- 快捷入口可跳转审批中心、审批审计中心和审计中心。
- Control API typecheck 通过。
- Web typecheck 通过。
