# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 多级控制台导航 | `apps/web/src/components/layout/sidebar.tsx`, `menu-navigation.ts` | 当前用户菜单权限 | 不调整导航逻辑，仅保证页面文案不暴露内部规划语言 |
| 开放接口文档 | `apps/web/src/app/(console)/api-reference/page.tsx` | 环境变量 `NEXT_PUBLIC_CONTROL_API_BASE_URL` 和静态接口说明 | 保留真实代码样例，标题改为业务化“调用样例” |
| API Key 管理 | `apps/web/src/components/api-keys/*` | API Key 查询、创建、编辑、观测、Webhook 投递 | 去掉 Mxx 徽标，保留权限状态和重试操作 |
| 核心业务创建页 | `agents`, `prompts`, `tools`, `models`, `knowledge` create/edit content | 各模块 create/update API | 把“详情页维护”改为“保存后继续配置” |
| 资源授权校验 | `resource-acls/*` | Resource ACL check/create/update/list API | “模拟检查”改为“访问校验/权限校验” |
| 审计与租户组织 | `approval-audits`, `audit`, `tenants`, `departments` | 审计、租户、部门列表 API | 去掉里程碑与列表职责解释 |
| 运营资产页面 | `storage`, `plugins`, `billing`, `channels`, `role-scenarios` | 各模块现有列表 API | 空状态和说明改为真实业务提示 |
