# M137 续约机会成交复盘报告归档删除审批

## 背景

M136 已经支持成交复盘报告归档留存和下载。归档文件属于客户成功、财务核算和审计复盘材料，不能在报告页直接删除。M137 把归档删除改为审批化：申请删除只创建审批事件，安全管理员审批通过后才从对象存储删除文件，审批拒绝则保留文件。

## 范围

- 报告页归档列表新增“申请删除”行内操作。
- 删除申请需要二次确认，确认后创建审批事件，不直接删除对象。
- 审批中心“归档删除审批”新增来源：客户成功复盘。
- 安全管理员可以通过或拒绝客户成功复盘归档删除审批。
- 通过审批后调用 `StorageService.deleteTenantObject` 删除对象。
- 复用 `approval_audit_event`，不新增表结构、不新增中间件、不启动容器。

## 后端接口

```text
DELETE /customer-success-opportunities/:id/close-won-report/archives/:archiveId
GET    /customer-success-opportunities/close-won-report/archive-approvals
POST   /customer-success-opportunities/close-won-report/archive-approvals/:approvalId/approve
POST   /customer-success-opportunities/close-won-report/archive-approvals/:approvalId/reject
```

## 审批事件

`approval_audit_event.source_type`：

```text
CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE
```

事件类型：

```text
DELETE_REQUESTED
APPROVED
REJECTED
DELETE_APPLIED
```

## 页面职责

- 成交复盘报告页只负责申请删除，不负责审批。
- 归档删除审批页负责统一查看和处理审批。
- 列表页和分析页不导入归档删除接口。
- 对象删除只允许在审批通过后由后端执行。

## 验收

- 申请删除后对象未被删除。
- 审批列表出现客户成功复盘来源的待审批记录。
- 批准审批后对象存储文件被删除，并形成 `DELETE_APPLIED` 事件。
- 拒绝审批后对象不删除。
- 前端报告页有“申请删除 / 确认申请 / 取消”二次确认。
- 前端归档删除审批页可筛选和处理“客户成功复盘”来源。
- 后端测试、前端 IA 契约、共享类型构建和 typecheck 通过。
