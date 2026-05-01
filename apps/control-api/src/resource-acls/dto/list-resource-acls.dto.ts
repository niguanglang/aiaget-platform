import { IsIn, IsOptional, IsString } from 'class-validator';

import {
  RESOURCE_ACL_EFFECTS,
  RESOURCE_ACL_RESOURCE_TYPES,
  RESOURCE_ACL_STATUSES,
  RESOURCE_ACL_SUBJECT_TYPES,
} from '../resource-acl.constants';

export class ListResourceAclsDto {
  @IsOptional()
  @IsIn(RESOURCE_ACL_RESOURCE_TYPES)
  resource_type?: string;

  @IsOptional()
  @IsString()
  resource_id?: string;

  @IsOptional()
  @IsIn(RESOURCE_ACL_SUBJECT_TYPES)
  subject_type?: string;

  @IsOptional()
  @IsString()
  subject_id?: string;

  @IsOptional()
  @IsString()
  permission_code?: string;

  @IsOptional()
  @IsIn(RESOURCE_ACL_EFFECTS)
  effect?: string;

  @IsOptional()
  @IsIn(RESOURCE_ACL_STATUSES)
  status?: string;
}
