# Product Prototype / Wireframe Prompt

设计一个中保真产品原型图，主题是企业 AI Agent 平台 `/agent-teams` 的人工介入恢复执行流程，所有文字为中文。

信息架构：
1. 顶部：运行记录下拉、监控追踪、复制 Trace。
2. 摘要区：状态、完成度、失败步骤、Token、成本、耗时。
3. 左侧：步骤时间线，包含 PLAN、VERIFY、AGENT_RUN、HANDOFF、SUMMARY。
4. 右侧：人工介入面板。
5. 下方：接力记录列表与运行反馈列表。

人工介入面板原型：
- 标题：人工介入
- 状态：等待审批 / 无待处理 / 无权限
- 待审批接力：
  - 来源：某 Agent 或团队
  - 目标：人工处理或下一个 Agent
  - 原因：Supervisor 模型判断需要人工介入
  - 创建时间
- 审批备注 textarea
- 主按钮：通过并继续
- 次按钮：拒绝并结束

状态流：
- PENDING -> 点击通过 -> APPROVED -> 调用恢复执行 -> 运行回到 RUNNING/最终 SUCCESS/FAILED
- PENDING -> 点击拒绝 -> REJECTED -> 运行 FAILED
- 如果当前运行不是 WAITING_HUMAN，则面板显示“当前运行无需人工介入”

原型重点：
- 强调状态流和按钮位置，不需要复杂视觉装饰。
- 使用清晰分区、表单控件、状态 badge、空状态。
- 保持与现有 Agent 协作页面兼容，不增加新导航。
