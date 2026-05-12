import { createHash } from 'node:crypto';

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AcceptProductionReadinessCheckInput,
  ApprovalAuditEventItem,
  NotificationPolicyAuditOverview,
  NotificationPolicyApprovalOverview,
  NotificationPolicyChangePreview,
  NotificationPolicyImpactLevel,
  NotificationPolicySnapshotOverview,
  PaginatedResult,
  ProductionReadinessCategory,
  ProductionReadinessCategoryOverview,
  ProductionReadinessCheckItem,
  ProductionReadinessAcceptance,
  ProductionReadinessOverview,
  ProductionReadinessStatus,
  SystemSettingSnapshotAction,
  SystemSettingSnapshotItem,
  SystemSettingCategory,
  SystemSettingItem,
  SystemSettingOption,
  SystemSettingOverview,
  SystemSettingValueType,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { ListNotificationPolicyApprovalsDto } from './dto/list-notification-policy-approvals.dto';
import type { ListSystemSettingsDto } from './dto/list-system-settings.dto';
import type { ReviewNotificationPolicyApprovalDto } from './dto/review-notification-policy-approval.dto';
import type { RollbackSystemSettingSnapshotDto } from './dto/rollback-system-setting-snapshot.dto';
import type { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SYSTEM_SETTING_CATEGORY_LABELS,
  SYSTEM_SETTING_CATEGORIES,
  SYSTEM_SETTING_VALUE_TYPES,
} from './system-settings.constants';

