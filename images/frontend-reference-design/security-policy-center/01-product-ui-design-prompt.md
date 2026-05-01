# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: Enterprise Agent Platform - 安全策略中心
- Page/route: 安全策略中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员；read permission `security_policy.read`, write permission `security_policy.write`
- Business goal: 在现有 RBAC 上提供租户级 ABAC 策略配置、显式拒绝、策略模拟和评估日志，让企业能审查谁在什么上下文下能访问哪些智能体、知识库、工具、模型和会话。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + React Query + React Hook Form + Zod + lucide-react, shadcn-like Button/Card/Input/StatusBadge/MetricCard components.
- Existing page shell/layout: left sidebar + topbar console shell, responsive max-width content, dense operational SaaS dashboard.

Interface contract that must appear in the UI:
- API/service functions:
  - list security policy overview
  - list policies with keyword/status/effect/resource filters
  - create/update/delete policy
  - enable/disable policy
  - simulate ABAC decision
  - list recent policy evaluation logs
- Main entities and fields:
  - policy name, code, effect, resource_type, action, priority, status, conditions, description, timestamps
  - simulation subject/resource/action/context
  - evaluation decision, matched policy, reason, request_id, created_at
- Status values/enums:
  - policy status: ACTIVE, DISABLED, DELETED
  - effect: ALLOW, DENY
  - decision: ALLOW, DENY, NO_MATCH
  - operators: eq, neq, in, not_in, contains, exists
- User actions:
  - 新建策略, 编辑策略, 启用, 停用, 删除, 运行模拟, 查看评估日志, 复制请求 ID
- Required states:
  - loading skeleton, empty policy list, API error banner, validation messages, disabled mutation buttons, permission-denied state

Design requirements:
- Make it look like a production enterprise SaaS admin console, not a marketing page.
- Use a Bento/dashboard layout: top metrics, policy list table, right-side simulation panel, lower evaluation log table.
- Use subtle borders, soft shadows, backdrop blur, quiet blue/emerald/red status accents, and restrained spacing.
- Make policy effect visually obvious: DENY should be serious but not alarming, ALLOW should be calm.
- Keep all visible interface text in Chinese.
- Show realistic dense data rows and structured JSON-like condition chips.
- Use familiar icons for shield, lock, filter, play/test, alert, history.

Avoid:
- fake unrelated security products, random charts, unreadable tiny text, oversized hero sections, decorative blobs, excessive gradients, emoji, and one-note purple/blue palette.
