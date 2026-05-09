import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  CUSTOMER_SUCCESS_PLAN_HEALTH_LEVELS,
  CUSTOMER_SUCCESS_PLAN_PRIORITIES,
  CUSTOMER_SUCCESS_PLAN_STAGES,
  CUSTOMER_SUCCESS_PLAN_STATUSES,
} from './list-customer-success-plans.dto';

export class UpdateCustomerSuccessPlanDto {
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
  @IsIn(CUSTOMER_SUCCESS_PLAN_STAGES)
  plan_stage?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_PLAN_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_PLAN_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_PLAN_HEALTH_LEVELS)
  health_level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  success_score?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  expansion_scope?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  success_objectives?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  stakeholder_plan?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  asset_reuse_plan?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  renewal_plan?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  risk_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  next_action?: string;

  @IsOptional()
  @IsDateString()
  due_at?: string | null;

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
  delivery_asset_id?: string | null;

  @IsOptional()
  @IsString()
  solution_package_id?: string | null;
}