const settingInclude = {
  updater: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.SystemSettingInclude;

type SystemSettingRecord = Prisma.SystemSettingGetPayload<{ include: typeof settingInclude }>;

const operationLogInclude = {
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OperationLogInclude;

const snapshotInclude = {
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.SystemSettingSnapshotInclude;

type SystemSettingSnapshotRecord = Prisma.SystemSettingSnapshotGetPayload<{ include: typeof snapshotInclude }>;

const approvalAuditInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ApprovalAuditEventInclude;

type ApprovalAuditEventRecord = Prisma.ApprovalAuditEventGetPayload<{ include: typeof approvalAuditInclude }>;

const NOTIFICATION_SETTING_KEYS = [
  'alert_notification_auto_notify_enabled',
  'alert_notification_auto_notify_interval_ms',
  'alert_notification_auto_notify_batch_size',
  'alert_notification_auto_retry_enabled',
  'alert_notification_retry_interval_ms',
  'alert_notification_retry_batch_size',
  'alert_notification_max_retry_count',
  'alert_notification_retry_backoff_seconds',
  'alert_notification_lookback_hours',
  'operation_alert_sla_enabled',
  'operation_alert_sla_scan_interval_ms',
  'operation_alert_sla_due_minutes',
  'operation_alert_sla_warning_minutes',
  'operation_alert_sla_auto_escalate_enabled',
  'operation_alert_sla_lookback_hours',
  'operation_alert_sla_subscription_policy',
  'operation_alert_sla_notification_auto_retry_enabled',
  'operation_alert_sla_notification_retry_interval_ms',
  'operation_alert_sla_notification_retry_batch_size',
  'operation_alert_sla_notification_max_retry_count',
  'operation_alert_sla_notification_retry_backoff_seconds',
  'operation_alert_sla_notification_lookback_hours',
] as const;
const NOTIFICATION_SETTING_KEY_SET = new Set<string>(NOTIFICATION_SETTING_KEYS);
const NOTIFICATION_AUDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const NOTIFICATION_TASK_SNAPSHOT_MS = 24 * 60 * 60 * 1000;
const PRODUCTION_READINESS_CATEGORY_LABELS: Record<ProductionReadinessCategory, string> = {
  ENVIRONMENT: '环境配置',
  EXTERNAL_SERVICE: '外部服务',
  THIRD_PARTY: '第三方联调',
  RELEASE_VALIDATION: '发布验收',
  RISK: '风险项',
};
const PRODUCTION_READINESS_CATEGORY_DESCRIPTIONS: Record<ProductionReadinessCategory, string> = {
  ENVIRONMENT: '生产环境变量、密钥、迁移和基础运行参数验收。',
  EXTERNAL_SERVICE: 'PostgreSQL、MinIO、Qdrant、OpenSearch、Temporal 和 OTEL 等外部依赖验收。',
  THIRD_PARTY: '模型供应商、外部 API Key、全渠道发布和插件生态联调验收。',
  RELEASE_VALIDATION: '发布前 smoke、回滚、Trace 和运行手册证据验收。',
  RISK: '必须在真实目标环境人工确认的剩余风险。',
};

@Injectable()
export class SystemSettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<SystemSettingOverview> {
    await this.ensureDefaults(currentUser);
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: [
        {
          category: 'asc',
        },
        {
          sortOrder: 'asc',
        },
      ],
    });

    const categories = SYSTEM_SETTING_CATEGORIES.map((category) => {
      const categorySettings = settings.filter((setting) => setting.category === category);

      return {
        category,
        label: SYSTEM_SETTING_CATEGORY_LABELS[category],
        total: categorySettings.length,
        active: categorySettings.filter((setting) => setting.status === 'ACTIVE').length,
        changed: categorySettings.filter((setting) => !jsonEquals(setting.value, setting.defaultValue)).length,
      };
    });
    const lastUpdated = settings
      .map((setting) => setting.updatedAt)
      .sort((left, right) => right.getTime() - left.getTime())[0];

    return {
      total: settings.length,
      active: settings.filter((setting) => setting.status === 'ACTIVE').length,
      disabled: settings.filter((setting) => setting.status === 'DISABLED').length,
      secret: settings.filter((setting) => setting.isSecret).length,
      changed_from_default: settings.filter((setting) => !jsonEquals(setting.value, setting.defaultValue)).length,
      category_count: categories.filter((category) => category.total > 0).length,
      last_updated_at: lastUpdated?.toISOString() ?? null,
      categories,
    };
  }

  async getProductionReadinessOverview(currentUser: AuthenticatedUser): Promise<ProductionReadinessOverview> {
    const [
      activeModelProviders,
      activeModelConfigs,
      modelApiKeys,
      activePublishChannels,
      enabledApiKeys,
      activeSecurityPolicies,
      pendingKnowledgeTasks,
      failedKnowledgeTasks,
      qdrantSegments,
      openSearchSegments,
      customCodePluginHooks,
    ] = await Promise.all([
      this.prisma.modelProvider.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.modelConfig.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.modelApiKey.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.agentPublishChannel.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.apiKey.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.knowledgeEmbeddingTask.count({
        where: {
          tenantId: currentUser.tenantId,
          status: {
            in: ['PENDING', 'RUNNING'],
          },
        },
      }),
      this.prisma.knowledgeEmbeddingTask.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'FAILED',
        },
      }),
      this.prisma.knowledgeSegment.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          metadata: {
            path: ['vector_backend'],
            equals: 'QDRANT',
          },
        },
      }),
      this.prisma.knowledgeSegment.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          metadata: {
            path: ['keyword_backend'],
            equals: 'OPENSEARCH',
          },
        },
      }),
      this.prisma.pluginHook.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          configJson: {
            path: ['sandbox_policy', 'entry'],
            not: Prisma.DbNull,
          },
        },
      }),
    ]);
    const acceptanceByCheckId = await this.loadProductionReadinessAcceptances(currentUser.tenantId);
    const items: ProductionReadinessCheckItem[] = ([
      {
        id: 'env-template',
        category: 'ENVIRONMENT',
        title: '生产环境变量模板',
        description: '确认 .env.production 已按模板配置数据库、密钥、运行时、对象存储和可观测性参数。',
        status: envReady(['DATABASE_URL', 'JWT_ACCESS_TOKEN_SECRET', 'MODEL_KEY_ENCRYPTION_SECRET']) ? 'READY' : 'WARNING',
        severity: 'HIGH',
        owner: '平台运维',
        action_label: '查看发布清单',
        action_href: '/settings',
        evidence: [
          '仓库包含 .env.production.example 和 validate:prod-env 校验脚本。',
          envEvidence('DATABASE_URL', 'JWT_ACCESS_TOKEN_SECRET', 'MODEL_KEY_ENCRYPTION_SECRET'),
        ],
        acceptance: null,
      },
      {
        id: 'database-migration',
        category: 'ENVIRONMENT',
        title: '数据库迁移与种子数据',
        description: '生产库需要先执行 Prisma migrate deploy、表字段注释和必要种子数据校验。',
        status: 'MANUAL',
        severity: 'HIGH',
        owner: '后端负责人',
        action_label: '打开系统设置',
        action_href: '/settings',
        evidence: ['需要在目标生产库执行 pnpm --filter @aiaget/control-api prisma:deploy。', '该检查不会在接口内连接或修改外部数据库。'],
        acceptance: null,
      },
      {
        id: 'postgres',
        category: 'EXTERNAL_SERVICE',
        title: 'PostgreSQL 生产库',
        description: '确认控制面连接的是用户指定生产 PostgreSQL，并完成备份、恢复和最小权限验证。',
        status: process.env.DATABASE_URL ? 'MANUAL' : 'BLOCKED',
        severity: 'HIGH',
        owner: 'DBA',
        action_label: '查看系统设置',
        action_href: '/settings',
        evidence: [process.env.DATABASE_URL ? 'DATABASE_URL 已配置，仍需人工验证备份恢复。' : 'DATABASE_URL 未在当前进程配置。'],
        acceptance: null,
      },
      {
        id: 'minio',
        category: 'EXTERNAL_SERVICE',
        title: 'MinIO 对象存储',
        description: '确认桶、访问密钥、控制台地址和文件上传下载链路可用。',
        status: envReady(['MINIO_ENDPOINT', 'MINIO_BUCKET']) ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '平台运维',
        action_label: '打开存储设置',
        action_href: '/storage/settings',
        evidence: [envEvidence('MINIO_ENDPOINT', 'MINIO_BUCKET'), '页面提供桶初始化与存储设置验收入口。'],
        acceptance: null,
      },
      {
        id: 'qdrant',
        category: 'EXTERNAL_SERVICE',
        title: 'Qdrant 向量库',
        description: '确认知识库向量写入真实 Qdrant 集合，并保留 PostgreSQL fallback 状态可追踪。',
        status: qdrantSegments > 0 ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '知识库负责人',
        action_label: '打开知识库健康',
        action_href: '/knowledge/health',
        evidence: [
          envEvidence('QDRANT_ENABLED', 'QDRANT_URL', 'QDRANT_COLLECTION_PREFIX'),
          `Qdrant 片段 ${qdrantSegments} 条。`,
        ],
        acceptance: null,
      },
      {
        id: 'opensearch',
        category: 'EXTERNAL_SERVICE',
        title: 'OpenSearch 关键词检索',
        description: '确认关键词索引写入 OpenSearch，并和 Qdrant 共同构成混合检索。',
        status: openSearchSegments > 0 ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '知识库负责人',
        action_label: '打开检索测试',
        action_href: '/knowledge/retrieval',
        evidence: [
          envEvidence('OPENSEARCH_ENABLED', 'OPENSEARCH_URL', 'OPENSEARCH_INDEX_PREFIX'),
          `OpenSearch 片段 ${openSearchSegments} 条。`,
        ],
        acceptance: null,
      },
      {
        id: 'temporal',
        category: 'EXTERNAL_SERVICE',
        title: 'Temporal 工作流',
        description: '确认后台任务、渠道发布和运行时工作流可以进入 Temporal 后端。',
        status: process.env.RUNTIME_TEMPORAL_ENABLED === 'true' ? 'MANUAL' : 'WARNING',
        severity: 'MEDIUM',
        owner: '运行时负责人',
        action_label: '查看工作流',
        action_href: '/runtime/workflows',
        evidence: [
          envEvidence('RUNTIME_TEMPORAL_ENABLED', 'RUNTIME_TEMPORAL_ADDRESS', 'RUNTIME_TEMPORAL_TASK_QUEUE'),
          '当前接口只展示配置和平台数据，不主动连接 Temporal。',
        ],
        acceptance: null,
      },
      {
        id: 'otel',
        category: 'EXTERNAL_SERVICE',
        title: 'OpenTelemetry Collector',
        description: '确认控制面、Runtime、Tool Gateway 和前端请求 Trace ID 能导出到观测系统。',
        status: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'MANUAL' : 'WARNING',
        severity: 'MEDIUM',
        owner: '可观测性负责人',
        action_label: '查看观测质量',
        action_href: '/monitor/observability',
        evidence: [envEvidence('OTEL_EXPORTER_OTLP_ENDPOINT', 'OTEL_TRACES_EXPORTER', 'OTEL_RESOURCE_ATTRIBUTES')],
        acceptance: null,
      },
      {
        id: 'model-provider',
        category: 'THIRD_PARTY',
        title: '模型供应商联调',
        description: '确认生产模型供应商、模型配置、加密密钥和调用测试均完成。',
        status: activeModelProviders > 0 && activeModelConfigs > 0 && modelApiKeys > 0 ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '模型管理员',
        action_label: '打开模型中心',
        action_href: '/models',
        evidence: [`模型供应商 ${activeModelProviders} 个，启用模型 ${activeModelConfigs} 个，密钥 ${modelApiKeys} 个。`],
        acceptance: null,
      },
      {
        id: 'external-api-key',
        category: 'THIRD_PARTY',
        title: '外部 API Key 调用',
        description: '确认外部系统只使用授权 Agent、限流、IP 白名单和 webhook 回调策略。',
        status: enabledApiKeys > 0 ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '开放平台负责人',
        action_label: '打开 API Key',
        action_href: '/api-keys',
        evidence: [`启用 API Key ${enabledApiKeys} 个。`, '调用凭证不会在该接口中返回明文。'],
        acceptance: null,
      },
      {
        id: 'publish-channels',
        category: 'THIRD_PARTY',
        title: '全渠道发布联调',
        description: '确认 Web Widget、Open API、企业微信、钉钉、飞书或自定义 webhook 发布链路。',
        status: activePublishChannels > 0 ? 'MANUAL' : 'WARNING',
        severity: 'MEDIUM',
        owner: '渠道运营',
        action_label: '打开渠道发布',
        action_href: '/channels',
        evidence: [`启用发布渠道 ${activePublishChannels} 个。`],
        acceptance: null,
      },
      {
        id: 'plugin-ecosystem',
        category: 'THIRD_PARTY',
        title: '插件生态安全验收',
        description: '确认插件包完整性、权限声明、Tool Gateway 绑定和安装回滚流程。',
        status: 'MANUAL',
        severity: 'MEDIUM',
        owner: '插件管理员',
        action_label: '打开插件中心',
        action_href: '/plugins',
        evidence: ['插件安装已具备后端 manifest 和包完整性预检，需要真实插件包人工验收。'],
        acceptance: null,
      },
      {
        id: 'plugin-sandbox-executor',
        category: 'THIRD_PARTY',
        title: '代码型插件 Hook 沙箱执行器',
        description: '确认代码型插件 Hook 只会在批准的远程沙箱执行器中运行，未配置时保持阻断并审计。',
        status: customCodePluginHooks > 0
          ? process.env.PLUGIN_SANDBOX_EXECUTOR_URL
            ? 'MANUAL'
            : 'BLOCKED'
          : 'READY',
        severity: customCodePluginHooks > 0 ? 'HIGH' : 'MEDIUM',
        owner: '安全管理员',
        action_label: '打开插件安全',
        action_href: '/plugins/security',
        evidence: customCodePluginHooks > 0
          ? [
            `代码型插件 Hook ${customCodePluginHooks} 个。`,
            process.env.PLUGIN_SANDBOX_EXECUTOR_URL
              ? 'PLUGIN_SANDBOX_EXECUTOR_URL 已配置，仍需在目标环境人工验证远程沙箱隔离、超时、网络和审计。'
              : 'PLUGIN_SANDBOX_EXECUTOR_URL 未配置，Runtime 会阻断代码型 Hook 并记录 sandbox_blocked 事件。',
          ]
          : [
            '当前未发现代码型插件 Hook。',
            '未配置 PLUGIN_SANDBOX_EXECUTOR_URL 时，后续新增代码型 Hook 会在 Runtime 边界被阻断。',
          ],
        acceptance: null,
      },
      {
        id: 'knowledge-hybrid',
        category: 'RELEASE_VALIDATION',
        title: '知识库混合检索',
        description: '确认文档处理后台任务、Qdrant 向量和 OpenSearch 关键词检索数据一致。',
        status: failedKnowledgeTasks > 0 ? 'WARNING' : qdrantSegments > 0 && openSearchSegments > 0 ? 'MANUAL' : 'WARNING',
        severity: failedKnowledgeTasks > 0 ? 'HIGH' : 'MEDIUM',
        owner: '知识库负责人',
        action_label: '打开知识库健康',
        action_href: '/knowledge/health',
        evidence: [
          `Qdrant 片段 ${qdrantSegments} 条，OpenSearch 片段 ${openSearchSegments} 条。`,
          `失败任务 ${failedKnowledgeTasks} 个，待处理任务 ${pendingKnowledgeTasks} 个。`,
        ],
        acceptance: null,
      },
      {
        id: 'smoke-runbook',
        category: 'RELEASE_VALIDATION',
        title: 'Smoke 与运行手册',
        description: '确认生产 smoke、回滚演练、监控检查和发布记录按运行手册完成。',
        status: 'MANUAL',
        severity: 'HIGH',
        owner: '发布负责人',
        action_label: '查看监控中心',
        action_href: '/monitor',
        evidence: ['仓库提供 scripts/production-smoke.mjs、verify:prod-template 和 p0-12 运行手册。', 'verify:prod-template 可在不连接真实生产服务时校验模板。'],
        acceptance: null,
      },
      {
        id: 'observability-trace-quality',
        category: 'RELEASE_VALIDATION',
        title: '可观测性 Trace 质量证据',
        description: '确认监控中心可观测性 overview 已展示 Trace 覆盖率、孤立事件、错误链路和慢链路，并完成上线前人工复核。',
        status: 'MANUAL',
        severity: 'HIGH',
        owner: '可观测性负责人',
        action_label: '查看可观测性质量',
        action_href: '/monitor/observability',
        evidence_summary: 'Trace 覆盖率、孤立事件、错误链路和慢链路需要在监控中心完成证据截取或记录后再提交生产验收。',
        observability_signal: {
          trace_coverage_label: 'Trace 覆盖率待在监控中心确认',
          orphan_event_label: '孤立事件需为 0 或已有解释',
          error_trace_label: '错误链路需完成归因',
          slow_trace_label: '慢链路需完成阈值复核',
        },
        evidence: [
          '打开 /monitor/observability 查看 24h 或 7d 可观测性 overview。',
          '验收说明需记录 Trace 覆盖率、孤立事件数、错误链路样本和慢链路样本。',
          '该检查只展示验收提示，不启动 Collector，也不创建中间件。',
        ],
        acceptance: null,
      },
      {
        id: 'security-policy',
        category: 'RELEASE_VALIDATION',
        title: '权限与安全闭环',
        description: '确认 RBAC、ABAC、资源授权、高危审批和审计日志在生产租户启用。',
        status: activeSecurityPolicies > 0 ? 'MANUAL' : 'WARNING',
        severity: 'HIGH',
        owner: '安全管理员',
        action_label: '打开安全中心',
        action_href: '/security',
        evidence: [`启用安全策略 ${activeSecurityPolicies} 条。`, '菜单权限、数据权限和 Resource ACL 已具备独立管理页。'],
        acceptance: null,
      },
      {
        id: 'real-target-smoke',
        category: 'RISK',
        title: '真实目标环境未自动执行',
        description: '当前平台不能替代生产目标环境的真实登录、上传、检索、调用、审批和回滚验收。',
        status: 'BLOCKED',
        severity: 'HIGH',
        owner: '项目负责人',
        action_label: '查看发布验收',
        action_href: '/monitor',
        evidence: ['需要使用真实域名、真实凭证和目标租户执行端到端验收。'],
        acceptance: null,
      },
      {
        id: 'third-party-credentials',
        category: 'RISK',
        title: '第三方凭证与配额需人工确认',
        description: '模型、渠道、插件和 webhook 的生产凭证、白名单、额度和 SLA 必须由业务方确认。',
        status: 'BLOCKED',
        severity: 'HIGH',
        owner: '业务负责人',
        action_label: '打开成本中心',
        action_href: '/billing',
        evidence: ['平台只展示密钥数量和配置状态，不会读取或暴露凭证明文。'],
        acceptance: null,
      },
    ] satisfies ProductionReadinessCheckItem[]).map((item): ProductionReadinessCheckItem => ({
      ...item,
      acceptance: acceptanceByCheckId.get(item.id) ?? null,
    }));

    const categories = (Object.keys(PRODUCTION_READINESS_CATEGORY_LABELS) as ProductionReadinessCategory[]).map(
      (category) => mapProductionReadinessCategory(category, items),
    );
    const allItems = categories.flatMap((category) => category.items);
    const readyChecks = countByStatus(allItems, 'READY');
    const manualChecks = countByStatus(allItems, 'MANUAL');

    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_checks: allItems.length,
        ready_checks: readyChecks,
        warning_checks: countByStatus(allItems, 'WARNING'),
        blocked_checks: countByStatus(allItems, 'BLOCKED'),
        manual_checks: manualChecks,
        production_score: allItems.length ? Math.round(((readyChecks + manualChecks * 0.5) / allItems.length) * 100) : 0,
      },
      categories,
    };
  }

  async acceptProductionReadinessCheck(
    currentUser: AuthenticatedUser,
    checkId: string,
    input: AcceptProductionReadinessCheckInput,
  ): Promise<ProductionReadinessAcceptance> {
    const note = nullableText(input.note);
    if (!note) {
      throw new BadRequestException('Acceptance note is required');
    }

    const overview = await this.getProductionReadinessOverview(currentUser);
    const check = overview.categories.flatMap((category) => category.items).find((item) => item.id === checkId);
    if (!check) {
      throw new NotFoundException('Production readiness check not found');
    }

    const event = await this.prisma.approvalAuditEvent.create({
      data: {
        tenantId: currentUser.tenantId,
        sourceType: 'PRODUCTION_READINESS',
        sourceId: productionReadinessSourceId(checkId),
        eventType: 'ACCEPTED',
        eventStatus: 'SUCCESS',
        title: `${check.title}验收通过`,
        note,
        metadata: toJsonInput({
          check_id: check.id,
          check_title: check.title,
          check_category: check.category,
          check_status: check.status,
          check_severity: check.severity,
        }),
        actorId: currentUser.id,
      },
      include: approvalAuditInclude,
    });

    return mapProductionReadinessAcceptance(event);
  }

  async list(currentUser: AuthenticatedUser, query: ListSystemSettingsDto): Promise<SystemSettingItem[]> {
    await this.ensureDefaults(currentUser);

    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
        category: query.category,
        status: query.status,
      },
      include: settingInclude,
      orderBy: [
        {
          category: 'asc',
        },
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return settings.map((setting) => this.mapSetting(setting));
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateSystemSettingDto): Promise<SystemSettingItem> {
    const setting = await this.findSetting(currentUser.tenantId, id);
    const data: Prisma.SystemSettingUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.value !== undefined) {
      data.value = this.normalizeValue(setting, dto.value);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const pendingApproval = await this.createNotificationPolicyPendingApproval(currentUser, setting, data, 'UPDATE');
    if (pendingApproval) {
      return this.mapSetting(setting);
    }

    const updated = await this.prisma.systemSetting.update({
      where: {
        id,
      },
      data,
      include: settingInclude,
    });
    await this.createNotificationPolicySnapshot(currentUser, setting, updated, 'UPDATE');

    return this.mapSetting(updated);
  }

  async previewNotificationPolicyChange(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateSystemSettingDto,
  ): Promise<NotificationPolicyChangePreview> {
    const setting = await this.findSetting(currentUser.tenantId, id);
    if (setting.category !== 'NOTIFICATION' || !NOTIFICATION_SETTING_KEY_SET.has(setting.key)) {
      throw new BadRequestException('Only notification policy settings can be previewed');
    }

    const nextValue = dto.value === undefined ? setting.value : this.normalizeValue(setting, dto.value);
    const currentStatus = setting.status as SystemSettingItem['status'];
    const nextStatus = dto.status ?? (currentStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE');
    const changedFields = [
      ...(!jsonEquals(setting.value, nextValue) ? ['value'] : []),
      ...(currentStatus !== nextStatus ? ['status'] : []),
    ];
    const [taskSnapshot, recentChangeCount] = await Promise.all([
      this.getNotificationTaskSnapshot(currentUser.tenantId),
      this.countRecentNotificationPolicyChanges(currentUser.tenantId),
    ]);
    const impact = assessNotificationPolicyImpact(setting, nextValue, nextStatus, changedFields, taskSnapshot);

    return {
      setting_id: setting.id,
      key: setting.key,
      name: setting.name,
      current_value: setting.value,
      next_value: nextValue,
      current_status: currentStatus,
      next_status: nextStatus,
      changed_fields: changedFields,
      impact_level: impact.impact_level,
      impact_summary: impact.impact_summary,
      warnings: impact.warnings,
      task_snapshot: taskSnapshot,
      recent_change_count: recentChangeCount,
    };
  }

  async getNotificationPolicyAudit(currentUser: AuthenticatedUser): Promise<NotificationPolicyAuditOverview> {
    const recentChanges = await this.listNotificationPolicyAuditItems(currentUser.tenantId, 20);

    return {
      generated_at: new Date().toISOString(),
      summary: {
        change_count: recentChanges.length,
        success_count: recentChanges.filter((item) => item.status_code >= 200 && item.status_code < 400).length,
        failed_count: recentChanges.filter((item) => item.status_code >= 400).length,
        latest_change_at: recentChanges[0]?.occurred_at ?? null,
      },
      recent_changes: recentChanges,
    };
  }

  async getNotificationPolicySnapshots(currentUser: AuthenticatedUser): Promise<NotificationPolicySnapshotOverview> {
    const snapshots = await this.prisma.systemSettingSnapshot.findMany({
      where: {
        tenantId: currentUser.tenantId,
        settingKey: {
          in: [...NOTIFICATION_SETTING_KEYS],
        },
      },
      include: snapshotInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });

    return {
      generated_at: new Date().toISOString(),
      summary: {
        snapshot_count: snapshots.length,
        rollback_count: snapshots.filter((snapshot) => snapshot.action === 'ROLLBACK').length,
        approval_reserved_count: snapshots.filter((snapshot) => snapshot.approvalStatus === 'RESERVED').length,
        pending_approval_count: snapshots.filter((snapshot) => snapshot.approvalStatus === 'PENDING').length,
        approved_count: snapshots.filter((snapshot) => snapshot.approvalStatus === 'APPROVED').length,
        rejected_count: snapshots.filter((snapshot) => snapshot.approvalStatus === 'REJECTED').length,
        latest_snapshot_at: snapshots[0]?.createdAt.toISOString() ?? null,
      },
      recent_snapshots: snapshots.map((snapshot) => mapSystemSettingSnapshot(snapshot)),
    };
  }

  async getNotificationPolicyApprovalOverview(
    currentUser: AuthenticatedUser,
  ): Promise<NotificationPolicyApprovalOverview> {
    const where = notificationPolicySnapshotWhere(currentUser.tenantId);
    const [pendingCount, approvedCount, rejectedCount, highImpactPendingCount] = await this.prisma.$transaction([
      this.prisma.systemSettingSnapshot.count({
        where: {
          ...where,
          approvalStatus: 'PENDING',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          ...where,
          approvalStatus: 'APPROVED',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          ...where,
          approvalStatus: 'REJECTED',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          ...where,
          approvalStatus: 'PENDING',
          impactLevel: 'HIGH',
        },
      }),
    ]);

    return {
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      high_impact_pending_count: highImpactPendingCount,
    };
  }

  async listNotificationPolicyApprovals(
    currentUser: AuthenticatedUser,
    query: ListNotificationPolicyApprovalsDto,
  ): Promise<PaginatedResult<SystemSettingSnapshotItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where = notificationPolicySnapshotWhere(currentUser.tenantId);

    if (query.status) {
      where.approvalStatus = query.status;
    } else {
      where.approvalStatus = {
        in: ['PENDING', 'APPROVED', 'REJECTED'],
      };
    }

    if (keyword) {
      where.OR = [
        { settingName: { contains: keyword, mode: 'insensitive' } },
        { settingKey: { contains: keyword, mode: 'insensitive' } },
        { impactSummary: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.systemSettingSnapshot.findMany({
        where,
        include: snapshotInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.systemSettingSnapshot.count({ where }),
    ]);

    return {
      items: items.map((item) => mapSystemSettingSnapshot(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async getNotificationPolicyApproval(
    currentUser: AuthenticatedUser,
    snapshotId: string,
  ): Promise<SystemSettingSnapshotItem> {
    const snapshot = await this.findNotificationPolicyApproval(currentUser.tenantId, snapshotId);
    const timeline = await this.loadApprovalAuditTimeline(currentUser.tenantId, snapshotId);
    return mapSystemSettingSnapshot(snapshot, timeline);
  }

  async approveNotificationPolicyApproval(
    currentUser: AuthenticatedUser,
    snapshotId: string,
    dto: ReviewNotificationPolicyApprovalDto,
  ): Promise<SystemSettingSnapshotItem> {
    const snapshot = await this.findNotificationPolicyApproval(currentUser.tenantId, snapshotId);
    if (snapshot.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Only pending notification policy approvals can be approved');
    }

    const updatedSnapshot = await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.update({
        where: {
          id: snapshot.settingId,
        },
        data: {
          value: toJsonInput(snapshot.nextValue),
          status: snapshot.nextStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
          updatedBy: currentUser.id,
        },
      });
      if (snapshot.action === 'ROLLBACK' && snapshot.rollbackFromSnapshotId) {
        await tx.systemSettingSnapshot.update({
          where: {
            id: snapshot.rollbackFromSnapshotId,
          },
          data: {
            rollbackCount: {
              increment: 1,
            },
          },
        });
      }

      return tx.systemSettingSnapshot.update({
        where: {
          id: snapshot.id,
        },
        data: {
          approvalStatus: 'APPROVED',
          approvalRequestId: buildApprovalDecisionReference('APPROVED', currentUser.id, dto.decision_note),
        },
        include: snapshotInclude,
      });
    });
    await this.recordNotificationApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: snapshot.id,
      eventType: 'APPROVED',
      eventStatus: 'SUCCESS',
      title: '通知策略审批已批准',
      note: nullableText(dto.decision_note),
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        setting_key: snapshot.settingKey,
        action: snapshot.action,
        previous_status: snapshot.previousStatus,
        next_status: snapshot.nextStatus,
      },
      actorId: currentUser.id,
    });
    await this.recordNotificationApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: snapshot.id,
      eventType: 'APPLIED',
      eventStatus: 'SUCCESS',
      title: '通知策略变更已生效',
      note: '审批通过后已写入系统设置。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        setting_id: snapshot.settingId,
        setting_key: snapshot.settingKey,
        next_value: snapshot.nextValue,
      },
      actorId: currentUser.id,
    });

    const timeline = await this.loadApprovalAuditTimeline(currentUser.tenantId, updatedSnapshot.id);
    return mapSystemSettingSnapshot(updatedSnapshot, timeline);
  }

  async rejectNotificationPolicyApproval(
    currentUser: AuthenticatedUser,
    snapshotId: string,
    dto: ReviewNotificationPolicyApprovalDto,
  ): Promise<SystemSettingSnapshotItem> {
    const snapshot = await this.findNotificationPolicyApproval(currentUser.tenantId, snapshotId);
    if (snapshot.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Only pending notification policy approvals can be rejected');
    }

    const updatedSnapshot = await this.prisma.systemSettingSnapshot.update({
      where: {
        id: snapshot.id,
      },
      data: {
        approvalStatus: 'REJECTED',
        approvalRequestId: buildApprovalDecisionReference('REJECTED', currentUser.id, dto.decision_note),
      },
      include: snapshotInclude,
    });
    await this.recordNotificationApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: snapshot.id,
      eventType: 'REJECTED',
      eventStatus: 'WARNING',
      title: '通知策略审批已拒绝',
      note: nullableText(dto.decision_note) ?? '审批人已拒绝通知策略变更。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        setting_key: snapshot.settingKey,
        action: snapshot.action,
        impact_level: snapshot.impactLevel,
      },
      actorId: currentUser.id,
    });

    const timeline = await this.loadApprovalAuditTimeline(currentUser.tenantId, updatedSnapshot.id);
    return mapSystemSettingSnapshot(updatedSnapshot, timeline);
  }

  async rollbackNotificationPolicySnapshot(
    currentUser: AuthenticatedUser,
    snapshotId: string,
    _dto: RollbackSystemSettingSnapshotDto,
  ): Promise<SystemSettingItem> {
    const snapshot = await this.prisma.systemSettingSnapshot.findFirst({
      where: {
        id: snapshotId,
        tenantId: currentUser.tenantId,
      },
    });
    if (!snapshot || !NOTIFICATION_SETTING_KEY_SET.has(snapshot.settingKey)) {
      throw new NotFoundException('Notification policy snapshot not found');
    }

    const setting = await this.findSetting(currentUser.tenantId, snapshot.settingId);
    if (setting.category !== 'NOTIFICATION') {
      throw new BadRequestException('Only notification policy snapshots can be rolled back');
    }

    if (snapshot.impactLevel === 'HIGH') {
      const version = await nextSnapshotVersion(this.prisma, currentUser.tenantId, setting.id);
      const approvalSnapshot = await this.prisma.systemSettingSnapshot.create({
        data: {
          tenantId: currentUser.tenantId,
          settingId: setting.id,
          settingKey: setting.key,
          settingName: setting.name,
          version,
          action: 'ROLLBACK',
          previousValue: toJsonInput(setting.value),
          nextValue: toJsonInput(snapshot.previousValue),
          previousStatus: setting.status,
          nextStatus: snapshot.previousStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
          approvalStatus: 'PENDING',
          approvalRequestId: `notification-policy-rollback:${snapshot.id}`,
          rollbackFromSnapshotId: snapshot.id,
          impactLevel: 'HIGH',
          impactSummary: '高影响通知策略回滚需要安全审批后才会生效。',
          createdBy: currentUser.id,
        },
      });
      await this.recordNotificationApprovalAuditEvent({
        tenantId: currentUser.tenantId,
        sourceId: approvalSnapshot.id,
        eventType: 'REQUEST_CREATED',
        eventStatus: 'INFO',
        title: '通知策略回滚审批已创建',
        note: '高影响通知策略回滚需要安全审批后才会生效。',
        requestId: currentUser.requestId ?? null,
        traceId: currentUser.traceId ?? null,
        metadata: {
          setting_key: setting.key,
          rollback_from_snapshot_id: snapshot.id,
          action: 'ROLLBACK',
        },
        actorId: currentUser.id,
      });

      return this.mapSetting(setting);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.systemSetting.update({
        where: {
          id: setting.id,
        },
        data: {
          value: toJsonInput(snapshot.previousValue),
          status: snapshot.previousStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
          updatedBy: currentUser.id,
        },
        include: settingInclude,
      });
      const version = await nextSnapshotVersion(tx, currentUser.tenantId, setting.id);

      await tx.systemSettingSnapshot.create({
        data: {
          tenantId: currentUser.tenantId,
          settingId: setting.id,
          settingKey: setting.key,
          settingName: setting.name,
          version,
          action: 'ROLLBACK',
          previousValue: toJsonInput(setting.value),
          nextValue: toJsonInput(snapshot.previousValue),
          previousStatus: setting.status,
          nextStatus: snapshot.previousStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
          approvalStatus: 'RESERVED',
          rollbackFromSnapshotId: snapshot.id,
          createdBy: currentUser.id,
        },
      });
      await tx.systemSettingSnapshot.update({
        where: {
          id: snapshot.id,
        },
        data: {
          rollbackCount: {
            increment: 1,
          },
        },
      });

      return next;
    });

    return this.mapSetting(updated);
  }

  async reset(currentUser: AuthenticatedUser, id: string): Promise<SystemSettingItem> {
    const setting = await this.findSetting(currentUser.tenantId, id);
    const pendingApproval = await this.createNotificationPolicyPendingApproval(
      currentUser,
      setting,
      {
        value: toJsonInput(setting.defaultValue),
        status: 'ACTIVE',
        updatedBy: currentUser.id,
      },
      'RESET',
    );
    if (pendingApproval) {
      return this.mapSetting(setting);
    }

    const updated = await this.prisma.systemSetting.update({
      where: {
        id,
      },
      data: {
        value: toJsonInput(setting.defaultValue),
        status: 'ACTIVE',
        updatedBy: currentUser.id,
      },
      include: settingInclude,
    });
    await this.createNotificationPolicySnapshot(currentUser, setting, updated, 'RESET');

    return this.mapSetting(updated);
  }

  private async ensureDefaults(currentUser: AuthenticatedUser) {
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      await this.prisma.systemSetting.upsert({
        where: {
          tenantId_key: {
            tenantId: currentUser.tenantId,
            key: setting.key,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          category: setting.category,
          key: setting.key,
          name: setting.name,
          description: setting.description,
          value: setting.value,
          defaultValue: setting.defaultValue,
          valueType: setting.valueType,
          options: setting.options ?? Prisma.JsonNull,
          isSecret: setting.isSecret,
          isSystem: true,
          status: 'ACTIVE',
          sortOrder: setting.sortOrder,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          category: setting.category,
          name: setting.name,
          description: setting.description,
          defaultValue: setting.defaultValue,
          valueType: setting.valueType,
          options: setting.options ?? Prisma.JsonNull,
          isSecret: setting.isSecret,
          isSystem: true,
          sortOrder: setting.sortOrder,
          deletedAt: null,
        },
      });
    }
  }

  private async findSetting(tenantId: string, id: string) {
    const setting = await this.prisma.systemSetting.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: settingInclude,
    });

    if (!setting) {
      throw new NotFoundException('System setting not found');
    }

    return setting;
  }

  private async countRecentNotificationPolicyChanges(tenantId: string) {
    return (await this.listNotificationPolicyAuditItems(tenantId, 100)).length;
  }

  private async listNotificationPolicyAuditItems(
    tenantId: string,
    limit: number,
  ): Promise<NotificationPolicyAuditOverview['recent_changes']> {
    const since = new Date(Date.now() - NOTIFICATION_AUDIT_WINDOW_MS);
    const logs = await this.prisma.operationLog.findMany({
      where: {
        tenantId,
        module: 'system-settings',
        method: {
          in: ['PATCH', 'POST'],
        },
        path: {
          contains: '/system-settings/',
        },
        NOT: [
          {
            path: {
              contains: '/notification-policy/preview',
            },
          },
        ],
        createdAt: {
          gte: since,
        },
      },
      include: operationLogInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.max(limit * 5, 80),
    });
    const settingIds = Array.from(new Set(logs.map((log) => extractSystemSettingId(log.path)).filter(isNonEmptyString)));
    const settings = settingIds.length
      ? await this.prisma.systemSetting.findMany({
          where: {
            tenantId,
            id: {
              in: settingIds,
            },
            key: {
              in: [...NOTIFICATION_SETTING_KEYS],
            },
          },
          select: {
            id: true,
            key: true,
          },
        })
      : [];
    const settingKeyById = new Map(settings.map((setting) => [setting.id, setting.key]));

    return logs
      .flatMap((log) => {
        const settingId = extractSystemSettingId(log.path);
        if (!settingId) return [];
        const settingKey = settingKeyById.get(settingId);
        if (!settingKey) return [];
        const summary = jsonObjectOrNull(log.requestSummary);

        return [
          {
            id: log.id,
            setting_id: settingId,
            setting_key: settingKey,
            action: log.path.includes('/reset') ? 'reset' : log.action,
            method: log.method,
            path: log.path,
            status_code: log.statusCode,
            request_id: log.requestId,
            user_name: log.user?.name ?? null,
            user_email: log.user?.email ?? null,
            value: summary && 'value' in summary ? summary.value : null,
            status: typeof summary?.status === 'string' ? summary.status : null,
            occurred_at: log.createdAt.toISOString(),
          },
        ];
      })
      .slice(0, limit);
  }

  private async getNotificationTaskSnapshot(
    tenantId: string,
  ): Promise<NotificationPolicyChangePreview['task_snapshot']> {
    const since = new Date(Date.now() - NOTIFICATION_TASK_SNAPSHOT_MS);
    const [events, activeSettingCount] = await Promise.all([
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          OR: [
            {
              eventSource: 'platform_usage_anomaly',
              eventType: 'platform.usage.alert.notification_sent',
            },
            {
              eventSource: 'security_center',
              eventType: 'platform.security.approval_operation_alert.notification_sent',
            },
          ],
          occurredAt: {
            gte: since,
          },
        },
        select: {
          payloadJson: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.systemSetting.count({
        where: {
          tenantId,
          category: 'NOTIFICATION',
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
    ]);
    const autoNotifiedAlertIds = new Set<string>();
    let failedNotificationCount = 0;
    let partialNotificationCount = 0;
    let retriedNotificationCount = 0;

    for (const event of events) {
      const payload = jsonObjectOrNull(event.payloadJson);
      const alertId = typeof payload?.alert_id === 'string' ? payload.alert_id : null;
      const status = typeof payload?.status === 'string' ? payload.status : 'FAILED';
      if (isAutoNotifySecurityOperationAlertId(alertId)) {
        autoNotifiedAlertIds.add(alertId);
      }
      if (status === 'FAILED') failedNotificationCount += 1;
      if (status === 'PARTIAL') partialNotificationCount += 1;
      if (
        (typeof payload?.retry_count === 'number' && payload.retry_count > 0) ||
        typeof payload?.retried_from_event_id === 'string'
      ) {
        retriedNotificationCount += 1;
      }
    }

    return {
      pending_auto_notify_count: 0,
      auto_notified_count: autoNotifiedAlertIds.size,
      pending_auto_retry_count: failedNotificationCount + partialNotificationCount,
      failed_notification_count: failedNotificationCount,
      partial_notification_count: partialNotificationCount,
      retried_notification_count: retriedNotificationCount,
      policy_source: activeSettingCount > 0 ? 'SYSTEM_SETTING' : 'ENVIRONMENT',
    };
  }

  private async createNotificationPolicySnapshot(
    currentUser: AuthenticatedUser,
    previous: SystemSettingRecord,
    next: SystemSettingRecord,
    action: SystemSettingSnapshotAction,
  ) {
    if (previous.category !== 'NOTIFICATION' || !NOTIFICATION_SETTING_KEY_SET.has(previous.key)) {
      return null;
    }

    const changed = !jsonEquals(previous.value, next.value) || previous.status !== next.status;
    if (!changed) {
      return null;
    }

    const taskSnapshot = await this.getNotificationTaskSnapshot(currentUser.tenantId);
    const impact = assessNotificationPolicyImpact(
      previous,
      next.value,
      next.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
      [
        ...(!jsonEquals(previous.value, next.value) ? ['value'] : []),
        ...(previous.status !== next.status ? ['status'] : []),
      ],
      taskSnapshot,
    );
    const version = await nextSnapshotVersion(this.prisma, currentUser.tenantId, previous.id);

    const snapshot = await this.prisma.systemSettingSnapshot.create({
      data: {
        tenantId: currentUser.tenantId,
        settingId: previous.id,
        settingKey: previous.key,
        settingName: previous.name,
        version,
        action,
        previousValue: toJsonInput(previous.value),
        nextValue: toJsonInput(next.value),
        previousStatus: previous.status,
        nextStatus: next.status,
        approvalStatus: impact.impact_level === 'HIGH' ? 'RESERVED' : 'NOT_REQUIRED',
        impactLevel: impact.impact_level,
        impactSummary: impact.impact_summary,
        createdBy: currentUser.id,
      },
    });
    await this.recordNotificationApprovalAuditEvent({
      tenantId: currentUser.tenantId,
      sourceId: snapshot.id,
      eventType: 'REQUEST_CREATED',
      eventStatus: 'INFO',
      title: '通知策略审批已创建',
      note: impact.impact_summary,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      metadata: {
        setting_key: previous.key,
        action,
        changed_fields: [
          ...(!jsonEquals(previous.value, next.value) ? ['value'] : []),
          ...(previous.status !== next.status ? ['status'] : []),
        ],
        impact_level: impact.impact_level,
      },
      actorId: currentUser.id,
    });

    return snapshot;
  }

  private async createNotificationPolicyPendingApproval(
    currentUser: AuthenticatedUser,
    setting: SystemSettingRecord,
    data: Prisma.SystemSettingUncheckedUpdateInput,
    action: SystemSettingSnapshotAction,
  ) {
    if (setting.category !== 'NOTIFICATION' || !NOTIFICATION_SETTING_KEY_SET.has(setting.key)) {
      return null;
    }

    const nextValue = data.value === undefined ? setting.value : data.value;
    const nextStatusValue = typeof data.status === 'string' ? data.status : setting.status;
    const nextStatus = nextStatusValue === 'DISABLED' ? 'DISABLED' : 'ACTIVE';
    const changedFields = [
      ...(!jsonEquals(setting.value, nextValue) ? ['value'] : []),
      ...(setting.status !== nextStatus ? ['status'] : []),
    ];
    if (changedFields.length === 0) {
      return null;
    }

    const taskSnapshot = await this.getNotificationTaskSnapshot(currentUser.tenantId);
    const impact = assessNotificationPolicyImpact(setting, nextValue, nextStatus, changedFields, taskSnapshot);
    if (impact.impact_level !== 'HIGH') {
      return null;
    }

    const version = await nextSnapshotVersion(this.prisma, currentUser.tenantId, setting.id);

    return this.prisma.systemSettingSnapshot.create({
      data: {
        tenantId: currentUser.tenantId,
        settingId: setting.id,
        settingKey: setting.key,
        settingName: setting.name,
        version,
        action,
        previousValue: toJsonInput(setting.value),
        nextValue: toJsonInput(nextValue),
        previousStatus: setting.status,
        nextStatus,
        approvalStatus: 'PENDING',
        approvalRequestId: `notification-policy:${setting.id}:v${version}`,
        impactLevel: impact.impact_level,
        impactSummary: impact.impact_summary,
        createdBy: currentUser.id,
      },
    });
  }

  private async findNotificationPolicyApproval(tenantId: string, snapshotId: string) {
    const snapshot = await this.prisma.systemSettingSnapshot.findFirst({
      where: {
        id: snapshotId,
        ...notificationPolicySnapshotWhere(tenantId),
      },
      include: snapshotInclude,
    });

    if (!snapshot) {
      throw new NotFoundException('Notification policy approval not found');
    }

    return snapshot;
  }

  private async loadApprovalAuditTimeline(
    tenantId: string,
    sourceId: string,
  ): Promise<ApprovalAuditEventItem[]> {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'NOTIFICATION_POLICY',
        sourceId,
      },
      include: approvalAuditInclude,
      orderBy: {
        occurredAt: 'asc',
      },
    });

    return items.map(mapApprovalAuditEvent);
  }

  private async loadProductionReadinessAcceptances(
    tenantId: string,
  ): Promise<Map<string, ProductionReadinessAcceptance>> {
    const items = await this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'PRODUCTION_READINESS',
        eventType: 'ACCEPTED',
        eventStatus: 'SUCCESS',
      },
      include: approvalAuditInclude,
      orderBy: {
        occurredAt: 'desc',
      },
    });
    const output = new Map<string, ProductionReadinessAcceptance>();

    const latestItems = [...items].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

    for (const item of latestItems) {
      const checkId = productionReadinessCheckIdFromMetadata(item.metadata);
      if (!checkId || output.has(checkId)) continue;
      output.set(checkId, mapProductionReadinessAcceptance(item));
    }

    return output;
  }

  private async recordNotificationApprovalAuditEvent(input: {
    tenantId: string;
    sourceId: string;
    eventType: string;
    eventStatus: string;
    title: string;
    note?: string | null;
    requestId?: string | null;
    traceId?: string | null;
    metadata?: Record<string, unknown> | null;
    actorId?: string | null;
  }) {
    await this.prisma.approvalAuditEvent.create({
      data: {
        tenantId: input.tenantId,
        sourceType: 'NOTIFICATION_POLICY',
        sourceId: input.sourceId,
        eventType: input.eventType,
        eventStatus: input.eventStatus,
        title: input.title,
        note: input.note ?? null,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        metadata: input.metadata ? toJsonInput(input.metadata) : Prisma.JsonNull,
        actorId: input.actorId ?? null,
      },
    });
  }

  private normalizeValue(
    setting: { valueType: string; options: Prisma.JsonValue | null },
    value: unknown,
  ): Prisma.InputJsonValue {
    if (!SYSTEM_SETTING_VALUE_TYPES.includes(setting.valueType as (typeof SYSTEM_SETTING_VALUE_TYPES)[number])) {
      throw new BadRequestException('Unsupported system setting value type');
    }

    if (setting.valueType === 'STRING') {
      if (typeof value !== 'string') {
        throw new BadRequestException('Setting value must be a string');
      }

      return toJsonInput(value);
    }

    if (setting.valueType === 'NUMBER') {
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numberValue)) {
        throw new BadRequestException('Setting value must be a number');
      }

      return toJsonInput(numberValue);
    }

    if (setting.valueType === 'BOOLEAN') {
      if (typeof value !== 'boolean') {
        throw new BadRequestException('Setting value must be a boolean');
      }

      return toJsonInput(value);
    }

    if (setting.valueType === 'SELECT') {
      const options = parseOptions(setting.options);
      if (options.length === 0) {
        throw new BadRequestException('Setting options are not configured');
      }

      const allowed = options.some((option) => option.value === value);
      if (!allowed) {
        throw new BadRequestException('Setting value is not in allowed options');
      }

      if (!isJsonPrimitive(value)) {
        throw new BadRequestException('Select setting value must be a JSON primitive');
      }

      return toJsonInput(value);
    }

    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      throw new BadRequestException('Setting value must be valid JSON');
    }

    return toJsonInput(value);
  }

  private mapSetting(setting: SystemSettingRecord): SystemSettingItem {
    return {
      id: setting.id,
      tenant_id: setting.tenantId,
      category: setting.category as SystemSettingCategory,
      key: setting.key,
      name: setting.name,
      description: setting.description,
      value: setting.value,
      default_value: setting.defaultValue,
      value_type: setting.valueType as SystemSettingValueType,
      options: parseOptions(setting.options),
      is_secret: setting.isSecret,
      is_system: setting.isSystem,
      status: setting.status as SystemSettingItem['status'],
      sort_order: setting.sortOrder,
      updated_at: setting.updatedAt.toISOString(),
      updated_by: setting.updater
        ? {
            id: setting.updater.id,
            name: setting.updater.name,
            email: setting.updater.email,
          }
        : null,
    };
  }
}

