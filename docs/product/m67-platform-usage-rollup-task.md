# M67 统一用量 Rollup 聚合任务

## 目标

把 `platform_usage_event` 中的统一用量账本增量聚合到 `platform_usage_rollup`，让监控中心、成本中心和后续计费模块可以共享同一套小时/日汇总口径。

本模块不新增表、不执行迁移、不启动容器、不安装中间件，只复用 M64 已落库的统一用量事件和汇总表。

## 聚合入口

### 增量聚合

统一入口：

```text
PlatformEventsService.recordUsage
```

每次写入用量事件后，后台会尽力更新两个汇总周期：

```text
hour
day
```

增量更新失败不会影响主用量事件写入，避免成本汇总问题阻断业务调用链路。

### 手动重建

新增接口：

```text
POST /platform-usage/rollups/rebuild?window=24h|7d|30d
```

权限：

```text
monitor:log:view
```

接口会按当前租户和窗口读取 `platform_usage_event`，重建窗口内的小时/日汇总，并返回最近生成的汇总桶样本。

## 汇总维度

Rollup 按以下维度归并：

```text
tenant_id
department_id
subject_type
subject_id
resource_type
resource_id
metric_type
period_type
period_start
period_end
```

## 汇总指标

```text
event_count
quantity_total
amount_total
cost_total
error_count
success_count
retry_count
```

## 前端承载

继续复用 M64 面板：

```text
/monitor
PlatformEventUsagePanel
```

新增能力：

```text
1. full view 顶部增加“重建 Rollup”按钮
2. 重建中按钮禁用并显示处理中状态
3. 重建成功显示中文提示并刷新 overview / trends / ledger
4. 重建失败显示中文错误提示
5. compact 视图不展示重建按钮，避免成本页被操作按钮挤占
```

## 边界

1. 当前重建是窗口级运维重建，不是全量历史回放。
2. 增量聚合为 best-effort，不阻断 `recordUsage` 主链路。
3. 不引入 Temporal；M67 只把 Rollup 聚合边界收口，后续可以迁移为后台调度或工作流任务。
4. 不新增数据库结构，依赖 M64 已存在的 `platform_usage_rollup`。

## 验收标准

- 新写入的 `platform_usage_event` 会增量更新小时和日 Rollup。
- 可通过 `POST /platform-usage/rollups/rebuild?window=24h|7d|30d` 手动重建窗口内 Rollup。
- 监控中心可以触发重建并看到 `recent_rollups` 更新。
- Control API typecheck 通过。
- Web typecheck 通过。
