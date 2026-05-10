# Project UI Brief

- Page: CustomerSuccessCloseWonReportArchiveDeletionApproval
- Route: /customer-success-opportunities/[id]/close-won-report
- Feature goal: 成交复盘报告归档删除审批
- Target users/permissions: 客户成功经理可申请删除成交复盘报告归档；安全管理员在归档删除审批中心处理审批，需要 `security:approval:view` / `security:approval:handle`。
- APIs/services:
  - `deleteCustomerSuccessOpportunityCloseWonReportArchive(opportunityId, archiveId)`：只创建删除审批，不直接删除对象。
  - `listCustomerSuccessOpportunityCloseWonReportArchiveApprovals()`
  - `approveCustomerSuccessOpportunityCloseWonReportArchiveApproval(approvalId, { decision_note })`
  - `rejectCustomerSuccessOpportunityCloseWonReportArchiveApproval(approvalId, { decision_note })`
  - 继续复用 M136 的归档列表和下载链接接口。
- Entities/fields/statuses:
  - 归档项：`id`、`key`、`file_name`、`size_bytes`、`last_modified`、`opportunity_code`。
  - 删除审批：`archive_id`、`archive_key`、`archive_file_name`、`archive_size_bytes`、`status`、`reason`、`requested_by`、`reviewed_by`、`requested_at`、`reviewed_at`。
  - 审批状态：`PENDING`、`APPROVED`、`REJECTED`、`APPLIED`。
- Existing components/design system: Next.js App Router、React Query、Tailwind CSS、shadcn 风格 Button/Card/StatusBadge、`ArchiveDeletionApprovalsContent` 聚合审批页、报告页局部归档卡。
- Required states: 归档列表加载中、删除申请处理中、删除申请失败、审批列表加载中、审批空状态、批准/拒绝处理中、审批无权限查看模式。
- Page boundary constraints: 报告页只发起删除审批和刷新归档，不直接审批；统一归档删除审批页负责处理审批；对象删除只在审批通过后由后端执行。
