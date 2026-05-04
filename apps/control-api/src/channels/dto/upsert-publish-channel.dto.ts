import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import type { PublishChannelStatus, PublishChannelType } from '@aiaget/shared-types';

export class UpsertPublishChannelDto {
  @IsUUID('4')
  agent_id!: string;

  @IsIn(['WEB_WIDGET', 'OPEN_API', 'WECHAT_WORK', 'DINGTALK', 'FEISHU', 'SLACK', 'CUSTOM_WEBHOOK'] satisfies PublishChannelType[])
  channel!: PublishChannelType;

  @IsString()
  @MaxLength(160)
  name!: string;

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
