import { SetMetadata } from '@nestjs/common';

import type { ResourceAclResourceType } from '@aiaget/shared-types';

export const SECURITY_POLICY_KEY = 'security_policy';

export interface SecurityPolicyRequirement {
  resourceType: ResourceAclResourceType;
  idParam?: string;
  action: string;
}

export function RequireSecurityPolicy(requirement: SecurityPolicyRequirement) {
  return SetMetadata(SECURITY_POLICY_KEY, requirement);
}
