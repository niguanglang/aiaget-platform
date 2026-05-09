import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SOLUTION_PACKAGE_CUSTOMER_TYPES = ['UNKNOWN', 'ANXIOUS', 'TASK_DRIVEN', 'CLEAR'] as const;
export const SOLUTION_PACKAGE_STAGES = ['DISCOVERY', 'SOLUTION_DESIGN', 'PILOT_DESIGN', 'DELIVERY_PLAN', 'EXPANSION'] as const;
export const SOLUTION_PACKAGE_STATUSES = ['DRAFT', 'REVIEWING', 'APPROVED', 'DELIVERING', 'CLOSED', 'ARCHIVED'] as const;
export const SOLUTION_PACKAGE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ListSolutionPackagesDto {
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
  @IsIn(SOLUTION_PACKAGE_CUSTOMER_TYPES)
  customer_type?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_STAGES)
  package_stage?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
