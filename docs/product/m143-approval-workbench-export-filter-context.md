# M143 审批工作台导出筛选上下文

## 背景

M142 已经在统一审批工作台详情和 `/approvals/archive-deletions` 聚合页面展示通知审计归档的筛选来源、筛选状态和筛选关键词。但安全中心 `/security/alerts` 的统一审批工作台 CSV 导出仍只包含审批核心字段，离线复核时会丢失“客户成功复盘归档删除 / 已发送 / trace-customer”等归档创建上下文。

## 范围

本里程碑只增强导出契约：

1. 统一安全审批工作台 CSV 增加通知归档筛选上下文列。
2. 导出保留筛选来源、筛选状态和筛选关键词。
3. 通知状态码在 CSV 中输出中文标签。
4. 不改变 `/security/alerts` 页面布局和按钮分布。
5. 不新增中间件、容器、表结构或迁移。

## 后端设计

`SecurityApprovalWorkbenchService.exportCsv` 改为把带 `metadata` 的工作台记录传入 CSV 构造函数，而不是先剥离详情字段。

CSV 新增列：

```text
通知筛选来源
通知筛选状态
通知筛选关键词
```

状态中文映射：

```text
SENT -> 已发送
PARTIAL -> 部分成功
SKIPPED -> 已跳过
FAILED -> 失败
```

非通知审计归档删除记录这三列输出为空，保持统一表头，避免多种导出格式。

## 前端设计

前端页面不新增控件。用户仍在 `/security/alerts` 的统一审批工作台区域使用“导出当前筛选”按钮，导出的 CSV 会自动包含新增列。

页面职责保持不变：

- `/security/alerts` 负责统一审批筛选、详情处理和导出。
- `/approvals/archive-deletions` 负责归档删除审批聚合队列。
- 通知审计明细和客户成功报告正文不进入 CSV 的审批列表行。

## 验收标准

1. CSV 表头包含“通知筛选来源”、“通知筛选状态”、“通知筛选关键词”。
2. 运营告警通知归档删除审批导出包含“客户成功复盘归档删除”。
3. `SENT` 状态导出为“已发送”。
4. 导出仍记录 `platform.security.approval_workbench.exported` 审计事件。
5. 后端目标测试和类型检查通过。

## 前端参考设计

```text
images/frontend-reference-design/m143-审批工作台导出筛选上下文/
```
