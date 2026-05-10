# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the Enterprise AI Agent Platform admin page.

Project context:
- Page/route: 归档治理 at `/security/archives`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 选择“告警通知归档” -> 查看归档文件 -> 读取筛选上下文 badges（筛选来源、筛选状态、筛选关键词）-> 下载或申请删除 -> 在右侧删除审批列表复核同一上下文 -> 跳转删除审批中心处理。
- API/service contract: `listSecurityOperationAlertNotificationArchives`, `listSecurityOperationAlertNotificationArchiveApprovals`, `getSecurityOperationAlertNotificationArchiveApprovalOverview`, `getSecurityOperationAlertNotificationArchiveDownloadUrl`, `deleteSecurityOperationAlertNotificationArchive`。
- Data entities and fields: archive row fields `file_name/key/folder/size_bytes/etag/last_modified/status_filter/alert_category_label/keyword`; approval row fields `archive_file_name/archive_key/archive_size_bytes/status/requested_by/reviewed_by/requested_at/reviewed_at/reason/status_filter/alert_category_label/keyword`。
- Actions and states: 刷新、下载、申请删除、跳转删除审批、权限只读提示、无权限提示、加载行、空态、错误提示、成功提示、确认弹窗。

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout must match the current page: header actions, three source selection cards, four metric cards, two-column main area.
- In the archive table, draw filter-context chips under file key: “筛选来源：客户成功复盘归档删除”, “筛选状态：已发送”, “筛选关键词：trace-customer”。
- In the approval row, draw a compact context strip below requester/reviewer/time fields with the same three labels.
- Show delete confirmation modal text mentioning that deletion enters approval and does not directly clean object storage.
- Make component boundaries obvious for implementation in existing React/Tailwind components.

Avoid:
- showing notification audit event rows on this page
- mixing customer success opportunity/report details into archive governance
- adding direct approval handling controls in this page beyond the existing approval-center link
