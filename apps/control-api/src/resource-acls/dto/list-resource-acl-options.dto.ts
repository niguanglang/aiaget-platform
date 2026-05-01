import { IsIn, IsOptional, IsString } from 'class-validator';

import { RESOURCE_ACL_RESOURCE_TYPES, RESOURCE_ACL_SUBJECT_TYPES } from '../resource-acl.constants';

export class ListResourceAclOptionsDto {
  @IsOptional()
  @IsIn(RESOURCE_ACL_RESOURCE_TYPES)
  resource_type?: string;

  @IsOptional()
  @IsIn(RESOURCE_ACL_SUBJECT_TYPES)
  subject_type?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
