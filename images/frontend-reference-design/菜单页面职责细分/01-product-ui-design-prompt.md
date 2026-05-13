# Product UI Design Image Prompt

Design a production-ready Chinese enterprise admin console, inspired by mature backend systems such as RuoYi but with modern SaaS polish. The screen shows a left collapsible multi-level sidebar and a dense operational workspace. Focus on information architecture, not marketing.

Core composition:
- Sidebar: `Agent 中心` expanded with `知识库中心` children `活动总览 / 文档处理任务 / 召回记录 / 检索健康度`; `工具中心` with `执行记录`; `可观测中心` with `平台用量` children `事件总览 / 平台事件 / 用量账本 / 用量趋势 / 事件告警 / 通知记录 / 治理任务`.
- Main area: one selected page with compact header, status badges, refresh button, return/config buttons, metric cards, search/filter strip, and a single focused data table.
- No hero copy, no feature introduction paragraphs, no decorative glow, no emoji, no oversized rounded cards.

Visual style:
- Chinese labels, quiet enterprise palette, white/neutral cards, blue accent only for primary state.
- Table-first layout, 8px or smaller radius, predictable spacing, clear row actions.
- Top buttons are global actions; row buttons are single-object actions; detail links open separate pages.
