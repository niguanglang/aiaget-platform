import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface RequestWithContext extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
}

