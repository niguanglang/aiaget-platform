# Product UI Design Image Prompt

Create a high-fidelity Chinese enterprise SaaS admin screen for an "企业 Agent 平台 - 渠道提供方" focused page at `/channels/providers`.

Layout: responsive dashboard layout with left app navigation implied, main content max width, top breadcrumb-like route subtitle, page title "渠道提供方", concise description, horizontal channel operation tabs where "渠道提供方" is active. Use a Bento/Dashboard composition: four metric cards for total providers, active providers, average success rate, credential readiness; below, a clean searchable provider list with compact rows and expandable detail area. Top-right actions include "新建提供方" and "刷新"; destructive actions live in the expanded row detail only.

Visual style: minimal, technical, premium product feel; Tailwind/shadcn style cards, 8px radius, subtle borders, soft shadows, backdrop blur, light noise texture, restrained blue/emerald/amber status accents. Avoid excessive gradients, cheap glow, oversized rounded blobs, emojis, or overcrowded fields.

Content: Chinese labels only. Provider rows show core identity and status only: provider name, code, type, status, health, last check time, success rate. Expanded detail shows account count, template count, route rule count, 24h delivery, adapter readiness, credential rotation, metadata summary, and action buttons "启用提供方", "停用提供方", "编辑配置", "删除提供方".

Interactions to imply: hover feedback, smooth expand/collapse, staggered list reveal, permission-disabled buttons, delete confirmation. The UI should look like a real production admin page, not a template.
