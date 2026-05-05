export type WorkflowMode = 'local' | 'temporal_first' | 'temporal';
export type WorkflowBackend = 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
export type WorkflowBackendStatus = 'READY' | 'DISPATCH_FAILED';

export interface WorkflowFailureSnapshot {
  error_message: string;
}

export interface WorkflowBackendEventSnapshot {
  eventType: string;
  workflowBackend: WorkflowBackend;
  errorMessage: string | null;
}

export interface ResolvedWorkflowBackendStatus {
  backend: WorkflowBackend;
  status: WorkflowBackendStatus;
  latest_failure: WorkflowFailureSnapshot | null;
}

export function resolveWorkflowBackendStatus(
  mode: WorkflowMode,
  latestEvent: WorkflowBackendEventSnapshot | null,
): ResolvedWorkflowBackendStatus {
  if (latestEvent?.eventType.endsWith('.dispatch_failed')) {
    return {
      backend: null,
      status: 'DISPATCH_FAILED',
      latest_failure: {
        error_message: latestEvent.errorMessage ?? 'Workflow dispatch failed',
      },
    };
  }

  return {
    backend: latestEvent?.workflowBackend ?? (mode === 'local' ? 'LOCAL' : null),
    status: 'READY',
    latest_failure: null,
  };
}

export function normalizeWorkflowMode(value: string | undefined): WorkflowMode {
  if (value === 'temporal' || value === 'temporal_first' || value === 'local') {
    return value;
  }

  if (value === 'runtime_first' || value === 'runtime_only') {
    return 'temporal_first';
  }

  return 'local';
}

export function normalizeWorkflowBackend(value: unknown): WorkflowBackend {
  return value === 'LOCAL' || value === 'LOCAL_FALLBACK' || value === 'TEMPORAL' ? value : null;
}
