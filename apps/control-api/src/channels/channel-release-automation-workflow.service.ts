import { Inject, Injectable, Logger } from '@nestjs/common';

import type { ChannelReleaseAutomationOverview } from '@aiaget/shared-types';

import { requireEnv } from '../common/env';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ChannelsService } from './channels.service';

type ChannelReleaseWorkflowMode = 'local' | 'temporal_first' | 'temporal';
type RuntimeWorkflowBackend = 'TEMPORAL' | 'LOCAL_FALLBACK';

const WORKFLOW_MODE = normalizeWorkflowMode(process.env.CHANNEL_RELEASE_WORKFLOW_MODE);
const RUNTIME_BASE_URL = requireEnv('RUNTIME_BASE_URL');
const RUNTIME_INTERNAL_TOKEN = requireEnv('RUNTIME_INTERNAL_TOKEN');
const WORKFLOW_REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class ChannelReleaseAutomationWorkflowService {
  private readonly logger = new Logger(ChannelReleaseAutomationWorkflowService.name);

  constructor(@Inject(ChannelsService) private readonly channelsService: ChannelsService) {}

  getWorkflowMode() {
    return WORKFLOW_MODE;
  }

  async getOverview(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseAutomationOverview> {
    const overview = await this.channelsService.getReleaseAutomation(currentUser, channelId);

    return {
      ...overview,
      workflow_mode: WORKFLOW_MODE,
      workflow_backend: overview.last_run?.workflow_backend ?? null,
    };
  }

  async dispatch(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseAutomationOverview> {
    if (WORKFLOW_MODE === 'local') {
      return this.runLocal(currentUser, channelId, 'LOCAL');
    }

    try {
      const workflow = await this.startRuntimeWorkflow(channelId);
      if (WORKFLOW_MODE === 'temporal' && workflow.backend !== 'TEMPORAL') {
        throw new Error('Runtime workflow endpoint returned LOCAL_FALLBACK while CHANNEL_RELEASE_WORKFLOW_MODE=temporal');
      }

      this.logger.log(
        `Dispatched channel release automation ${channelId} to ${workflow.backend} workflow ${workflow.workflowId ?? 'unknown'}`,
      );
      const overview = await this.channelsService.getReleaseAutomation(currentUser, channelId);

      return {
        ...overview,
        workflow_mode: WORKFLOW_MODE,
        workflow_backend: workflow.backend,
        workflow_id: workflow.workflowId,
        workflow_run_id: workflow.runId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown channel release workflow dispatch error';
      if (WORKFLOW_MODE === 'temporal_first') {
        this.logger.warn(`Temporal dispatch failed for channel release automation ${channelId}; falling back to local runner: ${message}`);
        return this.runLocal(currentUser, channelId, 'LOCAL_FALLBACK');
      }

      await this.channelsService.recordReleaseAutomationDispatchFailure(currentUser, channelId, message);
      throw error;
    }
  }

  private async runLocal(
    currentUser: AuthenticatedUser,
    channelId: string,
    backend: 'LOCAL' | 'LOCAL_FALLBACK',
  ): Promise<ChannelReleaseAutomationOverview> {
    const overview = await this.channelsService.runReleaseAutomation(currentUser, channelId, {
      workflowBackend: backend,
      workflowId: null,
      workflowRunId: null,
    });

    return {
      ...overview,
      workflow_mode: WORKFLOW_MODE,
      workflow_backend: backend,
      workflow_id: overview.last_run?.workflow_id ?? null,
      workflow_run_id: overview.last_run?.workflow_run_id ?? null,
    };
  }

  private async startRuntimeWorkflow(channelId: string) {
    const response = await fetch(new URL('/runtime/workflows/channel-release-automation/start', RUNTIME_BASE_URL), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-runtime-internal-token': RUNTIME_INTERNAL_TOKEN,
      },
      body: JSON.stringify({ channel_id: channelId }),
      signal: AbortSignal.timeout(WORKFLOW_REQUEST_TIMEOUT_MS),
    });
    const body = await safeJson(response);

    if (!response.ok) {
      throw new Error(extractWorkflowError(body) ?? `Runtime workflow endpoint responded with HTTP ${response.status}`);
    }

    return parseRuntimeWorkflowStartResponse(body);
  }
}

function normalizeWorkflowMode(value: string | undefined): ChannelReleaseWorkflowMode {
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
