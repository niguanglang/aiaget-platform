# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend module.

Project context:
- Product/module: 企业 Agent 平台 / API Key 管理中心 / 外部 API 调用观测
- Page/route: `/api-keys`
- Target users/roles: 租户管理员、API Key 管理员、运维人员、审计人员
- Business goal: Help operators see which external systems called which Agent, whether calls succeeded or were denied, how much quota and token cost was consumed, and where to jump for Trace/Audit investigation.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, local shadcn-style Card/Button/Input/MetricCard/StatusBadge/EmptyState, TanStack Query, lucide icons, motion.
- Existing page shell/layout: console dashboard layout with sidebar and topbar. This module is an additional section inside the existing API Key management page.

Interface contract that must appear in the UI:
- Endpoint: `GET /api/v1/api-keys/external-observability?window=24h|7d`
- Permission: `system:api_key:view`
- Summary fields: `total_requests`, `success_requests`, `denied_requests`, `success_rate`, `total_tokens`, `total_cost`, `average_latency_ms`, `active_key_count`, `risky_key_count`
- Recent calls: `event_id`, `api_key_id`, `api_key_name`, `masked_key`, `agent_id`, `agent_name`, `status`, `status_code`, `trace_id`, `request_id`, `latency_ms`, `total_tokens`, `cost_total`, `ip`, `occurred_at`
- Quota watch: API Key name, masked key, used today, daily quota, remaining, usage rate, risk level, last used
- Security denials: source, reason, key prefix/id, agent id, request id, trace id, path, status code, occurred time
- Actions: refresh, switch time window, copy trace/request ID, open monitor trace, open audit search, open API reference
- Required states: loading, empty, backend error, read-only permission state

Design requirements:
- Use a Bento/dashboard layout integrated into API Key management.
- Keep it production SaaS/admin quality with Chinese copy only.
- Use subtle borders, soft shadows, restrained backdrop blur, clean information hierarchy.
- Make trace/audit investigation links obvious but not visually noisy.
- Keep tables scannable and compact for operational use.

Avoid:
- invented endpoints or hidden secrets
- decorative charts without data contract
- excessive gradients, emoji, cheap glow
- pretending streaming external endpoint exists
