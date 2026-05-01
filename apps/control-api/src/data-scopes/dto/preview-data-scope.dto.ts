import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { DATA_SCOPE_RESOURCE_TYPES, DATA_SCOPE_TYPES } from '../data-scope.constants';
import { DataScopeValueDto } from './replace-role-data-scopes.dto';

export class PreviewDataScopeDto {
  @IsString()
  role_id!: string;

  @IsIn(DATA_SCOPE_RESOURCE_TYPES)
  resource_type!: string;

  @IsIn(DATA_SCOPE_TYPES)
  scope_type!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataScopeValueDto)
  scope_value?: DataScopeValueDto | null;
}
