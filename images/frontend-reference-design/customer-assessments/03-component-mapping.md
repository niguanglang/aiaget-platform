# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/customer-assessments/customer-assessment-background.tsx` + page layout | route shell | 轻量氛围背景，不抢主体信息 |
| Toolbar/search/filter | `apps/web/src/components/customer-assessments/customer-assessments-content.tsx` | `listCustomerAssessments` | 搜索、筛选、清空、分页 |
| Metrics row | `apps/web/src/components/ui/metric-card.tsx` | `CustomerAssessmentListItem` 聚合统计 | 只展示概览指标 |
| Main table | `apps/web/src/components/customer-assessments/customer-assessments-content.tsx` | `CustomerAssessmentListItem` | 列表只保留核心字段和预览字段 |
| Detail action bar | `apps/web/src/components/customer-assessments/customer-assessment-detail-content.tsx` | `getCustomerAssessment`, `deleteCustomerAssessment` | 编辑、归档、返回 |
| Detail content | `apps/web/src/components/customer-assessments/customer-assessment-detail-content.tsx` | `CustomerAssessmentDetail` | 六问判断、评分、建议打法、风险提示、下一步动作 |
| Create/Edit form | `apps/web/src/components/customer-assessments/customer-assessment-form-panel.tsx` | `CreateCustomerAssessmentInput`, `UpdateCustomerAssessmentInput` | 独立表单，重算准备度 |
| Empty state | `apps/web/src/components/ui/empty-state.tsx` | 列表查询空结果 | 中文空状态 |
| Loading / error | `Card` + inline text in content components | query state | 保持当前项目风格 |
