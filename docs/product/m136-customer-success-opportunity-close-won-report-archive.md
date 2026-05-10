# M136 续约机会成交复盘报告归档留存

## 背景

M133-M135 已经支持成交复盘报告查看、Markdown 导出和导出审计。M136 补齐报告留存能力，把当前成交复盘报告保存到对象存储，便于客户成功、财务运营和审计角色在后续复盘、核算和内部审计中下载固定版本。

## 范围

- 后端新增成交复盘报告归档创建接口。
- 后端新增当前续约机会下的归档列表接口。
- 后端新增归档短期下载链接接口。
- 前端只在 `/customer-success-opportunities/[id]/close-won-report` 页面增加归档留存区。
- 复用现有 MinIO `StorageService`，不新增表结构、不新增中间件、不启动新容器。

## 后端接口

```text
POST /customer-success-opportunities/:id/close-won-report/archives
GET  /customer-success-opportunities/:id/close-won-report/archives
GET  /customer-success-opportunities/:id/close-won-report/archives/:archiveId/download-url
```

## 对象存储路径

```text
customer-success-close-won-reports/{opportunityId}/{opportunityCode}/{timestamp}-{opportunityId}.md
```

## 页面职责

- 成交复盘报告页负责报告查看、导出、归档和归档下载。
- 续约机会列表页继续保持紧凑概览，不导入归档 API。
- 续约机会分析页继续负责漏斗和看板，不导入归档 API。
- 归档区不包含编辑机会、成交入账、生成跟进行动等变更流程。

## 审计

生成归档时写入平台事件：

```text
customer_success.opportunity.close_won_report.archived
```

事件 payload 包含归档 ID、归档 Key、文件名、机会、客户、成交金额、调账单数和调账单号。

## 验收

- 生成归档时 Markdown 写入对象存储。
- 归档返回文件名、大小、机会、客户和下载有效期。
- 生成归档写入平台事件。
- 报告页可查看最近归档并打开短期下载链接。
- 列表页和分析页不导入归档 API。
- 后端服务测试、前端 IA 契约、共享类型构建和 typecheck 通过。
