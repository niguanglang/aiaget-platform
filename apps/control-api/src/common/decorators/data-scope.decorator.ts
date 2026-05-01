import { SetMetadata } from '@nestjs/common';

import type { DataScopeResourceType } from '@aiaget/shared-types';

export const DATA_SCOPE_KEY = 'data_scope';

export interface DataScopeRequirement {
  resourceType: DataScopeResourceType;
  idParam?: string;
}

export function RequireDataScope(requirement: DataScopeRequirement) {
  return SetMetadata(DATA_SCOPE_KEY, requirement);
}
