# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台
- Page/route: 登录页 at `/login`
- Target users/roles: 未登录的企业租户用户
- Business goal: 引导用户通过企业域名、账号和密码登录控制台
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, local shadcn-like `Input`/`Button`/`Card`, lucide-react icons, motion/react
- Existing page shell/layout: standalone full-screen login page, no console sidebar/topbar

Interface contract that must appear in the UI:
- API/service functions: `useAuth().login(input)` -> `POST /auth/login`
- Main entities and fields: `tenantCode`, `email`, `password`
- Status values/enums: submitting, validation error, server error, password visible/hidden
- User actions: submit login, toggle password visibility, open forgot password link, click apply trial link, click enterprise SSO button
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production enterprise SaaS login screen, not a generic Dribbble mockup.
- Use the project's existing data fields and actions; do not invent unrelated modules.
- Show the primary workflow clearly: tenant login with supporting trust/feature copy and SSO fallback.
- Include the exact layout from the provided reference: top-left brand, large left headline, bottom capability cards, right glass card form.
- Keep visual language consistent with the provided reference image and the supplied background slice.
- Emphasize hierarchy, spacing, alignment, and operational clarity.
- Output should be a product UI design reference image suitable for frontend implementation.
