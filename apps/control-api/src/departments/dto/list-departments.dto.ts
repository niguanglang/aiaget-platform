import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEPARTMENT_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;

export class ListDepartmentsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 100))
  @IsInt()
  @Min(1)
  @Max(500)
  page_size = 100;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(DEPARTMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
