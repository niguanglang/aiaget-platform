# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台，成本与额度中心升级为计费商业化中心
- Page/route: M63-3 计费商业化中心 at `/billing`
- Target users/roles: 租户管理员、平台运营、财务运营
- Business goal: 管理租户套餐订阅、账单、额度策略，并把模型成本、运行成本、API Key 额度和平台用量联动展示
- Frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style components, cards, buttons, status badges, metric cards, light SaaS dashboard
- Existing page shell/layout: Console route with left navigation and constrained content width, responsive Bento/Dashboard grid, white cards, thin borders, subtle shadow, backdrop blur

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /billing/overview?window=24h|7d`
  - `PATCH /billing/subscription`
  - `PATCH /billing/quota-policies/:id`
- Main entities and fields:
  - Summary metrics: 总成本、模型成本、步骤成本、词元、月度预测、风险密钥、当前周期成本、超额成本、下期账单估算、活跃额度策略
  - Plan catalog: 套餐名称、层级、月付价格、年付价格、包含成本、包含词元、包含调用、包含存储、超额单价、功能限制
  - Current subscription: 当前套餐、状态、计费周期、基础价格、账期开始/结束、自动续费、包含额度
  - Invoices: 账单编号、状态、账期、总金额、已支付、到期时间
  - Quota policies: 策略名称、主体、指标、周期、额度、当前用量、使用率、预警阈值、硬限制阈值、动作、状态
- Status values/enums:
  - Subscription: TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELED
  - Plan tier: TEAM, BUSINESS, ENTERPRISE
  - Invoice: DRAFT, OPEN, PAID, VOID, OVERDUE
  - Quota risk: NORMAL, WARNING, CRITICAL, UNLIMITED
  - Quota action: WARN, THROTTLE, REQUIRE_APPROVAL, BLOCK
- User actions:
  - 切换 24h/7d 成本窗口
  - 刷新概览
  - 切换套餐与月付/年付
  - 编辑额度策略上限、阈值、动作和状态
- Required states: loading skeletons, empty cards, error banner, disabled buttons while saving, validation messages, success state through refreshed data

Design requirements:
- Make it look like a production enterprise billing console, not a marketing pricing page.
- Primary workflow: user scans current subscription and cost exposure, compares plan cards, switches plan/cycle, reviews invoice history, adjusts quota policies.
- Use compact Chinese labels and realistic numeric values.
- Layout should have:
  - top header with title, window segmented control, refresh button
  - top metric card grid
  - current subscription card and plan catalog card in a two-column responsive grid
  - quota policy management card with editable rows and usage bars
  - invoice table and existing cost trend areas below
- Visual language: minimal, technical, premium enterprise SaaS, clean white surface, thin borders, soft shadows, restrained blue/neutral accents, no noisy decoration.

Avoid:
- fake fields not listed above
- decorative graphics that cannot map to cards/tables/forms
- unreadable tiny text
- over-bright gradients, neon glow, emoji, excessive animation
