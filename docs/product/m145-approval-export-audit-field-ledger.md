# M145 审批导出审计字段清单

## 背景

M143 让统一安全审批工作台 CSV 包含通知归档筛选来源、筛选状态和筛选关键词；M144 在 `/security/alerts` 导出区域提示用户这些字段会进入 CSV。但导出审计事件仍只记录导出数量和筛选条件，审计员在安全事件详情里无法确认本次导出的字段范围。

## 范围

本里程碑增强导出审计 payload 和安全事件详情上下文：

1. `platform.security.approval_workbench.exported` payload 写入完整导出字段清单。
2. payload 单独写入通知归档筛选字段清单。
3. 安全事件详情 `context` 暴露 `exported_fields`。
4. 安全事件详情 `context` 暴露 `notification_archive_filter_fields`。
5. 不新增页面、不新增表结构、不新增中间件或容器。

## 后端设计

导出事件 payload 新增：

```json
{
  "exported_fields": [
    "审批ID",
    "来源ID",
    "审批类型",
    "来源模块",
    "标题",
    "状态",
    "风险域",
    "风险等级",
    "审批对象ID",
    "审批对象",
    "审批原因",
    "申请人",
    "申请人邮箱",
    "审批人",
    "审批人邮箱",
    "申请时间",
    "审批时间",
    "请求ID",
    "Trace ID",
    "通知筛选来源",
    "通知筛选状态",
    "通知筛选关键词"
  ],
  "notification_archive_filter_fields": [
    "通知筛选来源",
    "通知筛选状态",
    "通知筛选关键词"
  ]
}
```

`mapPlatformSecurityEvent` 把这两个字段映射到安全事件 `context`，使 `/security/events/[id]` 的上下文 JSON 可以直接展示导出字段范围。

## 前端设计

不改页面结构。安全事件详情页已有“请求摘要”和“主体 / 资源 / 上下文” JSON 区域，新增字段会自然出现在上下文 JSON 中。

## 验收标准

1. 审批工作台导出平台事件 payload 包含 `exported_fields`。
2. 审批工作台导出平台事件 payload 包含 `notification_archive_filter_fields`。
3. 安全事件详情 context 暴露上述两个字段。
4. 后端目标测试和 Control API typecheck 通过。

## 前端参考设计

```text
images/frontend-reference-design/m145-审批导出审计字段清单/
```
