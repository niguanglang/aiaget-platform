import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const PROMPT_TYPES = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'] as const;
export const PROMPT_STATUSES = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'] as const;
export const PROMPT_VARIABLE_TYPES = ['string', 'number', 'boolean', 'json'] as const;

export class ListPromptTemplatesDto {
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
  @IsIn(PROMPT_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(PROMPT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
