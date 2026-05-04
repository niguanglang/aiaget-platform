# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the M63-21 release postmortem report panel inside `/channels`.

Main task flow:
1. 选择渠道。
2. 查看复盘结论和风险等级。
3. 扫描核心指标。
4. 阅读风险与建议。
5. 查看关键时间线和 Trace。
6. 复制或阅读 Markdown 报告正文。

Data contract:
- `ChannelReleaseReport.summary`
- `ChannelReleaseReport.metrics`
- `ChannelReleaseReport.risks`
- `ChannelReleaseReport.timeline`
- `ChannelReleaseReport.markdown`

Prototype requirements:
- Show component boundaries for header, conclusion, metrics, risks, timeline, report body.
- Include loading, error, empty, no-channel states.
- Use existing dashboard layout and Chinese labels.
- Keep report read-only; no unsupported edit/export controls.

Avoid:
- Invented backend fields
- New standalone route
- Visual noise that makes audit text hard to read
