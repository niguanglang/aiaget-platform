# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS/admin page.

Project context:
- Product/module: Enterprise Agent Platform, M04 Model Center.
- Page/route: Model Center at `/models`.
- Target users/roles: authenticated tenant admins and operators with `model.read`; write actions require `model.write`.
- Business goal: manage OpenAI Compatible providers, model configs, masked API keys, cost rules, rate limits, and call tests from one tenant-scoped console.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, lucide icons, shadcn-style Button/StatusBadge/MetricCard.
- Existing page shell/layout: protected console with fixed left navigation and top bar; content area uses centered max-width dashboard layouts.

Interface contract that must appear in the UI:
- API/service functions: list/create/update/delete model providers, enable/disable provider, get provider detail, add/delete masked API key, create/update/delete/enable/disable model config, test provider, read call logs.
- Main entities and fields:
  - Provider: name, code, provider type, base URL, status, default flag, description, updated time.
  - Model: name, model id, capabilities, context length, input/output token price, rate limit RPM, status, default flag.
  - API Key: name, prefix, masked key, status, last used, created time; never show raw secret.
  - Call Log: trace id, model, status, tokens, cost, latency, error, created time.
- Status values/enums: ACTIVE, DISABLED, DELETED; capabilities chat, embedding, rerank, vision, tool_call.
- User actions: search, filter by provider type/status/capability, create/edit provider, create/edit model, disable/enable, soft delete, add/remove key, run call test, inspect logs.
- Required states: loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Use a production dashboard/Bento layout: metric cards, provider table, model table, right detail/test panel.
- Use thin borders, soft shadow, subtle glass surfaces with backdrop blur, light noise texture, and restrained gradient mesh depth.
- Include small motion-ready affordances: hover states, active row, soft reveal groups, smooth transitions; keep all motion calm and operational.
- Include an optional ambient Three.js-style particle field or floating geometry in the background, subtle and not competing with information.
- Keep visual language minimal, advanced, clean, high-product quality.
- Avoid overdone gradients, exaggerated glow, emoji, large decorative circles, crowded content, random analytics charts, or fields not in the contract.