function parseOptions(value: Prisma.JsonValue | null): SystemSettingOption[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((option) => {
    if (!option || typeof option !== 'object' || Array.isArray(option)) return [];
    if (!('label' in option) || !('value' in option)) return [];
    if (typeof option.label !== 'string' || !isJsonPrimitive(option.value)) return [];

    return [
      {
        label: option.label,
        value: option.value,
      },
    ];
  });
}

function isJsonPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function jsonEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mapProductionReadinessCategory(
  category: ProductionReadinessCategory,
  items: ProductionReadinessCheckItem[],
): ProductionReadinessCategoryOverview {
  const categoryItems = items.filter((item) => item.category === category);

  return {
    category,
    label: PRODUCTION_READINESS_CATEGORY_LABELS[category],
    description: PRODUCTION_READINESS_CATEGORY_DESCRIPTIONS[category],
    ready_count: countByStatus(categoryItems, 'READY'),
    warning_count: countByStatus(categoryItems, 'WARNING'),
    blocked_count: countByStatus(categoryItems, 'BLOCKED'),
    manual_count: countByStatus(categoryItems, 'MANUAL'),
    items: categoryItems,
  };
}

function countByStatus(items: ProductionReadinessCheckItem[], status: ProductionReadinessStatus) {
  return items.filter((item) => item.status === status).length;
}

