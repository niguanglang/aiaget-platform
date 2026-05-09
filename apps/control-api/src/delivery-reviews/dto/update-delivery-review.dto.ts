import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  DELIVERY_REVIEW_RESULTS,
  DELIVERY_REVIEW_SATISFACTION_LEVELS,
  DELIVERY_REVIEW_STAGES,
  DELIVERY_REVIEW_STATUSES,
} from './list-delivery-reviews.dto';

export class UpdateDeliveryReviewDto {
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
  @IsIn(DELIVERY_REVIEW_STAGES)
  review_stage?: string;

  @IsOptional()
  @IsIn(DELIVERY_REVIEW_RESULTS)
  result?: string;

  @IsOptional()
  @IsIn(DELIVERY_REVIEW_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(DELIVERY_REVIEW_SATISFACTION_LEVELS)
  satisfaction_level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  acceptance_score?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  delivered_scope?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  acceptance_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  issue_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  improvement_actions?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  expansion_plan?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  reusable_assets?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  next_action?: string;

  @IsOptional()
  @IsDateString()
  reviewed_at?: string | null;

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
  solution_package_id?: string | null;
}
