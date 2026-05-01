import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import type { RequestWithContext } from '../common/types/request-context';
import { requireEnv } from '../common/env';
const RUNTIME_INTERNAL_TOKEN = requireEnv('RUNTIME_INTERNAL_TOKEN');

@Injectable()
export class RuntimeInternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const token = request.headers['x-runtime-internal-token']?.toString();

    if (!token || token !== getRuntimeInternalToken()) {
      throw new UnauthorizedException('Invalid runtime internal token');
    }

    return true;
  }
}

function getRuntimeInternalToken() {
  return RUNTIME_INTERNAL_TOKEN;
}
