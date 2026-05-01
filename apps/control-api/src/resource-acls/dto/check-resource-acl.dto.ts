import { IsIn, IsString, MaxLength } from 'class-validator';

import { RESOURCE_ACL_RESOURCE_TYPES, RESOURCE_ACL_SUBJECT_TYPES } from '../resource-acl.constants';

export class CheckResourceAclDto {
  @IsIn(RESOURCE_ACL_RESOURCE_TYPES)
  resource_type!: string;

  @IsString()
  resource_id!: string;

  @IsIn(RESOURCE_ACL_SUBJECT_TYPES)
  subject_type!: string;

  @IsString()
  subject_id!: string;

  @IsString()
  @MaxLength(120)
  permission_code!: string;
}
