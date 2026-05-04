# M57 外部 API 调用观测与审计视图增强

## 目标

M57 在 API Key 管理中心补齐外部系统调用 Agent 后的观测闭环，让租户管理员、接口管理员和审计人员可以直接看到外部请求量、成功率、额度风险、安全拒绝、Trace ID 和审计跳转。

## 已实现

- 新增共享类型：
  - `ExternalApiObservabilityOverview`
  - `ExternalApiObservabilitySummary`
  - `ExternalApiCallLogItem`
  - `ExternalApiQuotaWatchItem`
  - `ExternalApiSecurityDenialItem`
  - `ExternalApiObservabilityWindow`
- 新增控制面接口：

```http
GET /api/v1/api-keys/external-observability?window=24h|7d
```

- 接口权限：
  - `system:api_key:view`
- 聚合数据来源：
  - `api_key`
  - `operation_log`
  - `conversation_run`
  - `conversation`
  - `agent`
- 外部调用日志上下文增强：
  - `api_key_id`
  - `api_key_prefix`
  - `external_agent_id`
  - `external_conversation_id`
  - `external_run_id`
  - `external_trace_id`
- 外部 API Key 鉴权链路提前挂载 request 上下文，确保有效密钥触发的 scope、Agent 白名单、IP 白名单、限流、额度等拒绝能进入操作日志。
- 安全拒绝事件映射兼容 `guard_source`，用于展示 Data Scope、Resource ACL 和安全策略拒绝来源。

## 前端页面

页面位置：

```text
/api-keys
```

新增区域：

- 外部 API 调用观测头部
- 时间窗口切换：近 24 小时 / 近 7 天
- 指标卡片：
  - 外部请求
  - 成功率
  - 拒绝事件
  - 词元消耗
- 最近外部调用：
  - Agent
  - API Key
  - 状态码
  - 词元
  - 成本
  - 延迟
  - IP
  - Request ID
  - Trace ID
  - 监控入口
  - 审计入口
- 额度关注：
  - 今日调用
  - 日额度
  - 剩余额度
  - 使用率
  - 风险等级
- 安全拒绝：
  - 拒绝原因
  - 来源
  - API Key 前缀
  - Agent
  - Request ID
  - Trace ID
  - 审计入口

## 审计链路

外部调用走以下链路：

```text
外部系统
-> /external/agents/{agentId}/chat
-> API Key 鉴权
-> 权限 / Data Scope / Resource ACL 校验
-> Conversation / Runtime 执行
-> OperationLog 记录
-> API Key 管理中心观测聚合
```

成功请求会尽量关联到会话 Run 和 Trace。被拒绝请求至少会保留 Request ID、状态码、API Key 前缀、Agent ID 和拒绝错误，便于进入审计中心排查。

## 参考设计资产

```text
images/frontend-reference-design/外部api调用观测/
```

包含：

- Project UI Brief
- 产品 UI 设计图提示词
- 产品原型图提示词
- 组件映射说明

## 当前边界

- M57 不新增数据库表。
- M57 不新增中间件、容器或外部依赖。
- 观测数据基于现有操作日志和会话运行记录聚合，历史日志如果缺少新增上下文字段，只能按 path、request_id 或 trace_id 尽量关联。
- 无效 API Key 或缺失 API Key 的请求无法确定租户和用户，因此不会写入租户级操作日志。
- 当前外部开放接口仍是非流式 Agent 调用，流式外部接口仍未开放。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
