# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design for a Chinese “客户成功续约机会中心” page at `/customer-success-opportunities`.

The screen is a real product dashboard, not a landing page. Use a restrained modern enterprise style with Tailwind/shadcn-like components: left console context implied, spacious content area, subtle border, soft shadow, light glass blur, quiet gradient mesh background, no emoji, no cheap glow, no oversized rounded cards.

Primary layout:

- Header with badges “续约机会 / 商务闭环 / 客户成功”, title “客户成功续约机会中心”, short Chinese description, and primary button “新建机会”.
- Bento metric row: 续约机会总数, 高价值机会, 谈判中, 风险机会.
- Filter bar with keyword search and compact selects for opportunity type, stage, status, priority, confidence, risk, owner, plan, action, review, asset, package.
- Compact table with columns: 机会, 客户, 类型/阶段, 状态/优先级, 信心/风险, 评分, 金额/概率, 机会摘要, 下一步动作, 来源关系, 负责人, 关键时间, 操作.
- Row actions: 详情, 编辑, 归档. Low-frequency destructive action visually secondary.
- Empty/loading/error states should feel product-ready.

Visual notes:

- Use Chinese UI text throughout.
- Information hierarchy must be clean and dense enough for an operations console.
- Use badges and small monetary values for pipeline review.
- Do not place full customer value, commercial strategy, decision path, risk summary, loss reason, or notes in the list table; they belong to detail page.
