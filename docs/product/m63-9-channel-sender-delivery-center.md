# M63-9 Sender 投递中心

## 目标

把 M63-8 的 Channel Sender 主动回复从“只写平台事件和用量”升级为可查询、可审计、可重试的投递中心。

## 后端能力

- 新增 `channel_sender_delivery` 表。
- 每次主动回复先创建 `PENDING` 投递记录。
- 投递完成后更新为：
  - `SUCCESS`：发送成功。
  - `FAILED`：平台返回失败或网络异常。
  - `SKIPPED`：空回复、sender 停用或缺少目标配置。
  - `RETRYING`：失败投递正在重试。
- 保存投递上下文：
  - 渠道、Agent、平台 provider、目标 target。
  - 请求正文、脱敏请求头、响应状态码、响应正文。
  - conversation、run、trace、外部会话和消息 ID。
  - 父级投递 ID、重试次数、耗时。
- 查询和详情接口受租户隔离与渠道/Agent 数据范围约束。

## API

```text
GET  /api/v1/channels/sender-deliveries
GET  /api/v1/channels/sender-deliveries/:deliveryId
POST /api/v1/channels/sender-deliveries/:deliveryId/retry
```

查询参数：

```text
channel_id
status
provider
```

权限：

```text
channel:publish:view   查看列表和详情
channel:publish:manage 重试失败投递
```

## 前端

在 `/channels` 的「全渠道发布中心」下新增「主动回复投递」面板：

- 投递指标：总数、成功、失败、跳过、平均耗时。
- 筛选：全部渠道 / 当前渠道、投递状态、平台。
- 列表：状态、平台、渠道、Agent、目标、耗时、重试次数、错误摘要。
- 详情：请求头、请求正文、响应正文、Trace、Run、外部消息上下文。
- 操作：复制投递 ID、重试失败投递。

参考设计产物：

```text
images/frontend-reference-design/m63-9-sender-投递中心/
```

## 注意

- 数据库保留失败重试所需的请求地址和请求头；API 输出到前端时会脱敏 Authorization、token、key、secret、sign 等敏感字段。
- 前端展示的目标地址使用脱敏 target，不展示真实带 token 的请求 URL。
- 本模块只新增迁移文件，没有自动执行数据库迁移。
