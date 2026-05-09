# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 客户成功计划中心 at `/customer-success-plans`
- Users/roles: 租户管理员、客户成功经理、交付负责人；查看权限 `customer:success:view`，管理权限 `customer:success:manage`
- Main task flow: 进入客户成功计划列表 -> 搜索/筛选客户和计划状态 -> 查看核心字段和来源关系 -> 进入详情查看成功目标、资产复用、续约和风险 -> 新建或编辑计划 -> 二次确认归档
- API/service contract: `listCustomerSuccessPlans`、`createCustomerSuccessPlan`、`getCustomerSuccessPlan`、`updateCustomerSuccessPlan`、`deleteCustomerSuccessPlan`；辅助 `listDeliveryReviews`、`listDeliveryAssets`、`listSolutionPackages`、`listUsers`
- Data entities and fields: `CustomerSuccessPlanListItem` 包含计划、客户、阶段、状态、优先级、健康度、评分、扩展预览、下一步预览、负责人、来源复盘、成果资产、方案包、关键时间；`CustomerSuccessPlanDetail` 承载完整计划内容
- Actions and states: 新建、查看、编辑、归档、筛选、分页、加载、空状态、错误、权限禁用、表单校验

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, page regions, user flow, and interaction states.
- Show clear labels for sections: header, metrics, filters, compact table, archive confirmation, detail cards, create/edit grouped form.
- Include empty/error/loading/permission state placeholders.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current project and route shell.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
