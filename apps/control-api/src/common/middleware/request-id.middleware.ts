import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';

import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id']?.toString() ?? `req_${randomUUID().replaceAll('-', '')}`;

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}

