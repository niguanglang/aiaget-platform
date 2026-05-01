import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  PERMISSION_CODES,
  type AuditFailureItem,
  type MonitorErrorSampleItem,
  type MonitorModule,
  type SecurityCenterMetric,
  type SecurityCenterModuleSummary,
  type SecurityCenterDenialItem,
  type SecurityCenterOverview,
  type SecurityCenterRiskLevel,
  type SecurityCenterRiskSignal,
  type SecurityPolicyDecision,
  type SecurityPolicyEvaluationItem,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';

type EvaluationRecord = Prisma.SecurityPolicyEvaluationGetPayload<{
  include: {
    matchedPolicy: true;
    operator: true;
  };
}>;

@Injectable()
export class SecurityCenterService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<SecurityCenterOverview> {
    const tenantId = currentUser.tenantId;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      policyStats,
      dataScopeStats,
      resourceAclStats,
      approvalStats,
      auditStats,
      monitorStats,
      runtimeSecurityStats,
      recentEvaluations,
      recentDenials,
      recentAuditFailures,
      recentMonitorErrors,
    ] = await Promise.all([
      this.loadPolicyStats(tenantId),
      this.loadDataScopeStats(tenantId),
      this.loadResourceAclStats(tenantId),
      this.loadApprovalStats(tenantId),
      this.loadAuditStats(tenantId, since24h),
      this.loadMonitorStats(tenantId, since24h),
      this.loadRuntimeSecurityStats(tenantId, since24h),
      this.loadRecentEvaluations(tenantId),
      this.loadRecentDenials(tenantId, since24h),
      this.loadRecentAuditFailures(tenantId, since24h),
      this.loadRecentMonitorErrors(tenantId, since24h),
    ]);

    const metrics = {
      active_policies: policyStats.active,
      deny_policies: policyStats.deny,
      resource_acl_deny: resourceAclStats.deny,
      pending_approvals: approvalStats.pending,
      runtime_pending_approvals: approvalStats.runtimePending,
      security_events_24h: auditStats.securityEvents,
      security_policy_denials_24h: runtimeSecurityStats.securityPolicyDenials,
      list_data_scope_filters: runtimeSecurityStats.listDataScopeFilters,
      resource_acl_condition_checks: runtimeSecurityStats.resourceAclConditionChecks,
      failed_monitor_events_24h: monitorStats.failedEvents,
      configured_data_scope_roles: dataScopeStats.configuredRoleCount,
      custom_data_scopes: dataScopeStats.custom,
    };
    const posture = buildPosture(metrics);
    const modules = buildModules({
      policyStats,
      dataScopeStats,
      resourceAclStats,
      approvalStats,
      auditStats,
      monitorStats,
    });

    return {
      generated_at: new Date().toISOString(),
      posture,
      metrics,
      modules,
      risks: buildRiskSignals(metrics, posture),
      recent: {
        policy_evaluations: recentEvaluations,
        security_denials: recentDenials,
        audit_failures: recentAuditFailures,
        monitor_errors: recentMonitorErrors,
      },
    };
  }

  private async loadPolicyStats(tenantId: string) {
    const [total, active, disabled, deny, allow, evaluations] = await this.prisma.$transaction([
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          status: 'DISABLED',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          effect: 'DENY',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          effect: 'ALLOW',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicyEvaluation.count({
        where: {
          tenantId,
        },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      deny,
      allow,
      evaluations,
    };
  }

  private async loadDataScopeStats(tenantId: string) {
    const [roleCount, configuredRoles, total, all, tenant, dept, self, custom] = await this.prisma.$transaction([
      this.prisma.role.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        distinct: ['roleId'],
        select: {
          roleId: true,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'ALL',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'TENANT',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: {
            in: ['DEPT', 'DEPT_AND_CHILD'],
          },
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'SELF',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'CUSTOM',
          deletedAt: null,
        },
      }),
    ]);

    return {
      roleCount,
      configuredRoleCount: configuredRoles.length,
      total,
      all,
      tenant,
      dept,
      self,
      custom,
    };
  }

  private async loadResourceAclStats(tenantId: string) {
    const [total, active, disabled, allow, deny] = await this.prisma.$transaction([
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'DISABLED',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          effect: 'ALLOW',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          effect: 'DENY',
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      allow,
      deny,
    };
  }

  private async loadApprovalStats(tenantId: string) {
    const [pending, approved, rejected, runtimePending, testPending] = await this.prisma.$transaction([
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'APPROVED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'REJECTED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'RUNTIME',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'TEST',
        },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      runtimePending,
      testPending,
    };
  }

  private async loadAuditStats(tenantId: string, since: Date) {
    const [loginTotal, operationTotal, failedLogin, failedOperation, configChanges] = await this.prisma.$transaction([
      this.prisma.loginLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.loginLog.count({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
          OR: configChangePathFilters(),
        },
      }),
    ]);
    const total = loginTotal + operationTotal;
    const failed = failedLogin + failedOperation;

    return {
      loginTotal,
      operationTotal,
      securityEvents: failed,
      configChanges,
      successRate: ratioPercent(total - failed, total),
    };
  }

  private async loadMonitorStats(tenantId: string, since: Date) {
    const [operationLogs, modelCallLogs, toolCallLogs, recallLogs, conversationRuns, activeConversations] =
      await this.prisma.$transaction([
        this.prisma.operationLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            statusCode: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.modelCallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.toolCallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.knowledgeRecallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.conversationRun.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.conversation.count({
          where: {
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
      ]);

    const events = [
      ...operationLogs.map((item) => ({
        success: item.statusCode < 400,
        latency: null,
      })),
      ...modelCallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...toolCallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...recallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...conversationRuns.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
    ];
    const latencies = events.map((item) => item.latency).filter(isNumber);

    return {
      eventsTotal: events.length,
      successRate: ratioPercent(events.filter((item) => item.success).length, events.length),
      failedEvents: events.filter((item) => !item.success).length,
      averageLatencyMs: average(latencies),
      p95LatencyMs: percentile(latencies, 0.95) ?? 0,
      activeConversations,
    };
  }

  private async loadRecentEvaluations(tenantId: string): Promise<SecurityPolicyEvaluationItem[]> {
    const items = await this.prisma.securityPolicyEvaluation.findMany({
      where: {
        tenantId,
      },
      include: {
        matchedPolicy: true,
        operator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });

    return items.map(mapEvaluation);
  }

  private async loadRuntimeSecurityStats(tenantId: string, since: Date) {
    const [securityPolicyDenials, listDataScopeFilters, resourceAclConditionChecks] = await this.prisma.$transaction([
      this.prisma.securityPolicyEvaluation.count({
        where: {
          tenantId,
          decision: 'DENY',
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          resourceType: {
            in: ['AGENT', 'KNOWLEDGE_BASE', 'TOOL', 'MODEL', 'CONVERSATION'],
          },
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          conditions: {
            not: Prisma.JsonNull,
          },
        },
      }),
    ]);

    return {
      securityPolicyDenials,
      listDataScopeFilters,
      resourceAclConditionChecks,
    };
  }

  private async loadRecentDenials(tenantId: string, since: Date): Promise<SecurityCenterDenialItem[]> {
    const [operationLogs, policyEvaluations] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          module: 'security',
          action: 'deny',
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
      this.prisma.securityPolicyEvaluation.findMany({
        where: {
          tenantId,
          decision: 'DENY',
          createdAt: {
            gte: since,
          },
        },
        include: {
          matchedPolicy: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
    ]);

    const operationDenials = operationLogs.map(mapOperationDenial);
    const policyDenials = policyEvaluations.map(mapPolicyDenial);

    return [...operationDenials, ...policyDenials]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 8);
  }

  private async loadRecentAuditFailures(tenantId: string, since: Date): Promise<AuditFailureItem[]> {
    const [loginLogs, operationLogs] = await this.prisma.$transaction([
      this.prisma.loginLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
    ]);

    return [
      ...loginLogs.map((log) => ({
        event_id: `login:${log.id}`,
        source_type: 'login' as const,
        title: log.status === 'SUCCESS' ? '登录成功' : '登录失败',
        error_message: log.errorMessage ?? `来自 ${log.ip ?? '未知 IP'} 的登录尝试`,
        occurred_at: log.createdAt.toISOString(),
      })),
      ...operationLogs.map((log) => ({
        event_id: `operation:${log.id}`,
        source_type: 'operation' as const,
        title: `${log.module} ${log.action}`,
        error_message: log.errorMessage ?? `${log.method} ${log.path}`,
        occurred_at: log.createdAt.toISOString(),
      })),
    ]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 6);
  }

  private async loadRecentMonitorErrors(tenantId: string, since: Date): Promise<MonitorErrorSampleItem[]> {
    const [operationLogs, modelCallLogs, toolCallLogs, recallLogs, conversationRuns] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.modelCallLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.toolCallLog.findMany({
        where: {
          tenantId,
          status: {
            notIn: ['SUCCESS', 'APPROVAL_REQUIRED'],
          },
          createdAt: {
            gte: since,
          },
        },
        include: {
          tool: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.knowledgeRecallLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.conversationRun.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        include: {
          agent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
    ]);

    return [
      ...operationLogs.map((item) => ({
        event_id: `operation:${item.id}`,
        trace_id: item.requestId,
        module: normalizeMonitorModule(item.module),
        title: `${item.module} ${item.action}`,
        error_message: item.errorMessage ?? `${item.method} ${item.path}`,
        occurred_at: item.createdAt.toISOString(),
      })),
      ...modelCallLogs.map((item) => ({
        event_id: `model:${item.id}`,
        trace_id: item.traceId,
        module: 'model' as const,
        title: item.requestModel,
        error_message: item.errorMessage ?? '模型调用失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...toolCallLogs.map((item) => ({
        event_id: `tool:${item.id}`,
        trace_id: item.id,
        module: 'tool' as const,
        title: item.tool?.name ?? item.requestUrl,
        error_message: item.errorMessage ?? '工具调用失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...recallLogs.map((item) => ({
        event_id: `knowledge:${item.id}`,
        trace_id: item.id,
        module: 'knowledge' as const,
        title: item.query.slice(0, 60),
        error_message: item.errorMessage ?? '知识库检索失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...conversationRuns.map((item) => ({
        event_id: `conversation:${item.id}`,
        trace_id: item.id,
        module: 'conversation' as const,
        title: item.agent?.name ?? item.requestModel ?? '会话运行',
        error_message: item.errorMessage ?? '会话运行失败',
        occurred_at: item.createdAt.toISOString(),
      })),
    ]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 6);
  }
}

function buildPosture(metrics: SecurityCenterOverview['metrics']): SecurityCenterOverview['posture'] {
  let score = 100;
  score -= Math.min(metrics.pending_approvals * 8, 24);
  score -= Math.min(metrics.security_events_24h * 5, 25);
  score -= Math.min(metrics.security_policy_denials_24h * 4, 16);
  score -= Math.min(metrics.failed_monitor_events_24h * 4, 20);
  if (metrics.active_policies === 0) score -= 12;
  if (metrics.configured_data_scope_roles === 0) score -= 10;
  if (metrics.list_data_scope_filters === 0) score -= 8;
  if (metrics.resource_acl_deny === 0) score -= 4;
  score = Math.max(0, Math.min(100, score));

  const level: SecurityCenterRiskLevel = score >= 85 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH';
  const summary = level === 'LOW'
    ? '安全治理运行平稳，关键访问控制链路已覆盖。'
    : level === 'MEDIUM'
      ? '存在需要关注的审批、审计或运行异常，建议检查风险信号。'
      : '安全风险偏高，请优先处理待审批和异常事件。';

  return {
    score,
    level,
    summary,
    guard_chain: ['JWT 鉴权', 'RBAC 权限', 'DataScope 数据范围', 'Resource ACL 资源授权', 'Security Policy 安全策略', '业务执行'],
  };
}

function buildModules(input: {
  policyStats: Awaited<ReturnType<SecurityCenterService['loadPolicyStats']>>;
  dataScopeStats: Awaited<ReturnType<SecurityCenterService['loadDataScopeStats']>>;
  resourceAclStats: Awaited<ReturnType<SecurityCenterService['loadResourceAclStats']>>;
  approvalStats: Awaited<ReturnType<SecurityCenterService['loadApprovalStats']>>;
  auditStats: Awaited<ReturnType<SecurityCenterService['loadAuditStats']>>;
  monitorStats: Awaited<ReturnType<SecurityCenterService['loadMonitorStats']>>;
}): SecurityCenterModuleSummary[] {
  return [
    moduleSummary({
      key: 'security_policies',
      title: '安全策略',
      description: '租户级 ABAC 策略、显式拒绝和模拟评估。',
      href: '/security',
      permission: PERMISSION_CODES.securityRuleView,
      status: input.policyStats.active > 0 ? 'healthy' : 'degraded',
      primary: metric('生效策略', input.policyStats.active, `${input.policyStats.total} 条策略`),
      secondary: metric('拒绝策略', input.policyStats.deny, `${input.policyStats.evaluations} 条评估`),
      action: '治理策略',
    }),
    moduleSummary({
      key: 'data_scopes',
      title: '数据权限',
      description: '按角色配置资源数据范围，约束能看哪些数据。',
      href: '/data-scopes',
      permission: PERMISSION_CODES.systemDataScopeView,
      status: input.dataScopeStats.configuredRoleCount > 0 ? 'healthy' : 'degraded',
      primary: metric('已配置角色', input.dataScopeStats.configuredRoleCount, `${input.dataScopeStats.roleCount} 个角色`),
      secondary: metric('列表过滤', input.dataScopeStats.total, `${input.dataScopeStats.custom} 条自定义范围`),
      action: '配置范围',
    }),
    moduleSummary({
      key: 'resource_acls',
      title: '资源授权',
      description: '按具体 Agent、知识库、工具、模型做对象级授权。',
      href: '/resource-acls',
      permission: PERMISSION_CODES.systemResourceAclView,
      status: input.resourceAclStats.active > 0 ? 'healthy' : 'planned',
      primary: metric('启用授权', input.resourceAclStats.active, `${input.resourceAclStats.total} 条规则`),
      secondary: metric('拒绝/条件', input.resourceAclStats.deny, `${input.resourceAclStats.allow} 条允许`),
      action: '管理授权',
    }),
    moduleSummary({
      key: 'approvals',
      title: '高危审批',
      description: '处理高风险工具调用和运行时审批请求。',
      href: '/approvals',
      permission: PERMISSION_CODES.securityApprovalView,
      status: input.approvalStats.pending > 0 ? 'degraded' : 'healthy',
      primary: metric('待审批', input.approvalStats.pending, `${input.approvalStats.runtimePending} 个运行时`),
      secondary: metric('已拒绝', input.approvalStats.rejected, `${input.approvalStats.approved} 个已通过`),
      action: '处理审批',
    }),
    moduleSummary({
      key: 'audit',
      title: '审计日志',
      description: '查看登录、操作、安全事件和配置变更记录。',
      href: '/audit',
      permission: PERMISSION_CODES.securityAuditView,
      status: input.auditStats.securityEvents > 0 ? 'degraded' : 'healthy',
      primary: metric('安全事件', input.auditStats.securityEvents, '最近 24 小时'),
      secondary: metric('成功率', `${input.auditStats.successRate}%`, `${input.auditStats.configChanges} 次配置变更`),
      action: '查看审计',
    }),
    moduleSummary({
      key: 'monitor',
      title: '运行监控',
      description: '聚合模型、工具、知识库、会话运行和链路异常。',
      href: '/monitor',
      permission: PERMISSION_CODES.monitorLogView,
      status: input.monitorStats.failedEvents > 0 ? 'degraded' : 'healthy',
      primary: metric('成功率', `${input.monitorStats.successRate}%`, `${input.monitorStats.eventsTotal} 个事件`),
      secondary: metric('P95 延迟', `${input.monitorStats.p95LatencyMs} ms`, `${input.monitorStats.failedEvents} 个异常`),
      action: '查看监控',
    }),
  ];
}

function buildRiskSignals(
  metrics: SecurityCenterOverview['metrics'],
  posture: SecurityCenterOverview['posture'],
): SecurityCenterRiskSignal[] {
  const risks: SecurityCenterRiskSignal[] = [];

  if (metrics.pending_approvals > 0) {
    risks.push({
      id: 'pending-approvals',
      title: '存在待处理高危审批',
      description: '高风险工具调用正在等待人工决策，建议优先处理。',
      severity: metrics.pending_approvals >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?status=PENDING',
      metric: `${metrics.pending_approvals} 个待审批`,
    });
  }

  if (metrics.security_events_24h > 0) {
    risks.push({
      id: 'audit-security-events',
      title: '最近 24 小时存在安全事件',
      description: '失败登录或异常操作已进入审计日志，需要检查来源和影响面。',
      severity: metrics.security_events_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/audit?status=FAILED',
      metric: `${metrics.security_events_24h} 个事件`,
    });
  }

  if (metrics.security_policy_denials_24h > 0) {
    risks.push({
      id: 'runtime-policy-denials',
      title: '运行时安全策略发生拒绝',
      description: 'SecurityPolicyGuard 已拦截访问请求，请结合最近拒绝事件检查规则和主体属性。',
      severity: metrics.security_policy_denials_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${metrics.security_policy_denials_24h} 次拒绝`,
    });
  }

  if (metrics.list_data_scope_filters === 0) {
    risks.push({
      id: 'list-data-scope-missing',
      title: '列表数据范围过滤尚未覆盖',
      description: '建议为核心角色配置数据范围，确保列表页不会暴露无权资源。',
      severity: 'MEDIUM',
      href: '/data-scopes',
      metric: '0 个过滤范围',
    });
  }

  if (metrics.failed_monitor_events_24h > 0) {
    risks.push({
      id: 'monitor-failures',
      title: '运行链路存在异常',
      description: '模型、工具、知识库或会话链路出现失败事件。',
      severity: metrics.failed_monitor_events_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/monitor?status=FAILED',
      metric: `${metrics.failed_monitor_events_24h} 个异常`,
    });
  }

  if (metrics.configured_data_scope_roles === 0) {
    risks.push({
      id: 'data-scope-empty',
      title: '数据权限尚未覆盖角色',
      description: '建议至少为核心角色配置 TENANT、DEPT、SELF 或 CUSTOM 数据范围。',
      severity: 'MEDIUM',
      href: '/data-scopes',
      metric: '0 个角色',
    });
  }

  if (metrics.active_policies === 0) {
    risks.push({
      id: 'policy-empty',
      title: '未启用安全策略',
      description: 'ABAC 策略为空时，运行时主要依赖 RBAC 和对象授权。',
      severity: 'MEDIUM',
      href: '/security',
      metric: '0 条策略',
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: 'posture-normal',
      title: '安全治理运行平稳',
      description: posture.summary,
      severity: 'LOW',
      href: '/security',
      metric: `${posture.score} 分`,
    });
  }

  return risks.slice(0, 6);
}

function moduleSummary(input: {
  key: SecurityCenterModuleSummary['key'];
  title: string;
  description: string;
  href: string;
  permission: SecurityCenterModuleSummary['permission'];
  status: SecurityCenterModuleSummary['status'];
  primary: SecurityCenterMetric;
  secondary: SecurityCenterMetric;
  action: string;
}): SecurityCenterModuleSummary {
  return {
    key: input.key,
    title: input.title,
    description: input.description,
    href: input.href,
    permission: input.permission,
    status: input.status,
    primary_metric: input.primary,
    secondary_metric: input.secondary,
    action_label: input.action,
  };
}

function metric(label: string, value: string | number, helper: string): SecurityCenterMetric {
  return {
    label,
    value: String(value),
    helper,
  };
}

function mapEvaluation(item: EvaluationRecord): SecurityPolicyEvaluationItem {
  return {
    id: item.id,
    tenant_id: item.tenantId,
    request_id: item.requestId,
    trace_id: item.traceId,
    subject: normalizeJsonObjectOutput(item.subject) ?? {},
    resource: normalizeJsonObjectOutput(item.resource) ?? {},
    action: item.action,
    decision: normalizeDecision(item.decision),
    matched_policy_id: item.matchedPolicyId,
    matched_policy_code: item.matchedPolicyCode,
    matched_policy_name: item.matchedPolicy?.name ?? null,
    reason: item.reason,
    context: normalizeJsonObjectOutput(item.context),
    created_at: item.createdAt.toISOString(),
    created_by: item.operator
      ? {
          id: item.operator.id,
          name: item.operator.name,
          email: item.operator.email,
        }
      : null,
  };
}

function mapOperationDenial(item: Prisma.OperationLogGetPayload<object>): SecurityCenterDenialItem {
  const summary = normalizeJsonObjectOutput(item.requestSummary);

  return {
    id: `operation:${item.id}`,
    source: normalizeDenialSource(summary?.guard_source),
    title: `${denialSourceLabel(summary?.guard_source)} 拒绝`,
    reason: item.errorMessage ?? '安全访问被拒绝',
    resource_type: stringValue(summary?.resource_type),
    resource_id: stringValue(summary?.resource_id),
    action: stringValue(summary?.action),
    matched_code: stringValue(summary?.matched_code),
    path: item.path,
    method: item.method,
    status_code: item.statusCode,
    request_id: item.requestId,
    trace_id: stringValue(summary?.trace_id),
    occurred_at: item.createdAt.toISOString(),
  };
}

function mapPolicyDenial(
  item: Prisma.SecurityPolicyEvaluationGetPayload<{
    include: {
      matchedPolicy: true;
    };
  }>,
): SecurityCenterDenialItem {
  const resource = normalizeJsonObjectOutput(item.resource);
  const context = normalizeJsonObjectOutput(item.context);

  return {
    id: `policy:${item.id}`,
    source: 'SECURITY_POLICY',
    title: '安全策略拒绝',
    reason: item.reason,
    resource_type: stringValue(resource?.resource_type ?? resource?.type),
    resource_id: stringValue(resource?.id),
    action: item.action,
    matched_code: item.matchedPolicyCode ?? item.matchedPolicy?.code ?? null,
    path: stringValue(context?.path) ?? '/security-policies/evaluations',
    method: stringValue(context?.method) ?? 'EVALUATE',
    status_code: 403,
    request_id: item.requestId,
    trace_id: item.traceId,
    occurred_at: item.createdAt.toISOString(),
  };
}

function normalizeDenialSource(value: unknown): SecurityCenterDenialItem['source'] {
  if (value === 'DATA_SCOPE' || value === 'RESOURCE_ACL' || value === 'SECURITY_POLICY') return value;
  return 'OPERATION';
}

function denialSourceLabel(value: unknown) {
  switch (normalizeDenialSource(value)) {
    case 'DATA_SCOPE':
      return '数据权限';
    case 'RESOURCE_ACL':
      return '资源授权';
    case 'SECURITY_POLICY':
      return '安全策略';
    case 'OPERATION':
      return '操作审计';
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeDecision(value: string): SecurityPolicyDecision {
  if (value === 'ALLOW' || value === 'DENY' || value === 'NO_MATCH') return value;
  return 'NO_MATCH';
}

function normalizeJsonObjectOutput(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function configChangePathFilters(): Prisma.OperationLogWhereInput[] {
  return ['agents', 'model-providers', 'models', 'prompt-templates', 'knowledge-bases', 'tools', 'users', 'tenants'].map(
    (prefix) => ({
      path: {
        contains: prefix,
      },
    }),
  );
}

function normalizeMonitorModule(module: string): MonitorModule {
  if (
    module === 'agent' ||
    module === 'prompt' ||
    module === 'model' ||
    module === 'knowledge' ||
    module === 'tool' ||
    module === 'conversation' ||
    module === 'user' ||
    module === 'tenant' ||
    module === 'auth' ||
    module === 'system'
  ) {
    return module;
  }

  if (module.includes('agent')) return 'agent';
  if (module.includes('prompt')) return 'prompt';
  if (module.includes('model')) return 'model';
  if (module.includes('knowledge')) return 'knowledge';
  if (module.includes('tool')) return 'tool';
  if (module.includes('conversation')) return 'conversation';
  if (module.includes('user')) return 'user';
  if (module.includes('tenant')) return 'tenant';
  if (module.includes('auth')) return 'auth';

  return 'system';
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 100;
  return Number(((success / total) * 100).toFixed(1));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index] ?? null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
