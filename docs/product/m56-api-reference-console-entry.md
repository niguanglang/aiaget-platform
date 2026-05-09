# M56 开放接口文档中心入口

## 目标

M56 把已经完成的开放接口文档页接入企业控制台，解决“页面存在但后台不可发现”的问题，并让它和 API Key 外部调用能力形成入口闭环。

## 已实现

- 路由接入控制台布局：
  - 页面从独立根路由文件迁入 `(console)` 路由组。
  - URL 保持 `/api-reference` 不变。
  - 页面现在复用 `ConsoleShell`、登录保护、左侧导航、顶部栏和移动端导航。
- 模块配置新增：
  - `api_reference`
  - 标题：开放接口文档中心
  - 导航名：接口文档
  - 权限：`system:api_key:view`
  - 路由：`/api-reference`
- 导航入口新增：
  - fallback 导航支持 `api_reference`
  - 动态菜单图标支持 `BookOpen`
  - 当数据库菜单尚未补齐时，会按 `system:api_key:view` 权限自动补充 `/api-reference` 入口。
- 种子菜单新增：
  - `api_reference`
  - 图标：`BookOpen`
  - 权限：`system:api_key:view`
- API Key 管理中心新增“接口文档”入口，方便从密钥配置直接跳到外部调用文档。

## 页面能力

页面继续展示当前真实开放接口：

```http
POST /api/v1/external/agents/{agentId}/chat
POST /api/v1/external/agents/{agentId}/chat/stream
POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages
POST /api/v1/external/agents/{agentId}/conversations/{conversationId}/messages/stream
```

覆盖内容：

- Bearer Token / `x-api-key` 两种鉴权方式
- 请求体字段
- 响应字段
- 非流式与 SSE 流式事件结构
- 新建会话与指定 `conversation_id` 续聊
- curl 示例
- TypeScript fetch 示例
- API Key 管理接口
- 安全校验链路
- 常见错误与处理方式
- Swagger 入口

## 权限说明

接口文档使用 `system:api_key:view` 控制可见性。原因是该页面面向外部调用接入，核心工作流依赖 API Key 查看和治理能力。

```text
有 system:api_key:view
-> 可以看到接口文档入口
-> 可以打开 /api-reference
-> 可以跳转 API Key 管理中心
```

后台真实 API 调用仍由后端继续校验：

- API Key 状态、过期时间、scope
- Agent 白名单
- IP 白名单
- 限流与日额度
- 创建人权限
- Data Scope
- Resource ACL
- Runtime / Audit / Trace 链路

## 参考设计资产

```text
images/frontend-reference-design/开放接口文档中心/
```

包含：

- Project UI Brief
- 产品 UI 设计图提示词
- 产品原型图提示词
- 组件映射说明

## 当前边界

- M56 不新增后端接口。
- M56 不执行数据库 seed；已有租户如果没有 `api_reference` 菜单，前端会通过 fallback 权限补入口。
- M56 只负责把接口文档中心接入控制台；外部 SSE 流式调用由 M58 落地，外部会话续聊由 M59 落地。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- `git diff --check`
