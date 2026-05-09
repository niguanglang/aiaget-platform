import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const SKILL_CATEGORIES = ['GENERAL', 'SALES', 'DESIGN', 'OPERATIONS', 'TRAINING', 'REVIEW'] as const;
export const SKILL_STATUSES = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'] as const;

export class ListSkillsDto {
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
  @IsIn(SKILL_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsIn(SKILL_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
