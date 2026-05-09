import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CUSTOMER_SUCCESS_OPPORTUNITY_TYPES = ['RENEWAL', 'EXPANSION', 'UPSELL', 'CROSS_SELL', 'RISK_SAVE'] as const;
export const CUSTOMER_SUCCESS_OPPORTUNITY_STAGES = [
  'DISCOVERY',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ARCHIVED',
] as const;
export const CUSTOMER_SUCCESS_OPPORTUNITY_STATUSES = ['OPEN', 'AT_RISK', 'WON', 'LOST', 'ARCHIVED'] as const;
export const CUSTOMER_SUCCESS_OPPORTUNITY_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const CUSTOMER_SUCCESS_OPPORTUNITY_CONFIDENCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const CUSTOMER_SUCCESS_OPPORTUNITY_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ListCustomerSuccessOpportunitiesDto {
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
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  customer_success_plan_id?: string;

  @IsOptional()
  @IsString()
  customer_success_action_id?: string;

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
