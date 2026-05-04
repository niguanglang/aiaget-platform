# M80 审批审计归档与下载中心

## 目标

在 M79 同步 CSV 导出基础上，新增审批审计归档能力，把当前筛选结果生成 CSV 文件并保存到 MinIO 对象存储，形成可下载、可删除、可复查的审计归档。

本模块只新增代码和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增接口：

```text
POST   /api/v1/tool-approvals/audit-events/archives
GET    /api/v1/tool-approvals/audit-events/archives
GET    /api/v1/tool-approvals/audit-events/archives/:archiveId/download-url
DELETE /api/v1/tool-approvals/audit-events/archives/:archiveId
```

归档生成复用审批审计列表筛选参数：

```text
window
keyword
source_type
event_type
event_status
trace_only
```

## 存储策略

不新增数据库表，归档文件存储到租户隔离对象前缀：

```text
tenants/{tenantId}/audit-archives/approval-audits/
```

归档列表从对象存储前缀读取，归档 ID 由对象 key 编码生成。

## 前端页面

承载页面：

```text
/approval-audits
```

新增区域：

```text
审批审计归档
```

页面能力：

```text
1. 根据当前筛选条件生成 CSV 归档
2. 展示归档文件数量和容量
3. 展示归档文件名、目录、大小、更新时间、对象路径
4. 支持生成短期下载链接
5. 支持删除归档
6. 支持空状态、加载态、成功提示、失败提示
```

## 参考设计

```text
images/frontend-reference-design/m80-审批审计归档与下载中心/
```

## 权限

```text
security:approval:view
```

## 边界

1. M80 不新增表，不做归档数据库索引。
2. M80 不创建独立异步任务，归档生成仍是同步请求。
3. M80 不改变 MinIO 配置，不启动或创建容器。
4. M80 暂不做归档审批，后续可以把删除归档升级为高危操作审批。

## 验收标准

- 审批审计页可以生成归档。
- 归档文件保存到租户对象存储前缀。
- 审批审计页可以列出归档文件。
- 审批审计页可以生成下载链接并下载归档。
- 审批审计页可以删除归档。
- Control API typecheck 通过。
- Web typecheck 通过。
