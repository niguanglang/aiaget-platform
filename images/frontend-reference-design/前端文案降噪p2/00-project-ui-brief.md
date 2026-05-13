# Project UI Brief

- Page: 前端文案降噪 P2
- Routes: `/customer-assessments`, `/solution-packages`, `/delivery-reviews`, `/delivery-assets`, `/customer-success-plans`, `/customer-success-actions`, `/customer-success-opportunities`, `/skills`, `/plugins`
- Feature goal: 清理低频业务模块中的内部 IA 说明、营销化词汇、里程碑标签和无权限占位动作，让页面更像真实后台。
- Target users: 售前顾问、交付负责人、客户成功经理、插件管理员、技能资产管理员、租户管理员。
- Permissions: 继续使用现有 `hasPermission` 和租户管理员判断；无写权限时隐藏新建、编辑等入口，归档、删除、分页和加载等真实禁用状态保留。
- APIs/services: 保持现有 `@/lib/api-client` 调用不变，包括客户评估、方案包、交付复盘、成果资产、客户成功计划、行动、续约机会、Skill、插件详情与安装相关接口。
- Entities/fields/statuses: 客户评估、落地方案包、交付复盘、成果资产、客户成功计划、客户成功行动、续约机会、Skill、插件 Manifest、安装状态、权限、Hook、菜单绑定。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、motion、lucide-react、`Button`、`Card`、`EmptyState`、`MetricCard`、`StatusBadge`、模块级背景组件和表单面板。
- Required states: loading、empty、error、success、permission-denied、readonly、pagination disabled、mutation pending、form validation disabled。
- Constraints: 不改路由、接口、类型、权限模型和数据结构；只调整可见中文文案、状态标签和无权限动作展示方式。
