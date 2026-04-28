import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { HealthResponse } from '@aiaget/shared-types';

import { RuntimeHealthService } from './runtime-health.service';

@ApiTags('runtime')
@Controller('runtime')
export class RuntimeHealthController {
  constructor(
    @Inject(RuntimeHealthService)
    private readonly runtimeHealthService: RuntimeHealthService,
  ) {}

  @Get('health')
  @ApiOkResponse({
    description: 'Agent Runtime health status proxied by the Control Plane',
    schema: {
      example: {
        service: 'agent-runtime',
        status: 'healthy',
        timestamp: '2026-04-28T00:00:00.000Z',
        version: '0.1.0',
      },
    },
  })
  async getRuntimeHealth(): Promise<HealthResponse> {
    return this.runtimeHealthService.getRuntimeHealth();
  }
}
