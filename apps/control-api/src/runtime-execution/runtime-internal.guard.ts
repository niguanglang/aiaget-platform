import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import type { RequestWithContext } from '../common/types/request-context';

const DEFAULT_RUNTIME_INTERNAL_TOKEN = 'dev-runtime-internal-token';

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
  return process.env.RUNTIME_INTERNAL_TOKEN ?? DEFAULT_RUNTIME_INTERNAL_TOKEN;
}
