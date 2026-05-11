# M173 生产验收与可观测性联动

## 范围

M173 将生产落地中心和现有可观测性 overview 连接起来，在发布验收清单中增加 Trace 质量证据提示。该能力不启动 OpenTelemetry Collector、不创建中间件、不开通新服务，也不在生产落地页直接拉取监控实时数据。

## 行为

- 生产验收 API 新增一个 `RELEASE_VALIDATION` 检查项：`observability-trace-quality`。
- 该检查项引导发布负责人在提交生产验收前复核 `/monitor/observability`。
- 检查项包含 `evidence_summary` 和结构化 `observability_signal`，覆盖：
  - Trace 覆盖率
  - 孤立事件
  - 错误链路
  - 慢链路
- 前端生产落地中心在现有检查项卡片内用中文展示证据摘要。
- 人工验收流程不变：有权限的用户继续通过现有验收备注提交证据。

## 验收备注建议

生产验收备注建议包含观测窗口、Trace 覆盖率、孤立事件数量、代表性错误 Trace ID 或处置状态，以及代表性慢链路 Trace ID 或阈值复核结论。

## 非目标

- 不启动 Collector。
- 不创建中间件。
- 不新增监控采集链路。
- 不重设计生产落地中心。
