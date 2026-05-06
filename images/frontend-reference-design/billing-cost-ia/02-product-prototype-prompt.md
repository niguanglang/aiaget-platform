# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the AIAget billing cost information architecture split.

Project context:
- Routes: `/billing`, `/billing/usage`, `/billing/quota-policy`, `/billing/invoices`, `/billing/adjustments`, `/billing/subscription`.
- Users/roles: finance and tenant operators with view access; adjustment managers and system settings managers for write actions.
- Main task flow: start at `/billing` overview, inspect cost indicators, choose a focused child page, perform the supported operation there, return to overview.
- API/service contract: all data reads use `getBillingOverview({ window })`; writes use existing billing mutation functions only.
- Data entities and fields: summary, trend, provider/model usage, quota policies, API key quota, invoices with line items, adjustments, plans and subscription.
- Actions and states: window filter, refresh, route entry, quota enforcement, quota policy save, invoice recalculate/status actions, adjustment create/approve/apply/void, subscription plan change; include loading/empty/error/permission-disabled states.

Prototype requirements:
- Draw six route-level screens or panels in one IA board.
- `/billing`: header, window segmented control, metrics row, trend/recent summaries, child route entry tiles; no complete forms.
- `/billing/usage`: filters, model/provider/API key/conversation cost tables, compact trend.
- `/billing/quota-policy`: quota policy list with inline edit region and quota enforcement result panel.
- `/billing/invoices`: invoice status filters, invoice table, selected invoice detail and line items, invoice status action area.
- `/billing/adjustments`: adjustment creation form on one side and approval/history table on the other.
- `/billing/subscription`: current subscription usage, billing cycle control and plan catalog.
- Make component boundaries obvious and label every major region in Chinese.

Avoid:
- New backend resources, unrelated analytics, dynamic detail routes, or menu entries for form-only screens.
