import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CUSTOMER_ASSESSMENT_TYPES = ['UNKNOWN', 'ANXIOUS', 'TASK_DRIVEN', 'CLEAR'] as const;
export const CUSTOMER_ASSESSMENT_DECISION_STAGES = ['LEARNING', 'EVALUATION', 'PROCUREMENT', 'PILOT', 'DELIVERY'] as const;
export const CUSTOMER_ASSESSMENT_STATUSES = ['DISCOVERY', 'QUALIFIED', 'NURTURING', 'WON', 'LOST', 'ARCHIVED'] as const;

export class ListCustomerAssessmentsDto {
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
  @IsIn(CUSTOMER_ASSESSMENT_TYPES)
  customer_type?: string;

  @IsOptional()
  @IsIn(CUSTOMER_ASSESSMENT_DECISION_STAGES)
  decision_stage?: string;

  @IsOptional()
  @IsIn(CUSTOMER_ASSESSMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
