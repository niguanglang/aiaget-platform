import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { DATA_SCOPE_RESOURCE_TYPES, DATA_SCOPE_TYPES } from '../data-scope.constants';

export class DataScopeValueDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  department_ids?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  user_ids?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  resource_ids?: string[];

  @IsOptional()
  @IsBoolean()
  include_children?: boolean;
}

export class RoleDataScopeConfigDto {
  @IsIn(DATA_SCOPE_RESOURCE_TYPES)
  resource_type!: string;

  @IsIn(DATA_SCOPE_TYPES)
  scope_type!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataScopeValueDto)
  @IsObject()
  scope_value?: DataScopeValueDto | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;
}

export class ReplaceRoleDataScopesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDataScopeConfigDto)
  scopes!: RoleDataScopeConfigDto[];
}
