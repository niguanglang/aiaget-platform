# Product Prototype / Wireframe Prompt

Create a low-fidelity wireframe for the customer success opportunity detail page section “成交入账闭环”.

Layout:
1. Header row: left title + short description, right optional link to `/billing/adjustments`.
2. Metrics row: expected amount, weighted amount, current stage/status, billing record state.
3. Form state when not closed:
   - input: 成交金额
   - input/textarea: 入账说明
   - primary action: 确认成交入账
   - permission-denied notice when user lacks either opportunity manage or billing adjustment manage.
4. Confirmation modal:
   - title: 确认成交入账
   - body explains opportunity will become WON and a billing debit adjustment will be created.
   - buttons: 取消, 确认入账.
5. Closed state:
   - adjustment summary: 调账单号, 金额, 状态, 来源.
   - link button: 查看调账记录.

Keep the wireframe focused on page responsibility boundaries: no full billing adjustment list, no invoice detail, no opportunity edit form. Use Chinese labels only.
