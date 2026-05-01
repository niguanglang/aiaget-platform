import { SetMetadata } from '@nestjs/common';

import type { ResourceAclResourceType } from '@aiaget/shared-types';

export const RESOURCE_ACL_KEY = 'resource_acl';

export interface ResourceAclRequirement {
  resourceType: ResourceAclResourceType;
  idParam?: string;
  permissionCode: string;
}

export function RequireResourceAcl(requirement: ResourceAclRequirement) {
  return SetMetadata(RESOURCE_ACL_KEY, requirement);
}
