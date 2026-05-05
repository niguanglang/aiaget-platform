import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const CHANNEL_OPERATION_STATUSES = [
  'ACTIVE',
  'DISABLED',
  'ERROR',
  'DRAFT',
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'SKIPPED',
  'RETRYING',
  'CANCELED',
  'CANCELLED',
  'RECEIVED',
  'PROCESSED',
  'IGNORED',
] as const;

export class ListChannelOperationsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 50))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 50;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(CHANNEL_OPERATION_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsUUID('4')
  channel_id?: string;

  @IsOptional()
  @IsUUID('4')
  account_id?: string;
}

export class CreateChannelProviderDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  provider_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  endpoint_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  callback_url?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  auth_type?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'])
  status?: string;
}

export class UpdateChannelProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  provider_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  endpoint_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  callback_url?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  auth_type?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'])
  status?: string;
}

export class CreateChannelAccountDto {
  @IsUUID('4')
  provider_id!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  external_account_id?: string | null;

  @IsOptional()
  @IsString()
  secret?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'EXPIRED'])
  status?: string;
}

export class UpdateChannelAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  external_account_id?: string | null;

  @IsOptional()
  @IsString()
  secret?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'EXPIRED'])
  status?: string;
}

export class CreateChannelTemplateDto {
  @IsOptional()
  @IsUUID('4')
  provider_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  account_id?: string | null;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,119}$/)
  code!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  template_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  locale?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string | null;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  content_schema?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  external_template_id?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'DISABLED', 'ERROR', 'APPROVED', 'REJECTED'])
  status?: string;
}

export class UpdateChannelTemplateDto {
  @IsOptional()
  @IsUUID('4')
  provider_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  account_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  template_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  locale?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string | null;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  content_schema?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  external_template_id?: string | null;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'DISABLED', 'ERROR', 'APPROVED', 'REJECTED'])
  status?: string;
}

export class CreateChannelRouteRuleDto {
  @IsOptional()
  @IsUUID('4')
  agent_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  provider_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  account_id?: string | null;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,119}$/)
  code!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'])
  status?: string;

  @IsOptional()
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  match_type?: string;

  @IsOptional()
  @IsObject()
  match_config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  target_type?: string;

  @IsOptional()
  @IsObject()
  target_config?: Record<string, unknown> | null;
}

export class UpdateChannelRouteRuleDto {
  @IsOptional()
  @IsUUID('4')
  agent_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  provider_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  account_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'])
  status?: string;

  @IsOptional()
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  match_type?: string;

  @IsOptional()
  @IsObject()
  match_config?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  target_type?: string;

  @IsOptional()
  @IsObject()
  target_config?: Record<string, unknown> | null;

  @IsOptional()
  @IsBoolean()
  clear_agent?: boolean;
}
