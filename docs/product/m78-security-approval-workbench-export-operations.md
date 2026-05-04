# M78 审批工作台导出运营指标与告警闭环

## 目标

在 M76/M77 已经形成统一安全审批工作台导出与导出事件检索后，继续把导出行为纳入安全中心“审批与归档运营”看板。平台可以识别统一审批工作台的导出量偏高、高风险筛选导出和短时间重复导出，并在告警闭环中提供通知、确认、升级和关闭操作。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端增强

统一安全中心概览 `approval_operations` 新增字段：

```text
approval_workbench_exports_24h
approval_workbench_exported_records_24h
approval_workbench_high_risk_exports_24h
approval_workbench_repeated_exports_24h
```

统计来源：

```text
platform.security.approval_workbench.exported
```

统计规则：

```text
1. total：最近 24 小时导出事件数量。
2. exportedRecords：最近 24 小时导出审批记录总数。
3. highRiskExports：导出筛选包含待审批、审计归档、高危归档删除等高风险条件的次数。
4. repeatedExports：同一主体重复导出超出阈值的次数。
```

新增告警：

```text
approval-workbench-export-volume-risk
approval-workbench-export-high-risk-filter
approval-workbench-export-repeated-risk
```

告警分类：

```text
APPROVAL_WORKBENCH_EXPORT
```

## 前端增强

页面仍为：

```text
/security
```

“审批与归档运营”看板新增：

```text
1. 审批工作台导出治理指标组。
2. 导出次数、导出记录、高风险导出、重复导出 4 个指标。
3. 风险提示条。
4. 导出治理告警卡片，支持通知、确认、升级、关闭。
```

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench-export-operations/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
manifest.json
```

## 边界

1. 不新增独立治理页面。
2. 不修改导出接口字段。
3. 不新增数据库表。
4. 不把所有安全事件都纳入导出治理，只针对审批工作台导出行为。

## 验收标准

1. 安全中心概览返回审批工作台导出统计。
2. 审批与归档运营看板展示导出治理指标。
3. 导出量偏高时产生运营告警。
4. 高风险筛选导出时产生运营告警。
5. 短时间重复导出时产生运营告警。
6. 告警支持通知、确认、升级和关闭。
7. `/security` 页面所有新增文案均为中文。
8. Control API typecheck 通过。
9. Web typecheck 通过。
