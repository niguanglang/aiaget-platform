import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  CUSTOMER_SUCCESS_OPPORTUNITY_CONFIDENCE_LEVELS,
  CUSTOMER_SUCCESS_OPPORTUNITY_PRIORITIES,
  CUSTOMER_SUCCESS_OPPORTUNITY_RISK_LEVELS,
  CUSTOMER_SUCCESS_OPPORTUNITY_STAGES,
  CUSTOMER_SUCCESS_OPPORTUNITY_STATUSES,
  CUSTOMER_SUCCESS_OPPORTUNITY_TYPES,
} from './list-customer-success-opportunities.dto';

export class CreateCustomerSuccessOpportunityDto {
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

  @IsString()
  customer_success_plan_id!: string;

  @IsOptional()
  @IsString()
  customer_success_action_id?: string | null;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_TYPES)
  opportunity_type?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_STAGES)
  stage?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_CONFIDENCE_LEVELS)
  confidence_level?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_OPPORTUNITY_RISK_LEVELS)
  risk_level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  opportunity_score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsDateString()
  expected_close_at?: string | null;

  @IsOptional()
  @IsDateString()
  closed_at?: string | null;

  @IsString()
  @MinLength(1)
  opportunity_summary!: string;

  @IsString()
  @MinLength(1)
  customer_value!: string;

  @IsString()
  @MinLength(1)
  commercial_strategy!: string;

  @IsString()
  @MinLength(1)
  decision_path!: string;

  @IsString()
  @MinLength(1)
  risk_summary!: string;

  @IsString()
  @MinLength(1)
  next_action!: string;

  @IsOptional()
  @IsString()
  loss_reason?: string | null;

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
