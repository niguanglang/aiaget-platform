# M146 安全事件导出字段摘要

## 背景

M145 已经把审批工作台 CSV 导出字段清单写入平台事件 payload，并映射到安全事件详情 `context`。但 `/security/events/[id]` 页面仍主要通过 JSON 展示上下文，审计员需要展开并阅读原始 JSON 才能确认导出字段范围。

## 范围

本里程碑在安全事件详情页增加只读摘要：

1. 当 `context.exported_fields` 存在时，展示“审批导出字段清单”。
2. 当 `context.notification_archive_filter_fields` 存在时，展示“通知归档筛选字段”。
3. 使用紧凑标签展示字段名，保留原 JSON 上下文。
4. 不改变安全事件列表，不新增接口，不新增导出配置。

## 前端设计

新增 `ExportFieldSummary`：

```text
审批导出字段清单
导出字段：审批ID、来源ID、...
通知归档筛选字段：通知筛选来源、通知筛选状态、通知筛选关键词
```

组件只在字段数组存在时渲染；普通安全策略拒绝、资源授权拒绝等事件不会出现该区块。

## 验收标准

1. 安全事件详情页源码包含“审批导出字段清单”。
2. 安全事件详情页源码包含“通知归档筛选字段”。
3. 页面显式读取 `exported_fields` 和 `notification_archive_filter_fields`。
4. 前端定向 IA 测试、Web typecheck 和 Web IA 全量测试通过。

## 前端参考设计

```text
images/frontend-reference-design/m146-安全事件导出字段摘要/
```
