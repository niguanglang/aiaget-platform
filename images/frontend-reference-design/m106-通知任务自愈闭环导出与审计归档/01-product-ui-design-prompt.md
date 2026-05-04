# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the real `/security` page section.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 通知任务自愈闭环审计
- Page/route: M106 通知任务自愈闭环导出与审计归档 at `/security`
- Existing stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style Card/Button/MetricCard/StatusBadge/EmptyState
- Placement: inside the M105 “自愈闭环审计检索” card, below filters/table as an archive panel.

Interface contract:
- Export current filters to CSV.
- Create archive from current filters.
- List archive files from object storage.
- Get archive download URL.
- Archive fields: id, key, file_name, folder, size_bytes, etag, last_modified, download_expires_in.

Design requirements:
- Add an “审计归档” panel with archive summary cards and a compact archive list.
- Top action row: 导出 CSV, 生成归档, 刷新归档.
- Show success/error message banners.
- Archive row shows file name, size, last modified, folder, and download button.
- Keep layout dense, clean, enterprise-oriented.
- Chinese labels only.

Avoid:
- delete or destructive archive controls
- automatic repair controls
- decorative hero sections, excessive gradients, emojis, glows
