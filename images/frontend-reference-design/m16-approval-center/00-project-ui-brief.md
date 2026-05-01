# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M16 Approval Center
- Route: `/approvals`
- Feature goal: provide a real operational approval console for high-risk tool calls from tests and runtime conversations
- Parent layout: protected console shell with sidebar, topbar, metric strip, data table, and right-side detail workspace
- Target users: tenant operators and admins with `approval.read` and `approval.write`

## APIs and Services

- `getToolApprovalOverview()`
- `listToolApprovals({ page, page_size, keyword, status, trigger_source, tool_id })`
- `getToolApproval(approvalId)`
- `approveToolApproval(approvalId, { decision_note })`
- `rejectToolApproval(approvalId, { decision_note })`

## Entities and Fields

- Approval request:
  - `tool_name`, `tool_code`
  - `status`
  - `trigger_source`
  - `execution_status`
  - `request_url`, `request_method`
  - `reason`, `decision_note`
  - `requested_by`, `reviewed_by`
  - `created_at`, `reviewed_at`
- Context:
  - `conversation_title`
  - `agent_name`
- Request/response payload:
  - `request_headers`, `request_body`
  - `response_status`, `response_headers`, `response_body`
  - `latency_ms`, `error_message`

## Existing Components and Design System

- console shell navigation and page grid
- `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`
- Tailwind CSS with thin borders, soft shadow, glass-like cards
- existing tool/conversation detail routes as linked context

## Required States

- loading:
  - overview
  - approval list
  - selected approval detail
- empty:
  - no requests in current filter
  - no selected request
- error:
  - overview/list/detail load failure
  - approve/reject failure
- validation:
  - reviewer note optional
  - only pending items can be approved or rejected
- disabled:
  - read-only users
  - action buttons while mutation is pending
- success:
  - approval decision persists and updates execution result
- permission-denied:
  - page readable, actions disabled

## Constraints

- Keep all visible UI copy in Chinese.
- Reuse existing tool and conversation routes instead of inventing approval-specific detail pages.
- The approval page must work well when the pending queue is empty after a decision, while still keeping the last selected detail visible.
