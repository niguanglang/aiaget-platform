# 生产运营闭环覆盖矩阵

本文档记录本轮生产运营闭环的权限、数据隔离、资源授权、安全策略和前端入口覆盖情况，后续新增模块按同一矩阵补齐。

## 总体规则

- 所有控制台接口先经过 `JwtAuthGuard`，再经过模块级 `PermissionsGuard`。
- 可被部门、用户、角色或具体对象授权的业务资源，接入 `DataScopeGuard` 与 `ResourceAclGuard`。
- 存储、计费、API Key 等租户级运营资源，当前以 `tenantId` 服务层过滤 + 权限码控制为边界，不使用对象级 ACL。
- 高风险插件启用、插件 Hook/菜单变更、调账、账单状态流转、工作流恢复都会写入 `platform_event` 或模块审计记录。
- 前端只做入口与按钮显隐；后端接口必须重复校验权限。

## 覆盖矩阵

| 模块 | 入口/接口 | 权限码 | 数据范围 | 资源 ACL | 安全/审计闭环 | 本轮状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 插件生态 | `/plugins/*` | `plugin:center:view/install/manage/enable/disable/upgrade/uninstall/audit` | `PLUGIN` 列表与详情均接入 | `PLUGIN` 详情、更新、启停、升级、卸载、Hook、菜单绑定均接入 | 高风险启用由 `PluginSecurityPreview.can_enable` 阻断；卸载软删除安装实例、生成菜单、Hook、工具，并写插件审计和平台事件 | 已闭环 |
| 计费中心 | `/billing/*` | `billing:center:view`、`billing:adjustment:manage`、`system:settings:manage` | 租户级 `tenantId` 隔离 | 不适用，计费资源是租户运营账本 | 调账创建进入 `PENDING`，审批、应用、作废独立流转；账单锁账、已付、作废、逾期写平台事件；quota enforcement 返回 allow/block | 已闭环 |
| 渠道与外部调用 | `/channels/*`、`/external/*` | `channel:publish:*`、外部 API Key scope | 渠道发布资源沿用 `CHANNEL` 数据范围；外部调用以 API Key 绑定租户、Agent、渠道 | 渠道核心发布资源已支持 `CHANNEL`；外部调用按 API Key 授权 | 外部调用支持 `Idempotency-Key`/`X-Idempotency-Key`，平台事件 `dedupeKey` 去重；渠道凭据轮换写 `channel.credential.rotated` | 已闭环 |
| Runtime/Workflow | `/runtime/workflows/status`、`/runtime/workflows/retry` | `monitor:log:view`、`knowledge:base:manage` | 失败知识任务按 `tenantId` 与知识库有效性过滤 | 恢复入口以知识库管理权限控制，具体知识库 ACL 后续可在知识库任务级继续下钻 | 派发成功/失败写 `runtime_workflow` 平台事件；恢复将任务重置为 `PENDING` 并记录恢复请求 | 已闭环 |
| API Key 外部入口 | `/api-keys/*` | `system:api_key:view/manage` | 租户级 `tenantId` 隔离 | API Key 本身是租户级调用凭据，不开放跨对象 ACL | API Key 调用、Webhook 投递、重试和额度观察均进入事件/用量体系；外部调用本轮补幂等结果回放 | 已闭环 |
| MinIO 存储 | `/storage/*` | `storage:object:view/manage` | 对象 key 由服务层按租户前缀隔离 | 不适用，第一版文件管理是租户对象空间 | 桶检查、上传、下载 URL、删除均经权限校验；不新增容器或存储中间件 | 已闭环 |
| 知识库任务 | 文档处理、索引重建、恢复重试 | `knowledge:base:view/manage` | `KNOWLEDGE_BASE`、`DOCUMENT` 已有数据范围与 ACL | 知识库/文档已有 Resource ACL；工作流任务恢复按任务关联租户和知识库过滤 | 后台任务派发失败入平台事件，监控中心可见并可恢复 | 已闭环 |
| 监控中心 | `/monitor` | `monitor:log:view` | 审计/事件维度按租户过滤 | 不直接操作业务资源 | 新增工作流后端健康、最近派发失败、可恢复任务入口 | 已闭环 |

## 后续扩展要求

- 新增资源类型时，先更新 `DataScopeResourceType`、`DATA_SCOPE_RESOURCE_TYPES`、`ResourceAccessService` 和 seed，再接入控制器装饰器。
- 新增危险动作时，必须明确事件类型、审计摘要、失败记录和前端中文反馈。
- 新增外部回调或渠道调用时，必须支持幂等键或可重复消费策略，避免重复会话、重复投递或重复扣费。
- 新增中间件、容器或持久化服务前必须先征得用户确认。
