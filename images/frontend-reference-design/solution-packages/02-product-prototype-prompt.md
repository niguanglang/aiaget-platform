Create a product prototype / wireframe image for the AI 落地方案包中心 page.

Page/route: `/solution-packages`
Users/roles: 租户管理员、售前负责人、交付负责人、Agent 管理员
Main task flow: 搜索筛选方案包 -> 查看紧凑列表 -> 进入详情页查看交付路线图、验收、ROI、风险和关联资源 -> 新建或编辑方案包
API/service contract: listSolutionPackages, getSolutionPackage, createSolutionPackage, updateSolutionPackage, deleteSolutionPackage
Data entities and fields: customer_name, industry, package_stage, status, priority, package_score, executive_summary_preview, roadmap_preview, roi_preview, linked customer_assessment, linked role_scenario
Actions and states: 新建、详情、编辑、归档、清空筛选、分页、加载、空状态、错误、无权限禁用

Prototype requirements:
- Low- to mid-fidelity wireframe, focus on information architecture and page boundaries.
- Separate list page, detail page, create page, edit page.
- List page must not include full acceptance_plan, risk_mitigation, commercial_strategy, or full delivery_roadmap.
- Detail page uses grouped sections for 方案摘要、业务目标、范围、场景蓝图、交付路线图、验收计划、ROI、风险缓释、商务推进、关联资源。
- Create/edit page uses a structured form with sections, not a small modal.
