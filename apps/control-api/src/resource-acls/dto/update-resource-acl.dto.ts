import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { RESOURCE_ACL_EFFECTS } from '../resource-acl.constants';

export class UpdateResourceAclDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  permission_code?: string;

  @IsOptional()
  @IsIn(RESOURCE_ACL_EFFECTS)
  effect?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;
}
