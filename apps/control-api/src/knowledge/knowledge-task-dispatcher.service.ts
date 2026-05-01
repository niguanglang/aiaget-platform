import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type KnowledgeTaskRunner = (taskId: string) => Promise<void>;
type KnowledgeWorkflowMode = 'local' | 'temporal_first' | 'temporal';
type RuntimeWorkflowBackend = 'TEMPORAL' | 'LOCAL_FALLBACK';

const RUNNABLE_TASK_TYPES = ['PROCESS', 'REBUILD'];
const RUNNABLE_TASK_STATUSES = ['PENDING', 'RUNNING'];
const WORKFLOW_MODE = normalizeWorkflowMode(process.env.KNOWLEDGE_WORKFLOW_MODE);
const RUNTIME_BASE_URL = process.env.RUNTIME_BASE_URL ?? 'http://localhost:8000';
const RUNTIME_INTERNAL_TOKEN = process.env.RUNTIME_INTERNAL_TOKEN ?? 'dev-runtime-internal-token';
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
  }
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
