import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { TOOL_AUTH_TYPES, TOOL_METHODS, TOOL_RISK_LEVELS, TOOL_TYPES } from './list-tools.dto';

export class CreateToolDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(TOOL_TYPES)
  tool_type?: string;

  @IsIn(TOOL_METHODS)
  method!: string;

  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(1000)
  url!: string;

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
