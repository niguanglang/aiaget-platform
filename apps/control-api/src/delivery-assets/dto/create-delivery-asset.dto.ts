import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  DELIVERY_ASSET_STATUSES,
  DELIVERY_ASSET_TYPES,
  DELIVERY_ASSET_VISIBILITIES,
} from './list-delivery-assets.dto';

export class CreateDeliveryAssetDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customer_name!: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_TYPES)
  asset_type?: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_VISIBILITIES)
  visibility?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  reuse_score?: number;

  @IsString()
  @MinLength(1)
  summary!: string;

  @IsString()
  @MinLength(1)
  business_value!: string;

  @IsString()
  @MinLength(1)
  reuse_guidance!: string;

  @IsString()
  @MinLength(1)
  source_context!: string;

  @IsString()
  @MinLength(1)
  risk_notes!: string;

  @IsString()
  @MinLength(1)
  next_action!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;

  @IsString()
  delivery_review_id!: string;

  @IsOptional()
  @IsString()
  solution_package_id?: string | null;

  @IsOptional()
  @IsString()
  skill_id?: string | null;

  @IsOptional()
  @IsString()
  agent_id?: string | null;

  @IsOptional()
  @IsString()
  knowledge_id?: string | null;
}
