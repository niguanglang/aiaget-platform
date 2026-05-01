# Product UI Design Image Prompt

Create a high-fidelity enterprise login page for the Enterprise Agent Control Console at `/login`.

Project context:
- Product/module: enterprise AI agent control console
- Route: `/login`
- Target users: tenant administrators and tenant operators
- Business goal: authenticate into the real Control Plane with tenant context, JWT session, RBAC foundation, and audit-aware access
- Existing stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style inputs/buttons/cards, lucide icons

Interface contract that must appear:
- Form fields: tenant code, email, password
- Primary action: login
- States: validation errors, submitting, login failure, success redirect helper
- Development helper text: seeded tenant `default`, admin `oss-admin-7f4c2a@local.invalid`, password `AIAgetDev!9sK4pQ7m`

Design requirements:
- Use a premium, minimal, high-tech product aesthetic
- Light white and blue environment with strong whitespace
- Left side: brand, large headline, supporting copy, trust signals, compact capability cards
- Right side: tall glass login card with subtle border, soft shadow, backdrop blur, field icons, password visibility toggle, primary blue button
- Background: soft perspective grid, subtle gradient mesh, faint particles, one floating orb/orbit element for depth
- Motion style: restrained hover lift, staggered entrance, smooth transitions
- Keep it product-like and operational, not marketing-heavy

Avoid:
- loud neon glow
- oversized decorative gradients
- emoji
- cramped information density
