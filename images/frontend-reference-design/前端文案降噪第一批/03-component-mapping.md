# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 根入口 | `apps/web/src/app/page.tsx` | routes only | 删除产品介绍段，保留登录/仪表盘入口 |
| 登录页 | `apps/web/src/app/login/page.tsx` | `AuthProvider.login` | 营销句改为控制台标题和认证/审计/监控口径 |
| 工作台 | `apps/web/src/components/dashboard/dashboard-content.tsx` | `getMonitorOverview`、`getAuditOverview` | 欢迎语改为系统概览，去掉里程碑标签和版权尾注 |
| 菜单中心 | `apps/web/src/components/menus/menu-content.tsx` | `getMenuOverview`、`getMenuTree`、`listMenus` | 删除职责拆分提示，副标题改为字段口径 |
| 角色中心 | `apps/web/src/components/roles/role-permission-content.tsx` | `getRoleOverview`、`listRoles` | 删除列表职责说明 |
| 用户中心 | `apps/web/src/components/users/users-content.tsx` | `listUsers`、`listRoles`、`getDepartmentTree` | 删除页面说明，保留筛选和用户表 |
| 审计中心 | `apps/web/src/components/audit/audit-content.tsx` | `getAuditOverview`、`listAuditEvents`、`getApprovalAuditOverview` | 简化审计说明和审批桥接说明 |
| 审批中心 | `apps/web/src/components/approvals/approval-content.tsx` | approval overview APIs | 卡片说明改为短业务对象名 |
| 安全总览 | `apps/web/src/components/security/security-overview-content.tsx` | security overview APIs | 删除“引导进入/职责页/不嵌入”类文案 |
| 文案契约测试 | `apps/web/src/components/content-quality/content-copy-route-ia-contract.test.ts` | 源码字符串契约 | 防止介绍型和 IA 解释型文案回流 |
