import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DELIVERY_REVIEW_STAGES = [
  'PILOT_ACCEPTANCE',
  'FINAL_ACCEPTANCE',
  'EXPANSION_REVIEW',
  'RENEWAL_REVIEW',
] as const;
export const DELIVERY_REVIEW_RESULTS = ['PASSED', 'PARTIAL', 'FAILED', 'DEFERRED'] as const;
export const DELIVERY_REVIEW_STATUSES = ['DRAFT', 'IN_REVIEW', 'COMPLETED', 'ACTION_REQUIRED', 'ARCHIVED'] as const;
export const DELIVERY_REVIEW_SATISFACTION_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export class ListDeliveryReviewsDto {
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
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  solution_package_id?: string;
}
