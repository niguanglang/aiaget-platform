import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CUSTOMER_SUCCESS_ACTION_TYPES = [
  'MEETING',
  'ASSET_REUSE',
  'ROLLOUT',
  'TRAINING',
  'RENEWAL',
  'RISK_REVIEW',
  'FOLLOW_UP',
] as const;
export const CUSTOMER_SUCCESS_ACTION_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED', 'ARCHIVED'] as const;
export const CUSTOMER_SUCCESS_ACTION_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const CUSTOMER_SUCCESS_ACTION_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ListCustomerSuccessActionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

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
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  customer_success_plan_id?: string;

  @IsOptional()
  @IsString()
  delivery_review_id?: string;

  @IsOptional()
  @IsString()
  delivery_asset_id?: string;

  @IsOptional()
  @IsString()
  solution_package_id?: string;
}
