import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { PluginHookExecutionResult, QueuePluginHookExecutionInput } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PluginHookWorkflowService } from './plugin-hook-workflow.service';
import { auditSandboxPolicyForHookExecution } from './plugin-policy';

const RUNNABLE_INSTALLATION_STATUSES = ['ACTIVE', 'INSTALLED'] as const;
const RUNNABLE_RUNTIME_STATUSES = ['RUNNING', 'READY'] as const;

@Injectable()
export class PluginHookExecutionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Optional() @Inject(PluginHookWorkflowService) private readonly hookWorkflow: PluginHookWorkflowService | null = null,
  ) {}

  async queueHookExecution(
    currentUser: AuthenticatedUser,
    pluginId: string,
    hookId: string,
    input: QueuePluginHookExecutionInput,
  ): Promise<PluginHookExecutionResult> {
    const installation = await this.prisma.pluginInstallation.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        deletedAt: null,
        status: {
          in: [...RUNNABLE_INSTALLATION_STATUSES],
        },
        runtimeStatus: {
          in: [...RUNNABLE_RUNTIME_STATUSES],
        },
      },
    });

    if (!installation) {
      throw new NotFoundException('Plugin installation not found or not running');
    }

    const hook = await this.prisma.pluginHook.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        id: hookId,
        deletedAt: null,
      },
    });

    if (!hook) {
      throw new NotFoundException('Plugin hook not found');
    }

    if (hook.status !== 'ACTIVE') {
      throw new BadRequestException('Plugin hook is not active');
    }

    const sandboxAudit = auditSandboxPolicyForHookExecution(normalizeJsonRecord(installation.manifestJson));
    const sandboxPayload = {
      sandbox_policy: sandboxAudit.policy,
      sandbox_risk_level: sandboxAudit.risk_level,
      sandbox_violations: sandboxAudit.violations,
    };

    if (!sandboxAudit.allowed) {
      await this.platformEvents.recordEvent({
        tenantId: currentUser.tenantId,
        departmentId: currentUser.departmentId ?? null,
        userId: currentUser.id,
        resourceType: 'PLUGIN_HOOK',
        resourceId: hook.id,
        pluginId,
        traceId: input.trace_id ?? currentUser.traceId ?? null,
        eventSource: 'CONTROL_API',
        eventType: 'plugin.hook.execution.sandbox_blocked',
        status: 'FAILED',
        severity: 'WARN',
        billable: false,
        sourceSystem: 'PLUGIN_HOOK',
        sourceId: input.source_event_id ?? null,
        dedupeKey: input.source_event_id
          ? `plugin-hook-sandbox-blocked:${currentUser.tenantId}:${pluginId}:${hook.id}:${input.source_event_id}`
          : null,
        summary: `插件 Hook ${hook.code} 未通过运行前沙箱策略审计，已阻断入队。`,
        payloadJson: toJsonInput({
          plugin_id: pluginId,
          hook_id: hook.id,
          hook_code: hook.code,
          hook_type: hook.hookType,
          target: hook.target,
          method: hook.method,
          payload: input.payload ?? null,
          config: hook.configJson ?? null,
          execution_boundary: 'PLUGIN_SANDBOX_POLICY_BLOCKED',
          ...sandboxPayload,
        }),
      });

      throw new BadRequestException('插件 Hook 未通过运行前沙箱策略审计，已阻断入队。');
    }

    const event = await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN_HOOK',
      resourceId: hook.id,
      pluginId,
      traceId: input.trace_id ?? currentUser.traceId ?? null,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.hook.execution.queued',
      status: 'PENDING',
      severity: 'INFO',
      billable: false,
      sourceSystem: 'PLUGIN_HOOK',
      sourceId: input.source_event_id ?? null,
      dedupeKey: input.source_event_id
        ? `plugin-hook:${currentUser.tenantId}:${pluginId}:${hook.id}:${input.source_event_id}`
        : null,
      summary: `插件 Hook ${hook.code} 已进入受控异步执行队列`,
      payloadJson: toJsonInput({
        plugin_id: pluginId,
        hook_id: hook.id,
        hook_code: hook.code,
        hook_type: hook.hookType,
        target: hook.target,
        method: hook.method,
        payload: input.payload ?? null,
        config: hook.configJson ?? null,
        execution_boundary: sandboxAudit.policy.status === 'NOT_REQUIRED'
          ? 'CONTROL_PLANE_EVENT_ONLY'
          : 'PLUGIN_SANDBOX_POLICY_GATED',
        ...sandboxPayload,
      }),
    });

    if (input.source_event_id) {
      const sourceEvent = await this.prisma.platformEvent.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          id: input.source_event_id,
        },
        select: {
          id: true,
        },
      });

      if (sourceEvent) {
        const relationKey = `plugin-hook:${currentUser.tenantId}:${pluginId}:${hook.id}:${sourceEvent.id}`;
        const existingRelation = await this.prisma.platformEventRelation.findFirst({
          where: {
            tenantId: currentUser.tenantId,
            relationType: 'HOOK_EXECUTION_TRIGGER',
            parentEventId: sourceEvent.id,
            childEventId: event.id,
            sourceEventId: sourceEvent.id,
            targetEventId: event.id,
            relationKey,
          },
          select: {
            id: true,
          },
        });

        if (!existingRelation) {
          await this.prisma.platformEventRelation.create({
            data: {
              tenantId: currentUser.tenantId,
              relationType: 'HOOK_EXECUTION_TRIGGER',
              parentEventId: sourceEvent.id,
              childEventId: event.id,
              sourceEventId: sourceEvent.id,
              targetEventId: event.id,
              relationSource: 'plugin_hook_execution',
              relationKey,
              metadata: toJsonInput({
                plugin_id: pluginId,
                hook_id: hook.id,
                hook_code: hook.code,
                source_event_id: sourceEvent.id,
              }),
            },
          });
        }
      }
    }

    const workflowDispatch = this.hookWorkflow
      ? await this.hookWorkflow.dispatchHookExecution(currentUser, {
        eventId: event.id,
        pluginId,
        hookId: hook.id,
      })
      : {
        workflow_backend: null,
        workflow_id: null,
        workflow_run_id: null,
      };

    return {
      event_id: event.id,
      hook_id: hook.id,
      plugin_id: pluginId,
      status: 'QUEUED',
      workflow_backend: workflowDispatch.workflow_backend,
      workflow_id: workflowDispatch.workflow_id,
      workflow_run_id: workflowDispatch.workflow_run_id,
      message: '插件 Hook 已进入受控异步执行队列。',
    };
  }
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
