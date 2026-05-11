# M157 渠道配置敏感字段边界

## 背景

渠道中心已经有投递审计与回调审计脱敏，但 provider/account/template/route-rule 的配置 JSON 允许任意字段。如果用户把 token、secret、authorization 等凭据放入配置字段，可能绕过独立凭据字段和加密存储约束。

## 范围

- 渠道提供方 `config`。
- 渠道账号 `config`。
- 渠道模板 `variables` 与 `content_schema`。
- 渠道路由规则 `match_config` 与 `target_config`。
- 历史脏数据返回时的 metadata 脱敏。

## 后端行为

- 创建/更新配置类 JSON 时递归检查敏感 key。
- 命中敏感 key 时返回 `BadRequestException`。
- 提示用户使用独立 `secret` 字段或凭据管理能力。
- provider endpoint / callback URL 返回时会脱敏 query 中的 token、signature、secret 等参数。
- provider/account/template/route-rule metadata 返回时继续保留非敏感字段，但敏感字段值替换为 `[REDACTED]`。

## 敏感字段示例

- `authorization`
- `cookie`
- `token`
- `secret`
- `signature`
- `signing`
- `access_key`
- `api_key`
- `apikey`
- `corpsecret`

## 验收标准

- 敏感字段不会通过渠道配置入口落库。
- 渠道账号 secret 仍走原有加密存储与 masked 展示。
- 历史脏配置不会在列表或详情 metadata 中明文回显。
- 渠道投递审计、回调审计原有脱敏逻辑不回退。

## 非范围

- 不新增外部密钥管理服务。
- 不新增中间件或容器。
- 不改变渠道前端页面结构。
