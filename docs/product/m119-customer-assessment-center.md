# M119 客户分层与六问评估中心

## 目标
把企业落地交流文档里的“客户分层 + 六问判断”产品化，形成一个轻量的客户 AI 落地资格评估中心，而不是完整 CRM。

## 模块职责
- 列表页：查询、筛选、概览、查看、编辑、归档
- 详情页：完整六问判断、评分、建议打法、风险提示、下一步动作
- 新增/编辑页：独立表单，维护完整评估内容并重算准备度

## 核心契约
- 路由：/customer-assessments
- 控制面 API：GET/POST/PATCH/DELETE /customer-assessments
- 权限：customer:assessment:view / customer:assessment:manage
- 资源：CUSTOMER_ASSESSMENT
- 数据范围：支持 DataScopeGuard 与 ResourceAclGuard

## 数据字段
### 列表字段
- customer_name
- customer_type
- decision_stage
- status
- industry
- contact_name
- readiness_score
- business_goal_preview
- recommended_strategy_preview
- owner
- created_at
- updated_at

### 详情字段
- contact_info
- business_goal
- process_maturity
- data_asset_status
- management_support
- budget_signal
- six_question_scores
- recommended_strategy
- risk_summary
- next_action
- notes

### 枚举
- customer_type: UNKNOWN / ANXIOUS / TASK_DRIVEN / CLEAR
- decision_stage: LEARNING / EVALUATION / PROCUREMENT / PILOT / DELIVERY
- status: DISCOVERY / QUALIFIED / NURTURING / WON / LOST / ARCHIVED

## 参考设计
- 参考资产目录：images/frontend-reference-design/customer-assessments
- UI brief：00-project-ui-brief.md
- 高保真 UI 提示词：01-product-ui-design-prompt.md
- 原型提示词：02-product-prototype-prompt.md
- 组件映射：03-component-mapping.md
