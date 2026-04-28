import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { MODEL_PROVIDER_TYPES, MODEL_STATUSES } from './list-model-providers.dto';

export class UpdateModelProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(MODEL_PROVIDER_TYPES)
  provider_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  base_url?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(MODEL_STATUSES)
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
