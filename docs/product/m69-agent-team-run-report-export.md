# M69 多 Agent 团队运行报告导出

## 目标

在多 Agent 协作中心为单次团队运行提供可审计 CSV 报告导出，覆盖团队配置、运行摘要、成员步骤、成员内部事件、知识引用、工具调用、模型调用、接力记录和反馈记录。

本里程碑不新增中间件、不启动容器；导出由 Control API 直接从 PostgreSQL 读取现有运行数据并生成 CSV。

## 已实现

### Control API

新增接口：

```text
GET /api/v1/agent-teams/runs/:runId/report/export
```

权限：

```text
agent:team:view
```

返回：

```text
text/csv; charset=utf-8
```

CSV 包含统一列：

```text
报告分区
记录类型
记录ID
名称
状态
摘要
指标
指标值
Trace ID
Span ID
父 Span ID
时间
扩展信息
```

报告分区：

```text
团队信息
运行摘要
成员步骤
成员内部事件
知识引用
工具调用
模型调用
接力记录
反馈记录
```

### 前端页面

`/agent-teams` 运行工作区新增“审计报告导出”区域：

```text
1. 下载 CSV 按钮
2. 导出中状态
3. 报告覆盖范围标签：运行摘要、步骤、内部事件、知识引用、工具调用、模型调用
4. 运行 ID / Trace / 导出格式提示
```

顶部运行操作区也新增“导出报告”快捷按钮。

### API Client

新增：

```text
exportAgentTeamRunReport(runId)
```

前端使用 Blob 下载，文件名格式：

```text
Agent团队运行报告-{team_code}-{run_id}-{date}.csv
```

### Reference-first 前端资产

已生成：

```text
images/frontend-reference-design/agentteamrunreportexport/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 联动关系

- M67 团队步骤子事件：报告导出包含 `child_steps/references/tool_calls/model_call`。
- M68 运行回放与对比：页面导出入口放在回放对比之前，报告覆盖当前运行可见信号。
- 监控中心：报告保留 Trace / Span 字段，方便后续回查链路。
- 安全审计：导出只读，使用 `agent:team:view`；后续可接入审计归档和删除审批。

## 验收标准

```text
1. 有 `agent:team:view` 权限的用户可以下载选中运行的 CSV 报告。
2. CSV 能正确显示中文，包含 BOM。
3. 报告包含团队、运行、步骤、子事件、RAG、工具、模型、接力、反馈记录。
4. 页面展示导出中状态，并在失败时走现有错误提示。
5. Control API 和 Web typecheck 通过。
```

## 下一步

多 Agent 协作后续建议进入：

```text
团队运行报告归档：把导出的报告写入对象存储，接入下载中心、归档审计和删除审批链路。
```
