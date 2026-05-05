import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import type { PublishChannelStatus } from '@aiaget/shared-types';

export class UpdatePublishChannelDto {
  @IsOptional()
  @IsUUID('4')
  account_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  route_rule_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  endpoint_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  callback_url?: string | null;

  @IsOptional()
  @IsString()
  secret?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'DISABLED', 'ERROR', 'ARCHIVED'] satisfies PublishChannelStatus[])
  status?: PublishChannelStatus;
}
