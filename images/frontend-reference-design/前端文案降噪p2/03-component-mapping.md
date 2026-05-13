# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 客户评估 | `customer-assessments-content.tsx`, `customer-assessment-create-content.tsx`, `customer-assessment-detail-content.tsx` | `CustomerAssessmentListItem`, assessment APIs | 清理“进入详情页/沉淀完整”等内部说明；无写权限隐藏编辑入口。 |
| 交付成果资产 | `delivery-assets-content.tsx`, `delivery-asset-create-content.tsx`, `delivery-asset-form-panel.tsx` | delivery asset APIs | 文案聚焦资产类型、状态、复用评分、来源关系；新建入口按权限渲染。 |
| 客户成功行动 | `customer-success-actions-content.tsx`, `customer-success-action-create-content.tsx`, `customer-success-action-status.ts` | customer success action APIs | 将“闭环/赋能/沉淀”替换为执行跟进、培训支持、证据要求。 |
| 客户成功计划 | `customer-success-plans-content.tsx`, `customer-success-plan-create-content.tsx` | customer success plan APIs | 列表说明聚焦评分、扩展预览、下一步动作和来源关系；隐藏无权限新建入口。 |
| 续约机会 | `customer-success-opportunities-content.tsx`, `customer-success-opportunity-detail-content.tsx` | opportunity APIs | 将商务闭环、跟进行动闭环、成交入账闭环改为业务动作名称。 |
| 交付复盘与方案包 | `delivery-reviews-content.tsx`, `solution-packages-content.tsx` | review and solution package APIs | 文案改为验收结果、问题复盘、改进行动、评分和摘要预览。 |
| Skill 资产 | `skills-content.tsx`, `skill-create-content.tsx`, `skill-edit-content.tsx`, `skill-detail-content.tsx` | skill APIs | 去掉“列表页用于/完整 SOP/详情页维护”，保留 SOP 管理和版本引用语义。 |
| 插件生态 | `plugin-content.tsx`, `plugin-detail-content.tsx` | plugin APIs | 将 `M63-2` 改为插件生态，详情页说明聚焦 Manifest、安装状态、权限、Hook 和菜单绑定。 |
| 质量测试 | `content-copy-p2-route-ia-contract.test.ts` | Node test + source file scan | 覆盖 P2 低频模块的内部 IA/营销词和无权限占位动作。 |
