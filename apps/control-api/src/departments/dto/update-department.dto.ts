import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { DEPARTMENT_STATUSES } from './list-departments.dto';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  parent_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsString()
  leader_user_id?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;

  @IsOptional()
  @IsIn(DEPARTMENT_STATUSES)
  status?: string;
}
