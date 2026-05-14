import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

import { TOOL_METHODS } from './list-tools.dto';

export const TOOL_CALL_STATUSES = ['SUCCESS', 'FAILED', 'APPROVAL_REQUIRED', 'REJECTED'] as const;
export const TOOL_CALL_TRIGGER_SOURCES = ['TEST', 'RUNTIME'] as const;
export const TOOL_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export class ListToolCallLogsDto {
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
  @IsString()
  tool_id?: string;

  @IsOptional()
  @IsIn(TOOL_CALL_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(TOOL_CALL_TRIGGER_SOURCES)
  trigger_source?: string;

  @IsOptional()
  @IsIn(TOOL_APPROVAL_STATUSES)
  approval_status?: string;

  @IsOptional()
  @IsIn(TOOL_METHODS)
  request_method?: string;

  @IsOptional()
  @IsISO8601()
  date_from?: string;

  @IsOptional()
  @IsISO8601()
  date_to?: string;
}
