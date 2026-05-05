import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { requireEnv } from '../common/env';

type KnowledgeTaskRunner = (taskId: string) => Promise<void>;
type KnowledgeWorkflowMode = 'local' | 'temporal_first' | 'temporal';
type RuntimeWorkflowBackend = 'TEMPORAL' | 'LOCAL_FALLBACK';

const RUNNABLE_TASK_TYPES = ['PROCESS', 'REBUILD'];
const RUNNABLE_TASK_STATUSES = ['PENDING', 'RUNNING'];
const WORKFLOW_MODE = normalizeWorkflowMode(process.env.KNOWLEDGE_WORKFLOW_MODE);
const RUNTIME_BASE_URL = requireEnv('RUNTIME_BASE_URL');
const RUNTIME_INTERNAL_TOKEN = requireEnv('RUNTIME_INTERNAL_TOKEN');
const WORKFLOW_REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class KnowledgeTaskDispatcherService implements OnModuleDestroy {
  private readonly logger = new Logger(KnowledgeTaskDispatcherService.name);
  private readonly queuedTaskIds = new Set<string>();
  private runner: KnowledgeTaskRunner | null = null;
  private destroyed = false;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  registerRunner(runner: KnowledgeTaskRunner) {
    this.runner = runner;
  }

  enqueue(taskId: string) {
    if (this.destroyed || this.queuedTaskIds.has(taskId)) return;

    this.queuedTaskIds.add(taskId);
    setImmediate(() => {
      void this.dispatch(taskId);
    });
  }

  async recoverRunnableTasks() {
    const tasks = await this.prisma.knowledgeEmbeddingTask.findMany({
      where: {
        status: {
          in: RUNNABLE_TASK_STATUSES,
        },
        taskType: {
          in: RUNNABLE_TASK_TYPES,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
    });

    for (const task of tasks) {
      this.enqueue(task.id);
    }

    if (tasks.length > 0) {
      this.logger.log(`Recovered ${tasks.length} runnable knowledge processing task(s)`);
    }
  }

  onModuleDestroy() {
    this.destroyed = true;
    this.queuedTaskIds.clear();
  }

  private async dispatch(taskId: string) {
    if (WORKFLOW_MODE === 'local') {
      await this.runLocal(taskId);
      return;
    }

    try {
      await this.startRuntimeWorkflow(taskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Temporal dispatch error';

      if (WORKFLOW_MODE === 'temporal_first') {
        this.logger.warn(`Temporal dispatch failed for knowledge task ${taskId}; falling back to local runner: ${message}`);
        await this.recordDispatchEvent(taskId, {
          status: 'FAILED',
          backend: null,
          workflowId: null,
          runId: null,
          errorMessage: `Temporal workflow dispatch failed: ${message}`,
        });
        await this.runLocal(taskId);
        return;
      }

      await this.markTemporalDispatchFailed(taskId, message);
      this.logger.error(`Temporal dispatch failed for knowledge task ${taskId}: ${message}`);
    } finally {
      this.queuedTaskIds.delete(taskId);
    }
  }

  private async runLocal(taskId: string) {
    try {
      if (!this.runner) {
        this.logger.warn(`Knowledge task runner is not registered; task ${taskId} was not dispatched`);
        return;
      }

      await this.runner(taskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown knowledge task dispatch error';
      this.logger.error(`Knowledge task ${taskId} failed: ${message}`);
    } finally {
      this.queuedTaskIds.delete(taskId);
    }
  }

  private async startRuntimeWorkflow(taskId: string) {
    const response = await fetch(new URL('/runtime/workflows/knowledge-tasks/start', RUNTIME_BASE_URL), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-runtime-internal-token': RUNTIME_INTERNAL_TOKEN,
      },
      body: JSON.stringify({ task_id: taskId }),
      signal: AbortSignal.timeout(WORKFLOW_REQUEST_TIMEOUT_MS),
    });
    const body = await safeJson(response);

    if (!response.ok) {
      throw new Error(extractWorkflowError(body) ?? `Runtime workflow endpoint responded with HTTP ${response.status}`);
    }

    const workflow = parseRuntimeWorkflowStartResponse(body);
    if (WORKFLOW_MODE === 'temporal' && workflow.backend !== 'TEMPORAL') {
      throw new Error('Runtime workflow endpoint returned LOCAL_FALLBACK while KNOWLEDGE_WORKFLOW_MODE=temporal');
    }

    this.logger.log(
      `Dispatched knowledge task ${taskId} to ${workflow.backend} workflow ${workflow.workflowId ?? 'unknown'}`,
    );
    await this.recordDispatchEvent(taskId, {
      status: 'SUCCESS',
      backend: workflow.backend,
      workflowId: workflow.workflowId,
      runId: workflow.runId,
    });
  }

  private async markTemporalDispatchFailed(taskId: string, message: string) {
    await this.prisma.knowledgeEmbeddingTask.updateMany({
      where: {
        id: taskId,
        status: {
          in: RUNNABLE_TASK_STATUSES,
        },
      },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        errorMessage: `Temporal workflow dispatch failed: ${message}`,
      },
    });
    await this.recordDispatchEvent(taskId, {
      status: 'FAILED',
      backend: null,
      workflowId: null,
      runId: null,
      errorMessage: `Temporal workflow dispatch failed: ${message}`,
    });
  }

  private async recordDispatchEvent(taskId: string, input: {
    status: 'SUCCESS' | 'FAILED';
    backend: RuntimeWorkflowBackend | null;
    workflowId: string | null;
    runId: string | null;
    errorMessage?: string | null;
  }) {
    const task = await this.prisma.knowledgeEmbeddingTask.findUnique({
      where: { id: taskId },
      select: {
        tenantId: true,
        knowledgeId: true,
        documentId: true,
      },
    });

    if (!task) return;

    const eventType = input.status === 'FAILED' ? 'workflow.knowledge_task.dispatch_failed' : 'workflow.knowledge_task.dispatched';
    const summary = input.status === 'FAILED'
      ? `知识库后台任务 ${taskId} 工作流派发失败：${input.errorMessage ?? 'unknown error'}`
      : `知识库后台任务 ${taskId} 已派发到 ${input.backend ?? 'UNKNOWN'}。`;
    await this.prisma.platformEvent.create({
      data: {
        tenantId: task.tenantId,
        actorType: 'RUNTIME',
        resourceType: 'KNOWLEDGE_TASK',
        resourceId: taskId,
        taskId,
        eventSource: 'runtime_workflow',
        eventType,
        status: input.status,
        severity: input.status === 'FAILED' ? 'ERROR' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary,
        payloadJson: toJson({
          task_id: taskId,
          workflow_backend: input.backend,
          workflow_mode: WORKFLOW_MODE,
          workflow_id: input.workflowId,
          workflow_run_id: input.runId,
          knowledge_base_id: task.knowledgeId,
          document_id: task.documentId,
          error_message: input.errorMessage ?? null,
        }),
        sourceSystem: 'runtime_workflow',
        sourceId: taskId,
        dedupeKey: `runtime_workflow:${taskId}:${eventType}:${Date.now()}`,
      },
    });
  }
}

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeWorkflowMode(value: string | undefined): KnowledgeWorkflowMode {
  if (value === 'temporal' || value === 'temporal_first' || value === 'local') {
    return value;
  }

  return 'local';
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
  backend: RuntimeWorkflowBackend;
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
