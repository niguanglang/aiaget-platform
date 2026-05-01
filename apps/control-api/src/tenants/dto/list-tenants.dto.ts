import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const TENANT_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;

export class ListTenantsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(TENANT_STATUSES)
  status?: 'ACTIVE' | 'DISABLED' | 'DELETED';
}
