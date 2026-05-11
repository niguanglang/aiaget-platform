# Product UI Design Image Prompt

Create a high-fidelity Chinese enterprise SaaS admin interface for the custom plugin install dialog on `/plugins`.

Project context:
- Product/module: 企业 AI Agent 平台 / 插件生态 / 自定义插件安装
- Page/route: 插件中心 at `/plugins`
- Target users/roles: 插件管理员、安全管理员、租户管理员
- Business goal: 在安装自定义插件前识别 Manifest 是否声明了自定义代码入口，并要求沙箱策略声明，避免未隔离第三方代码进入平台。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui style cards, `StatusBadge`, `Button`, compact enterprise dashboard layout.
- Existing page shell/layout: plugin marketplace page opens a custom install dialog with Manifest JSON editor, preview, backend precheck panel, package integrity summary and Tool Gateway binding preview.

Interface contract that must appear in the UI:
- API/service functions: `validatePluginManifest`, `installPlugin`
- Main entities and fields: `PluginManifestValidationResult.sandbox_required`, `sandbox_policy.status`, `entry`, `isolation`, `network`, `filesystem`, `timeout_ms`, `memory_mb`, `reason`
- Status values/enums: `NOT_REQUIRED`, `MISSING`, `DECLARED`, plus package integrity `PASSED/FAILED/SKIPPED`
- User actions: 编辑 Manifest、执行预检、查看沙箱策略结果、安装、取消
- Required states: 未预检、预检中、预检失败、预检通过、结果失效、安装按钮禁用

Design requirements:
- Add a “沙箱策略预检” card below package integrity or near backend precheck results.
- Show clear badges: “无需沙箱”, “缺少策略”, “已声明”, “需要沙箱”.
- Use concise summary fields: 代码入口, 隔离方式, 网络策略, 文件系统, timeout_ms, memory_mb.
- Keep the dialog operational and compact; do not show a sandbox runtime console or any code execution UI.
- Use Chinese labels and restrained enterprise SaaS styling with subtle borders and soft shadows.

Avoid:
- fake container dashboards, fake terminal output, code execution buttons
- implying that Control API runs plugin code
- unrelated plugin marketplace content or decorative illustrations
