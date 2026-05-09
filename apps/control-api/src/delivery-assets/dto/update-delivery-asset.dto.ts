import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  DELIVERY_ASSET_STATUSES,
  DELIVERY_ASSET_TYPES,
  DELIVERY_ASSET_VISIBILITIES,
} from './list-delivery-assets.dto';

export class UpdateDeliveryAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customer_name?: string;

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

  @IsOptional()
  @IsString()
  @MinLength(1)
  summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  business_value?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  reuse_guidance?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  source_context?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  risk_notes?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  next_action?: string;

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

  @IsOptional()
  @IsString()
  delivery_review_id?: string | null;

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
