import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const ROLE_SCENARIO_TYPES = ['SALES', 'SERVICE', 'OPERATIONS', 'DESIGN', 'TRAINING', 'MANAGEMENT', 'CUSTOM'] as const;
export const ROLE_SCENARIO_STATUSES = ['DRAFT', 'READY', 'PILOTING', 'ACTIVE', 'ARCHIVED'] as const;
export const ROLE_SCENARIO_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ListRoleScenariosDto {
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
  @IsIn(ROLE_SCENARIO_TYPES)
  scenario_type?: string;

  @IsOptional()
  @IsIn(ROLE_SCENARIO_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(ROLE_SCENARIO_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
