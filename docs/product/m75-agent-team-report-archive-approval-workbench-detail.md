# M75 团队运行报告归档删除审批详情与筛选增强

## 目标

在 M71 已将团队运行报告归档删除接入统一审批工作台后，继续增强 `/security` 的详情审计和来源筛选能力。安全管理员可以直接在统一工作台内确认团队、运行、归档对象和审计链路，不需要回到 Agent 协作中心或人工解析对象路径。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端增强

统一审批工作台增强归档 metadata 兼容：

```text
archive_key
archive_file_name
archive_size_bytes
archive_folder
archive_source
archive_context
team_id
team_name
run_id
run_objective
```

历史审批事件没有团队或运行字段时，会从对象路径反推：

```text
agent-team-run-reports/{teamId}/{timestamp}-{runId}.csv
```

新建团队运行报告归档删除申请时，会尽量写入团队名称和运行目标，便于后续审计检索。

## 筛选增强

`GET /security-center/approval-workbench` 的 `keyword` 现在覆盖：

```text
1. 审批主字段
2. metadata 键和值
3. 时间线事件标题、备注、request_id、trace_id
4. 申请人和审批人信息
```

因此可以按以下内容搜索团队报告归档删除审批：

```text
团队 ID
团队名称
运行 ID
运行目标
归档文件名
对象路径
request_id
trace_id
```

## 前端增强

页面仍为：

```text
/security
```

统一审批工作台详情面板对 `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE` 增加两个中文结构化区域：

```text
团队运行上下文
- 团队名称
- 团队 ID
- 运行 ID
- 运行目标

归档对象
- 归档文件
- 归档大小
- 归档目录
- 归档来源
- 对象路径
```

其他非核心 metadata 继续显示在“其他扩展信息”中，避免重复堆叠核心字段。

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench-agent-team-archive-detail/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. 不新增审批来源类型。
2. 不新增页面路由。
3. 不改变审批通过和拒绝的原服务转发路径。
4. 不修改 MinIO、PostgreSQL、Redis、Qdrant、OpenSearch 或 Temporal 配置。
5. 历史数据兼容依赖现有 `archive_key`，没有对象路径的历史事件只展示已存在字段。

## 验收标准

1. 团队报告归档删除审批详情显示团队运行上下文。
2. 团队报告归档删除审批详情显示归档对象信息。
3. 历史事件缺少 `team_id` 或 `run_id` 时可从 `archive_key` 反推。
4. 新建删除申请会写入团队和运行相关 metadata。
5. 关键词搜索可命中团队 ID、运行 ID、归档文件和对象路径。
6. `/security` 页面新增文案均为中文。
7. Control API typecheck 通过。
8. Web typecheck 通过。
