import {
  IsArray,
  IsDateString,
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
  CUSTOMER_SUCCESS_ACTION_PRIORITIES,
  CUSTOMER_SUCCESS_ACTION_RISK_LEVELS,
  CUSTOMER_SUCCESS_ACTION_STATUSES,
  CUSTOMER_SUCCESS_ACTION_TYPES,
} from './list-customer-success-actions.dto';

export class CreateCustomerSuccessActionDto {
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
  @IsIn(CUSTOMER_SUCCESS_ACTION_TYPES)
  action_type?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_ACTION_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_ACTION_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SUCCESS_ACTION_RISK_LEVELS)
  risk_level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  action_score?: number;

  @IsString()
  @MinLength(1)
  action_summary!: string;

  @IsString()
  @MinLength(1)
  expected_outcome!: string;

  @IsString()
  @MinLength(1)
  execution_notes!: string;

  @IsString()
  @MinLength(1)
  blocker_summary!: string;

  @IsString()
  @MinLength(1)
  completion_evidence!: string;

  @IsString()
  @MinLength(1)
  next_action!: string;

  @IsOptional()
  @IsDateString()
  due_at?: string | null;

  @IsOptional()
  @IsDateString()
  completed_at?: string | null;

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
