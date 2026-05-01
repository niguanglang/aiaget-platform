import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { TOOL_AUTH_TYPES, TOOL_METHODS, TOOL_RISK_LEVELS, TOOL_STATUSES } from './list-tools.dto';

export class UpdateToolDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(TOOL_METHODS)
  method?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(1000)
  url?: string;

  @IsOptional()
  @IsIn(TOOL_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(TOOL_RISK_LEVELS)
  risk_level?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(120000)
  timeout_ms?: number;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string> | null;

  @IsOptional()
  @IsIn(TOOL_AUTH_TYPES)
  auth_type?: string;

  @IsOptional()
  @IsObject()
  auth_config?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  input_schema?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  output_schema?: Record<string, unknown> | null;
}
