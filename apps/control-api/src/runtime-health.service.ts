import { Injectable } from '@nestjs/common';

import type { HealthResponse } from '@aiaget/shared-types';

const DEFAULT_RUNTIME_BASE_URL = 'http://localhost:8000';

@Injectable()
export class RuntimeHealthService {
  private readonly runtimeBaseUrl = process.env.RUNTIME_BASE_URL ?? DEFAULT_RUNTIME_BASE_URL;

  async getRuntimeHealth(): Promise<HealthResponse> {
    const runtimeHealthUrl = new URL('/runtime/health', this.runtimeBaseUrl);

    try {
      const response = await fetch(runtimeHealthUrl, {
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        return this.unavailable();
      }

      const health = (await response.json()) as HealthResponse;

      return {
        service: health.service ?? 'agent-runtime',
        status: health.status ?? 'unavailable',
        timestamp: health.timestamp ?? new Date().toISOString(),
        version: health.version ?? 'unknown',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'runtime request failed';

      console.warn(`Runtime health check failed: ${message}`);

      return this.unavailable();
    }
  }

  private unavailable(): HealthResponse {
    return {
      service: 'agent-runtime',
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      version: 'unknown',
    };
  }
}
