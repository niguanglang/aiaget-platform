import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  scopes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  allowed_agent_ids?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  ip_allowlist?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rate_limit_per_minute?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000000)
  daily_quota?: number | null;

  @IsOptional()
  @IsBoolean()
  allow_stream?: boolean;

  @IsOptional()
  @IsBoolean()
  webhook_enabled?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  @MaxLength(1000)
  webhook_url?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  webhook_events?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhook_secret?: string | null;

  @IsOptional()
  @IsDateString()
  expires_at?: string | null;
}
