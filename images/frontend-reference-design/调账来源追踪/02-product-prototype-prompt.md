# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise billing adjustment source trace page.

Project context:
- Page/route: 调账申请与审批记录 at `/billing/adjustments`
- Users/roles: 财务运营、租户管理员、客户成功负责人；写操作由 `billing:adjustment:manage` 控制
- Main task flow: 用户进入调账页 -> 查看指标 -> 创建或处理调账 -> 在审批记录表格识别来源 -> 点击来源链接返回续约机会详情页
- API/service contract: `getBillingOverview` provides `adjustments`; mutation services remain create/approve/apply/void adjustment
- Data entities and fields: `adjustment_no`、`type`、`status`、`signed_amount`、`invoice_no`、`source_label`、`source_href`、`reason`、`created_at`

Prototype requirements:
- Low- to mid-fidelity wireframe, focused on information architecture.
- Regions: header with refresh/window switch, permission warning, metric cards, create adjustment form, adjustment table, confirmation dialog.
- Table columns should stay compact: 调账单 / 类型 / 状态 / 金额 / 关联账单 / 来源 / 原因 / 创建时间 / 操作.
- Source cell states: linked source, non-linked manual source, missing source fallback.
- Show loading row, empty state, error banner, disabled actions when permission missing.
- Make clear that clicking source navigates away to the source object detail page.

Avoid:
- Putting source object full details into the list
- Mixing renewal opportunity write actions into billing page
- Creating a second business list inside the adjustment table
