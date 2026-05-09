import { Inject, Injectable, Logger } from '@nestjs/common';

import type { RuntimeWorkflowBackend } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { requireEnv } from '../common/env';
import { PlatformEventsService } from '../platform-events/platform-events.service';

type PluginHookWorkflowMode = 'local' | 'temporal_first' | 'temporal';
type RuntimeStartBackend = 'TEMPORAL' | 'LOCAL_FALLBACK';

export interface PluginHookWorkflowDispatchResult {
  workflow_backend: RuntimeWorkflowBackend;
  workflow_id: string | null;
  workflow_run_id: string | null;
}

const WORKFLOW_MODE = normalizeWorkflowMode(process.env.PLUGIN_HOOK_WORKFLOW_MODE);
const WORKFLOW_REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class PluginHookWorkflowService {
  private readonly logger = new Logger(PluginHookWorkflowService.name);

  constructor(@Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService) {}

  async dispatchHookExecution(
    currentUser: AuthenticatedUser,
    input: { eventId: string; pluginId: string; hookId: string },
  ): Promise<PluginHookWorkflowDispatchResult> {
    if (WORKFLOW_MODE === 'local') {
      await this.recordDispatchEvent(currentUser, input, {
        status: 'SUCCESS',
        backend: 'LOCAL',
        workflowId: null,
        runId: null,
      });
      return { workflow_backend: 'LOCAL', workflow_id: null, workflow_run_id: null };
    }

    try {
      const workflow = await this.startRuntimeWorkflow(input);
      if (WORKFLOW_MODE === 'temporal' && workflow.backend !== 'TEMPORAL') {
        throw new Error('Runtime workflow endpoint returned LOCAL_FALLBACK while PLUGIN_HOOK_WORKFLOW_MODE=temporal');
      }

      await this.recordDispatchEvent(currentUser, input, {
        status: 'SUCCESS',
        backend: workflow.backend,
        workflowId: workflow.workflowId,
        runId: workflow.runId,
      });
      this.logger.log(`Dispatched plugin hook execution event ${input.eventId} to ${workflow.backend} workflow ${workflow.workflowId ?? 'unknown'}`);
      return {
        workflow_backend: workflow.backend,
        workflow_id: workflow.workflowId,
        workflow_run_id: workflow.runId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown plugin hook workflow dispatch error';
      await this.recordDispatchEvent(currentUser, input, {
        status: 'FAILED',
        backend: null,
        workflowId: null,
        runId: null,
        errorMessage: message,
      });
      if (WORKFLOW_MODE === 'temporal_first') {
        this.logger.warn(`Plugin hook workflow dispatch failed for ${input.eventId}; falling back to local boundary: ${message}`);
        return { workflow_backend: 'LOCAL_FALLBACK', workflow_id: null, workflow_run_id: null };
      }

      throw error;
    }
  }

  private async startRuntimeWorkflow(input: { eventId: string; pluginId: string; hookId: string }) {
    const response = await fetch(new URL('/runtime/workflows/plugin-hooks/start', requireEnv('RUNTIME_BASE_URL')), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-runtime-internal-token': requireEnv('RUNTIME_INTERNAL_TOKEN'),
      },
      body: JSON.stringify({
        event_id: input.eventId,
        plugin_id: input.pluginId,
        hook_id: input.hookId,
      }),
      signal: AbortSignal.timeout(WORKFLOW_REQUEST_TIMEOUT_MS),
    });
    const body = await safeJson(response);

    if (!response.ok) {
      throw new Error(extractWorkflowError(body) ?? `Runtime workflow endpoint responded with HTTP ${response.status}`);
    }

    return parseRuntimeWorkflowStartResponse(body);
  }

  private async recordDispatchEvent(
    currentUser: AuthenticatedUser,
    input: { eventId: string; pluginId: string; hookId: string },
    result: {
      status: 'SUCCESS' | 'FAILED';
      backend: RuntimeWorkflowBackend;
      workflowId: string | null;
      runId: string | null;
      errorMessage?: string | null;
    },
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'PLUGIN_HOOK',
      resourceId: input.hookId,
      pluginId: input.pluginId,
      taskId: input.eventId,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventSource: 'runtime_workflow',
      eventType: result.status === 'FAILED' ? 'workflow.plugin_hook_execution.dispatch_failed' : 'workflow.plugin_hook_execution.dispatched',
      status: result.status,
      severity: result.status === 'FAILED' ? 'ERROR' : 'INFO',
      securityLevel: 'INTERNAL',
      billable: false,
      summary: result.status === 'FAILED'
        ? `插件 Hook ${input.hookId} 执行工作流派发失败：${result.errorMessage ?? 'unknown error'}`
        : `插件 Hook ${input.hookId} 执行工作流已派发。`,
      payloadJson: {
        event_id: input.eventId,
        plugin_id: input.pluginId,
        hook_id: input.hookId,
        workflow_backend: result.backend,
        workflow_mode: WORKFLOW_MODE,
        workflow_id: result.workflowId,
        workflow_run_id: result.runId,
        error_message: result.errorMessage ?? null,
      },
      sourceSystem: 'runtime_workflow',
      sourceId: input.eventId,
      dedupeKey: `runtime_workflow:${input.eventId}:plugin_hook_dispatch:${currentUser.traceId ?? currentUser.requestId ?? Date.now()}`,
    });
  }
}

function normalizeWorkflowMode(value: string | undefined): PluginHookWorkflowMode {
  if (value === 'temporal' || value === 'temporal_first' || value === 'local') {
    return value;
  }

  return 'temporal_first';
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractWorkflowError(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  if (typeof record.message === 'string') return record.message;
  return null;
}

function parseRuntimeWorkflowStartResponse(value: unknown): {
  workflowId: string | null;
  runId: string | null;
  backend: RuntimeStartBackend;
} {
  if (!value || typeof value !== 'object') {
    throw new Error('Runtime workflow endpoint returned an invalid response');
  }

  const record = value as Record<string, unknown>;
  if (record.backend !== 'TEMPORAL' && record.backend !== 'LOCAL_FALLBACK') {
    throw new Error('Runtime workflow endpoint returned an invalid backend');
  }

  return {
    workflowId: typeof record.workflow_id === 'string' ? record.workflow_id : null,
    runId: typeof record.run_id === 'string' ? record.run_id : null,
    backend: record.backend,
  };
}
