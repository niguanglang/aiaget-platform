import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CUSTOMER_SUCCESS_PLAN_STAGES = [
  'DISCOVERY',
  'EXPANSION_DESIGN',
  'PILOT_ROLLOUT',
  'RENEWAL_PREP',
  'CLOSED',
] as const;
export const CUSTOMER_SUCCESS_PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'ARCHIVED'] as const;
export const CUSTOMER_SUCCESS_PLAN_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const CUSTOMER_SUCCESS_PLAN_HEALTH_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ListCustomerSuccessPlansDto {
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
  @IsString()
  owner_id?: string;

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
