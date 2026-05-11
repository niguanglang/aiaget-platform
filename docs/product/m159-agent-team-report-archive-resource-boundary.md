# M159 Agent 协作报告归档资源边界

## 背景

Agent 协作团队的运行报告导出、归档生成、归档下载和归档删除申请都属于团队运行审计资料。此前这些入口已经校验 `agent:team:view` 权限码，但报告归档下载和删除申请使用对象存储归档 ID 作为路由参数，缺少显式的团队资源边界声明。

## 本次收敛

1. 运行报告导出 `GET /agent-teams/runs/:runId/report/export` 显式接入 `DataScopeGuard` 与 `ResourceAclGuard`。
2. 运行报告归档生成 `POST /agent-teams/runs/:runId/report/archives` 显式接入 `DataScopeGuard` 与 `ResourceAclGuard`。
3. 归档下载链接 `GET /agent-teams/report/archives/:archiveId/download-url` 显式接入 `DataScopeGuard` 与 `ResourceAclGuard`。
4. 归档删除申请 `DELETE /agent-teams/report/archives/:archiveId` 显式接入 `DataScopeGuard` 与 `ResourceAclGuard`。
5. 资源解析层支持将报告归档 `archiveId` 反解为对象存储 key，并解析到所属 `AGENT_TEAM` 团队 ID。

## 权限语义

- `runId` 会解析到所属 `AGENT_TEAM`，再执行数据权限和资源 ACL 判断。
- `archiveId` 会解析到归档路径中的团队 ID，再执行同一套 `AGENT_TEAM` 数据权限和资源 ACL 判断。
- 所有入口继续使用 `agent:team:view` 作为动作权限，避免拥有列表查看权限但未被授权访问具体团队审计资料的用户越权下载归档。

## 影响范围

本次只收敛控制器守卫声明和资源 ID 解析逻辑，不改变报告 CSV 内容、对象存储 key 格式、删除审批流程和归档列表展示逻辑。
