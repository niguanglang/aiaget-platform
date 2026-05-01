import { IsIn, IsOptional, IsString } from 'class-validator';

import { DATA_SCOPE_RESOURCE_TYPES, DATA_SCOPE_STATUSES, DATA_SCOPE_TYPES } from '../data-scope.constants';

export class ListDataScopesDto {
  @IsOptional()
  @IsString()
  role_id?: string;

  @IsOptional()
  @IsIn(DATA_SCOPE_RESOURCE_TYPES)
  resource_type?: string;

  @IsOptional()
  @IsIn(DATA_SCOPE_TYPES)
  scope_type?: string;

  @IsOptional()
  @IsIn(DATA_SCOPE_STATUSES)
  status?: string;
}
