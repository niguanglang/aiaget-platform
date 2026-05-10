# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the real `/security/alerts` page.

Main task flow:
1. Safety operator enters 告警运营.
2. Operator sees total pending approvals and the new customer success close-won report archive deletion metrics.
3. Operator filters approval type to `客户成功复盘归档删除`.
4. Operator selects one approval, reviews metadata and timeline, writes an approval note, then approves or rejects.
5. Operator sees operation alert card and can send notification, acknowledge, escalate, or close it.

API/service contract:
- Overview: `getSecurityCenterOverview` exposes `approval_operations` and `operational_alerts`.
- Approval list/detail/review: `getSecurityApprovalWorkbenchOverview`, `listSecurityApprovalWorkbenchItems`, `getSecurityApprovalWorkbenchItem`, `reviewSecurityApprovalWorkbenchItem`.
- Alert lifecycle: `notifySecurityOperationAlert`, `updateSecurityOperationAlert`.

Data entities and fields:
- Approval type: `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`.
- Metrics: pending, approved, rejected, applied, closed-loop rate.
- Detail metadata: archive file name, archive key, opportunity id/code, request id, trace id, requester, reviewer, timeline.

Wireframe requirements:
- Show fixed page regions: header, summary metrics, customer success archive-delete metric strip, approval list/filter area, detail/action panel, operation alert panel, notification audit list.
- Mark loading, empty, error, disabled permission, and success notice placements.
- Keep labels in Chinese.
- Keep list columns compact; full metadata belongs in the detail panel.

Avoid:
- showing the full customer success opportunity list;
- embedding the成交复盘报告全文;
- inventing new backend actions beyond approval/reject/notify/lifecycle/export.
