import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { MODEL_CAPABILITIES, MODEL_STATUSES } from './list-model-providers.dto';

export class UpdateModelConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(MODEL_CAPABILITIES, { each: true })
  capabilities?: string[];

  @IsOptional()
  @IsInt()
  @Min(512)
  @Max(2000000)
  context_length?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000000)
  max_output_tokens?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  api_version?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  input_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  output_price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rate_limit_rpm?: number | null;

  @IsOptional()
  @IsIn(MODEL_STATUSES)
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
