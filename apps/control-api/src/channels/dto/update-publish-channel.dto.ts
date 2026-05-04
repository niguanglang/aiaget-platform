import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import type { PublishChannelStatus } from '@aiaget/shared-types';

export class UpdatePublishChannelDto {
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
