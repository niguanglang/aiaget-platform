import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { HealthResponse } from '@aiaget/shared-types';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'Control Plane health status',
    schema: {
      example: {
        service: 'control-api',
        status: 'healthy',
        timestamp: '2026-04-28T00:00:00.000Z',
        version: '0.1.0',
      },
    },
  })
  getHealth(): HealthResponse {
    return {
      service: 'control-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}