function envReady(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

function envEvidence(...keys: string[]) {
  const configured = keys.filter((key) => Boolean(process.env[key]));
  const missing = keys.filter((key) => !process.env[key]);
  const configuredText = configured.length ? `已配置 ${configured.join(', ')}` : '未检测到必需环境变量';
  const missingText = missing.length ? `；缺少 ${missing.join(', ')}` : '';

  return `${configuredText}${missingText}。`;
}

function assessNotificationPolicyImpact(
  setting: SystemSettingRecord,
  nextValue: unknown,
  nextStatus: Extract<SystemSettingItem['status'], 'ACTIVE' | 'DISABLED'>,
  changedFields: string[],
  taskSnapshot: NotificationPolicyChangePreview['task_snapshot'],
): {
  impact_level: NotificationPolicyImpactLevel;
  impact_summary: string;
  warnings: string[];
} {
  if (changedFields.length === 0) {
    return {
      impact_level: 'LOW',
      impact_summary: '当前修改不会改变通知策略，后台任务行为保持不变。',
      warnings: [],
    };
  }

  const warnings = new Set<string>();
  let score = changedFields.includes('status') ? 2 : 1;
  const notifyBacklog = taskSnapshot.pending_auto_notify_count;
  const retryBacklog = taskSnapshot.pending_auto_retry_count;

  if (nextStatus === 'DISABLED') {
    score += notifyBacklog + retryBacklog > 0 ? 4 : 2;
    warnings.add('停用该策略后，后台自动通知或自动重试任务会回退到环境变量或默认策略。');
  }

  const currentNumber = Number(setting.value);
  const nextNumber = Number(nextValue);

  if (setting.key === 'alert_notification_auto_notify_enabled' && nextValue === false) {
    score += notifyBacklog > 0 ? 5 : 3;
    warnings.add('关闭首发自动通知后，SLA 死信归档删除审批运营告警需要人工进入安全中心通知。');
  }

  if (setting.key === 'alert_notification_auto_notify_interval_ms' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10_000) {
      score += 4;
      warnings.add('首发通知扫描间隔低于 10 秒会增加控制面与下游 Webhook 压力。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('首发通知扫描间隔大幅缩短，告警高峰期可能形成集中投递。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 3) {
      score += 2;
      warnings.add('首发通知扫描间隔明显拉长，运营告警触达速度会降低。');
    }
  }

  if (setting.key === 'alert_notification_auto_notify_batch_size' && Number.isFinite(nextNumber)) {
    if (nextNumber > 20) {
      score += 4;
      warnings.add('单批通知数量较大，下游异常时可能放大首发投递峰值。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 3;
      warnings.add('单批通知数量大幅提高，请确认 Webhook 接收方容量。');
    }
  }

  if (setting.key === 'alert_notification_auto_retry_enabled' && nextValue === false) {
    score += retryBacklog > 0 ? 5 : 3;
    warnings.add('关闭自动重试后，失败投递需要人工进入监控中心处理。');
  }

  if (setting.key === 'alert_notification_retry_interval_ms' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10_000) {
      score += 4;
      warnings.add('扫描间隔低于 10 秒会增加控制面与下游 Webhook 压力。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('扫描间隔大幅缩短，失败高峰期可能形成集中重试。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 3) {
      score += 2;
      warnings.add('扫描间隔明显拉长，失败通知恢复速度会降低。');
    }
  }

  if (setting.key === 'alert_notification_retry_batch_size' && Number.isFinite(nextNumber)) {
    if (nextNumber > 20) {
      score += 4;
      warnings.add('单批重试数量较大，下游异常时可能放大重试峰值。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 3;
      warnings.add('单批数量大幅提高，请确认 Webhook 接收方容量。');
    }
  }

  if (setting.key === 'alert_notification_max_retry_count' && Number.isFinite(nextNumber)) {
    if (nextNumber > 5) {
      score += 4;
      warnings.add('最大重试次数较高，外部服务持续失败时会增加重复投递。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= Math.max(1, Math.floor(currentNumber / 2))) {
      score += 2;
      warnings.add('最大重试次数降低后，部分失败通知会更早进入人工处理。');
    }
  }

  if (setting.key === 'alert_notification_retry_backoff_seconds' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10) {
      score += 4;
      warnings.add('退避时间过短，可能在下游故障期间频繁重试。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('退避时间明显缩短，请确认下游接口具备恢复窗口。');
    }
  }

  if (setting.key === 'alert_notification_lookback_hours' && Number.isFinite(nextNumber)) {
    if (nextNumber > 168) {
      score += 4;
      warnings.add('回看窗口超过 7 天，历史失败记录可能重新进入扫描范围。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 2;
      warnings.add('回看窗口扩大后，后台任务会扫描更多历史投递记录。');
    }
  }

  if (setting.key === 'operation_alert_sla_enabled' && nextValue === false) {
    score += 4;
    warnings.add('关闭审批归档告警 SLA 后，安全中心不会再标记临近超时和已超时告警。');
  }

  if (setting.key === 'operation_alert_sla_auto_escalate_enabled' && nextValue === false) {
    score += 3;
    warnings.add('关闭 SLA 自动升级后，超时告警需要安全管理员手动升级。');
  }

  if (setting.key === 'operation_alert_sla_scan_interval_ms' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10_000) {
      score += 4;
      warnings.add('SLA 扫描间隔低于 10 秒会增加控制面轮询压力。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 3) {
      score += 2;
      warnings.add('SLA 扫描间隔明显拉长，超时告警自动升级会延迟。');
    }
  }

  if (setting.key === 'operation_alert_sla_due_minutes' && Number.isFinite(nextNumber)) {
    if (nextNumber < 30) {
      score += 4;
      warnings.add('SLA 到期时间低于 30 分钟，审批高峰期可能产生频繁升级。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('SLA 到期时间明显缩短，更多告警会进入临近超时或超时状态。');
    }
  }

  if (setting.key === 'operation_alert_sla_warning_minutes' && Number.isFinite(nextNumber)) {
    if (nextNumber < 5) {
      score += 2;
      warnings.add('SLA 预警窗口过短，安全管理员可响应时间会减少。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 2;
      warnings.add('SLA 预警窗口扩大后，更多告警会提前进入预警状态。');
    }
  }

  if (setting.key === 'operation_alert_sla_lookback_hours' && Number.isFinite(nextNumber) && nextNumber > 168) {
    score += 3;
    warnings.add('SLA 回看窗口超过 7 天，后续迁移持久任务时会扫描更多历史告警。');
  }

  if (setting.key === 'operation_alert_sla_subscription_policy') {
    const nextObject = typeof nextValue === 'object' && nextValue && !Array.isArray(nextValue)
      ? (nextValue as Record<string, unknown>)
      : null;
    if (nextObject?.enabled === false) {
      score += 4;
      warnings.add('关闭 SLA 超时订阅策略后，超时告警不会自动投递给订阅目标。');
    }
    if (Array.isArray(nextObject?.channels) && nextObject.channels.length === 0) {
      score += 4;
      warnings.add('SLA 超时订阅策略未配置任何渠道，通知任务会被跳过。');
    }
    if (Array.isArray(nextObject?.high_risk_targets) && nextObject.high_risk_targets.length === 0) {
      score += 3;
      warnings.add('高风险 SLA 超时告警没有订阅目标，租户管理员和审计员可能无法及时获知。');
    }
  }

  if (setting.key === 'operation_alert_sla_notification_auto_retry_enabled' && nextValue === false) {
    score += retryBacklog > 0 ? 4 : 2;
    warnings.add('关闭 SLA 通知自动重试后，失败或部分成功的 SLA 超时通知需要人工重试。');
  }

  if (setting.key === 'operation_alert_sla_notification_retry_interval_ms' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10_000) {
      score += 4;
      warnings.add('SLA 通知重试扫描间隔低于 10 秒会增加控制面与外部 Webhook 压力。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('SLA 通知重试扫描间隔明显缩短，失败高峰期可能形成集中重试。');
    }
  }

  if (setting.key === 'operation_alert_sla_notification_retry_batch_size' && Number.isFinite(nextNumber)) {
    if (nextNumber > 20) {
      score += 4;
      warnings.add('SLA 通知单批重试数量较大，下游异常时可能放大重试峰值。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 3;
      warnings.add('SLA 通知单批数量大幅提高，请确认 Webhook 接收方容量。');
    }
  }

  if (setting.key === 'operation_alert_sla_notification_max_retry_count' && Number.isFinite(nextNumber)) {
    if (nextNumber > 5) {
      score += 4;
      warnings.add('SLA 通知最大重试次数较高，外部服务持续失败时会增加重复投递。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= Math.max(1, Math.floor(currentNumber / 2))) {
      score += 2;
      warnings.add('SLA 通知最大重试次数降低后，部分失败通知会更早进入死信处理。');
    }
  }

  if (setting.key === 'operation_alert_sla_notification_retry_backoff_seconds' && Number.isFinite(nextNumber)) {
    if (nextNumber < 10) {
      score += 4;
      warnings.add('SLA 通知退避时间过短，可能在下游故障期间频繁重试。');
    } else if (Number.isFinite(currentNumber) && nextNumber <= currentNumber / 2) {
      score += 3;
      warnings.add('SLA 通知退避时间明显缩短，请确认下游接口具备恢复窗口。');
    }
  }

  if (setting.key === 'operation_alert_sla_notification_lookback_hours' && Number.isFinite(nextNumber)) {
    if (nextNumber > 168) {
      score += 4;
      warnings.add('SLA 通知重试回看窗口超过 7 天，历史失败记录可能重新进入扫描范围。');
    } else if (Number.isFinite(currentNumber) && nextNumber >= currentNumber * 2) {
      score += 2;
      warnings.add('SLA 通知重试回看窗口扩大后，后台任务会扫描更多历史投递记录。');
    }
  }

  if (retryBacklog > 0) {
    score += 1;
    warnings.add(`当前近 24 小时存在 ${retryBacklog} 条失败或部分成功投递，策略变更会立即影响后续处理。`);
  }

  const impactLevel: NotificationPolicyImpactLevel = score >= 6 ? 'HIGH' : score >= 3 ? 'MEDIUM' : 'LOW';

  return {
    impact_level: impactLevel,
    impact_summary:
      impactLevel === 'HIGH'
        ? '本次变更会明显改变告警通知自动重试行为，建议在低峰期保存并观察监控中心投递结果。'
        : impactLevel === 'MEDIUM'
          ? '本次变更会影响后台重试节奏或处理范围，保存后请关注最近通知投递状态。'
          : '本次变更影响较低，主要调整单项通知策略参数。',
    warnings: Array.from(warnings),
  };
}

function extractSystemSettingId(path: string) {
  const match = path.match(/\/system-settings\/([0-9a-fA-F-]{36})(?:\/reset)?(?:\?|$)/);
  return match?.[1] ?? null;
}

function jsonObjectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function notificationPolicySnapshotWhere(tenantId: string): Prisma.SystemSettingSnapshotWhereInput {
  return {
    tenantId,
    settingKey: {
      in: [...NOTIFICATION_SETTING_KEYS],
    },
  };
}

function mapSystemSettingSnapshot(
  snapshot: SystemSettingSnapshotRecord,
  auditTimeline: ApprovalAuditEventItem[] = [],
): SystemSettingSnapshotItem {
  return {
    id: snapshot.id,
    setting_id: snapshot.settingId,
    setting_key: snapshot.settingKey,
    setting_name: snapshot.settingName,
    version: snapshot.version,
    action: snapshot.action as SystemSettingSnapshotItem['action'],
    previous_value: snapshot.previousValue,
    next_value: snapshot.nextValue,
    previous_status: snapshot.previousStatus as SystemSettingItem['status'],
    next_status: snapshot.nextStatus as SystemSettingItem['status'],
    approval_status: snapshot.approvalStatus as SystemSettingSnapshotItem['approval_status'],
    approval_request_id: snapshot.approvalRequestId,
    rollback_from_snapshot_id: snapshot.rollbackFromSnapshotId,
    rollback_count: snapshot.rollbackCount,
    impact_level: snapshot.impactLevel as NotificationPolicyImpactLevel | null,
    impact_summary: snapshot.impactSummary,
    created_by: snapshot.creator
      ? {
          id: snapshot.creator.id,
          name: snapshot.creator.name,
          email: snapshot.creator.email,
        }
      : null,
    created_at: snapshot.createdAt.toISOString(),
    audit_timeline: auditTimeline,
  };
}

function mapApprovalAuditEvent(item: ApprovalAuditEventRecord): ApprovalAuditEventItem {
  return {
    id: item.id,
    tenant_id: item.tenantId,
    source_type: item.sourceType as ApprovalAuditEventItem['source_type'],
    source_id: item.sourceId,
    event_type: item.eventType as ApprovalAuditEventItem['event_type'],
    event_status: item.eventStatus as ApprovalAuditEventItem['event_status'],
    title: item.title,
    note: item.note,
    request_id: item.requestId,
    trace_id: item.traceId,
    metadata: normalizeJsonObject(item.metadata),
    actor: item.actor
      ? {
          id: item.actor.id,
          name: item.actor.name,
          email: item.actor.email,
        }
      : null,
    occurred_at: item.occurredAt.toISOString(),
  };
}

function mapProductionReadinessAcceptance(item: ApprovalAuditEventRecord): ProductionReadinessAcceptance {
  const checkId = productionReadinessCheckIdFromMetadata(item.metadata) ?? item.sourceId;

  return {
    check_id: checkId,
    status: 'ACCEPTED',
    note: item.note ?? '',
    accepted_by: item.actor
      ? {
          id: item.actor.id,
          name: item.actor.name,
          email: item.actor.email,
        }
      : null,
    accepted_at: item.occurredAt.toISOString(),
  };
}

function productionReadinessCheckIdFromMetadata(metadata: Prisma.JsonValue | null) {
  const value = normalizeJsonObject(metadata);
  return typeof value?.check_id === 'string' ? value.check_id : null;
}

function productionReadinessSourceId(checkId: string) {
  return uuidFromText(`production-readiness:${checkId}`);
}

function uuidFromText(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isAutoNotifySecurityOperationAlertId(alertId: string | null) {
  return (
    alertId === 'sla-dead-letter-archive-delete-pending' ||
    alertId === 'sla-dead-letter-archive-delete-rejected-risk'
  );
}

function buildApprovalDecisionReference(status: 'APPROVED' | 'REJECTED', userId: string, note?: string | null) {
  const noteText = note?.trim();
  return [
    `notification-policy-approval:${status.toLowerCase()}`,
    `reviewed_by=${userId}`,
    noteText ? `note=${noteText.slice(0, 20)}` : null,
  ]
    .filter(Boolean)
    .join(';');
}

async function nextSnapshotVersion(
  tx: Pick<PrismaService, 'systemSettingSnapshot'> | Prisma.TransactionClient,
  tenantId: string,
  settingId: string,
) {
  const latest = await tx.systemSettingSnapshot.findFirst({
    where: {
      tenantId,
      settingId,
    },
    select: {
      version: true,
    },
    orderBy: {
      version: 'desc',
    },
  });

  return (latest?.version ?? 0) + 1;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    throw new BadRequestException('Setting value must be valid JSON');
  }

  return value as Prisma.InputJsonValue;
}
