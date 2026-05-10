# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 归档治理
- Page/route: 归档治理 at `/security/archives`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 安全运营人员可以在归档治理页辨认通知审计归档的创建筛选范围，包括状态、来源和关键词，并在申请删除和审批复核时看到同一上下文。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS；shadcn 风格按钮、卡片、状态 Badge、空态、确认弹窗。
- Existing page shell/layout: 左侧管理后台导航，内容区为安全中心工作区；页面顶部 `SecurityWorkspaceHeader`，下方来源卡片、指标卡、左侧归档文件表格、右侧删除审批列表。

Interface contract that must appear in the UI:
- API/service functions: `listSecurityOperationAlertNotificationArchives`, `listSecurityOperationAlertNotificationArchiveApprovals`, `getSecurityOperationAlertNotificationArchiveApprovalOverview`, `getSecurityOperationAlertNotificationArchiveDownloadUrl`, `deleteSecurityOperationAlertNotificationArchive`。
- Main entities and fields: 归档文件 `file_name`, `key`, `folder`, `size_bytes`, `etag`, `last_modified`, `status_filter`, `alert_category_label`, `keyword`；删除审批 `archive_file_name`, `archive_key`, `archive_size_bytes`, `status`, `requested_by`, `reviewed_by`, `requested_at`, `reviewed_at`, `reason`, `status_filter`, `alert_category_label`, `keyword`。
- Status values/enums: `SENT/已发送`, `PARTIAL/部分成功`, `SKIPPED/已跳过`, `FAILED/失败`; 归档来源包括 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE/客户成功复盘归档删除`。
- User actions: 切换归档来源、刷新、下载归档、申请删除、查看删除审批、跳转删除审批中心。
- Required states: loading, empty, error, disabled, success, permission-denied, readonly approval state.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing dashboard.
- The archive file table must keep core columns only: 文件、目录、大小、更新时间、操作；filter context appears as small badges under the file key, not as many extra table columns.
- The delete approval list must show the same filter context in a compact bordered context strip so reviewers can identify why the archive was created.
- Use Chinese visible text only.
- Keep a restrained enterprise look with thin borders, light shadows, clear hierarchy, and enough whitespace.
- Emphasize the primary workflow: 用户从 `/security/alerts` 创建当前筛选归档 -> 在 `/security/archives` 看到归档筛选来源/状态/关键词 -> 申请删除 -> 审批人复核同一筛选上下文。

Avoid:
- showing customer success opportunity details or report content
- adding unrelated charts or fake fields
- overloading the table with many extra columns
- decorative glow, emoji, or noisy gradient backgrounds
