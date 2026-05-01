# M38 安全中心整合

## 目标

M38 把前面已经完成的安全能力整合到统一安全中心：

```text
安全策略
数据权限
资源授权
高危审批
审计日志
运行监控
```

原 `/security` 不再只是单一 ABAC 策略页，而是安全态势总控台 + 策略治理工作区。

## 已实现

- 新增 Control API 聚合接口：
  - `GET /api/v1/security-center/overview`
- 新增后端模块：
  - `SecurityCenterModule`
  - `SecurityCenterController`
  - `SecurityCenterService`
- 新增共享类型：
  - `SecurityCenterOverview`
  - `SecurityCenterModuleSummary`
  - `SecurityCenterRiskSignal`
- 前端 `/security` 改造：
  - 安全评分
  - 待审批、安全事件、拒绝规则、运行异常指标
  - 安全治理模块 Bento Grid
  - 风险信号列表
  - 保留原有策略清单、策略模拟、评估日志
- 更新模块配置：
  - 导航文案从“安全策略”升级为“安全中心”

## 聚合数据来源

```text
security_policy
security_policy_evaluation
role_data_scope
resource_acl
tool_approval_request
login_log
operation_log
model_call_log
tool_call_log
knowledge_recall_log
conversation_run
conversation
```

## 安全评分规则

第一版为启发式评分：

- 默认 100 分
- 待审批越多，扣分越多
- 最近 24 小时安全事件越多，扣分越多
- 最近 24 小时运行异常越多，扣分越多
- 没有启用安全策略会扣分
- 没有角色数据权限配置会扣分

风险等级：

```text
LOW     >= 85
MEDIUM  >= 65
HIGH    < 65
```

## 当前边界

- M38 只做聚合和统一入口，不改变 M37 Guard 判定逻辑。
- 安全评分是产品化前的第一版启发式算法，后续可以抽成可配置规则。
- 风险信号基于已有表数据生成，不新增告警表。
- 审计和监控仍保留原模块详情页，安全中心只展示摘要和入口。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- API 冒烟：
  - 登录默认租户管理员
  - 请求 `GET /api/v1/security-center/overview`
  - 返回安全评分、模块卡片和风险信号

## 下一步

- 把安全中心风险信号持久化成安全事件。
- 安全评分规则参数化，支持租户自定义权重。
- 把 M31 安全策略接入 M37 运行时 Guard 链路。
- 给审批、审计、监控详情页补资源级授权。
