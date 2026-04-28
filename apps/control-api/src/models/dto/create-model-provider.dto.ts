import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { MODEL_PROVIDER_TYPES } from './list-model-providers.dto';

export class CreateModelProviderDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsIn(MODEL_PROVIDER_TYPES)
  provider_type!: string;

  @IsString()
  @MaxLength(500)
  base_url!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
