import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const ROLE_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;
export const ROLE_MUTATION_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export class ListRolesDto {
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
  @IsIn(ROLE_STATUSES)
  status?: string;
}
