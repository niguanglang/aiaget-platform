import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  PluginSandboxExecutionRequest,
  PluginSandboxExecutionResponse,
  PluginSandboxExecutionStatus,
} from '@aiaget/shared-types';

export const PLUGIN_SANDBOX_EXECUTOR = Symbol('PLUGIN_SANDBOX_EXECUTOR');

export interface PluginSandboxExecutionInput {
  tenantId: string;
  pluginId: string;
  hookId: string;
  hookCode: string;
  eventId: string;
  entry: string;
  payload: Record<string, unknown>;
  sandboxPolicy: Record<string, unknown>;
  requestId?: string | null;
  traceId?: string | null;
}

export interface PluginSandboxExecutionResult {
  status: PluginSandboxExecutionStatus;
  latency_ms: number;
  output_preview?: string | null;
  output?: unknown;
  error_message?: string | null;
}

export interface PluginSandboxExecutor {
  isConfigured(): boolean;
  execute(input: PluginSandboxExecutionInput): Promise<PluginSandboxExecutionResult>;
}

const DEFAULT_PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS = 10_000;

@Injectable()
export class HttpPluginSandboxExecutor implements PluginSandboxExecutor {
  private readonly executorUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL?.trim() ?? '';
  private readonly executorToken = process.env.PLUGIN_SANDBOX_EXECUTOR_TOKEN?.trim() ?? '';
  private readonly timeoutMs = normalizePositiveInteger(
    process.env.PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS,
    DEFAULT_PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS,
  );

  isConfigured() {
    return Boolean(this.executorUrl);
  }

  async execute(input: PluginSandboxExecutionInput): Promise<PluginSandboxExecutionResult> {
    if (!this.isConfigured()) {
      throw new Error('Plugin sandbox executor is not configured');
    }

    const startedAt = Date.now();
    const response = await fetch(new URL('/execute', this.executorUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.executorToken ? { authorization: `Bearer ${this.executorToken}` } : {}),
        ...(input.requestId ? { 'x-request-id': input.requestId } : {}),
        ...(input.traceId ? { 'x-trace-id': input.traceId } : {}),
      },
      body: JSON.stringify({
        tenant_id: input.tenantId,
        plugin_id: input.pluginId,
        hook_id: input.hookId,
        hook_code: input.hookCode,
        event_id: input.eventId,
        entry: input.entry,
        payload: input.payload,
        sandbox_policy: input.sandboxPolicy,
      } satisfies PluginSandboxExecutionRequest),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const text = await response.text();
    const body = text ? parseJsonObject(text) as PluginSandboxExecutionResponse | null : null;
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        status: 'FAILED',
        latency_ms: latencyMs,
        output_preview: null,
        output: body ?? text,
        error_message: readString(body?.error_message) ?? readString(body?.message) ?? `Sandbox executor returned HTTP ${response.status}`,
      };
    }

    return {
      status: body?.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      latency_ms: readNumber(body?.latency_ms) ?? latencyMs,
      output_preview: readString(body?.output_preview) ?? summarizeOutput(body?.output),
      output: body?.output ?? body,
      error_message: readString(body?.error_message) ?? null,
    };
  }
}

@Injectable()
export class RuntimePluginSandboxExecutor implements PluginSandboxExecutor {
  constructor(
    private readonly defaultExecutor: HttpPluginSandboxExecutor,
    @Optional() @Inject(PLUGIN_SANDBOX_EXECUTOR) private readonly overrideExecutor: PluginSandboxExecutor | null = null,
  ) {}

  isConfigured() {
    return this.overrideExecutor?.isConfigured() ?? this.defaultExecutor.isConfigured();
  }

  execute(input: PluginSandboxExecutionInput) {
    return (this.overrideExecutor ?? this.defaultExecutor).execute(input);
  }
}

function normalizePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseJsonObject(text: string) {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function summarizeOutput(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 500 ? `${text.slice(0, 500)}...` : text;
}
