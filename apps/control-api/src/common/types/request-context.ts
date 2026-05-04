import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  departmentId?: string | null;
  email: string;
  roles: string[];
  roleIds?: string[];
  permissions: string[];
  requestId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string | null;
  traceparent?: string;
}

export interface RequestWithContext extends Request {
  rawBody?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string | null;
  traceparent?: string;
  apiKeyId?: string;
  apiKeyPrefix?: string;
  externalAgentId?: string;
  externalChannelId?: string;
  externalConversationId?: string;
  externalRunId?: string;
  externalTraceId?: string;
  user?: AuthenticatedUser;
}
