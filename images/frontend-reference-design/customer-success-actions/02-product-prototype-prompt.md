# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for an enterprise admin page.

Page: 客户成功行动中心 at `/customer-success-actions`

Information architecture:
- Top page header: module badges, page title, concise Chinese description, primary action `新建行动`
- Metrics row: 成功行动、进行中、受阻风险、高分行动
- Filter toolbar: keyword search, action type, status, priority, risk level, owner, customer success plan, delivery review, delivery asset, solution package, clear filters
- Table columns: 行动、客户、类型/状态、优先级/风险、评分、行动摘要、下一步动作、来源关系、负责人、关键时间、操作
- Row actions: 详情、编辑、归档
- Empty state: title `暂无客户成功行动`, description guiding user to create action from a customer success plan
- Detail route: `/customer-success-actions/[id]`
- Create route: `/customer-success-actions/create`
- Edit route: `/customer-success-actions/[id]/edit`

Prototype rules:
- List page only supports query/filter/overview/row actions.
- Full fields `预期结果`、`执行记录`、`阻塞风险`、`完成证据`、`内部备注` belong to detail page and form page, not table.
- Create/edit use independent page with grouped form sections: 基础信息、执行内容、关联资源.
- Dangerous archive action opens confirmation dialog.
- Use Chinese labels and real status wording.
