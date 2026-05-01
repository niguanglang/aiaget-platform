import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';

import type { RequestWithContext } from '../types/request-context';
import { buildTraceparent, createSpanId, createTraceId, normalizeTraceId, parseTraceparent } from '../tracing/trace-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id']?.toString() ?? `req_${randomUUID().replaceAll('-', '')}`;
    const parsedTraceparent = parseTraceparent(req.headers.traceparent);
    const traceId = parsedTraceparent?.traceId ?? normalizeTraceId(req.headers['x-trace-id']) ?? createTraceId();
    const spanId = createSpanId();
    const traceparent = buildTraceparent(traceId, spanId, parsedTraceparent?.traceFlags ?? '01');

    req.requestId = requestId;
    req.traceId = traceId;
    req.spanId = spanId;
    req.parentSpanId = parsedTraceparent?.spanId ?? null;
    req.traceparent = traceparent;

    res.setHeader('x-request-id', requestId);
    res.setHeader('x-trace-id', traceId);
    res.setHeader('traceparent', traceparent);

    next();
  }
}
